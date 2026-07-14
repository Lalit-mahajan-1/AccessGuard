// utils/plannerPrompt.ts

export const buildPlannerPrompt = (params: {
  framework: string;
  folder: string;
  tree: string[];
  findings: {
    accessibilityViolations: { id: string; impact: string; selector: string; description: string }[];
    missingSecurityHeaders: string[];
    unusedJavascript: string | null;
    consoleErrors: boolean;
    lighthouseScores: { performance: number; accessibility: number; seo: number; bestPractices: number };
  };
}) => {
  const { framework, folder, tree, findings } = params;

  const accessibilitySection = findings.accessibilityViolations.length
    ? findings.accessibilityViolations
        .map(v => `- [${v.impact.toUpperCase()}] ${v.description} (selector: ${v.selector})`)
        .join('\n')
    : '- None';

  const securitySection = findings.missingSecurityHeaders.length
    ? findings.missingSecurityHeaders.map(h => `- Missing: ${h}`).join('\n')
    : '- None';

  return `
You are a senior code planning agent. Your job is to analyze audit findings and a file tree, then produce a precise list of code tasks.

Return ONLY a raw JSON array. No explanation, no markdown, no backticks. Just the JSON array.

---
PROJECT INFO:
Framework: ${framework}
Main folder: ${folder}

---
AUDIT FINDINGS:

Accessibility:
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
TASK OUTPUT FORMAT (return an array of these):
{
  "task": "short description of what needs to be done",
  "file": "exact file path from the tree above",
  "type": "accessibility | security | performance | seo",
  "priority": "critical | high | medium | low",
  "fix": "precise instruction of what code change to make"
}

Rules:
- Only include tasks that map to a real file in the tree above
- One task per issue, do not merge multiple fixes into one task
- If a security header fix belongs in index.html, use that file
- If an accessibility fix belongs in a component, pick the most likely file from the tree
- Do not invent issues that are not in the audit findings
`.trim();
};