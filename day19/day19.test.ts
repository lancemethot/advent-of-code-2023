import { isNil } from "lodash";
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

type Range = {
  min: number;
  max: number;
};

type RangeSet = {
  x: Range;
  m: Range;
  a: Range;
  s: Range;
}

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
      if (check.condition === undefined && check.destination === Result.ACCEPTED) {
        part.result = Result.ACCEPTED;
        accepted.push(part);
        break;
      }

      // if no conditions and rejected -> break
      if (check.condition === undefined && check.destination === Result.REJECTED) {
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

function bisectRange(range: Range, value: number): { low: Range, high: Range } {
  return {
    low: { min: range.min, max: value - 1 },
    high: { min: value, max: range.max },
  };
}

function copyRangeSet(ranges: RangeSet): RangeSet {
  return {
    x: { min: ranges.x.min, max: ranges.x.max },
    m: { min: ranges.m.min, max: ranges.m.max },
    a: { min: ranges.a.min, max: ranges.a.max },
    s: { min: ranges.s.min, max: ranges.s.max },
  };
}

function rangeSetSize(ranges: RangeSet): number {
  const x = ranges.x.max - ranges.x.min + 1;
  const m = ranges.m.max - ranges.m.min + 1;
  const a = ranges.a.max - ranges.a.min + 1;
  const s = ranges.s.max - ranges.s.min + 1;
  return x * m * a * s;
}

function countCombinations(workflows: Map<string, Rule[]>, workflow: string, inventory: RangeSet): number {
  if(workflow === Result.ACCEPTED) {
    return rangeSetSize(inventory);
  } else if(workflow === Result.REJECTED) {
    return 0;
  }

  const ranges = copyRangeSet(inventory);
  const rules = workflows.get(workflow) as Rule[];
  let combinations = 0;
  rules.forEach((rule) => {
    if(isNil(rule.condition)) {
      combinations += countCombinations(workflows, rule.destination as string, ranges);
    } else {
      if(rule.condition.operator === "<") {
        const { low, high } = bisectRange(ranges[rule.condition.category], rule.condition.value);
        ranges[rule.condition.category] = low;
        combinations += countCombinations(workflows, rule.destination, ranges);
        ranges[rule.condition.category] = high;
      } else {
        const { low, high } = bisectRange(ranges[rule.condition.category], rule.condition.value + 1);
        ranges[rule.condition.category] = high;
        combinations += countCombinations(workflows, rule.destination, ranges);
        ranges[rule.condition.category] = low;
      }
    }
  });
  return combinations;
}

function partOne(lines: string[]): number {
  const { workflows, parts } = parseInput(lines);
  return processParts(workflows, parts).reduce((acc, part) => {
    return (acc += part.x + part.m + part.a + part.s);
  }, 0);
}

function partTwo(lines: string[]): number {
    const { workflows, parts } = parseInput(lines);
    const inventory: RangeSet = {
      x: { min: 1, max: 4000 },
      m: { min: 1, max: 4000 },
      a: { min: 1, max: 4000 },
      s: { min: 1, max: 4000 },
    }
    return countCombinations(workflows, "in", inventory);
}

const day = "day19";
test(day, () => {
  expect(partOne(getSmallInput(day))).toBe(19114);
  expect(partOne(getFullInput(day))).toBe(480738);

  expect(partTwo(getSmallInput(day))).toBe(167409079868000);
  expect(partTwo(getFullInput(day))).toBe(131550418841958);
});
