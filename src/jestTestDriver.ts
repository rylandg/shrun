import strip from 'strip-color';
import regEsc from 'escape-string-regexp';

import { logger } from './logger';
// Create/run and remove a Docker container.
import { Container } from './container';
import {
  Spec,
  isFailStep,
  isPassStep,
  FailStep,
  PassStep,
  OutputStep,
  PassOrFailStep,
  MatchType,
} from './specInterface';
import { getConfig } from './getConfig';

const {
  imageName,
  envVars,
  volumes,
} = getConfig();

const commonBashOpts = 'set -o pipefail;';

const stripText = (origText: string) => {
  return strip(origText)
    .replace(/\r+/g, '')
    .replace(/\s+$/g, '');
};

const createRegTest = (expected: string) => {
  const DIGIT_ESCAPE = 'ESCAPESEQUENCEDIGIT';
  const STAR_ESCAPE = 'ESCAPESEQUENCESPACE';
  const PERCENT_ESCAPE = 'ESCAPESEQUENCEPERCENT';
  const protectedEscapes = expected
    .replace(/#/g, DIGIT_ESCAPE)
    .replace(/\*/g, STAR_ESCAPE)
    .replace(/%/g, PERCENT_ESCAPE);
  const protectedRegexps = regEsc(protectedEscapes);
  const regex = protectedRegexps
    .replace(new RegExp(DIGIT_ESCAPE, 'g'), '\\d+')
    .replace(new RegExp(STAR_ESCAPE, 'g'), '[\\s\\S]*?')
    .replace(new RegExp(PERCENT_ESCAPE, 'g'), '.*?');
  return new RegExp(`^${regex}$`);
};

// next task is to define a type for the expected schema
const matchText = (expected: PassOrFailStep, stripCmd: OutputStep, prop: string) => {
  logger.silly(
`matching:
  expected: %o
  stripCmd: %o
`, expected, stripCmd);

  const cmd = (prop === 'out') ? stripCmd.stdout : stripCmd.stderr;
  const exp = (prop === 'out') ? (expected as PassStep).out : (expected as FailStep).err;
  return createRegTest(exp).test(cmd);
};

expect.extend({
  yamlMatch(received: PassOrFailStep, expected: OutputStep, type: MatchType) {
    const options = {
      comment: 'YAML snippet equality',
      isNot: this.isNot,
      promise: this.promise,
    };

    const pass = matchText(received, expected, type);
    const message = pass
      ? () =>
        `${this.utils.matcherHint('yamlMatch', undefined, undefined, options)}

        Expected: not ${this.utils.printExpected(expected)}
        Received: ${this.utils.printReceived(received)}
        `
      : () => {
        const rec = isPassStep(received) ? received.out : received.err;
        const realDiff = `Expected: ${this.utils.printExpected(expected.stdout || expected.stderr)}\n` +
            `Received: ${this.utils.printReceived(rec)}`;
        return `
${this.utils.matcherHint('yamlMatch', undefined, undefined, options)}

${realDiff}`;
      };
    return {
      message,
      pass,
    };
  },
  exitCodeMatch(received: number, expected: number) {
    const options = {
      comment: 'Exit code equality',
      isNot: this.isNot,
      promise: this.promise,
    };

    const pass = Object.is(received, expected);

    const message = pass
      ? () =>
        `${this.utils.matcherHint('exitCodeMatch', undefined, undefined, options)}

        Expected: not ${this.utils.printExpected(expected)}
        Received: ${this.utils.printReceived(received)}
        `
      : () => {
        return `
${this.utils.matcherHint('exitCodeMatch', undefined, undefined, options)}

Expected exit code: ${expected}
Received exit code: ${received}`;
      };
    return {
      message,
      pass,
    };
  }
});

// eslint-disable-next-line
export const runJestTest = (testSpec: Spec) => {
  let container: Container | undefined;
  let cleanup: string[] | undefined;
  beforeEach(() => {
    container = new Container(imageName);
    jest.setTimeout(15000);
  });
  afterEach(async () => {
    if (container?.started) {
      if (cleanup) {
        for (const cleanupStep of cleanup) {
          // eslint-disable-next-line no-await-in-loop
          const result = await container.streamIn(
            `${commonBashOpts} ${cleanupStep}`,
          );
          if (result.exitCode !== 0) {
            // eslint-disable-next-line no-await-in-loop
            await container.stopAndKillContainer();
            throw new Error(result.stderr);
          }
        }
      }
      await container.stopAndKillContainer();
    }
  });

  const createTest = (rawSubTest: Spec) => {
    it(rawSubTest.test, async () => {
      if (!container) return;
      const activeEnvs = envVars
        .filter(envKey => process.env[envKey] !== undefined)
        .map(envKey => `${envKey}=${process.env[envKey]}`);
      await container.startContainer(activeEnvs, volumes);
      if (rawSubTest.setup) {
        for (const setupStep of rawSubTest.setup) {
          // eslint-disable-next-line no-await-in-loop
          const setupOut = await container.streamIn(
            `${commonBashOpts} ${setupStep}`,
          );
          if (setupOut.exitCode !== 0) {
            throw new Error(setupOut.stderr);
          }
        }
      }
      // eslint-disable-next-line no-param-reassign
      cleanup = rawSubTest.cleanup;

      for (const step of rawSubTest.steps) {
        const cmdOut = await container.streamIn(step.in);
        if (isPassStep(step)) {
          // eslint-disable-next-line no-await-in-loop
          if (step.out) {
            const stripCmdOut = { ...cmdOut, stdout: stripText(cmdOut.stdout) };
            logger.silly('expected out step is %o', step);
            logger.silly('actual out step is %o', stripCmdOut);
            expect(step).yamlMatch(stripCmdOut, 'out');
          }
        } else if (isFailStep(step)) {
          const stripCmdStderr = {
            ...cmdOut,
            stderr: stripText(cmdOut.stderr),
          };
          expect(step).yamlMatch(stripCmdStderr, 'err');
          expect(cmdOut.exitCode).exitCodeMatch(step?.exit || 0);
        }
      }
    });
  };

  if (testSpec.foreach) {
    for (const forIter of testSpec.foreach) {
      let testStr = JSON.stringify(testSpec);
      for (const [key, value] of Object.entries(forIter)) {
        testStr = testStr.replace(new RegExp(`{${key}}`, 'g'), value);
      }
      createTest(JSON.parse(testStr));
    }
  } else {
    createTest(testSpec);
  }
};
