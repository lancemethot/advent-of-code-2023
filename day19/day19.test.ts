import { getFullInput, getSmallInput } from "../utils";

enum Category {
  X = "x",
  M = "m",
  A = "a",
  S = "s",
}

enum Result {
  REJECTED = "R",
  ACCEPTED = "A",
}

type Part = {
  x: number;
  m: number;
  a: number;
  s: number;
  result?: Result;
};

type Rule = {
  condition?: {
    category: Category;
    operator: ">" | "<";
    value: number;
  };
  destination: string | Result;
};

function toRule(rule: string): Rule {
  let match = rule.split(/(([xmas]{1})([><])([0-9]+):)*([a-z]+)/gi) as RegExpMatchArray;
  // e.g. x<5:A
  // e.g. m>500:xyz
  // e.g. R
  let destination = match[5];
  let condition = match[2] ? {
        category: match[2], // xmas
        operator: match[3], // > or <
        value: parseInt(match[4]), // value
      }
    : undefined; // sometimes no condition
  return {
    condition,
    destination,
  } as Rule;
}

function toPart(line: string): Part {
  const match = line.split(/\{x=([0-9]+),m=([0-9]+),a=([0-9]+),s=([0-9]+)\}/gi) as RegExpMatchArray;
  return {
    x: parseInt(match[1]),
    m: parseInt(match[2]),
    a: parseInt(match[3]),
    s: parseInt(match[4]),
  } as Part;
}

function parseInput(lines: string[]): { workflows: Map<string, Rule[]>, parts: Part[] } {
  let foundBlank = false;
  const workflows: Map<string, Rule[]> = new Map();
  const parts: Part[] = [];

  lines.forEach((line) => {
    if (line.trim().length === 0) {
      foundBlank = true;
      return;
    } else if (foundBlank) {
      // loading parts
      parts.push(toPart(line));
    } else {
      // loading workflows
      const match = line.split(/([^\{]+)\{([^\}]+)\}/gi) as RegExpMatchArray;
      // matches: name{rule}
      // e.g. in{m>500:xyz,x<5:A,R}
      workflows.set(match[1], match[2].split(",").map(toRule));
    }
  });

  return {
    workflows,
    parts,
  };
}

function checkCondition(part: Part, condition: Rule["condition"]): boolean {
  if (condition === undefined) {
    return true;
  }
  const { category, operator, value } = condition;
  if (operator === ">" && part[category] > value) {
    return true;
  }
  if (operator === "<" && part[category] < value) {
    return true;
  }
  return false;
}

function processParts(workflows: Map<string, Rule[]>, parts: Part[]): Part[] {
  const accepted: Part[] = [];

  parts.forEach((part, p) => {
    let checks: Rule[] = [...(workflows.get("in") as Rule[])];
    while (checks.length > 0) {
      // pull first item
      const check = checks.shift() as Rule;

      // if no conditions and accepted -> add to accepted and break
      if (check.condition === undefined &&check.destination === Result.ACCEPTED) {
        part.result = Result.ACCEPTED;
        accepted.push(part);
        break;
      }

      // if no conditions and rejected -> break
      if (check.condition === undefined &&check.destination === Result.REJECTED) {
        break;
      }

      // if no conditions and destination is a workflow -> add workflow to checks
      if (check.condition === undefined && workflows.has(check.destination as string)) {
        checks.splice(0, 0, ...(workflows.get(check.destination as string) as Rule[]));
        continue;
      }

      // if condition and passes, add destination to checks
      if (check.condition && checkCondition(part, check.condition)) {
        checks.splice(0, 0, { destination: check.destination } as Rule);
        continue;
      }
    }
  });

  return accepted;
}

function partOne(lines: string[]): number {
  const { workflows, parts } = parseInput(lines);
  return processParts(workflows, parts).reduce((acc, part) => {
    return (acc += part.x + part.m + part.a + part.s);
  }, 0);
}

const day = "day19";
test(day, () => {
  expect(partOne(getSmallInput(day))).toBe(19114);
  expect(partOne(getFullInput(day))).toBe(480738);
});
