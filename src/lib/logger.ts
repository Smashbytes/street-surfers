const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => { if (isDev) console.log(...args); },        // eslint-disable-line no-console
  warn: (...args: unknown[]) => { if (isDev) console.warn(...args); },       // eslint-disable-line no-console
  error: (...args: unknown[]) => { if (isDev) console.error(...args); },     // eslint-disable-line no-console
};
