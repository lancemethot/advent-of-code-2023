import { defaultsDeep, uniq } from "lodash";
import { getFullInput, getSmallInput } from "../utils";

enum TileType {
  GALAXY = "#",
  EMPTY = ".",
}

type Tile = {
  x: number;
  y: number;
  symbol: TileType;
  id: number;
};

function parseInput(lines: string[]): Tile[][] {
  let galaxies = 0;
  return lines.map((line, x) => {
    const tiles: Tile[] = line.split("").map((symbol, y) => {
      return {
        x,
        y,
        symbol: symbol as unknown as TileType,
        id: symbol === TileType.GALAXY ? ++galaxies : 0,
        distance: Number.MAX_VALUE,
      };
    });
    return tiles;
  });
}

function expandUniverse(tiles: Tile[][], expansionRate: number = 2): Tile[][] {
  // columns with galaxies
  const cols: number[] = uniq(
    tiles
      .reduce((acc, line) => {
        const galaxies: number[] = line.reduce((acc, tile) => {
          if (tile.symbol === TileType.GALAXY) {
            acc.push(tile.y);
          }
          return acc;
        }, [] as number[]);
        acc.push(...galaxies);
        return acc;
      }, [] as number[])
      .sort((a, b) => a - b)
  );

  // rows with galaxies
  const rows: number[] = uniq(
    tiles
      .reduce((acc, line) => {
        const galaxies: number[] = line.reduce((acc, tile) => {
          if (tile.symbol === TileType.GALAXY) {
            acc.push(tile.x);
          }
          return acc;
        }, [] as number[]);
        acc.push(...galaxies);
        return acc;
      }, [] as number[])
      .sort((a, b) => a - b)
  );

  let xExpansion = 0;
  let yExpansion = 0;

  // Re-calibrate x,y coordinates of galaxies
  return tiles.map((line, x) => {
    if (!rows.includes(x)) {
      xExpansion += expansionRate - 1;
    }
    yExpansion = 0;
    return line.map((tile, y) => {
      if (tile.symbol === TileType.GALAXY) {
        return defaultsDeep(
          {},
          {
            x: xExpansion + x,
            y: yExpansion + y,
          },
          tile
        );
      }
      if (!cols.includes(y)) {
        yExpansion += expansionRate - 1;
      }
      return tile;
    });
  });
}

function partOne(lines: string[]): number {
  const universe = expandUniverse(parseInput(lines));
  const galaxies: Tile[] = universe.reduce((acc, line) => {
    const galaxies: Tile[] = line.reduce((acc, tile) => {
      if (tile.symbol === TileType.GALAXY) {
        acc.push(tile);
      }
      return acc;
    }, [] as Tile[]);
    acc.push(...galaxies);
    return acc;
  }, [] as Tile[]);
  return galaxies.reduce((acc, galaxy, index) => {
    for (let i = index + 1; i < galaxies.length; i++) {
      acc +=
        Math.abs(galaxy.x - galaxies[i].x) + Math.abs(galaxy.y - galaxies[i].y);
    }
    return acc;
  }, 0);
}

function partTwo(lines: string[], expansionRate: number = 2): number {
  const universe = expandUniverse(parseInput(lines), expansionRate);
  const galaxies: Tile[] = universe.reduce((acc, line) => {
    const galaxies: Tile[] = line.reduce((acc, tile) => {
      if (tile.symbol === TileType.GALAXY) {
        acc.push(tile);
      }
      return acc;
    }, [] as Tile[]);
    acc.push(...galaxies);
    return acc;
  }, [] as Tile[]);
  return galaxies.reduce((acc, galaxy, index) => {
    for (let i = index + 1; i < galaxies.length; i++) {
      acc +=
        Math.abs(galaxy.x - galaxies[i].x) + Math.abs(galaxy.y - galaxies[i].y);
    }
    return acc;
  }, 0);
}

const day = "day11";
test(day, () => {
  expect(partOne(getSmallInput(day))).toBe(374);
  expect(partOne(getFullInput(day))).toBe(10885634);

  expect(partTwo(getSmallInput(day), 2)).toBe(374);
  expect(partTwo(getSmallInput(day), 10)).toBe(1030);
  expect(partTwo(getSmallInput(day), 100)).toBe(8410);
  expect(partTwo(getFullInput(day), 1000000)).toBe(707505470642);
});
