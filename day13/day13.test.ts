import { getFullInput, getSmallInput } from "../utils";

enum Terrain {
  ASH = ".",
  ROCK = "#",
}

type Pattern = {
  terrain: Terrain[][];
  lineOfReflection: {
    row: number;
    column: number;
  };
};

function newPattern(): Pattern {
  return {
    terrain: [],
    lineOfReflection: {
      row: 0,
      column: 0,
    },
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
function isReflective(terrain: Terrain[], index: number): boolean {
  const before = terrain.slice(0, index).reverse();
  const after = terrain.slice(index);
  let stop = Math.min(before.length, after.length);
  if (stop === 0) return false;
  for (let i = 0; i < stop; i++) {
    if (before[i] !== after[i]) {
      return false;
    }
  }
  return true;
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
  pattern.lineOfReflection.column = possibleColumns[0] || 0;
  pattern.lineOfReflection.row = possibleRows[0] || 0;
  return pattern;
}

function partOne(lines: string[]) {
  return parseInput(lines)
    .map((pattern) => findReflection(pattern))
    .reduce((acc, pattern) => {
      return (acc +=
        pattern.lineOfReflection.column + pattern.lineOfReflection.row * 100);
    }, 0);
}

const day = "day13";
test(day, () => {
  expect(partOne(getSmallInput(day))).toBe(405);
  expect(partOne(getFullInput(day))).toBe(37975);
});
