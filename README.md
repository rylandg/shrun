<p align="center">
    <img alt="npm" src="https://img.shields.io/npm/dw/shrun?style=for-the-badge">
    <img alt="GitHub" src="https://img.shields.io/github/license/rylandg/shrun?style=for-the-badge">
    <img alt="npm" src="https://img.shields.io/npm/v/shrun?style=for-the-badge">
</p>

# shrun (beta)

Test NodeJS CLI commands in isolated docker containers.

![](./shrun.gif)

* [Dependencies](#dependencies)
* [Quickstart](#quickstart)
* [Spec format](#spec-format)
* [Available CLI options](#available-cli-options)
* [Why shrun?](#why-shrun?)
    * [Benefits of shrun](#benefits-of-shrun)
* [Examples and resources](#examples-and-resources)
* [Known issues and unfinished work](#known-issues-and-unfinished-work)

### Dependencies

Docker is required to run `shrun`

[Install Docker here if you need it](https://download.docker.com/)

## Quickstart

**Add shrun to your project**

```bash
npm install --save-dev shrun
# or for yarn
yarn add --dev shrun
```

**Build the default shrun image**

```bash
npx shrun build <your-cli-command>
```

*depending on how Docker is installed, `sudo` may be necessary*

```bash
sudo -E npx shrun build <your-cli-command>
```

> Note: You will need to replace \<your-cli-command> with your own CLI command. The CLI command is the one registered to "bin" in your package.json

**Create a simple spec**

By default, `shrun` looks for "specs" (CLI tests) in the `<project-root>/specs` directory. Here is an example spec that tests the `echo` command in bash:

`specs/demo.yml`
```yml
---
- test: Test echo (good-path)
  steps:
    -   in: echo "Hello world"
        out: |-
          Hello world
```

Replace or add to this spec to test your specific CLI command. As long as you built the default `shrun` image, it should work out of the box.

For detailed information about writing `shrun` specs, read below `<REPLACE ME WITH LINK>`.

**Run the demo.yml spec**

```bash
npx shrun --dockerImage '<your-cli-command>:latest'
```

*sudo version*

```bash
sudo -E npx shrun --dockerImage '<your-cli-command>:latest'
```

## Spec format

```yml
- test: Test init help output
  setup:
    - "curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -"
    - "sudo apt install nodejs"
  steps:
    -   in: npm init --help
        out: |-
          npm init [--force|-f|--yes|-y|--scope]
          npm init <@scope> (same as `npx <@scope>/create`)
          npm init [<@scope>/]<name> (same as `npx [<@scope>/]create-<name>`)
          aliases: create, innit
```


`test: string` (**required**) - each spec test must have a `test` stanza with a unique name. For those who are familiar with Jest/Ava/Mocha, this maps directly to the `test("someName", () => {})` format used by those frameworks.

`setup?: string[]` - the setup section allows you to run a series of shell commands before the test itself runs. This is convenient for tests that rely on a specific set of environment variables, need iptables configured etc. For those who are familiar with Jest/Ava/Mocha, this partially maps to the `beforeEach` (more like `beforeThis` since you specify it per test) construct.

`steps: Step[]` (**required**) - steps are where the bulk of your test logic is defined and there is no limit to the number you can have per test. All steps must have an `in` entry, this is what will actually be run against the containers internal shell. If a step is expected to succeed, it is a PassStep and must have an `out` entry. `in` and `out` map to `actual` and `expected` in traditional testing frameworks. If a test is not expected to succeed (not 0 exit code), it must either have an `err` or `exit` entry. `err` is similar to `out` but is checked against stderr as opposed to stdout. `exit` makes it possible to specify the expected exit code that resulted from running the tests `in` statement.

There are also two other stanzas not used in the above spec:

`cleanup?: string[]` - the exact same as `setup` but runs after the test has finished. Useful for resource cleanup. Maps to the `afterEach/afterThis` construct in traditional testing frameworks.

`foreach: Map<string, string>[]` - allows a single test to be run multiple times with different input values.

## Available CLI options

> Note: we did our best to test all of the Jest options we are surfacing, but some may not behave as expected. Feel free to open an issue if you run into any issues.

```bash
  --help                     Show help                                 [boolean]
  --version, -v              Print the version and exit                [boolean]
  --dockerImage              Docker image to use when running Shrun tests
                                                                        [string]
  --dockerEnvVars            Environment variables that should be passed into
                             the Docker container                        [array]
  --bail, -b                 Exit the test suite immediately after `n` number of
                             failing tests.                            [boolean]
  --cache                    Whether to use the transform cache. Disable the
                             cache using --no-cache.                   [boolean]
  --ci                       Whether to run Jest in continuous integration (CI)
                             mode. This option is on by default in most popular
                             CI environments. It will prevent snapshots from
                             being written unless explicitly requested.
                                                      [boolean] [default: false]
  --clearCache               Clears the configured Jest cache directory and then
                             exits. Default directory can be found by calling
                             jest --showConfig                         [boolean]
  --color                    Forces test results output color highlighting (even
                             if stdout is not a TTY). Set to false if you would
                             like to have no colors.                   [boolean]
  --colors                   Alias for `--color`.                      [boolean]
  --debug                    Print debugging info about your jest config.
                                                                       [boolean]
  --detectLeaks              **EXPERIMENTAL**: Detect memory leaks in tests.
                             After executing a test, it will try to garbage
                             collect the global object used, and fail if it was
                             leaked                   [boolean] [default: false]
  --detectOpenHandles        Print out remaining open handles preventing Jest
                             from exiting at the end of a test run. Implies
                             `runInBand`.             [boolean] [default: false]
  --env                      The test environment used for all tests. This can
                             point to any file or node module. Examples:
                             `jsdom`, `node` or `path/to/my-environment.js`
                                                                        [string]
  --errorOnDeprecated        Make calling deprecated APIs throw helpful error
                             messages.                [boolean] [default: false]
  --expand, -e               Use this flag to show full diffs instead of a
                             patch.                                    [boolean]
  --forceExit                Force Jest to exit after all tests have completed
                             running. This is useful when resources set up by
                             test code cannot be adequately cleaned up.[boolean]
  --json                     Prints the test results in JSON. This mode will
                             send all other test output and user messages to
                             stderr.                                   [boolean]
  --listTests                Lists all tests Jest will run given the arguments
                             and exits. Most useful in a CI system together with
                             `--findRelatedTests` to determine the tests Jest
                             will run based on specific files
                                                      [boolean] [default: false]
  --logHeapUsage             Logs the heap usage after every test. Useful to
                             debug memory leaks. Use together with `--runInBand`
                             and `--expose-gc` in node.                [boolean]
  --maxConcurrency           Specifies the maximum number of tests that are
                             allowed to runconcurrently. This only affects tests
                             using `test.concurrent`.      [number] [default: 5]
  --maxWorkers, -w           Specifies the maximum number of workers the
                             worker-pool will spawn for running tests. This
                             defaults to the number of the cores available on
                             your machine. (its usually best not to override
                             this default)                              [string]
  --notify                   Activates notifications for test results. [boolean]
  --notifyMode               Specifies when notifications will appear for test
                             results.       [string] [default: "failure-change"]
  --outputFile               Write test results to a file when the --json option
                             is also specified.                         [string]
  --passWithNoTests          Will not fail if no tests are found (for example
                             while using `--testPathPattern`.)
                                                      [boolean] [default: false]
  --projects                 A list of projects that use Jest to run all tests
                             of all projects in a single instance of Jest.
                                                                         [array]
  --reporters                A list of custom reporters for the test suite.
                                                                         [array]
  --rootDir                  The root directory that Jest should scan for tests
                             and modules within.                        [string]
  --runInBand, -i            Run all tests serially in the current process
                             (rather than creating a worker pool of child
                             processes that run tests). This is sometimes useful
                             for debugging, but such use cases are pretty rare.
                                                                       [boolean]
  --runner                   Allows to use a custom runner instead of Jest's
                             default test runner.                       [string]
  --setupFiles               A list of paths to modules that run some code to
                             configure or set up the testing environment before
                             each test.                                  [array]
  --setupFilesAfterEnv       A list of paths to modules that run some code to
                             configure or set up the testing framework before
                             each test                                   [array]
  --showConfig               Print your jest config and then exits.    [boolean]
  --silent                   Prevent tests from printing messages through the
                             console.                                  [boolean]
  --snapshotSerializers      A list of paths to snapshot serializer modules Jest
                             should use for snapshot testing.            [array]
  --testEnvironment          Alias for --env                            [string]
  --testEnvironmentOptions   Test environment options that will be passed to the
                             testEnvironment. The relevant options depend on the
                             environment.                               [string]
  --testFailureExitCode      Exit code of `jest` command if the test run failed
                                                                        [string]
  --testLocationInResults    Add `location` information to the test results
                                                      [boolean] [default: false]
  --testMatch                The glob patterns Jest uses to detect test files.
                                                                         [array]
  --testResultsProcessor     Allows the use of a custom results processor. This
                             processor must be a node module that exports a
                             function expecting as the first argument the result
                             object.                                    [string]
  --testRunner               Allows to specify a custom test runner. The default
                             is  `jasmine2`. A path to a custom test runner can
                             be provided: `<rootDir>/path/to/testRunner.js`.
                                                                        [string]
  --testSequencer            Allows to specify a custom test sequencer. The
                             default is `@jest/test-sequencer`. A path to a
                             custom test sequencer can be provided:
                             `<rootDir>/path/to/testSequencer.js`       [string]
  --testTimeout              This option sets the default timeouts of test
                             cases.                                     [number]
  --updateSnapshot, -u       Use this flag to re-record snapshots. Can be used
                             together with a test suite pattern or with
                             `--testNamePattern` to re-record snapshot for test
                             matching the pattern                      [boolean]
  --useStderr                Divert all output to stderr.              [boolean]
  --verbose                  Display individual test results with the test suite
                             hierarchy.                                [boolean]
  --watchAll                 Watch files for changes and rerun all tests. If you
                             want to re-run only the tests related to the
                             changed files, use the `--watch` option.  [boolean]
  --watchPathIgnorePatterns  An array of regexp pattern strings that are matched
                             against all paths before trigger test re-run in
                             watch mode. If the test path matches any of the
                             patterns, it will be skipped.               [array]
  --watchman                 Whether to use watchman for file crawling. Disable
                             using --no-watchman.                      [boolean]
```

## Why shrun?

`shrun` aims to bring consistency and convenience to the process of testing command line tools. Each individual spec is run in an isolated Docker container, leaving you free to break things without worrying about affecting other tests. The best part is that `shrun` is built on Jest, so many of the standard Jest options work out of the box.

### Benefits of shrun

* Enables you to run thousands of parallel tests, each in their own isolated sandbox.
* Makes it possible to test the end-to-end flow of your CLI, including installation and removal.
* Built on top of Jest and accepts many of the Jest CLI options.
* Simple declarative test-spec format makes it a joy to write tests. Tests can even be used to drive the CLI product development process. 


## Examples and resources

A standalone example repo has been created to showcase `shrun`. The repo contains a basic command line tool `testshrun` and a few example specs:

https://github.com/rylandg/shrun-basic-demo

Here is the `demo.yml` spec from that repo:

```yml
---
- test: Simple passing case
  foreach:
    - PY_VERSION: python2
  steps:
    -   in: echo "Hello guys {PY_VERSION}"
        out: |-
          Hello guys {PY_VERSION}
- test: Exit code failure (bad-path)
  steps:
    -   in: Hello world
        err: |-
          bash: line 1: Hello: command not found
        exit: 127
- test: Test help (good-path)
  steps:
    -   in: testshrun help
        out: |-
          You will receive no help with testshrun
- test: Test run (good-path)
  steps:
    -   in: testshrun run
        out: |-
          Running sucks
- test: Test no command (bad-path)
  steps:
    -   in: testshrun
        err: |-
          Please provide a command to testshrun
        exit: 1
- test: Test unknown command (bad-path)
  steps:
    -   in: testshrun madeup
        err: |-
          madeup is not a recognized testshrun command
        exit: 1
```

## Known issues and unfinished work

* `shrun` does not currently support a configuration file. This feature is planned and prioritized and the file will support many of the configuration options available to Jest.

* some CLI outputs still refer to Jest instead of `shrun`

* `shrun` does not support test coverage as this is quite difficult to support. I would love to support this but realistically it might not happen.


## Aknowledgements

* `shrun` is originally based off open source work I did for my previous employer Binaris. [Here's a link to that original project (MIT)](https://github.com/binaris/binaris).
* My girlfriend (Jeanie) co-ported `shrun` with me
