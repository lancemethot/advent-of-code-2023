import { isEmpty, isNil } from "lodash";
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

class Range {
  public min: number;
  public max: number;
  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  overlaps(range: Range, inclusive: boolean = false): boolean {
    if(isNil(range)) return false;
    return (this.min <= range.max && this.max >= range.min - (inclusive ? 1 : 0)) ||
           (range.min <= this.max && range.max >= this.min - (inclusive ? 1 : 0));
  }

  union(range: Range): Range[] {
    if(isNil(range)) return [this];
    if(this.overlaps(range, true)) {
      let min = Math.min(this.min, range.min);
      let max = Math.max(this.max, range.max);
      return [new Range(min, max)];
    }
    return [this, range];
  }

  intersect(range: Range): Range[] {
    if(isNil(range)) return [];
    if(this.overlaps(range)) {
      let min = Math.max(this.min, range.min);
      let max = Math.min(this.max, range.max);
      return [new Range(min, max)];
    }
    return [];
  }

  complement(range: Range): Range[] {
    if(isNil(range)) return [this];
    let min = 0;
    let max = 0;
    if(this.overlaps(range)) {
      min = this.min >= range.min ? range.max + 1 : this.min;
      max = this.max > range.max ? this.max : range.min - 1;
    } else {
      let bounds = [this, range].sort((a, b) => a.min - b.min);
      min = bounds[0].max + 1;
      max = bounds[1].min - 1;
    }
    return max <= min ? [] : [new Range(min, max)];
  }

  size(): number {
    return this.max === 0 ? 0 : (this.max - this.min + 1);
  }

  toEqual(range: Range): boolean {
    return this.min === range.min && this.max === range.max;
  }

  toString(): string {
    return `${this.min}..${this.max}`;
  }
};

class RangeSet {
  x: Range[];
  m: Range[];
  a: Range[];
  s: Range[];

  constructor(x: Range[], m: Range[], a: Range[], s: Range[]) {
    this.x = x;
    this.m = m;
    this.a = a;
    this.s = s;
  }

  get(category: Category) {
    switch(category) {
      case Category.X: return this.x;
      case Category.M: return this.m;
      case Category.A: return this.a;
      case Category.S: return this.s;
    }
  }

  set(category: Category, ranges: Range[]) {
    switch(category) {
      case Category.X: this.x = ranges; break;
      case Category.M: this.m = ranges; break;
      case Category.A: this.a = ranges; break;
      case Category.S: this.s = ranges; break;
    }
  }

  add(category: Category, ranges: Range[]) {
    let items = [...this.get(category), ...ranges].sort((a, b) => a.min - b.min);
    this.set(category, items.reduce((acc, r) => {
      return r.union(acc[acc.length - 1]);
    }, [] as Range[]));
  }

  subtract(category: Category, ranges: Range[]) {
    let items = this.get(category).sort((a, b) => a.min - b.min);
    this.set(category, items.reduce((acc, r) => {
      return ranges.reduce((acc, r2) => {
        let x = r.intersect(r2);
        let c = r.complement(x[0]);
        return [...acc, ...c];
      }, [] as Range[]);
    }, [] as Range[]));
  }

  private unionRanges(a: Range[], b: Range[]): Range[] {
    if(isEmpty(a)) return b;
    if(isEmpty(b)) return a;
    let ranges: Range[] = [... a, ... b].sort((a, b) => a.min - b.min);
    return ranges.reduce((acc, r) => {
      return [ ... acc.slice(0, acc.length - 1), ... r.union(acc[acc.length - 1])].sort((a, b) => a.min - b.min);
    }, [] as Range[]);
  }

  union(rangeSet: RangeSet): RangeSet {
    let xs = this.unionRanges(this.x, rangeSet.x).sort((a, b) => a.min - b.min);
    let ms = this.unionRanges(this.m, rangeSet.m).sort((a, b) => a.min - b.min);
    let as = this.unionRanges(this.a, rangeSet.a).sort((a, b) => a.min - b.min);
    let ss = this.unionRanges(this.s, rangeSet.s).sort((a, b) => a.min - b.min);
    return new RangeSet(xs, ms, as, ss);
  }

  private intersectRanges(a: Range[], b: Range[]): Range[] {
    if(isEmpty(a) || isEmpty(b)) return [];
    return a.reduce((acc, r) => {
      return b.reduce((acc, r2) => {
        return r.intersect(r2);
      }, [] as Range[]);
    }, [] as Range[]);
  }

  intersect(rangeSet: RangeSet): RangeSet {
    let xs = this.intersectRanges(this.x, rangeSet.x).sort((a, b) => a.min - b.min);
    let ms = this.intersectRanges(this.m, rangeSet.m).sort((a, b) => a.min - b.min);
    let as = this.intersectRanges(this.a, rangeSet.a).sort((a, b) => a.min - b.min);
    let ss = this.intersectRanges(this.s, rangeSet.s).sort((a, b) => a.min - b.min);
    return new RangeSet(xs, ms, as, ss);
  }

