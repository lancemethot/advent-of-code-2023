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
  complements: Range[];
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

function flattenRules(workflows: Map<string, Rule[]>, rules: Rule[], prefix: string = ''): string[] {
  const flattened: string[] = [];

  rules.forEach((rule) => {
    if(isNil(rule.condition)) {
      if(rule.destination === Result.ACCEPTED || rule.destination === Result.REJECTED) {
        flattened.push(prefix + `->${rule.destination}`);
      } else {
        flattened.push(... flattenRules(workflows, workflows.get(rule.destination as string) as Rule[], prefix));
      }
    } else {
      let newPrefix = prefix + `->${rule.condition.category}${rule.condition.operator}${rule.condition.value}`;
      if(rule.destination === Result.ACCEPTED || rule.destination === Result.REJECTED) {
        flattened.push(newPrefix + `->${rule.destination}`);
      } else {
        flattened.push(... flattenRules(workflows, workflows.get(rule.destination as string) as Rule[], newPrefix));
      }
    }
  });

  return flattened;
}

const categories: Category [] = [Category.X, Category.M, Category.A, Category.S];
function filterRange(population: Range[], condition: string): Range[] {
  console.log(`from ${population.map((r) => `${r.min}..${r.max}`).join(',')} where ${condition}`);
  const parts = condition.split(/([xmas]{1})([><])([0-9]+)/gi) as RegExpMatchArray;
  const category = parts[1] as Category;
  const operator = parts[2] as ">" | "<";
  const value = parseInt(parts[3]);
  const index = categories.indexOf(category);
  let min = operator === '>' ? value + 1 > population[index].min ? value + 1 : population[index].min : population[index].min;
  let max = operator === '<' ? value - 1 < population[index].max ? value - 1 : population[index].max : population[index].max;
  let complements: Range[] = [];
  min > 1 ? complements.push({ min: 1, max: min - 1, complements: [] }) : max < 4000 ? complements.push({ min: max + 1, max: 4000, complements: [] }) : null;
  population[index] = { min, max, complements };
  console.log(`to ${population.map((r) => `${r.min}..${r.max}`).join(',')}`);
  console.log(`complements: ${population.map((r) => r.complements ? `${r.complements[0].min}..${r.complements[0].max}` : `${r.min}..${r.max}`).join(',')}`);
  return population;
}

function findRange(rule: string): Range [] {
  const criteria = rule.split("->").filter((r) => r !== "" && r !== Result.ACCEPTED && r !== Result.REJECTED);
  const inventory = Array(4).fill({ min: 1, max: 4000} as Range);
  return criteria.reduce((acc, c) => {
    return filterRange(acc, c);
  }, inventory);
}

function countCombinations(workflows: Map<string, Rule[]>): number {
  let combinations = 0;

  const flattened = flattenRules(workflows, workflows.get("in") as Rule[]);
  const accepted = flattened.filter((rule) => rule.endsWith(`->${Result.ACCEPTED}`));
  const rejected = flattened.filter((rule) => rule.endsWith(`->${Result.REJECTED}`));

  // debug
  let totalParts = 4000 * 4000 * 4000 * 4000;
  console.log(`total parts: ${totalParts}`);
  console.log(`accepted:\n${accepted.join('\n')}`);
  console.log(`rejected:\n${rejected.join('\n')}`);
  // debug

  combinations = accepted.reduce((acc, rule) => {
    const range: Range[] = findRange(rule);
    const valid = range.reduce((acc, r) => {
      return acc && r.min <= r.max;
    }, true);

    if(valid) {
      let x = range[0].max - range[0].min + 1;
      let m = range[1].max - range[1].min + 1;
      let a = range[2].max - range[2].min + 1;
      let s = range[3].max - range[3].min + 1;
      let total = x * m * a * s;
      console.log(`  valid rule: ${rule} ${range.map((r) => `${r.min}..${r.max}`).join(',')} = ${total} combinations`);
      return acc + total;
    } else {
      console.log(`invalid rule: ${rule} ${range.map((r) => `${r.min}..${r.max}`).join(',')}`);
    }
    return acc;
  }, 0);

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
    return countCombinations(workflows);
}

const day = "day19";
test(day, () => {
  expect(partOne(getSmallInput(day))).toBe(19114);
  expect(partOne(getFullInput(day))).toBe(480738);

  expect(partTwo(getSmallInput(day))).toBe(167409079868000);
});
