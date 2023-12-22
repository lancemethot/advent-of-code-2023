import { isEmpty, isNil } from "lodash";
import { getFullInput, getSmallInput } from "../utils";

enum Terrain {
  ASH = ".",
  ROCK = "#",
}

type LineOfReflection = {
  row?: number;
  column?: number;
};

type Pattern = {
  terrain: Terrain[][];
  lineOfReflection: LineOfReflection;
};

function newPattern(): Pattern {
  return {
    terrain: [],
    lineOfReflection: {},
  };
}

function parseInput(lines: string[]): Pattern[] {
  let pattern: Pattern = newPattern();
  return lines.reduce((acc, line, index) => {
    if (line.length === 0) {
      acc.push(pattern);
      pattern = newPattern();
    } else {
      pattern.terrain.push(line.split("") as Terrain[]);
      if (index === lines.length - 1) {
        acc.push(pattern);
      }
    }
    return acc;
  }, [] as Pattern[]);
}

/**
 * Split terrain at position 'index'
 * Reverse the 'before' characters
 * Compare the two for any inequality
 */
const cache: Map<string, boolean> = new Map();
function isReflective(terrain: Terrain[], index: number): boolean {
  const key = `${terrain.join("")}-${index}`;
  if (cache.has(key)) {
    return cache.get(key) as boolean;
  }
  let reflective = false;
  const before = terrain.slice(0, index).reverse();
  const after = terrain.slice(index);
  let stop = Math.min(before.length, after.length);
  for (let i = 0; i < stop; i++) {
    reflective = before[i] === after[i];
    if (!reflective) {
      break;
    }
  }
  cache.set(key, reflective);
  return reflective;
}

function findReflection(pattern: Pattern): Pattern {
  const height = pattern.terrain.length; // # of rows (lines)
  const length = pattern.terrain[0].length; // # of columns (assuming equal lines)

  let possibleColumns = Array.from(Array(length).keys()); // Candidate cols e.g [0, 1, 2, 3, 4...]
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < length; j++) {
      if (!isReflective(pattern.terrain[i], j)) {
        // Remove un-reflective columns from candidate list
        possibleColumns = possibleColumns.filter((column) => column !== j);
      }
    }
  }

  let possibleRows = Array.from(Array(height).keys()); // Candidate rows e.g. [0, 1, 2, 3, 4...]
  for (let i = 0; i < length; i++) {
    const terrain: Terrain[] = pattern.terrain.map((row) => row[i]); // Get the nth char in each row
    for (let j = 0; j < terrain.length; j++) {
      if (!isReflective(terrain, j)) {
        // Remove un-reflective rows from candidate list
        possibleRows = possibleRows.filter((row) => row !== j);
      }
    }
  }
  // Remove existing reflective cols/rows from candidate list (part 2)
  pattern.lineOfReflection.column = possibleColumns.filter(
    (column) => column !== pattern.lineOfReflection.column
  )[0];
  pattern.lineOfReflection.row = possibleRows.filter(
    (row) => row !== pattern.lineOfReflection.row
  )[0];
  return pattern;
}

function flipTerrain(terrain: Terrain[][], x: number, y: number): Terrain[][] {
  return terrain.map((row, a) => {
    return row.map((cell, b) => {
      if (a === x && b === y) {
        return cell === Terrain.ASH ? Terrain.ROCK : Terrain.ASH;
      } else {
        return cell;
      }
    });
  });
}

function fixSmudge(pattern: Pattern): Pattern {
  for (let x = 0; x < pattern.terrain.length; x++) {
    for (let y = 0; y < pattern.terrain[x].length; y++) {
      const reflection = findReflection({
        terrain: flipTerrain(pattern.terrain, x, y),
        lineOfReflection: {
          column: pattern.lineOfReflection.column,
          row: pattern.lineOfReflection.row
        }
      });
      if (!isNil(reflection.lineOfReflection.column) || !isNil(reflection.lineOfReflection.row)) {
        return reflection;
      }
    }
  }
  return pattern;
}

function partOne(lines: string[]) {
  return parseInput(lines)
    .map((pattern) => findReflection(pattern))
    .reduce((acc, pattern) => {
      return (acc +=
        (pattern.lineOfReflection.column || 0) +
        (pattern.lineOfReflection.row || 0) * 100);
    }, 0);
}

function partTwo(lines: string[]) {
  return parseInput(lines)
    .map((pattern) => findReflection(pattern))
    .map((pattern) => fixSmudge(pattern))
    .reduce((acc, pattern) => {
      return (acc +=
        (pattern.lineOfReflection.column || 0) +
        (pattern.lineOfReflection.row || 0) * 100);
    }, 0);
}

const day = "day13";
test(day, () => {
  expect(partOne(getSmallInput(day))).toBe(405);
  expect(partOne(getFullInput(day))).toBe(37975);

  expect(partTwo(getSmallInput(day))).toBe(400);
  expect(partTwo(getFullInput(day))).toBe(32497);
});
