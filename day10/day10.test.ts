import { getDayInput, getExampleInput } from "advent-of-code-utils";

type Tile = {
  x: number;
  y: number;
  symbol: string;
  distance: number;
  location?: "inside" | "outside" | "pipe";
};

function parseInput(lines: string[]): Tile[][] {
  const length = lines.reduce((acc, line) => {
    return line.length > acc ? line.length : acc;
  }, 0);
  lines.unshift(".".repeat(length));
  lines.push(".".repeat(length));
  return lines.map((line, x) => {
    const tiles: Tile[] = `.${line}.`.split("").map((symbol, y) => {
      return {
        x,
        y,
        symbol,
        distance: symbol === "S" ? 0 : Number.MAX_VALUE,
      };
    });
    return tiles;
  });
}

function findS(tiles: Tile[][]): Tile {
  for (let x = 0; x < tiles.length; x++) {
    for (let y = 0; y < tiles[x].length; y++) {
      if (tiles[x][y].distance === 0) {
        return tiles[x][y];
      }
    }
  }
  return {
    x: 1,
    y: 1,
    symbol: "S",
    distance: 0,
  };
}

function findConnections(tiles: Tile[][], tile: Tile): Tile[] {
  const connections: Tile[] = [];
  const above: Tile = tiles[tile.x - 1][tile.y];
  const below: Tile = tiles[tile.x + 1][tile.y];
  const left: Tile = tiles[tile.x][tile.y - 1];
  const right: Tile = tiles[tile.x][tile.y + 1];
  if (
    above.distance === Number.MAX_VALUE &&
    (tile.symbol === "S" ||
      tile.symbol === "|" ||
      tile.symbol === "L" ||
      tile.symbol === "J") &&
    (above.symbol === "|" || above.symbol === "7" || above.symbol === "F")
  ) {
    connections.push(above);
  }
  if (
    below.distance === Number.MAX_VALUE &&
    (tile.symbol === "S" ||
      tile.symbol === "|" ||
      tile.symbol === "F" ||
      tile.symbol === "7") &&
    (below.symbol === "|" || below.symbol === "J" || below.symbol === "L")
  ) {
    connections.push(below);
  }
  if (
    left.distance === Number.MAX_VALUE &&
    (tile.symbol === "S" ||
      tile.symbol === "-" ||
      tile.symbol === "J" ||
      tile.symbol === "7") &&
    (left.symbol === "-" || left.symbol === "L" || left.symbol === "F")
  ) {
    connections.push(left);
  }
  if (
    right.distance === Number.MAX_VALUE &&
    (tile.symbol === "S" ||
      tile.symbol === "-" ||
      tile.symbol === "L" ||
      tile.symbol === "F") &&
    (right.symbol === "-" || right.symbol === "J" || right.symbol === "7")
  ) {
    connections.push(right);
  }
  return connections;
}

function calculateDistances(tiles: Tile[][], tile: Tile): Tile[][] {
  const check: Tile[] = [tile];
  for (let i = 0; i < check.length; i++) {
    const connections = findConnections(tiles, check[i]);
    if (connections.length > 0) {
      connections.forEach((connection) => {
        tiles[connection.x][connection.y].distance = check[i].distance + 1;
        check.push(tiles[connection.x][connection.y]);
      });
    }
  }
  return tiles;
}

// Diagonal scan ignoring L and 7
function scanTiles(tiles: Tile[][]): Tile[][] {
  let pipesFound = 0;
  // Start at bottom left corner of grid and move up
  for (let i = tiles.length - 1; i >= 0; i--) {
    pipesFound = 0;
    // Scan left to right x number of tiles
    for (let x = i, y = 0; x < tiles.length; x++, y++) {
      if (tiles[x][y].distance !== Number.MAX_VALUE) {
        tiles[x][y].location = "pipe";
        // Ignore bend right or bend down pieces
        if (tiles[x][y].symbol !== "L" && tiles[x][y].symbol !== "7") {
          pipesFound++;
        }
      } else {
        tiles[x][y].location =
          pipesFound % 2 === 0 || x === tiles.length - 1 ? "outside" : "inside";
      }
      if (y === tiles[x].length - 1) {
        break;
      }
    }
  }
  // Start with x = 0, and y = 1 (skip first tile as it was scanned above)
  // and move left
  for (let i = 1; i < tiles[0].length; i++) {
    pipesFound = 0;
    // Scan left to right x number of tiles and ignore bends
    for (let x = 0, y = i; x < tiles.length; x++, y++) {
      if (tiles[x][y].distance !== Number.MAX_VALUE) {
        tiles[x][y].location = "pipe";
        if (tiles[x][y].symbol !== "L" && tiles[x][y].symbol !== "7") {
          pipesFound++;
        }
      } else {
        tiles[x][y].location =
          pipesFound % 2 === 0 || x === tiles.length - 1 ? "outside" : "inside";
      }
      if (y === tiles[x].length - 1) {
        break;
      }
    }
  }

  return tiles;
}

function partOne(lines: string[]): number {
  const tiles: Tile[][] = parseInput(lines);
  return calculateDistances(tiles, findS(tiles)).reduce((furthest, line) => {
    return Math.max(
      furthest,
      line.reduce((highest, tile) => {
        return Math.max(
          highest,
          tile.distance === Number.MAX_VALUE ? 0 : tile.distance
        );
      }, 0)
    );
  }, 0);
}

function partTwo(lines: string[]): number {
  const tiles: Tile[][] = parseInput(lines);
  const scanned: Tile[][] = scanTiles(calculateDistances(tiles, findS(tiles)));
  return scanned.reduce((acc, line) => {
    return (
      acc +
      line.reduce((acc, tile) => {
        return acc + (tile.location === "inside" ? 1 : 0);
      }, 0)
    );
  }, 0);
}

const day = "day10";
test(day, () => {
  expect(partOne(getExampleInput(day, 1))).toBe(4);
  expect(partOne(getExampleInput(day, 2))).toBe(8);
  expect(partOne(getDayInput(day))).toBe(6701);

  expect(partTwo(getExampleInput(day, 3))).toBe(4);
  expect(partTwo(getExampleInput(day, 4))).toBe(4);
  expect(partTwo(getExampleInput(day, 5))).toBe(4);
  expect(partTwo(getExampleInput(day, 6))).toBe(8);
  expect(partTwo(getExampleInput(day, 7))).toBe(8);
  expect(partTwo(getExampleInput(day, 8))).toBe(10);
  expect(partTwo(getExampleInput(day, 9))).toBe(10);
  expect(partTwo(getDayInput(day))).toBe(303);
});
