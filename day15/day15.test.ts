import { getFullInput, getSmallInput } from "../utils";

function parseInput(lines: string[]): string [] {
    return lines[0].split(',').filter(x => x !== '').map(x => x.trim());
}

const cache: {[key: string]: number} = {};
function hash(sequence: string): number {
    if(!cache[sequence]) {
        cache[sequence] = sequence.split('').reduce((acc, char) => {
            return acc = ((acc + char.charCodeAt(0)) * 17) % 256;
        }, 0);
    }
    return cache[sequence];
}

function partOne(lines: string[]) {
    return parseInput(lines).reduce((acc, step) => {
        return acc += hash(step);
    }, 0);
}


const day = 'day15';
test(day, () => {
    expect(partOne(getSmallInput(day))).toBe(1320);
    expect(partOne(getFullInput(day))).toBe(0);
});