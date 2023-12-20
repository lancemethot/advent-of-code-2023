import { isEqual } from "lodash";
import { getFullInput, getSmallInput } from "../utils";

enum Condition {
  OPERATIONAL = ".",
  DAMAGED = "#",
  UNKNOWN = "?",
}

type Record = {
  springs: string;
  sizes: number[];
};

function parseInput(lines: string[]): Record[] {
  return lines.map((line) => {
    return {
      springs: line.split(" ")[0],
      sizes: line
        .split(" ")[1]
        .split(",")
        .map((size) => parseInt(size)),
    };
  });
}

function generateCombinations(input: string): string[] {
  const index = input.indexOf(Condition.UNKNOWN);
  if (index === -1) {
    return [input];
  }
  const prefix = input.substring(0, index);
  const suffix = input.substring(index + 1);
  const combinationsAsOperational = generateCombinations(
    prefix + Condition.OPERATIONAL + suffix
  );
  const combinationsAsDamaged = generateCombinations(
    prefix + Condition.DAMAGED + suffix
  );
  return [...combinationsAsOperational, ...combinationsAsDamaged];
}

function determineArrangements(record: Record): number {
  return generateCombinations(record.springs).filter((combination) => {
    const combinationSizes = combination
      .split(Condition.OPERATIONAL)
      .filter((group) => group.length > 0)
      .map((group) => group.split("").length);
    return isEqual(combinationSizes, record.sizes);
  }).length;
}

function partOne(lines: string[]): number {
  return parseInput(lines).reduce((acc, record) => {
    return (acc += determineArrangements(record));
  }, 0);
}

const day = "day12";
test(day, () => {
  expect(partOne(getSmallInput(day))).toBe(21);
  expect(partOne(getFullInput(day))).toBe(7251);
});
