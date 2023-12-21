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

const cache: Map<string, number> = new Map();

function trimStart(input: string): string {
  // remove leading . as long as there is a ? or # after it
  return input.startsWith(Condition.OPERATIONAL)
    ? input
        .split(/(?<=\.)(?=[^.])/)
        .slice(1)
        .join("")
    : input;
}

function determineArrangements(springs: string, groups: number[]): number {
  const line = `${springs} ${groups.join(",")}`;

  // return any cached results
  if (cache.has(line)) {
    return cache.get(line) as number;
  }

  // If there are no more groups, return whether or not we have a damaged spring
  if (groups.length <= 0) return Number(!springs.includes(Condition.DAMAGED));

  // Check if we have enough characters to fill up the remaining groups
  if (springs.length - groups.reduce((a, b) => a + b) - groups.length + 1 < 0)
    return 0;

  // Take a chunk of the row up to the first group size and see if it contains ? or #
  const damagedOrUnknown = !springs
    .slice(0, groups[0])
    .includes(Condition.OPERATIONAL);

  // If we have enough characters to fill up the group, return truthy
  if (springs.length == groups[0]) return Number(damagedOrUnknown);

  // Repeat with smaller slices of the row and cache the results
  // If the first spring is damaged and we couldn't fill a group, it's automatically 0
  // If the slice will run over into the next group, it's also automatically 0
  const arrangements =
    (springs[0] != Condition.DAMAGED
      ? determineArrangements(trimStart(springs.slice(1)), groups)
      : 0) +
    (damagedOrUnknown && springs[groups[0]] != Condition.DAMAGED
      ? determineArrangements(
          trimStart(springs.slice(groups[0] + 1)),
          groups.slice(1)
        )
      : 0);

  cache.set(line, arrangements);
  return arrangements;
}

function unfold(record: Record): Record {
  return {
    springs: Array(5).fill(record.springs).join("?"),
    sizes: Array(5).fill(record.sizes).flat(),
  };
}

function partOne(lines: string[]): number {
  return parseInput(lines).reduce((acc, record) => {
    return (acc += determineArrangements(record.springs, record.sizes));
  }, 0);
}

function partTwo(lines: string[]): number {
  return parseInput(lines).reduce((acc, record) => {
    const unfolded = unfold(record);
    return (acc += determineArrangements(unfolded.springs, unfolded.sizes));
  }, 0);
}

const day = "day12";
test(day, () => {
  expect(partOne(getSmallInput(day))).toBe(21);
  expect(partOne(getFullInput(day))).toBe(7251);

  expect(partTwo(getSmallInput(day))).toBe(525152);
  expect(partTwo(getFullInput(day))).toBe(2128386729962);
});