  private complmentRanges(a: Range[], b: Range[]): Range[] {
    if(isEmpty(a)) return [];
    if(isEmpty(b)) return a;
    return a.reduce((acc, r) => {
      return b.reduce((acc, r2) => {
        if(!r.overlaps(r2)) return [r];
        let x = r.intersect(r2);
        return x.reduce((acc, r3) => {
          return r.complement(r3);
        }, [] as Range[]);
      }, [] as Range[]);
    }, [] as Range[]);
  }

  complement(rangeSet: RangeSet): RangeSet {
    let xs = this.complmentRanges(this.x, rangeSet.x).sort((a, b) => a.min - b.min);
    let ms = this.complmentRanges(this.m, rangeSet.m).sort((a, b) => a.min - b.min);
    let as = this.complmentRanges(this.a, rangeSet.a).sort((a, b) => a.min - b.min);
    let ss = this.complmentRanges(this.s, rangeSet.s).sort((a, b) => a.min - b.min);
    return new RangeSet(xs, ms, as, ss);
  }

  size(): number {
    const length = (r: Range[]): number => r.reduce((acc, r) => acc + r.size(), 0);
    if(isEmpty(this.x) && isEmpty(this.m) && isEmpty(this.a) && isEmpty(this.s)) return 0;
    return (isEmpty(this.x) ? 1 : length(this.x)) *
           (isEmpty(this.m) ? 1 : length(this.m)) *
           (isEmpty(this.a) ? 1 : length(this.a)) * 
           (isEmpty(this.s) ? 1: length(this.s));
  }

  toString(): string {
    return `[[x: ${isEmpty(this.x) ? '-----' : this.x.map((r) => r.toString()).join(",")}]\t` +
            `[m: ${isEmpty(this.m) ? '-----' : this.m.map((r) => r.toString()).join(",")}]\t` +
            `[a: ${isEmpty(this.a) ? '-----' : this.a.map((r) => r.toString()).join(",")}]\t` +
            `[s: ${isEmpty(this.s) ? '-----' : this.s.map((r) => r.toString()).join(",")}]]`;
  }
};

const emptySet = (): RangeSet => {
  return new RangeSet([], [], [], []);
};

