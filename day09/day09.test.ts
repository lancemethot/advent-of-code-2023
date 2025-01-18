import { getDayInput, getExampleInput } from "advent-of-code-utils";

type History = {
  steps: number[];
};

function parseInput(lines: string[]): History[] {
  const histories: History[] = lines.map((line) => {
    return {
      steps: line.split(" ").map((step) => parseInt(step)),
    };
  });
  return histories;
}

function findDifferences(nums: number[]): number[] {
  const diffs: number[] = [];
  for (let i = 0; i < nums.length - 1; i++) {
    diffs.push(nums[i + 1] - nums[i]);
  }
  return diffs;
}

function predictNext(history: History): number {
  const steps: number[][] = [history.steps];
  let allZeroes = false;
  do {
    const diffs = findDifferences(steps[steps.length - 1]);
    steps.push(diffs);
    allZeroes = diffs.every((diff) => diff === 0);
  } while (!allZeroes);
  for (let i = steps.length - 2; i >= 0; i--) {
    const last = steps[i][steps[i].length - 1];
    const previous: number[] = steps[i + 1];
    const below = previous[previous.length - 1];
    steps[i].push(last + below);
  }
  return steps[0][steps[0].length - 1];
}

function predictFirst(history: History): number {
  const steps: number[][] = [history.steps];
  let allZeroes = false;
  do {
    const diffs = findDifferences(steps[steps.length - 1]);
    steps.push(diffs);
    allZeroes = diffs.every((diff) => diff === 0);
  } while (!allZeroes);
  for (let i = steps.length - 2; i >= 0; i--) {
    const first = steps[i][0];
    const previous: number[] = steps[i + 1];
    const below = previous[0];
    steps[i].unshift(first - below);
  }
  return steps[0][0];
}

function partOne(lines: string[]): number {
  const sum = parseInput(lines).reduce((acc, history) => {
    return acc + predictNext(history);
  }, 0);
  return sum;
}

function partTwo(lines: string[]): number {
  const sum = parseInput(lines).reduce((acc, history) => {
    return acc + predictFirst(history);
  }, 0);
  return sum;
}

const day = "day09";
test(day, () => {
  expect(partOne(getExampleInput(day))).toBe(114);
  expect(partOne(getDayInput(day))).toBe(1641934234);

  expect(partTwo(getExampleInput(day))).toBe(2);
  expect(partTwo(getDayInput(day))).toBe(975);
});
