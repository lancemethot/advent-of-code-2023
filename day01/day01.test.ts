import { isNil } from "lodash";
import { getDayInput, getExampleInput } from "advent-of-code-utils";

const map: Map<string, { character: string; ignore: number }> = new Map();
map.set("one", { character: "1", ignore: 2 });
map.set("two", { character: "2", ignore: 2 });
map.set("three", { character: "3", ignore: 4 });
map.set("four", { character: "4", ignore: 3 });
map.set("five", { character: "5", ignore: 3 });
map.set("six", { character: "6", ignore: 2 });
map.set("seven", { character: "7", ignore: 4 });
map.set("eight", { character: "8", ignore: 4 });
map.set("nine", { character: "9", ignore: 3 });

function prepareLine(line: string): string {
  const characters = line.split("");
  let ignore = 0;
  let preparedLine = "";
  for (let index = 0; index < characters.length; index++) {
    let character = characters[index];
    const nextTwo = line.substring(index, index + 3);
    const nextThree = line.substring(index, index + 4);
    const nextFour = line.substring(index, index + 5);

    let entry: { character: string; ignore: number } | undefined = undefined;
    if (map.has(nextTwo)) {
      entry = map.get(nextTwo);
    } else if (map.has(nextThree)) {
      entry = map.get(nextThree);
    } else if (map.has(nextFour)) {
      entry = map.get(nextFour);
    }

    if (!isNil(entry)) {
      preparedLine += entry.character;
      ignore = entry.ignore;
    } else if (ignore <= 0) {
      preparedLine += character;
    } else {
      ignore--;
    }
  }

  return preparedLine;
}

function parseLine(line: string): number {
  const first = line.match(/^[a-z]*(\d)[a-z0-9]*/i) as RegExpMatchArray;
  const second = line.match(/^[a-z0-9]*(\d)[a-z]*$/i) as RegExpMatchArray;
  return +`${first[1]}${second[1]}`;
}

function partOne(lines: string[]): number {
  let sum = 0;
  for (const line of lines) {
    sum += parseLine(line);
  }
  return sum;
}

function partTwo(lines: string[]): number {
  let sum = 0;
  for (const line of lines) {
    sum += parseLine(prepareLine(line));
  }
  return sum;
}

const day = "day01";
test(day, () => {
  expect(partOne(getExampleInput(day, 1))).toBe(142);
  expect(partOne(getDayInput(day))).toBe(55816);

  expect(partTwo(getExampleInput(day, 2))).toBe(281);
  expect(partTwo(getDayInput(day))).toBe(54980);
});
