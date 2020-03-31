export {}

declare global {
  namespace jest {
    interface Matchers<R> {
      yamlMatch(received: import('./specInterface').OutputStep, type: import('./specInterface').MatchType): R;
      exitCodeMatch(code: number): R;
    }
    interface Expect {
      yamlMatch: (expected: import('./specInterface').PassOrFailStep) => object;
      exitCodeMatch: (expected: number) => object;
    }
  }
}
