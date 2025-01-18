import { isNil } from "lodash";
import { getDayInput, getExampleInput } from "advent-of-code-utils";

enum TileType {
  EMPTY = ".",
  LEFT_MIRROR = "\\",
  RIGHT_MIRROR = "/",
  HORIZONTAL = "-",
  VERTICAL = "|",
}

enum Direction {
  LEFT = "left",
  RIGHT = "right",
  UP = "up",
  DOWN = "down",
}

type Tile = {
  x: number;
  y: number;
  type: TileType;
  energized: Beam[];
};

type Beam = {
  x: number;
  y: number;
  direction: Direction;
};

function parseInput(lines: string[]): Tile[][] {
  return lines.map(
    (line, x) =>
      line.split("").map((tile, y) => {
        return {
          x,
          y,
          type: tile,
          energized: [],
        };
      }) as Tile[]
  );
}

function getNextTile(
  tiles: Tile[][],
  tile: Tile,
  direction: Direction
): Tile | undefined {
  switch (direction) {
    case Direction.LEFT:
      return tile.y - 1 >= 0 ? tiles[tile.x][tile.y - 1] : undefined;
    case Direction.RIGHT:
      return tile.y + 1 < tiles[tile.x].length
        ? tiles[tile.x][tile.y + 1]
        : undefined;
    case Direction.UP:
      return tile.x - 1 >= 0 ? tiles[tile.x - 1][tile.y] : undefined;
    case Direction.DOWN:
      return tile.x + 1 < tiles.length ? tiles[tile.x + 1][tile.y] : undefined;
  }
}

function energize(tiles: Tile[][], beam: Beam): Tile[][] {
  const detector: { [key: string]: boolean } = {};
  const energized: Tile[][] = tiles.map((line) =>
    line.map((tile) => {
      return {
        ...tile,
        energized: [],
      };
    })
  );
  const beams: Beam[] = [beam];

  for (let i = 0; i < beams.length; i++) {
    let beam = beams[i];
    let tile: Tile | undefined = tiles[beam.x][beam.y];
    let next: Tile | undefined;

    while (!isNil(tile)) {
      const key = `${beam.x},${beam.y} ${beam.direction} ${tile.x},${tile.y}`;
      if (detector[key] === true) {
        // detected a cycle
        break;
      }
      //console.log(tiles.map((line) => line.map((t) => (t.x === tile?.x && t.y === tile?.y) ? 'X' : '.').join('')).join('\n'));

      energized[tile.x][tile.y].energized.push(beam);
      detector[key] = true;

      switch (tile.type) {
        case TileType.HORIZONTAL:
          if (
            beam.direction === Direction.UP ||
            beam.direction === Direction.DOWN
          ) {
            beam.x = tile!.x;
            beam.y = tile!.y;
            beam.direction = Direction.RIGHT;
            beams.push({
              x: tile!.x,
              y: tile!.y,
              direction: Direction.LEFT,
            });
          }
          break;
        case TileType.VERTICAL:
          if (
            beam.direction === Direction.LEFT ||
            beam.direction === Direction.RIGHT
          ) {
            beam.x = tile!.x;
            beam.y = tile!.y;
            beam.direction = Direction.UP;
            beams.push({
              x: tile!.x,
              y: tile!.y,
              direction: Direction.DOWN,
            });
          }
          break;
        case TileType.LEFT_MIRROR:
          if (beam.direction === Direction.UP) {
            beam.direction = Direction.LEFT;
          } else if (beam.direction === Direction.DOWN) {
            beam.direction = Direction.RIGHT;
          } else if (beam.direction === Direction.LEFT) {
            beam.direction = Direction.UP;
          } else if (beam.direction === Direction.RIGHT) {
            beam.direction = Direction.DOWN;
          }
          break;
        case TileType.RIGHT_MIRROR:
          if (beam.direction === Direction.UP) {
            beam.direction = Direction.RIGHT;
          } else if (beam.direction === Direction.DOWN) {
            beam.direction = Direction.LEFT;
          } else if (beam.direction === Direction.LEFT) {
            beam.direction = Direction.DOWN;
          } else if (beam.direction === Direction.RIGHT) {
            beam.direction = Direction.UP;
          }
          break;
      }
      tile = getNextTile(tiles, tile, beam.direction);
    }
  }
  return energized;
}

function beams(tiles: Tile[][]): Beam[] {
  return tiles
    .map((line, x) =>
      line
        .map((tile, y) => {
          const items: Beam[] = [];
          if (x === 0) {
            items.push({ x, y, direction: Direction.DOWN });
          } else if (x === tiles.length - 1) {
            items.push({ x, y, direction: Direction.UP });
          }
          if (y === 0) {
            items.push({ x, y, direction: Direction.RIGHT });
          } else if (y === tiles[x].length - 1) {
            items.push({ x, y, direction: Direction.LEFT });
          }
          return items as Beam[];
        })
        .flat()
    )
    .flat();
}

function partOne(lines: string[]): number {
  return energize(parseInput(lines), {
    x: 0,
    y: 0,
    direction: Direction.RIGHT,
  }).reduce((acc, line) => {
    return (acc += line.reduce((acc, tile) => {
      return (acc += tile.energized.length > 0 ? 1 : 0);
    }, 0));
  }, 0);
}

function partTwo(lines: string[]): number {
  const tiles = parseInput(lines);
  return beams(tiles).reduce((acc, beam) => {
    return Math.max(
      acc,
      energize(tiles, beam).reduce((acc, line) => {
        return (acc += line.reduce((acc, tile) => {
          return (acc += tile.energized.length > 0 ? 1 : 0);
        }, 0));
      }, 0)
    );
  }, 0);
}

const day = "day16";
test(day, () => {
  expect(partOne(getExampleInput(day))).toBe(46);
  expect(partOne(getDayInput(day))).toBe(7870);

  expect(partTwo(getExampleInput(day))).toBe(51);
  expect(partTwo(getDayInput(day))).toBe(8143);
});
