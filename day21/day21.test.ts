import { getFullInput, getSmallInput } from "../utils";

enum TileType {
  START = "S",
  GARDEN = ".",
  ROCK = "#",
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
  let start: Tile = { x: -1, y: -1, symbol: TileType.START , xquad: 0, yquad: 0};
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

function moves(tiles: Tile[][], tile: Tile): Tile[] {
  let north = tile.x > 0 ? tiles[tile.x - 1][tile.y] : undefined;
  let south = tile.x < tiles.length - 1 ? tiles[tile.x + 1][tile.y] : undefined;
  let east =
    tile.y < tiles[0].length - 1 ? tiles[tile.x][tile.y + 1] : undefined;
  let west = tile.y > 0 ? tiles[tile.x][tile.y - 1] : undefined;
  return [north, south, east, west]
    .filter((tile) => tile !== undefined)
    .filter((tile) => tile!.symbol !== TileType.ROCK) as Tile[];
}

function step(tiles: Tile[][], steps: Tile[]): Tile[] {
  return steps.reduce((acc, step) => {
    let next = moves(tiles, step).filter((tile) => !acc.includes(tile!));
    return acc.concat(next);
  }, [] as Tile[]);
}

function partOne(lines: string[], steps: number): number {
  let tiles = parseInput(lines);
  let start: Tile = startTile(tiles);
  let next: Tile[] = [start];
  for (let i = 0; i < steps; i++) {
    next = step(tiles, next);
  }
  return next.length;
}

function partTwo(lines: string[], steps: number): number {
  let tiles = parseInput(lines);
  let start: Tile = startTile(tiles);
  let next: Tile[] = [start];
  for (let i = 0; i < steps; i++) {
    next = step(tiles, next);
  }
  return next.length;
}

const day = "day21";
test(day, () => {
  expect(partOne(getSmallInput(day), 6)).toBe(16);
  expect(partOne(getFullInput(day), 64)).toBe(3660);

  expect(partTwo(getSmallInput(day), 6)).toBe(16);
  //expect(partTwo(getSmallInput(day), 10)).toBe(50);
  //expect(partTwo(getSmallInput(day), 50)).toBe(1594);
  //expect(partTwo(getSmallInput(day), 100)).toBe(6536);
  //expect(partTwo(getSmallInput(day), 500)).toBe(167004);
  //expect(partTwo(getSmallInput(day), 1000)).toBe(668697);
  //expect(partTwo(getSmallInput(day), 5000)).toBe(16733044);
  //expect(partTwo(getFullInput(day), 26501365)).toBe(0);
});
