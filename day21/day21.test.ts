import path from "path";
import { getFullInput, getSmallInput } from "../utils";
import fs from 'fs'

enum TileType {
  START = "S",
  GARDEN = ".",
  ROCK = "#",
}

type Tile = {
  x: number;
  y: number;
  symbol: TileType;
  distance: number;
};

function parseInput(lines: string[]): Tile[][] {
  return lines.map((line, x) => {
    return line.split("").map((symbol, y) => {
      return { x, y, symbol: symbol as TileType, distance: Number.MAX_VALUE };
    });
  });
}

function startTile(tiles: Tile[][]): Tile {
  let start: Tile = { x: -1, y: -1, symbol: TileType.START, distance: 0 };
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
  let east = tile.y < tiles[0].length - 1 ? tiles[tile.x][tile.y + 1] : undefined;
  let west = tile.y > 0 ? tiles[tile.x][tile.y - 1] : undefined;
  return [north, south, east, west]
    .filter((tile) => tile !== undefined)
    .filter((tile) => tile!.symbol !== TileType.ROCK) as Tile[];
}

function step(tiles: Tile[][], steps: Tile[]): Tile[] {
  return steps.reduce((acc, step) => {
    let next = moves(tiles, step).filter(
      (tile) =>
        acc.findIndex((t) => t.x === tile.x && t.y === tile.y) === -1
    );
    return acc.concat(next);
  }, [] as Tile[]);
}

function solve(tiles: Tile[][], steps: number): number {
  let start: Tile = startTile(tiles);
  let next: Tile[] = [start];
  for (let i = 0; i < steps; i++) {
    next = step(tiles, next);
  }
  return next.length;
}

function dijkstra(tiles: Tile[][], start: Tile): Tile[][] {
  let visited: Tile[][] = tiles.map(line => line.map(tile => {tile.distance = Number.MAX_VALUE; return tile;}));
  visited[start.x][start.y].distance = 0;
  let queue: Tile[] = [start];
  while (queue.length > 0) {
    let tile = queue.shift()!;
    let distance = visited[tile.x][tile.y].distance;
    moves(tiles, tile).forEach((t) => {
      if(distance + 1 < visited[t.x][t.y].distance) {
        visited[t.x][t.y].distance = distance + 1;
        queue.push(t);
      }
    });
  }
  return visited;
}

function countReachable(tiles: Tile[][], start: Tile, steps: number): number {
  const visited = dijkstra(tiles, start);
  //const map  = visited.map(line => line.map(tile => tile.distance <= steps ? tile.distance < 10 ? `  ${tile.distance}` : tile.distance < 100 ? ` ${tile.distance}` : tile.distance < Number.MAX_VALUE ? tile.distance : tile.symbol.repeat(3) : 'XXX').join(" ")).join("\n");
  //fs.writeFileSync(path.join(__dirname, `day21-${start.x}-${start.y}-${steps}.out`), map);

  let evens = steps % 2 === 0;
  return visited.reduce((acc, line) => {
    return acc += line.filter(tile => tile.distance <= steps)
      .filter(tile => evens ? tile.distance % 2 === 0 : tile.distance % 2 === 1).length;
  }, 0);
}

function partOne(lines: string[], steps: number): number {
  return solve(parseInput(lines), steps);
}

// https://github.com/villuna/aoc23/wiki/A-Geometric-solution-to-advent-of-code-2023,-day-21

function partTwo(lines: string[], steps: number): number {
  let tiles: Tile[][] = parseInput(lines);
  let start: Tile = startTile(tiles);

  // A lot of this assumes a square grid with unobstructed movement
  // from the center to east/west edges.
  let width = tiles.length;
  let shortestDistance = Math.floor(width / 2);
  let numOfGrids = Math.floor((steps - shortestDistance) / width);
  let total = 0;

  // Count the # of reachable steps from the center
  // These are the fully-filled grids within the diamond
  const evenSteps = countReachable(tiles, start, width + 1);
  total += (numOfGrids * numOfGrids) * evenSteps;

  const oddSteps = countReachable(tiles, start, width);
  total += ((numOfGrids - 1) * (numOfGrids - 1)) * oddSteps;

  // Count the # of reachable steps from each corner
  // These are the partially-filled grids along the 4 edges
  // of the diamond.
  const fromNWStepsBig = countReachable(tiles, tiles[0][0], width + shortestDistance - 1);
  total += (numOfGrids - 1) * fromNWStepsBig;

  const fromNWStepsSmall = countReachable(tiles, tiles[0][0], shortestDistance - 1);
  total += numOfGrids * fromNWStepsSmall;

  const fromNEStepsBig = countReachable(tiles, tiles[0][width - 1], width + shortestDistance - 1);
  total += (numOfGrids - 1) * fromNEStepsBig;

  const fromNEStepsSmall = countReachable(tiles, tiles[0][width - 1], shortestDistance - 1);
  total += numOfGrids * fromNEStepsSmall;

  const fromSWStepsBig = countReachable(tiles, tiles[width - 1][0], width + shortestDistance - 1);
  total +=  (numOfGrids - 1) * fromSWStepsBig;

  const fromSWStepsSmall = countReachable(tiles, tiles[width - 1][0], shortestDistance - 1);
  total += numOfGrids * fromSWStepsSmall;

  const fromSEStepsBig = countReachable(tiles, tiles[width - 1][width - 1], width + shortestDistance - 1);
  total +=  (numOfGrids - 1) * fromSEStepsBig;

  const fromSEStepsSmall = countReachable(tiles, tiles[width - 1][width - 1], shortestDistance - 1);
  total += numOfGrids * fromSEStepsSmall;

  // Count the # of steps from edge to edge
  // These are the 4 points of the diamond
  const fromTop = countReachable(tiles, tiles[0][shortestDistance], width - 1);
  total += fromTop;

  const fromBottom = countReachable(tiles, tiles[width - 1][shortestDistance], width - 1);
  total += fromBottom;

  const fromLeft = countReachable(tiles, tiles[shortestDistance][0], width - 1);
  total += fromLeft;

  const fromRight = countReachable(tiles, tiles[shortestDistance][width - 1], width - 1);
  total += fromRight;

  return total;
}

const day = "day21";
test(day, () => {
  expect(partOne(getSmallInput(day), 6)).toBe(16);
  expect(partOne(getFullInput(day), 64)).toBe(3660);

  //expect(partTwo(getSmallInput(day), 6)).toBe(16);
  //expect(partTwo(getSmallInput(day), 10)).toBe(50);
  //expect(partTwo(getSmallInput(day), 50)).toBe(1594);
  //expect(partTwo(getSmallInput(day), 100)).toBe(6536);
  //expect(partTwo(getSmallInput(day), 500)).toBe(167004);
  //expect(partTwo(getSmallInput(day), 1000)).toBe(668697);
  //expect(partTwo(getSmallInput(day), 5000)).toBe(16733044);
  expect(partTwo(getFullInput(day), 26501365)).toBe(605492675373144);
});
