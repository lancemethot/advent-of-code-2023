import { getDayInput, getExampleInput } from "advent-of-code-utils";

enum TileType {
  ROUND = "O",
  CUBE = "#",
  EMPTY = ".",
}

type Platform = {
  tiles: TileType[][];
};

function parseInput(lines: string[]): Platform {
  return {
    tiles: lines.map((line) => line.split("") as TileType[]),
  };
}

const cache: Map<string, string> = new Map();
function tiltLine(line: TileType[]): TileType[] {
  const key = line.join("");
  if (!cache.has(key)) {
    const tilted = line
      .join("")
      .split(/(#)/g)
      .map((group) => {
        if (group === TileType.CUBE) {
          return TileType.CUBE;
        } else {
          return group
            .split("")
            .sort((a, b) => {
              return a === TileType.ROUND ? (b === TileType.EMPTY ? -1 : 1) : 0;
            })
            .join("");
        }
      })
      .join("");
    cache.set(key, tilted);
  }
  return cache
    .get(key)
    ?.split("")
    .map((tile) => tile as TileType) as TileType[];
}

function tilt(tiles: TileType[][]): TileType[][] {
  return tiles.map((line) => tiltLine(line));
}

function turn(tiles: TileType[][], times: number = 1): TileType[][] {
  let rotatedTiles = tiles.map((row) => row.map((tile) => tile));
  for (let i = 0; i < times; i++) {
    // Transpose the grid (rotate 90 degrees clockwise)
    rotatedTiles = rotatedTiles[0]
      .map((_, i) => rotatedTiles.map((row) => row[i]))
      .map((row) => row.reverse());
  }
  return rotatedTiles;
}

const detector: Map<string, number> = new Map();
function spin(platform: Platform, cycles: number): Platform {
  let tiles = turn(platform.tiles, 3); // move so that north can be tilted
  for (let i = 0; i < cycles; i++) {
    tiles = turn(tilt(turn(tilt(turn(tilt(turn(tilt(tiles))))))));
    const key = tiles.map((row) => row.join("")).join("");
    if (detector.has(key)) {
      const length = i - detector.get(key)!;
      if(i + length < cycles) {
        // skip ahead
        i = cycles - (cycles - i) % length;
      }
    } else {
      detector.set(key, i);
    }
  }
  return {
    tiles: turn(tiles), // move back to original orientation
  };
}

function partOne(lines: string[]): number {
  return turn(tilt(turn(parseInput(lines).tiles, 3))).reduce(
    (acc, row, index, tiles) => {
      return (acc += row.reduce((acc, tile) => {
        return (acc += tile === TileType.ROUND ? tiles.length - index : 0);
      }, 0));
    },
    0
  );
}

function partTwo(lines: string[]): number {
  return spin(parseInput(lines), 1000000000).tiles.reduce(
    (acc, row, index, tiles) => {
      return (acc += row.reduce((acc, tile) => {
        return (acc += tile === TileType.ROUND ? tiles.length - index : 0);
      }, 0));
    },
    0
  );
}

const day = "day14";
test(day, () => {
  expect(partOne(getExampleInput(day))).toBe(136);
  expect(partOne(getDayInput(day))).toBe(112048);

  expect(partTwo(getExampleInput(day))).toBe(64);
  expect(partTwo(getDayInput(day))).toBe(105606);
});
