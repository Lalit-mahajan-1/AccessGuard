import { DockerSandbox } from "../tools/dockerSandbox.js";
import { OllamaClient } from "../tools/ollamaClient.js";

export interface FixTask {
  file: string;
  issue: string;
  fix: string;
  type: string;
  priority: string;
  task: string;
}

export class FixAgent {
  /**
   * Extracts unique candidate class names or IDs from a string.
   * Handles HTML attribute format (class="foo") and CSS format (.foo, #foo).
   */
  private static extractCandidates(text: string): string[] {
    const candidates = new Set<string>();
    const attrRegex = /class(?:Name)?=["']([^"']+)["']/gi;
    let m: RegExpExecArray | null;
    while ((m = attrRegex.exec(text)) !== null) {
      if (m[1]) {
        for (const cls of m[1].split(/\s+/)) {
          if (cls.length >= 3) candidates.add(cls);
        }
      }
    }
    const cssRegex = /[.#]([a-zA-Z][a-zA-Z0-9_-]{2,})/g;
    while ((m = cssRegex.exec(text)) !== null) {
      if (m[1]) candidates.add(m[1]);
    }
    return Array.from(candidates);
  }

  /**
   * Given a list of candidate terms, search the workspace inside the container
   * and return the first matching source file.
   */
  private static async findCorrectFile(
    containerName: string,
    guessedFile: string,
    candidates: string[]
  ): Promise<string> {
    const genericTags = new Set([
      "div", "span", "p", "a", "button", "input", "textarea", "form",
      "img", "video", "audio", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
      "section", "main", "header", "footer", "nav", "article", "aside",
      "select", "option", "label", "unknown",
    ]);

    for (const term of candidates) {
      if (genericTags.has(term.toLowerCase())) continue;

      // Check if term is in the active (non-commented) code of the guessed file
      const inGuessed = await DockerSandbox.executeCommand(
        containerName,
        `grep -v "^[[:space:]]*//" /app/${guessedFile} 2>/dev/null | grep -q "${term}" && echo found || echo notfound`
      );
      if (inGuessed.stdout.includes("found")) {
        console.log(`[FixAgent] Term "${term}" verified (active code) in "${guessedFile}".`);
        return guessedFile;
      }

      // Workspace-wide search excluding comments
      console.log(`[FixAgent] Term "${term}" not in active code of "${guessedFile}". Searching workspace...`);
      const searchRes = await DockerSandbox.executeCommand(
        containerName,
        `grep -rln "${term}" /app --include="*.jsx" --include="*.tsx" --include="*.js" --include="*.ts" 2>/dev/null | grep -v node_modules | grep -v /dist/ | grep -v /.next/ | head -5 || true`
      );

      if (searchRes.stdout.trim()) {
        const firstMatch = searchRes.stdout.trim().split("\n")[0];
        if (firstMatch) {
          const relPath = firstMatch.replace("/app/", "").trim();
          if (relPath && relPath !== guessedFile) {
            console.log(`[FixAgent] Auto-corrected: "${guessedFile}" → "${relPath}" (matched "${term}")`);
            return relPath;
          }
        }
      }
    }

    return guessedFile;
  }

  /**
   * Strip single-line comments and blank lines to reduce LLM token count.
   * Returns condensed code for prompting; original code is always preserved for file writes.
   */
  private static condenseCode(code: string): string {
    return code
      .split("\n")
      .filter(line => !line.trimStart().startsWith("//"))
      .filter(line => line.trim() !== "")
      .join("\n");
  }

  /**
   * Applies the code fix for a single task inside the docker sandbox container.
   * Strategy: send condensed active code → get full modified file back → write it.
   * No diff/search-replace (avoids all indentation-mismatch issues).
   */
  public static async executeFix(
    containerName: string,
    task: FixTask,
    _verificationCommand = "npm run build"
  ): Promise<{ success: boolean; originalCode: string; fixedCode: string; file: string; errorLogs?: string }> {
    const { file, issue, fix } = task;
    let targetFile = file;

    // --- Step 1: Auto-correct target file ---
    try {
      const combinedText = issue + " " + task.task + " " + fix;
      const candidates = this.extractCandidates(combinedText);
      console.log(`[FixAgent] Extracted selector candidates: ${JSON.stringify(candidates)}`);
      targetFile = await this.findCorrectFile(containerName, file, candidates);
    } catch (err: any) {
      console.warn(`[FixAgent] File auto-correction skipped: ${err.message}`);
    }

    console.log(`[FixAgent] Starting fix for: ${targetFile}`);

    // --- Step 2: Read the target file ---
    let originalCode = "";
    try {
      originalCode = await DockerSandbox.readFile(containerName, targetFile);
    } catch (err: any) {
      return { success: false, originalCode: "", fixedCode: "", file: targetFile, errorLogs: `Cannot read file: ${err.message}` };
    }

    const condensedCode = this.condenseCode(originalCode);
    console.log(`[FixAgent] File: ${originalCode.split("\n").length} lines → condensed to ${condensedCode.split("\n").length} active lines for LLM.`);

    // --- Step 3: Ask LLM for complete fixed file (no diffs) ---
    const prompt = `
You are an expert web developer. Fix the accessibility issue in this file.

FILE: ${targetFile}

ISSUE:
${issue}

HOW TO FIX:
${fix}

CURRENT FILE CONTENT:
\`\`\`
${condensedCode}
\`\`\`

OUTPUT INSTRUCTIONS:
- Return the COMPLETE modified file content, with the fix applied.
- Do NOT include any explanation, preamble, or markdown outside the code block.
- Output ONLY the raw file content, starting from the first line of code.
`.trim();

    let attempts = 0;
    const maxAttempts = 2;
    let lastError = "";

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[FixAgent] Generation attempt ${attempts}/${maxAttempts}...`);

      let response = "";
      try {
        response = await OllamaClient.generate(prompt, false);
      } catch (err: any) {
        return { success: false, originalCode, fixedCode: originalCode, file: targetFile, errorLogs: `Ollama error: ${err.message}` };
      }

      // Strip any markdown code fences from response
      let fixedCode = response.trim();
      fixedCode = fixedCode.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "").replace(/```$/, "").trim();

      if (!fixedCode || fixedCode.length < 20) {
        lastError = `LLM returned empty or too-short response (${fixedCode.length} chars)`;
        console.warn(`[FixAgent] Attempt ${attempts}: ${lastError}`);
        continue;
      }

      // Write the fixed file back to the sandbox
      try {
        await DockerSandbox.writeFile(containerName, targetFile, fixedCode);
        console.log(`[FixAgent] ✓ Fix applied to ${targetFile} (${fixedCode.split("\n").length} lines written)`);
        return { success: true, originalCode, fixedCode, file: targetFile };
      } catch (err: any) {
        lastError = `Failed to write fixed file: ${err.message}`;
        console.warn(`[FixAgent] Attempt ${attempts} write error: ${lastError}`);
      }
    }

    // Revert to original on failure
    try { await DockerSandbox.writeFile(containerName, targetFile, originalCode); } catch {}

    return {
      success: false,
      originalCode,
      fixedCode: originalCode,
      file: targetFile,
      errorLogs: `All ${maxAttempts} attempts failed. Last error: ${lastError}`,
    };
  }
}
