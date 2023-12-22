import { getFullInput, getSmallInput } from "../utils";

enum TileType {
  ROUND = "O",
  CUBE = "#",
  EMPTY = ".",
}

enum TiltDirection {
  NORTH = "N",
  SOUTH = "S",
  EAST = "E",
  WEST = "W",
}

type Platform = {
  tiles: TileType[][];
};

function parseInput(lines: string[]): Platform {
  return {
    tiles: lines.map((line) => line.split("") as TileType[]),
  };
}

function tilt(platform: Platform): Platform {
  const tilted = platform.tiles.map((row) => row.map((tile) => tile));
  // if direction is north
  // - for each column
  // - start with lowest = 0
  // - look at each row for the next # or O
  // - if # then set lowest to row #
  // - if O then swap O and . set lowest to row #
  for (let y = 0; y < tilted[0].length; y++) {
    let lowest = 0;
    for (let x = 0; x < tilted.length; x++) {
      if (tilted[x][y] === TileType.CUBE) {
        lowest = x + 1;
      } else if (tilted[x][y] === TileType.EMPTY) {
        lowest = Math.min(x, lowest); // Handle series of empty
      } else if (tilted[x][y] === TileType.ROUND) {
        if (tilted[lowest][y] === TileType.EMPTY) {
          tilted[x][y] = TileType.EMPTY;
          tilted[lowest][y] = TileType.ROUND;
          lowest = lowest + 1;
        } else {
          lowest = x + 1;
        }
      }
    }
  }
  return {
    tiles: tilted,
  };
}

function partOne(lines: string[]): number {
  return tilt(parseInput(lines)).tiles.reduce((acc, row, index, tiles) => {
    return (acc += row.reduce((acc, tile) => {
      return (acc += tile === TileType.ROUND ? tiles.length - index : 0);
    }, 0));
  }, 0);
}

const day = "day14";
test(day, () => {
  expect(partOne(getSmallInput(day))).toBe(136);
  expect(partOne(getFullInput(day))).toBe(112048);
});
