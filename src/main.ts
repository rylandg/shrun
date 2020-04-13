#!/usr/bin/node

import { join } from 'path';
import { promisify } from 'util';

import yargs from 'yargs';
import yaml from 'js-yaml';
import { readFileSync, writeFile } from 'mz/fs';
// eslint-disable-next-line
import { runCLI } from 'jest';
import { usage } from 'jest-cli/build/cli/args';
import type { Config } from '@jest/types';
import { validateCLIOptions } from 'jest-validate';
import { deprecationEntries } from 'jest-config';
import globCB from 'glob';
import { dir, setGracefulCleanup, tmpName } from 'tmp-promise';

import { logger } from './logger';
import { msleep } from './msleep';
import { buildImage } from './container';
import { Spec, TestSpec } from './specInterface';
import { getCLIOptions, ShrunArgv } from './cliInterface';

const glob = promisify(globCB);
setGracefulCleanup();

export const runTests = async (argv: ShrunArgv) => {
  const rootDir = join(__dirname, '../../');
  const userRootDir = argv.rootDir || process.cwd();
  const testPathIgnore = join(rootDir, 'build/src/jestTestDriver.js');
  const searchDirs = argv.testMatch || ['specs'];
  const unflatted: string[] = await Promise.all(searchDirs.map(async (
    dir: string
  ) =>
    glob(join(userRootDir, dir, '*.yml')))
  );
  const allTests = ([] as string[]).concat(...unflatted);
  const specsByFile = allTests.map((pathToTest: string) =>
    yaml.safeLoad(readFileSync(pathToTest, 'utf8')));
  const allSpecs = specsByFile.reduce((aggr: Spec[], curr: Spec[]) => {
    return [...aggr, ...curr];
  }, []);

  // shrun handles this for the user
  delete argv.testMatch;
  delete argv.rootDir;

  if (allSpecs.length === 0 && !argv.passWithNoTests) {
    logger.error(
`No tests found, exiting with code 1
Run with \`--passWithNoTests\` to exit with code 0` );
    process.exit(1);
  }

  const testFiles: TestSpec[] = allSpecs.map((spec: Spec) => {
  const fileSpec =
`const { runJestTest } = require('${testPathIgnore}');

const testData = ${JSON.stringify(spec)};
runJestTest(testData);`;
    return {
      fileSpec,
      name: spec.test,
    };
  });

  const { path, cleanup } = await dir({ unsafeCleanup: true });
  logger.verbose(`Generating tests at path: ${path}`);
  await Promise.all(testFiles.map(async ({ fileSpec, name }) => {
    const specName = name.toLowerCase().split(' ').join('-');
    const tmpFileName = await tmpName({
      dir: path,
      template: `${specName}-XXXXXX.js`,
    });
    return writeFile(tmpFileName, fileSpec, 'utf8');
  }));

  process.env.SHRUN_INTERNAL_SPECIFIER_ENV_VARS =
    JSON.stringify(argv.dockerEnvVars || []);

  process.env.SHRUN_INTERNAL_SPECIFIER_IMAGE_NAME =
    argv.dockerImage || 'usercli:latest';
  await runCLI(
    {
      ...argv,
      testMatch: ['**/**js'],
      rootDir: path,
      noStackTrace: true,
      _: [],
      $0: '',
    },
    [process.cwd()],
  );
  await cleanup();
};

const shrunOpts = getCLIOptions();

const main = async () => {
  // unfortunately these are needed to provide
  // the yargs behavior we want while taking
  // advantage of the existing Jest CLI
  let cmdFinished = false;
  let blockNeeded = false;
  const argv = yargs.usage(usage).options(shrunOpts).command(
    'build [commandName]',
    'Build the default shrun docker image',
    (yargs0) => {
      yargs0
        .usage('Usage: $0 build <commandName>')
        .positional('commandName', {
          describe: 'Name of CLI command to bake into the docker image',
          type: 'string',
        })
        .strict()
    },
    async (argv: { commandName: string }) => {
      blockNeeded = true;
      try {
        await buildImage(argv.commandName);
      } catch (err) {
        process.exit(1);
      }
      process.exit(0);
    },
  ).onFinishCommand(async () => {
    cmdFinished = true;
  }).argv;

  while (!cmdFinished && blockNeeded) {
    await msleep(100);
  }
  validateCLIOptions(argv as Config.Argv,
    { ...(shrunOpts), deprecationEntries });
  runTests(argv);
}

main();
