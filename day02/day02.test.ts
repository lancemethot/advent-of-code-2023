import { getExampleInput, getDayInput } from "advent-of-code-utils";

const MAX_RED = 12;
const MAX_GREEN = 13;
const MAX_BLUE = 14;

type GameSet = {
  red: number;
  green: number;
  blue: number;
};

type Game = {
  id: number;
  sets: GameSet[];
};

function removeEmptyLines(lines: string[]): string[] {
  return lines.filter(line => line.trim().length > 0);
}

function parseSet(setStr: string): GameSet {
  const colors = setStr.trim().split(",");
  const set: GameSet = {
    red: 0,
    green: 0,
    blue: 0,
  };

  colors.forEach((color) => {
    const matches = color
      .trim()
      .match(/(\d+)\s+(red|green|blue)/i) as RegExpMatchArray;
    const num = matches[1];
    const col = matches[2];

    if (col === "red") {
      set.red = +num;
    } else if (col === "green") {
      set.green = +num;
    } else if (col === "blue") {
      set.blue = +num;
    }
  });

  return set;
}

function loadGame(line: string): Game {
  const label = line.split(":").shift() || "";
  const sets = line.split(":").pop()?.split(";") || [];

  return {
    id: +label.replace("Game ", "").trim(),
    sets: sets.map((set) => parseSet(set)),
  };
}

function isPossible(game: Game): boolean {
  let validSets = 0;
  game.sets.forEach((set) => {
    if (set.red <= MAX_RED && set.green <= MAX_GREEN && set.blue <= MAX_BLUE) {
      validSets++;
    }
  });
  return game.sets.length === validSets;
}

function makePossible(game: Game): GameSet {
  const possibleSet: GameSet = {
    red: 1,
    green: 1,
    blue: 1,
  };
  game.sets.forEach((set) => {
    possibleSet.red = set.red > possibleSet.red ? set.red : possibleSet.red;
    possibleSet.green =
      set.green > possibleSet.green ? set.green : possibleSet.green;
    possibleSet.blue =
      set.blue > possibleSet.blue ? set.blue : possibleSet.blue;
  });
  return possibleSet;
}

function partOne(lines: string[]): number {
  return removeEmptyLines(lines).reduce((sum, line) => {
    const game = loadGame(line);
    if (isPossible(game)) {
      sum += game.id;
    }
    return sum;
  }, 0);
}

function partTwo(lines: string[]): number {
  return removeEmptyLines(lines).reduce((sum, line) => {
    const game = loadGame(line);
    const set = makePossible(game);
    sum += set.red * set.green * set.blue;
    return sum;
  }, 0);
}

const day = "day02";
test(day, () => {
  expect(partOne(getExampleInput(day))).toBe(8);
  expect(partOne(getDayInput(day))).toBe(2683);

  expect(partTwo(getExampleInput(day))).toBe(2286);
  expect(partTwo(getDayInput(day))).toBe(49710);
});
