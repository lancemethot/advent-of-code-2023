import { isNil } from "lodash";
import { getFullInput, getSmallInput } from "../utils";

enum Direction {
  LEFT = "left",
  RIGHT = "right",
  UP = "up",
  DOWN = "down",
}
const directions: Direction[] = [
  Direction.LEFT,
  Direction.RIGHT,
  Direction.UP,
  Direction.DOWN,
];

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
  distance: number;
  parent?: Path;
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

function cacheKey(path: Path): string {
  return `${path.x},${path.y},${path.direction},${path.length}`;
}

function jump(
  map: Tile[][],
  tile: Tile,
  direction: Direction,
  length: number
): { next?: Tile; cost: number } {
  let cost = 0;
  let next = tile;
  for (let i = 0; i < length; i++) {
    next = getNextTiles(map, map[next.x][next.y], direction)[
      directions.indexOf(direction)
    ]!;
    if (!isNil(next)) {
      cost += next.heatloss;
    } else {
      break;
    }
  }
  //console.log(`jumped ${length} tiles, ${tile.x},${tile.y} -> ${next.x},${next.y} cost: ${cost}`);
  return { next, cost };
}

function distance(start: number[], end: number[]): number {
  return Math.abs(start[0] - end[0]) + Math.abs(start[1] - end[1]);
}

function findShortestPath(
  map: Tile[][],
  minLength: number = 1,
  maxLength: number = 3
): Path[] {
  const cache: { [key: string]: number } = {};
  const paths: Path[] = [];
  const end: number[] = [map.length - 1, map[0].length - 1];
  paths.push(
    {
      x: 0,
      y: 0,
      length: 0,
      direction: Direction.RIGHT,
      cost: 0,
      distance: distance([0, 0], end),
    },
    {
      x: 0,
      y: 0,
      length: 0,
      direction: Direction.DOWN,
      cost: 0,
      distance: distance([0, 0], end),
    }
  );

  while(paths.length > 0) {
    let lowestIndex = 0;
    for(let i = 0; i < paths.length; i++) {
      if(paths[i].cost + paths[i].distance < paths[lowestIndex].cost + paths[lowestIndex].distance) {
        lowestIndex = i;
      }
    }
    const path = paths[lowestIndex];

    const key = cacheKey(path);
    if (cache[key]) {
      continue;
    }

    if (distance([path.x, path.y], end) === 0) {
      const shortestPath: Path[] = [];
      let next = path;
      shortestPath.push(next);
      while(!isNil(next.parent)) {
        shortestPath.push(next.parent);
        next = next.parent;
      }
      return shortestPath.reverse();
    }

    paths.splice(lowestIndex, 1);

    getNextTiles(map, map[path.x][path.y], path.direction)
      .map((next, index) => {
        if (!isNil(next)) {
          if (
            path.direction !== directions[index] &&
            path.length >= minLength
          ) {
            // change direction
            return {
              x: next.x,
              y: next.y,
              length: 1,
              direction: directions[index],
              cost: path.cost + next.heatloss,
              distance: distance([next.x, next.y], end),
              parent: path,
            };
          } else if (path.length < minLength) {
            // same direction, but jump to min length tile
            const jumpAhead = jump(
              map,
              map[path.x][path.y],
              path.direction,
              minLength - path.length
            );
            if (!isNil(jumpAhead.next)) {
              return {
                x: jumpAhead.next.x,
                y: jumpAhead.next.y,
                length: minLength,
                direction: path.direction,
                cost: path.cost + jumpAhead.cost,
                distance: distance([jumpAhead.next.x, jumpAhead.next.y], end),
                parent: path,
              };
            }
          } else if (path.length < maxLength) {
            // same direction, but under max length, move forward
            return {
              x: next.x,
              y: next.y,
              length: path.length + 1,
              direction: path.direction,
              cost: path.cost + next.heatloss,
              distance: distance([next.x, next.y], end),
              parent: path,
            };
          }
        }
        return undefined;
      })
      .filter((newPath) => !isNil(newPath)) // there is a path
      .filter((newPath) => isNil(cache[cacheKey(newPath!)])) // it has not been visited
      .forEach((newPath) => {
        // find insert position
        const insert = paths.findIndex((path) => {
          return cacheKey(path) === cacheKey(newPath!);
        });

        if(insert < 0) {
          paths.push(newPath! as Path);
        } else {
          if(newPath!.cost < paths[insert].cost) {
            paths.splice(insert, 1, newPath as Path);
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
  return findShortestPath(parseInput(lines)).reduce((acc, path) => {
    return Math.max(acc, path.cost);
  }, 0);
}

function partTwo(lines: string[]): number {
  return findShortestPath(parseInput(lines), 4, 10).reduce((acc, path) => {
    return Math.max(acc, path.cost);
  }, 0);
}

const day = "day17";
test(day, () => {
  expect(partOne(getSmallInput(day, 1))).toBe(102);
  expect(partOne(getFullInput(day))).toBe(1004);

  expect(partTwo(getSmallInput(day, 1))).toBe(94);
  //expect(partTwo(getSmallInput(day, 2))).toBe(71);
  //expect(partTwo(getFullInput(day))).toBe(0);
});
