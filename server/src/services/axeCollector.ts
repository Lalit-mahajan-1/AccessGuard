import type { Page } from 'playwright';
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core'), 'utf-8');

export const collectAxe = async (page: Page) => {
  await page.evaluate(axeSource);

  const axeResults: any = await page.evaluate(async () => {
    return await (window as any).axe.run(document, {
      resultTypes: ['violations'],
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    });
  });

  const violations = axeResults.violations.map((v: any) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    help: v.help,
    wcag: v.tags.filter((t: string) => t.startsWith('wcag')),
    nodeCount: v.nodes.length,
    nodes: v.nodes.slice(0, 3).map((n: any) => ({
      selector: n.target.join(' '),
      html: n.html?.slice(0, 200),
      failure: n.failureSummary?.slice(0, 200),
    })),
  }));

  const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  violations.forEach((v: any) => {
    if (v.impact && byImpact.hasOwnProperty(v.impact))
      byImpact[v.impact as keyof typeof byImpact]++;
  });

  return {
    totalViolations: violations.length,
    byImpact,
    violations: violations.slice(0, 20),
  };
};