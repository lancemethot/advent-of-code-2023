import * as fs from "fs";

export function getInputLines(inputFile: string): string [] {
    const input = fs.readFileSync(inputFile, "utf8");
    return input.split("\n");
}

export function getSmallInput(day: string, part?: number): string [] {
    return getInputLines(`./${day}/${day}-small${part ? `-${part}` : ''}.txt`);
}

export function getFullInput(day: string, part?: number): string [] {
    return getInputLines(`./${day}/${day}-full${part ? `-${part}` : ''}.txt`);
}

export function removeEmptyLines(lines: string[]): string[] {
    return lines.filter((line) => line.trim().length > 0);
}