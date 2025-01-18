import { isNil, isEmpty } from "lodash";
import { getDayInput, getExampleInput } from "advent-of-code-utils";

const cache: Map<string, { left: string; right: string }> = new Map();

type Node = {
  name: string;
  left: string;
  right: string;
};

function parseInput(lines: string[]): {
  sequence: string;
  nodes: Node[];
} {
  cache.clear();
  const sequence = lines[0];
  const nodes: Node[] = [];
  for (let i = 2; i < lines.length; i++) {
    const match = lines[i].match(
      /([0-9A-Z]{3}) = \(([0-9A-Z]{3})\, ([0-9A-Z]{3})\)/
    ) as RegExpMatchArray;
    nodes.push({
      name: match[1],
      left: match[2],
      right: match[3],
    });
  }
  return {
    sequence,
    nodes,
  };
}

function getNext(nodes: Node[], name: string, direction: "L" | "R"): string {
  let node: { left: string; right: string } | undefined = cache.get(name);
  if (isNil(node) || isEmpty(node)) {
    node = nodes.find((n) => n.name === name);
    if (isNil(node) || isEmpty(node)) {
      throw new Error(`Cannot find ${name}`);
    }
    cache.set(name, {
      left: node.left,
      right: node.right,
    });
  }
  if (direction === "L") {
    return node.left;
  }
  return node.right;
}

function partOne(lines: string[]): number {
  const { sequence, nodes } = parseInput(lines);
  const directions = sequence.split("") as ("L" | "R")[];
  let steps = 0;
  let node = "AAA";
  for (let i = 0; i < directions.length; i++, steps++) {
    if (node === "ZZZ") {
      break;
    }
    node = getNext(nodes, node, directions[i]);
    if (i === directions.length - 1) {
      i = -1; // start over
    }
  }
  return steps;
}

function gcd(x: number, y: number): number {
  return (!y ? x : gcd(y, x % y));
}

function lcm(x: number, y: number): number {
  return (x  * y ) / gcd(x, y);
}

function partTwo(lines: string[]): number {
  const { sequence, nodes } = parseInput(lines);
  const directions = sequence.split("") as ("L" | "R")[];
  let minSteps: number[] = nodes
    .filter((node) => node.name.endsWith("A"))
    .map((node) => node.name)
    .map((name) => {
      let steps = 0;
      let node = name;
      for (let i = 0; i < directions.length; i++, steps++) {
        if (node.endsWith("Z")) {
          break;
        }
        node = getNext(nodes, node, directions[i]);
        if (i === directions.length - 1) {
          i = -1; // start over
        }
      }
      return steps;
    });
  return minSteps.reduce((a, b) => lcm(a, b));
}

const day = "day08";
test(day, () => {
  expect(partOne(getExampleInput(day, 1))).toBe(2);
  expect(partOne(getExampleInput(day, 2))).toBe(6);
  expect(partOne(getDayInput(day))).toBe(21797);

  expect(partTwo(getExampleInput(day, 3))).toBe(6);
  expect(partTwo(getDayInput(day))).toBe(23977527174353);
});
