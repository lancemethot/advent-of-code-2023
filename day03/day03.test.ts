import { isEmpty, isNil } from "lodash";

import { getFullInput, getSmallInput } from "../utils";

/**
const lines = getInputLines("day03")
  .filter((line) => line.trim().length > 0)
  .map((line) => `.${line}.`); // add a border of . to simplify checks
const lineLength = lines.reduce((acc, line) => Math.max(acc, line.length), 0);
const border = ".".repeat(lineLength);
*/

type PartNumber = {
  value: number;
  lineIndex: number;
  charIndex: number;
  charLength: number;
  neighbors: string[][];
  valid: boolean;
};

type Gear = {
  ratio: number;
  lineIndex: number;
  charIndex: number;
  neighbors: string[][];
};

function getLineCharacters(
  lines: string[],
  lineIndex: number,
  charIndex?: number,
  length?: number
): string[] {
  const border = ".".repeat(lines[0].length);
  let characters = [];
  if (lineIndex < 0 || lineIndex >= lines.length) {
    characters = border.split("");
  } else {
    characters = lines[lineIndex].split("");
  }

  if (!isNil(charIndex) && !isNil(length)) {
    return characters.slice(charIndex, charIndex + length + 1);
  }
  return characters;
}

function parseSchematicLineForPartNumbers(
  lines: string[],
  lineIndex: number
): PartNumber[] {
  const candidatePartNumbers: PartNumber[] = [];
  const characters = getLineCharacters(lines, lineIndex);
  let partNumber = "";

  for (let i = 0; i < characters.length; i++) {
    const check = characters[i];
    // Accumulate numbers
    if (check.match(/[0-9]/gi)) {
      partNumber = `${partNumber}${check}`;
      continue;
    } else {
      if (!isEmpty(partNumber)) {
        candidatePartNumbers.push({
          value: parseInt(partNumber),
          lineIndex: lineIndex,
          charIndex: i - partNumber.length,
          charLength: partNumber.length,
          neighbors: [
            getLineCharacters(
              lines,
              lineIndex - 1,
              i - partNumber.length - 1,
              partNumber.length + 1
            ),
            getLineCharacters(
              lines,
              lineIndex,
              i - partNumber.length - 1,
              partNumber.length + 1
            ),
            getLineCharacters(
              lines,
              lineIndex + 1,
              i - partNumber.length - 1,
              partNumber.length + 1
            ),
          ],
          valid: false,
        });
      }
      partNumber = "";
    }
  }
  return candidatePartNumbers;
}

function parseSchematicLineForGears(
  lines: string[],
  lineIndex: number
): Gear[] {
  const candidateGears: Gear[] = [];
  const characters = getLineCharacters(lines, lineIndex);

  for (let i = 0; i < characters.length; i++) {
    const check = characters[i];
    if (check.match(/[\\*]/gi)) {
      candidateGears.push({
        ratio: 0,
        lineIndex: lineIndex,
        charIndex: i,
        neighbors: [
          getLineCharacters(lines, lineIndex - 1, i - 1, 2),
          getLineCharacters(lines, lineIndex, i - 1, 2),
          getLineCharacters(lines, lineIndex + 1, i - 1, 2),
        ],
      });
    }
  }
  return candidateGears;
}

function parseSubstringForPartNumbers(
  lines: string[],
  lineIndex: number,
  charIndex: number
): number[] {
  const partNumbers: number[] = [];

  const characters = getLineCharacters(lines, lineIndex);
  let substr = characters[charIndex];

  // Look left
  for (let index = charIndex - 1; index > 0; index--) {
    const character = characters[index];
    if (character.match(/[0-9]/gi)) {
      substr = `${character}${substr}`;
    } else {
      break;
    }
  }

  // Look right
  for (let index = charIndex + 1; index < characters.length; index++) {
    const character = characters[index];
    if (character.match(/[0-9]/gi)) {
      substr = `${substr}${character}`;
    } else {
      break;
    }
  }

  partNumbers.push(
    ...substr
      .split(/[^0-9]/gi)
      .map((val) => parseInt(val))
      .filter((val) => !isNaN(val))
  );
  return partNumbers;
}

function verifyPartNumber(candidatePartNumber: PartNumber): PartNumber {
  const verifiedPartNumber: PartNumber = {
    value: candidatePartNumber.value,
    lineIndex: candidatePartNumber.lineIndex,
    charIndex: candidatePartNumber.charIndex,
    charLength: candidatePartNumber.charLength,
    neighbors: candidatePartNumber.neighbors,
    valid: false,
  };

  const check = candidatePartNumber.neighbors
    .reduce((acc, val) => acc.concat(val.join("")), [])
    .join("");
  if (check.match(/[^\\.0-9]/gi)) {
    verifiedPartNumber.valid = true;
  }

  return verifiedPartNumber;
}

function verifyGear(lines: string[], candidateGear: Gear): Gear {
  const verifiedGear: Gear = {
    ratio: candidateGear.ratio,
    lineIndex: candidateGear.lineIndex,
    charIndex: candidateGear.charIndex,
    neighbors: candidateGear.neighbors,
  };

  const nearByPartNumbers: number[] = [];
  nearByPartNumbers.push(
    ...parseSubstringForPartNumbers(
      lines,
      candidateGear.lineIndex - 1,
      candidateGear.charIndex
    )
  );
  nearByPartNumbers.push(
    ...parseSubstringForPartNumbers(
      lines,
      candidateGear.lineIndex,
      candidateGear.charIndex
    )
  );
  nearByPartNumbers.push(
    ...parseSubstringForPartNumbers(
      lines,
      candidateGear.lineIndex + 1,
      candidateGear.charIndex
    )
  );

  if (nearByPartNumbers.length === 2) {
    verifiedGear.ratio = nearByPartNumbers[0] * nearByPartNumbers[1];
  }

  return verifiedGear;
}

function getPartNumbers(lines: string[]): PartNumber[] {
  const bufferedLines = lines.map((line) => `.${line}.`);
  return bufferedLines
    .map((line, lineIndex) => {
      return parseSchematicLineForPartNumbers(bufferedLines, lineIndex);
    })
    .reduce(
      (partNumbers, candidates) =>
        partNumbers.concat(
          candidates.map((candidate) => verifyPartNumber(candidate))
        ),
      [] as PartNumber[]
    );
}

function getGears(lines: string[]): Gear[] {
  const bufferedLines = lines.map((line) => `.${line}.`);
  return bufferedLines
    .map((line, lineIndex) => {
      return parseSchematicLineForGears(bufferedLines, lineIndex);
    })
    .reduce(
      (gears, candidates) =>
        gears.concat(
          candidates.map((candidate) => verifyGear(bufferedLines, candidate))
        ),
      [] as Gear[]
    );
}

function partOne(lines: string[]): number {
  return getPartNumbers(lines).reduce((acc, partNumber) => {
    return acc + (partNumber.valid ? partNumber.value : 0);
  }, 0);
}

function partTwo(lines: string[]): number {
  return getGears(lines).reduce((acc, gear) => {
    return acc + gear.ratio;
  }, 0);
}

const day = "day03";
test("day 3", () => {
  expect(partOne(getSmallInput(day))).toBe(4361);
  expect(partOne(getFullInput(day))).toBe(512794);

  expect(partTwo(getSmallInput(day))).toBe(467835);
  expect(partTwo(getFullInput(day))).toBe(67779080);
});
