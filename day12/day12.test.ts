import { getSmallInput } from "../utils";

enum Condition {
    OPERATIONAL = '.',
    DAMAGED = '#',
    UNKNOWN = '?',
};

type Record = {
    springs: Condition [];
    sizes: number[];
}

function parseInput(lines: string[]): Record [] {
    return lines.map((line) => {
        return {
            springs: line.split(' ')[0].split('') as Condition[],
            sizes: line.split(' ')[1].split(',').map((size)=> parseInt(size)),
        }
    });
}

function determineArrangements(record: Record): Record[][] {
    console.log(`checking: ${record.springs.join('')} for groups: ${record.sizes.join(',')}`);
    return [];
}

function partOne(lines: string[]): number {
    return parseInput(lines).reduce((acc, record) => {
        return acc += determineArrangements(record).length;
    }, 0);
}

const day = 'day12';
test(day, () => {
    expect(partOne(getSmallInput(day))).toBe(21);
});