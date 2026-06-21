import type { CDPSession } from 'playwright';

export const createConsoleCollector = (cdp: CDPSession) => {
  const logs: any[] = [];

  cdp.on('Log.entryAdded', (e: any) => {
    logs.push({
      source: e.entry.source,
      level: e.entry.level,
      text: e.entry.text?.slice(0, 300),
    });
  });

  cdp.on('Runtime.consoleAPICalled', (e: any) => {
    if (e.type === 'error' || e.type === 'warning') {
      logs.push({
        source: 'console-api',
        level: e.type,
        text: e.args.map((a: any) => a.value || a.description || '').join(' ').slice(0, 300),
      });
    }
  });

  cdp.on('Runtime.exceptionThrown', (e: any) => {
    logs.push({
      source: 'exception',
      level: 'error',
      text: (e.exceptionDetails.text + ' ' + (e.exceptionDetails.exception?.description || '')).slice(0, 300),
    });
  });

  const getResult = () => ({
    total: logs.length,
    errors: logs.filter((l) => l.level === 'error').length,
    warnings: logs.filter((l) => l.level === 'warning').length,
    logs: logs.slice(0, 30),
  });

  return { getResult };
};