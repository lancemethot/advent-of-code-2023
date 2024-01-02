import { defaultsDeep, isNil } from "lodash";
import { getFullInput, getSmallInput } from "../utils";

enum TileType {
  START = "S",
  GARDEN = ".",
  ROCK = "#",
  VISITED = 'O',
}

type Tile = {
  x: number;
  y: number;
  symbol: TileType;
  xquad: number;
  yquad: number;
};

function parseInput(lines: string[]): Tile[][] {
  return lines.map((line, x) => {
    return line.split("").map((symbol, y) => {
      return { x, y, symbol: symbol as TileType, xquad: 0, yquad: 0 };
    });
  });
}

function startTile(tiles: Tile[][]): Tile {
  let start: Tile = { x: -1, y: -1, symbol: TileType.START,xquad: 0, yquad: 0 };
  return tiles.reduce((acc, line) => {
    return line.reduce((acc, tile) => {
      if (tile.symbol === TileType.START) {
        start.x = tile.x;
        start.y = tile.y;
        return tile;
      }
      return acc;
    }, acc);
  }, start);
}

function moves(tiles: Tile[][], tile: Tile, infinite: boolean = false): Tile[] {
  let north = tile.x > 0 ? tiles[tile.x - 1][tile.y] : undefined;
  if (infinite) {
    if (isNil(north)) {
      north = {
        x: tiles.length - 1,
        y: tile.y,
        symbol: tiles[tiles.length - 1][tile.y].symbol,
        xquad: tile.xquad - 1,
        yquad: tile.yquad,
      };
    } else {
      north = defaultsDeep({}, {
        xquad: tile.xquad,
        yquad: tile.yquad,
      }, north);
    }
  }

  let south = tile.x < tiles.length - 1 ? tiles[tile.x + 1][tile.y] : undefined;
  if (infinite) {
    if (isNil(south)) {
      south = {
        x: 0,
        y: tile.y,
        symbol: tiles[0][tile.y].symbol,
        xquad: tile.xquad + 1,
        yquad: tile.yquad,
      };
    } else {
      south = defaultsDeep({}, {
        xquad: tile.xquad,
        yquad: tile.yquad,
      }, south);
    }
  }

  let east = tile.y < tiles[0].length - 1 ? tiles[tile.x][tile.y + 1] : undefined;
  if (infinite) {
    if (isNil(east)) {
      east = {
        x: tile.x,
        y: 0,
        symbol: tiles[tile.x][0].symbol,
        xquad: tile.xquad,
        yquad: tile.yquad + 1,
      };
    } else {
      east = defaultsDeep({}, {
        xquad: tile.xquad,
        yquad: tile.yquad,
      }, east);
    }
  }

  let west = tile.y > 0 ? tiles[tile.x][tile.y - 1] : undefined;
  if (infinite) {
    if (isNil(west)) {
      west = {
        x: tile.x,
        y: tiles[0].length - 1,
        symbol: tiles[tile.x][tiles[0].length - 1].symbol,
        xquad: tile.xquad,
        yquad: tile.yquad - 1,
      };
    } else {
      west = defaultsDeep({}, {
        xquad: tile.xquad,
        yquad: tile.yquad,
      }, west);
    }
  }

  return [north, south, east, west]
    .filter((tile) => tile !== undefined)
    .filter((tile) => tile!.symbol !== TileType.ROCK) as Tile[];
}

function step(tiles: Tile[][], steps: Tile[], infinite: boolean = false): Tile[] {
  return steps.reduce((acc, step) => {
    let next = moves(tiles, step, infinite).filter(
      (tile) =>
        acc.findIndex(
          (t) =>
            t.x === tile.x &&
            t.y === tile.y &&
            t.xquad === tile.xquad &&
            t.yquad === tile.yquad
        ) === -1
    );
    return acc.concat(next);
  }, [] as Tile[]);
}

function printMap(tiles: Tile[][], next: Tile[], xq: number, yq: number): string[] {
  return tiles.map((line) => line.map((tile) => {
    return next.reduce((acc, t) => {
      return (t.x === tile.x && t.y === tile.y && t.xquad === xq && t.yquad === yq) ? TileType.VISITED : acc;
    }, tile.symbol);
  }).join(""));
}

function print(tiles: Tile[][], step: number, next: Tile[]): void {
  let nw = printMap(tiles, next, -1, -1);
  let n = printMap(tiles, next, -1, 0);
  let ne = printMap(tiles, next, -1, 1);
  let w = printMap(tiles, next, 0, -1);
  let c = printMap(tiles, next, 0, 0);
  let e = printMap(tiles, next, 0, 1);
  let sw = printMap(tiles, next, 1, -1);
  let s = printMap(tiles, next, 1, 0);
  let se = printMap(tiles, next, 1, 1);

  let str = [nw.map((line, index) => `${nw[index]} ${n[index]} ${ne[index]}`).join("\n"),
             w.map((line, index) => `${w[index]} ${c[index]} ${e[index]}`).join("\n"),
             sw.map((line, index) => `${sw[index]} ${s[index]} ${se[index]}`).join("\n")].join('\n');
  console.log(`step ${step + 1}:\n`+
              `${str}\n\n`+
              `visited: ${next.length}\n\n${next.reduce((acc, tile, index) => {
                let key = `${index + 1}] tile ${tile.x}, ${tile.y} quadrant: ${tile.xquad}, ${tile.yquad}`;
                if(acc.includes(key)) key += " (duplicate)";
                return [ ...acc, key]
              }, [] as string[]).join('\n')}`);
}

function solve(tiles: Tile[][], steps: number, infinite: boolean = false): number {
  let start: Tile = startTile(tiles);
  let next: Tile[] = [start];
  for (let i = 0; i < steps; i++) {
    next = step(tiles, next, infinite);
    // print(tiles, i, next);
  }
  return next.length;
}

function partOne(lines: string[], steps: number): number {
  return solve(parseInput(lines), steps, false);
}

function partTwo(lines: string[], steps: number): number {
  return solve(parseInput(lines), steps, true);
}

const day = "day21";
test(day, () => {
  expect(partOne(getSmallInput(day), 6)).toBe(16);
  expect(partOne(getFullInput(day), 64)).toBe(3660);

  expect(partTwo(getSmallInput(day), 6)).toBe(16);
  expect(partTwo(getSmallInput(day), 10)).toBe(50);
  expect(partTwo(getSmallInput(day), 50)).toBe(1594);
  //expect(partTwo(getSmallInput(day), 100)).toBe(6536);
  //expect(partTwo(getSmallInput(day), 500)).toBe(167004);
  //expect(partTwo(getSmallInput(day), 1000)).toBe(668697);
  //expect(partTwo(getSmallInput(day), 5000)).toBe(16733044);
  //expect(partTwo(getFullInput(day), 26501365)).toBe(0);
});
