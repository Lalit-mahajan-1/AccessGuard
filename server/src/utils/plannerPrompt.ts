// utils/plannerPrompt.ts

export const buildPlannerPrompt = (params: {
  framework: string;
  folder: string;
  tree: string[];
  findings: {
    accessibilityViolations: { id: string; impact: string; selector: string; html: string; failureSummary: string; description: string; help: string }[];
    missingSecurityHeaders: string[];
    unusedJavascript: string | null;
    consoleErrors: boolean;
    lighthouseScores: { performance: number; accessibility: number; seo: number; bestPractices: number };
  };
}) => {
  const { framework, folder, tree, findings } = params;

  const accessibilitySection = findings.accessibilityViolations.length
    ? findings.accessibilityViolations
        .map((v, idx) => `${idx + 1}. [${v.impact.toUpperCase()}] ${v.description}
   - ID/Rule: ${v.id}
   - Help: ${v.help}
   - Selector: ${v.selector}
   - HTML Snippet: ${v.html}
   - Failure Reason: ${v.failureSummary}`)
        .join('\n\n')
    : '- None';

  const securitySection = findings.missingSecurityHeaders.length
    ? findings.missingSecurityHeaders.map(h => `- Missing header: ${h}`).join('\n')
    : '- None';

  return `
You are an expert senior code planning agent. Your task is to analyze detailed audit findings and a project's repository file tree, then produce a precise, action-oriented list of code tasks to fix every single issue detected.

You must examine every accessibility violation, missing security header, performance issue, and console error, and map them to specific files in the repository.

CRITICAL INSTRUCTIONS:
1. Provide a plan for EVERY single issue or violation. Do not group them into a single plan if they are separate issues or affect different elements. We want a comprehensive, complete plan. If there are 5 accessibility violations, there must be at least 5 separate tasks.
2. For each task, provide an extremely descriptive "issue" explanation (explaining exactly what is wrong, the selector/HTML of the node, and why it fails accessibility/security/best practices).
3. For each task, provide an extremely descriptive "fix" solution. Other developers or AI agents should be able to look at the "fix" and write the exact code change without having to research. Provide detailed step-by-step instructions and code snippets/templates to show exactly what to write.

---
PROJECT INFO:
Framework: ${framework}
Main folder: ${folder}

---
AUDIT FINDINGS:

Accessibility Violations:
${accessibilitySection}

Security Headers:
${securitySection}

Unused JavaScript: ${findings.unusedJavascript ?? 'None'}

Console Errors: ${findings.consoleErrors ? 'Yes — browser errors were logged' : 'None'}

Lighthouse Scores:
- Performance: ${findings.lighthouseScores.performance}
- Accessibility: ${findings.lighthouseScores.accessibility}
- SEO: ${findings.lighthouseScores.seo}
- Best Practices: ${findings.lighthouseScores.bestPractices}

---
FILE TREE:
${tree.join('\n')}

---
TASK OUTPUT FORMAT (You MUST return ONLY a raw JSON array of objects with this exact structure):
[
  {
    "task": "short description of what needs to be done",
    "file": "exact file path from the tree above where the fix should be applied",
    "type": "accessibility | security | performance | seo",
    "priority": "critical | high | medium | low",
    "issue": "A detailed, descriptive explanation of the issue, including the specific element selector, the offending HTML snippet, and why it is a violation",
    "fix": "A highly detailed, step-by-step technical solution. Explain exactly where in the file to make the change and provide the code patch or implementation details so another agent can easily apply it"
  }
]

Rules:
- You must return ONLY the raw JSON array. Do not wrap it in markdown code blocks (\`\`\`json ... \`\`\`), do not include any explanatory text before or after the JSON.
- Every task MUST map to a real, existing file from the file tree. Choose the most logical file. (e.g. if there's a button accessibility violation, find the corresponding component, page, or index.html/App.tsx file in the tree).
- One task per specific violation/node. Do not merge multiple violations or elements into a single task.
`.trim();
};