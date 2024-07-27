import { memoize } from "lodash";

const [PEG_A, PEG_B, PEG_C] = [1, 2, 3];

export type Step = [from: number, to: number];

export function getTowerSolution(
  n: number,
  from: number = PEG_A,
  to: number = PEG_C,
): Step[] {
  if (n === 1) {
    return [[from, to]];
  }

  const tmp_to = PEG_A + PEG_B + PEG_C - (from + to);

  return [
    ...getTowerSolution(n - 1, from, tmp_to),
    [from, to],
    ...getTowerSolution(n - 1, tmp_to, to),
  ];
}

export const getMemoizedTowerSolution = memoize(getTowerSolution);