const universalSet = (): RangeSet => {
  return new RangeSet(
    [new Range(1, 4000)],
    [new Range(1, 4000)],
    [new Range(1, 4000)],
    [new Range(1, 4000)],
  );
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

// Navigate workflow and build a list of rules
// ex. m>500->x<100->a>1000->A
//     s<1250->R
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

function filterRangeSet(inventory: RangeSet, condition: string): RangeSet {
  const parts = condition.split(/([xmas]{1})([><])([0-9]+)/gi) as RegExpMatchArray;
  const category = parts[1] as Category;
  const operator = parts[2] as ">" | "<";
  const value = parseInt(parts[3]);
  const ranges = inventory.get(category);
  if(ranges.length === 0) ranges.push(new Range(1, 4000));
  let min = operator === '>' ? value + 1 > ranges[0].min ? value + 1 : ranges[0].min : ranges[0].min;
  let max = operator === '<' ? value - 1 < ranges[0].max ? value - 1 : ranges[0].max : ranges[0].max;
  inventory.set(category, [max < min ? new Range(0, 0) : new Range(min, max)]);
  return inventory;
}

function findRange(inventory: RangeSet, rule: string): RangeSet {
  const criteria = rule.split("->").filter((r) => r !== "" && r !== Result.ACCEPTED && r !== Result.REJECTED);
  return criteria.reduce((acc, c) => {
    return filterRangeSet(acc, c);
  }, inventory);
}

// Has any items in range set
function hasAny(set: RangeSet): boolean {
  const hasSome = (r: Range[]): boolean => r.reduce((acc, r) => acc || (r.max - r.min + 1) > 0, false);
  return hasSome(set.x) || hasSome(set.m) || hasSome(set.a) || hasSome(set.s);
}

function applyRule(inventory: RangeSet, rule: string): { overlap: RangeSet, remainder: RangeSet } {
  let range: RangeSet = findRange(inventory, rule);
  let complement: RangeSet = inventory.complement(range);
  let overlap: RangeSet = inventory.intersect(range);
  let remainder: RangeSet = inventory.intersect(complement);

  console.log(`applying ${rule}\n` +
//              `inventory:\t${inventory.toString()}\n` +
              `range:\t${range.toString()}\n` +
//              `complement:\t${complement.toString()}\n` +
//              `overlap:\t${overlap.toString()}\n` +
//              `remainder:\t${remainder.toString()}\n`+
``);
  return { overlap: range, remainder: complement}
 //return { overlap, remainder };
}

function countCombinations(workflows: Map<string, Rule[]>): number {
  let inventory: RangeSet = universalSet();
  let checks: Rule[] = [...(workflows.get("in") as Rule[])];
  let check: Rule | undefined = undefined;
  let combinations = 0;
  let ranges: Range[] = [];
  let complements: Range[] = [];

  while ((check = checks.shift()) !== undefined) {
    if(isNil(check.condition)) {
      if(check.destination === Result.ACCEPTED) {
        combinations += inventory.size();
        // add to combinations
        // set inventory to complement
        break;
      } else if(check.destination === Result.REJECTED) {
        // set inventory to complement
        break;
      } else if(workflows.has(check.destination as string)) {
        // eval next workflow
        checks.splice(0, 0, ...(workflows.get(check.destination as string) as Rule[]));
        continue;
      }
    } else {
      inventory = filterRangeSet(inventory, `${check.condition.category}${check.condition.operator}${check.condition.value}`);
      checks.splice(0, 0, { destination: check.destination } as Rule);
      continue;
    }
  }

  let flattened = flattenRules(workflows, workflows.get("in") as Rule[]);
  console.log(flattened.map((r) => `${r}`).join('\n'));

  flattened.filter((r) => r.endsWith(Result.ACCEPTED)).forEach((r) => {
    let { overlap, remainder } = applyRule(inventory, r);
    if(hasAny(overlap)) {
      accepted = accepted.union(overlap);
      console.log(`accepted = ${accepted.toString()}`);
      console.log(`size = ${accepted.size()}`)
      //inventory = remainder;
    }
  });
  console.log(`accepted: ${accepted.toString()}`);
  return accepted.size();
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

test(`${day} range class`, () => {
  // overlapping
  let rangeA: Range = new Range(5, 400);
  let rangeB: Range = new Range(2, 50);
  expect(rangeA.size()).toBe(396);
  expect(rangeB.size()).toBe(49);
  expect(rangeA.overlaps(rangeB)).toBe(true);
  expect(rangeA.union(rangeB)).toEqual(expect.arrayContaining([new Range(2, 400)]));
  expect(rangeA.intersect(rangeB)).toEqual(expect.arrayContaining([new Range(5, 50)]));
  expect(rangeA.complement(rangeB)).toEqual(expect.arrayContaining([new Range(51, 400)]));
  // non-overlapping
  let rangeC: Range = new Range(1, 50);
  let rangeD: Range = new Range(75, 100);
  expect(rangeC.overlaps(rangeD)).toBe(false);
  expect(rangeC.union(rangeD)).toEqual(expect.arrayContaining([new Range(1, 50), new Range(75, 100)]));
  expect(rangeC.intersect(rangeD)).toEqual([]);
  expect(rangeC.complement(rangeD)).toEqual(expect.arrayContaining([new Range(51, 74)]));
});

test(`${day} range set class`, () => {
  // overlapping
  let rangeSetA: RangeSet = new RangeSet([new Range(5, 400)], [new Range(2, 50)], [new Range(1, 50)], [new Range(75, 100)]);
  let rangeSetB: RangeSet = new RangeSet([new Range(1, 50)], [new Range(75, 100)], [new Range(1, 50)], [new Range(75, 100)]);
  expect(rangeSetA.size()).toBe(396 * 49 * 50 * 26);
  expect(rangeSetB.size()).toBe(50 * 26 * 50 * 26);

  rangeSetA.add(Category.X, [new Range(1, 4)]);
  expect(rangeSetA.get(Category.X)).toEqual(expect.arrayContaining([new Range(1, 400)]));
  expect(rangeSetA.size()).toBe(400 * 49 * 50 * 26);
  rangeSetA.subtract(Category.X, [new Range(1, 4)]);
  expect(rangeSetA.size()).toBe(396 * 49 * 50 * 26);

  expect(rangeSetA.union(rangeSetB)).toEqual(new RangeSet([new Range(1, 400)], [new Range(2, 50), new Range(75, 100)], [new Range(1, 50)], [new Range(75, 100)]));
  expect(rangeSetA.intersect(rangeSetB)).toEqual(new RangeSet([new Range(5, 50)], [], [new Range(1, 50)], [new Range(75, 100)]));
  expect(rangeSetA.complement(rangeSetB)).toEqual(new RangeSet([new Range(51, 400)], [new Range(2, 50)], [], []));

  let rangeSetC: RangeSet = new RangeSet([new Range(1, 1415), new Range(2663, 4000)], [new Range(2091, 4000)], [new Range(1, 2005)], [new Range(1, 1350), new Range(3449, 4000)]);
  let rangeSetD: RangeSet = new RangeSet([], [new Range(1459, 4000)], [], [new Range(2771, 4000)]);
  expect(rangeSetC.union(rangeSetD)).toEqual(new RangeSet([new Range(1, 1415), new Range(2663, 4000)], [new Range(1459, 4000)], [new Range(1, 2005)], [new Range(1, 1350), new Range(2771, 4000)]));
});