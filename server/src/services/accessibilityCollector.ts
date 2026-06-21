import type { Page } from 'playwright';

export const collectAccessibility = async (page: Page) => {
  return await page.evaluate(() => {
    const issues: any[] = [];

    const imgsNoAlt = [...document.querySelectorAll('img:not([alt])')].length;
    if (imgsNoAlt) issues.push({ rule: 'image-alt', count: imgsNoAlt, impact: 'serious' });

    const btnsNoName = [...document.querySelectorAll('button')].filter(
      (b) => !b.textContent?.trim() && !b.getAttribute('aria-label')
    ).length;
    if (btnsNoName) issues.push({ rule: 'button-name', count: btnsNoName, impact: 'serious' });

    const linksNoText = [...document.querySelectorAll('a')].filter(
      (a) => !a.textContent?.trim() && !a.getAttribute('aria-label')
    ).length;
    if (linksNoText) issues.push({ rule: 'link-name', count: linksNoText, impact: 'serious' });

    const inputsNoLabel = [...document.querySelectorAll('input')].filter((i) => {
      const id = i.getAttribute('id');
      return !i.getAttribute('aria-label') && !(id && document.querySelector(`label[for="${id}"]`));
    }).length;
    if (inputsNoLabel) issues.push({ rule: 'label', count: inputsNoLabel, impact: 'critical' });

    if (!document.documentElement.lang)
      issues.push({ rule: 'html-has-lang', count: 1, impact: 'serious' });

    const h1Count = document.querySelectorAll('h1').length;
    if (h1Count === 0) issues.push({ rule: 'page-has-heading-one', count: 1, impact: 'moderate' });
    if (h1Count > 1) issues.push({ rule: 'multiple-h1', count: h1Count, impact: 'moderate' });

    return {
      issues,
      summary: {
        totalImages: document.querySelectorAll('img').length,
        totalButtons: document.querySelectorAll('button').length,
        totalLinks: document.querySelectorAll('a').length,
        totalInputs: document.querySelectorAll('input').length,
        hasLang: !!document.documentElement.lang,
        hasTitle: !!document.title,
      },
    };
  });
};