#!/usr/bin/node

import { join } from 'path';
import { promisify } from 'util';

import yargs from 'yargs';
import yaml from 'js-yaml';
import { readFileSync, writeFile } from 'mz/fs';
// eslint-disable-next-line
import { runCLI } from 'jest';
import { options, usage } from 'jest-cli/build/cli/args';
import type { Config } from '@jest/types';
import { validateCLIOptions } from 'jest-validate';
import { deprecationEntries } from 'jest-config';
import globCB from 'glob';
import { dir, setGracefulCleanup, tmpName } from 'tmp-promise';

import { logger } from './logger';
import { Spec, TestSpec } from './specInterface';

const glob = promisify(globCB);
setGracefulCleanup();

export const runTests = async (argv: Config.Argv) => {
  const rootDir = join(__dirname, '../../');
  const userRootDir = argv.rootDir || process.cwd();
  const testPathIgnore = join(rootDir, 'build/src/jestTestDriver.js');
  const searchDirs = argv.testMatch || ['specs'];
  const unflatted = await Promise.all(searchDirs.map(async (dir: string) =>
    glob(join(userRootDir, dir, '*.yml'))));
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

  process.env.SHRUN_INTERNAL_SPECIFIER_IMAGE_NAME =
    (argv.dockerImage as string | undefined) || 'node:13';
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

type BorrowedOpts = Omit<
  Config.Argv,
  '$0' | 'all' | 'automock' |
  'browser' | 'cacheDirectory' | 'changedFilesWithAncestor' |
  'changedSince' | 'clearMocks' | 'collectCoverage' |
  'collectCoverageFrom' | 'collectCoverageOnlyFrom' | 'config' |
  'coverage' | 'coverageDirectory' | 'coveragePathIgnorePatterns' |
  'coverageProvider' | 'coverageReporters' | 'coverageThreshold' |
  'dependencyExtractor' | 'extraGlobals' | 'filter' |
  'findRelatedTests' | 'forceCoverageMatch' | 'globals' |
  'globalSetup' | 'globalTeardown' | 'haste' |
  'init' | 'lastCommit' | 'mapCoverage' |
  'moduleDirectories' | 'moduleFileExtensions' | 'moduleNameMapper' |
  'modulePathIgnorePatterns' | 'modulePaths' | 'noStackTrace' |
  'onlyChanged' | 'onlyFailures' | 'preset' |
  'prettierPath' | 'resetMocks' | 'resetModules' |
  'resolver' | 'restoreMocks' | 'runTestsByPath' |
  'skipFilter' | 'testNamePattern' | 'testPathIgnorePatterns' |
  'testPathPattern' | 'testURL' | 'timers' |
  'transform' | 'transformIgnorePatterns' | 'unmockedModulePathPatterns' |
  'watch' | 'watchPathIgnorePaterns'
>;

type ShrunOptions = BorrowedOpts & {
  dockerImage: {
    description: string;
    type: string;
  }
};
// TODO (Ryland): add support for runTestsByPath
// TODO (Ryland): add support for testPathPattern
// TODO (Ryland): add support for testNamePattern
// TODO (Ryland): add support for testPathIgnorePatterns
// TODO (Ryland): support filter
// TODO (Ryland): support skipFilter
// TODO (Ryland): support onlyFailures (will need to implement ourselves)
// TODO (Ryland): add support for testRegex in addition to testMatch
// TODO (Ryland): support config option for config path
const shrunOpts: ShrunOptions = {
  ...options,
  dockerImage: {
    description: 'Docker image to use when running Shrun tests',
    type: "string",
  },
};

delete shrunOpts.$0;
delete shrunOpts.all;
delete shrunOpts.automock;
delete shrunOpts.browser;
delete shrunOpts.cacheDirectory;
delete shrunOpts.changedFilesWithAncestor;
delete shrunOpts.changedSince;
delete shrunOpts.clearMocks;
delete shrunOpts.collectCoverage;
delete shrunOpts.collectCoverageFrom;
delete shrunOpts.collectCoverageOnlyFrom;
delete shrunOpts.config;
delete shrunOpts.coverage;
delete shrunOpts.coverageDirectory;
delete shrunOpts.coveragePathIgnorePatterns;
delete shrunOpts.coverageProvider;
delete shrunOpts.coverageReporters;
delete shrunOpts.coverageThreshold;
delete shrunOpts.dependencyExtractor;
delete shrunOpts.extraGlobals;
delete shrunOpts.filter;
delete shrunOpts.findRelatedTests;
delete shrunOpts.forceCoverageMatch;
delete shrunOpts.globals;
delete shrunOpts.globalSetup;
delete shrunOpts.globalTeardown;
delete shrunOpts.haste;
delete shrunOpts.init;
delete shrunOpts.lastCommit;
delete shrunOpts.mapCoverage;
delete shrunOpts.moduleDirectories;
delete shrunOpts.moduleFileExtensions;
delete shrunOpts.moduleNameMapper;
delete shrunOpts.modulePathIgnorePatterns;
delete shrunOpts.modulePaths;
delete shrunOpts.noStackTrace;
delete shrunOpts.onlyChanged;
delete shrunOpts.onlyFailures;
delete shrunOpts.preset;
delete shrunOpts.prettierPath;
delete shrunOpts.resetMocks;
delete shrunOpts.resetModules;
delete shrunOpts.resolver;
delete shrunOpts.restoreMocks;
delete shrunOpts.runTestsByPath;
delete shrunOpts.skipFilter;
delete shrunOpts.testNamePattern;
delete shrunOpts.testPathIgnorePatterns;
delete shrunOpts.testPathPattern;
delete shrunOpts.testURL;
delete shrunOpts.timers;
delete shrunOpts.transform;
delete shrunOpts.transformIgnorePatterns;
delete shrunOpts.unmockedModulePathPatterns;
delete shrunOpts.watch;
delete shrunOpts.watchPathIgnorePaterns;

const argv = yargs.usage(usage).options(shrunOpts as any).argv;
validateCLIOptions(argv, { ...(shrunOpts as any), deprecationEntries });
runTests(argv);
