import { getDayInput, getExampleInput } from "advent-of-code-utils";

enum Direction {
  LEFT = "L",
  RIGHT = "R",
  UP = "U",
  DOWN = "D",
}

const directions = [
  Direction.RIGHT,
  Direction.DOWN,
  Direction.LEFT,
  Direction.UP,
];

type DigPlan = {
  direction: Direction;
  length: number;
  color: string;
  x: number;
  y: number;
};

function parseInput(lines: string[]): DigPlan[] {
  return lines.map((line) => {
    const match = line.split(
      /([LRUD]) ([\d]+) \((#[a-f0-9]{6})\)/gi
    ) as RegExpMatchArray;
    return {
      direction: match[1],
      length: parseInt(match[2]),
      color: match[3],
    } as DigPlan;
  });
}

function adjustDigPlan(plan: DigPlan[]): DigPlan[] {
  return plan.map((next) => {
    return {
      ...next,
      direction:
        directions[parseInt(next.color.substring(next.color.length - 1))],
      length: Number(`0x${next.color.substring(1, next.color.length - 1)}`),
    };
  });
}

function prepareSite(plan: DigPlan[]): DigPlan[] {
  let x: number = 0;
  let y: number = 0;
  return plan.map((next) => {
    next.x = x;
    next.y = y;
    x += next.direction === Direction.DOWN ? next.length : next.direction === Direction.UP ? -next.length : 0;
    y += next.direction === Direction.RIGHT ? next.length : next.direction === Direction.LEFT ? -next.length : 0;
    return next;
  });
}

function dig(plan: DigPlan[]): number {
  // shoelace algorithm
  const site = prepareSite(plan).reverse();
  const area = site
    .reduce((acc, corner, index, corners) => {
      let next = index === corners.length - 1 ? 0 : index + 1;
      let addX = corner.x;
      let addY = corners[next].y;
      let subX = corners[next].x;
      let subY = corner.y;
      return acc + (addX * addY * 0.5 - subX * subY * 0.5);
    }, 0);

    const perimeter = site.reduce((acc, next) => {
      return acc += next.length;
    }, 0);
    
    // pick's theorem
    return area + perimeter / 2 + 1;
}

function partOne(lines: string[]): number {
  return dig(parseInput(lines));
}

function partTwo(lines: string[]): number {
  return dig(adjustDigPlan(parseInput(lines)));
}

const day = "day18";
test(day, () => {
  expect(partOne(getExampleInput(day))).toBe(62);
  expect(partOne(getDayInput(day))).toBe(50603);

  expect(partTwo(getExampleInput(day))).toBe(952408144115);
  expect(partTwo(getDayInput(day))).toBe(96556251590677);
});
