import { Options } from 'yargs';
import type { Config } from '@jest/types';
import { options } from 'jest-cli/build/cli/args';

type BorrowedOpts = Omit<
  Config.Argv,
  'all' | 'automock' |
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

export type ShrunArgv = Partial<{
  dockerImage: string;
// eslint-disable-next-line
}> & BorrowedOpts & { [argName: string]: any; };

export const getCLIOptions = () => {
  // TODO (Ryland): add support for runTestsByPath
  // TODO (Ryland): add support for testPathPattern
  // TODO (Ryland): add support for testNamePattern
  // TODO (Ryland): add support for testPathIgnorePatterns
  // TODO (Ryland): support filter
  // TODO (Ryland): support skipFilter
  // TODO (Ryland): support onlyFailures (will need to implement ourselves)
  // TODO (Ryland): add support for testRegex in addition to testMatch
  // TODO (Ryland): support config option for config path
  // TODO (Ryland): support roots in addition to rootDir
  const dockerOption: Options = {
    description: 'Docker image to use when running Shrun tests',
    type: 'string',
  };

  const envOptions: Options = {
    description: 'Environment variables that should be passed into the Docker container',
    type: 'array',
  };

  const shrunOpts = {
    ...options,
    dockerImage: dockerOption,
    dockerEnvVars: envOptions,
  };

  // delete shrunOpts.$0;
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
  // delete shrunOpts.dependencyExtractor;
  // delete shrunOpts.extraGlobals;
  delete shrunOpts.filter;
  delete shrunOpts.findRelatedTests;
  // delete shrunOpts.forceCoverageMatch;
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
  delete shrunOpts.testRegex;
  delete shrunOpts.testNamePattern;
  delete shrunOpts.testPathIgnorePatterns;
  delete shrunOpts.testPathPattern;
  delete shrunOpts.testURL;
  delete shrunOpts.timers;
  delete shrunOpts.transform;
  delete shrunOpts.transformIgnorePatterns;
  delete shrunOpts.unmockedModulePathPatterns;
  delete shrunOpts.watch;
  delete shrunOpts.roots;
  // delete shrunOpts.watchPathIgnorePaterns;
  return shrunOpts;
};
