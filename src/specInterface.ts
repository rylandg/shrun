export type MatchType = 'out' | 'err';

export interface Step {
  in: string;
}

export interface PassStep extends Step {
  out: string;
}

export interface FailStep extends Step {
  err: string;
  exit?: number;
}

export type PassOrFailStep = PassStep | FailStep;

export interface OutputStep {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface Spec {
  test: string;
  setup?: string[];
  cleanup?: string[];
  steps: PassOrFailStep[];
  foreach?: { [key: string]: string }[];
}

export const isPassStep = (step: PassStep | FailStep): step is PassStep => {
  return (step as PassStep).out !== undefined;
};

export const isFailStep = (step: PassStep | FailStep): step is FailStep => {
  return (step as FailStep).err !== undefined;
};

export interface TestSpec {
  fileSpec: string,
  name: string,
}
