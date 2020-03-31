/* eslint @typescript-eslint/no-explicit-any: 0 */
type Levels = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
type Level = {
  [l in Levels]: number;
};

const levels: Level = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

const level = levels[(process.env.LOG_LEVEL || 'info') as Levels];

const log = (logLevel: number, input: any, ...args: any[]) => {
  if (logLevel <= level) {
    console.log(input, ...args);
  }
};

type LoggerFunc = (i: any, ...args: any[]) => void;
type Logger = { [l in Levels]: LoggerFunc };

const createAllLoggers = (): Logger => {
  return Object.keys(levels).reduce((aggr: any, curr: Levels) => {
    return {
      ...aggr,
      [curr]: (input: any, ...args: any[]) => log(levels[curr], input, ...args),
    };
  }, {});
};

export const logger = createAllLoggers();
