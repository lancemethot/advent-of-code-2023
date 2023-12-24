import { isNil } from "lodash";
import { getFullInput, getSmallInput } from "../utils";

enum Direction {
  LEFT = "left",
  RIGHT = "right",
  UP = "up",
  DOWN = "down",
}

type Tile = {
  x: number;
  y: number;
  heatloss: number;
};

type Path = {
  x: number;
  y: number;
  length: number;
  direction: Direction;
  cost: number;
};

function parseInput(lines: string[]): Tile[][] {
  return lines.map((line, x) =>
    line.split("").map((char, y) => {
      return {
        x,
        y,
        heatloss: parseInt(char),
      };
    })
  );
}

function getNextTiles(
  tiles: Tile[][],
  tile: Tile,
  direction: Direction
): (Tile | undefined)[] {
  const left: Tile | undefined =
    tile.y - 1 >= 0 ? tiles[tile.x][tile.y - 1] : undefined;
  const right: Tile | undefined =
    tile.y + 1 < tiles[tile.x].length ? tiles[tile.x][tile.y + 1] : undefined;
  const up: Tile | undefined =
    tile.x - 1 >= 0 ? tiles[tile.x - 1][tile.y] : undefined;
  const down: Tile | undefined =
    tile.x + 1 < tiles.length ? tiles[tile.x + 1][tile.y] : undefined;
  switch (direction) {
    case Direction.LEFT:
      return [left, undefined, up, down];
    case Direction.RIGHT:
      return [undefined, right, up, down];
    case Direction.UP:
      return [left, right, up, undefined];
    case Direction.DOWN:
      return [left, right, undefined, down];
  }
}

function findPaths(map: Tile[][]): Path[] {
  const cache: { [key: string]: number } = {};
  const paths: Path[] = [];
  const directions: Direction[] = [
    Direction.LEFT,
    Direction.RIGHT,
    Direction.UP,
    Direction.DOWN,
  ];
  const distances = map.map((row) => row.map(() => Number.MAX_VALUE));
  distances[0][0] = 0;

  paths.push(
    {
      x: 0,
      y: 0,
      length: 0,
      direction: Direction.RIGHT,
      cost: 0,
    },
    {
      x: 0,
      y: 0,
      length: 0,
      direction: Direction.DOWN,
      cost: 0,
    }
  );

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const key = `${path.x},${path.y},${path.direction},${path.length}`;
    if (cache[key] && cache[key] <= path.cost) {
      continue;
    }
    let tile: Tile | undefined = map[path.x][path.y];
    getNextTiles(map, tile, path.direction)
      .forEach((next, index) => {
        if (!isNil(next)) {
          if (path.direction !== directions[index]) {
            // change direction
            distances[next.x][next.y] = path.cost + next.heatloss;
            paths.push({
              x: next.x,
              y: next.y,
              length: 1,
              direction: directions[index],
              cost: path.cost + next.heatloss,
            });
          } else if (path.length < 3) {
            // same direction
            distances[next.x][next.y] = path.cost + next.heatloss;
            paths.push({
              x: next.x,
              y: next.y,
              length: path.length + 1,
              direction: path.direction,
              cost: path.cost + next.heatloss,
            });
          }
        }
      });
    cache[key] = path.cost;
  }

  return paths.filter(
    (path) => path.x === map.length - 1 && path.y === map[0].length - 1
  );
}

function partOne(lines: string[]): number {
  return findPaths(parseInput(lines)).reduce((acc, path) => {
    return Math.min(acc, path.cost);
  }, Number.MAX_VALUE);
}

const day = "day17";
test(day, () => {
  expect(partOne(getSmallInput(day))).toBe(102);
  //expect(partOne(getFullInput(day))).toBe(0);
});
