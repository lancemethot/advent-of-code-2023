import { getFullInput, getSmallInput } from "../utils";

function parseInput(lines: string[]): string[] {
  return lines[0]
    .split(",")
    .filter((x) => x !== "")
    .map((x) => x.trim());
}

const cache: { [key: string]: number } = {};
function hash(text: string): number {
  if (!cache[text]) {
    cache[text] = text.split("").reduce((acc, char) => {
      return (acc = ((acc + char.charCodeAt(0)) * 17) % 256);
    }, 0);
  }
  return cache[text];
}

function fillBoxes(steps: string[]): string[][] {
  const boxes = Array.from(new Array(256), () => [] as string[]);
  for (let i = 0; i < steps.length; i++) {
    const match = steps[i].split(
      /([^=-]+)([=-])([0-9]*)/gi
    ) as RegExpMatchArray;
    const label = match[1];
    const operation = match[2];
    const lens = parseInt(match[3]);
    const box = hash(label);
    const index = boxes[box].findIndex((x: string) => x.startsWith(label));
    if (operation === "=") {
      if (index !== -1) {
        boxes[box].splice(index, 1, `${label} ${lens}`);
      } else {
        boxes[box].push(`${label} ${lens}`);
      }
    } else {
      if (index !== -1) {
        boxes[box].splice(index, 1);
      }
    }
    //console.log(`After ${steps[i]}\n${boxes.filter(b => b.length > 0).map((b, idx) => `Box ${idx}: [${b.join('], [')}]\n`)}`);
  }
  return boxes;
}

function partOne(lines: string[]) {
  return parseInput(lines).reduce((acc, step) => {
    return (acc += hash(step));
  }, 0);
}

function partTwo(lines: string[]) {
  return fillBoxes(parseInput(lines)).reduce((acc, box, boxIndex) => {
    return (acc += box.reduce((acc, slot, slotIndex) => {
      return (acc +=
        (boxIndex + 1) * (slotIndex + 1) * parseInt(slot.split(" ")[1]));
    }, 0));
  }, 0);
}

const day = "day15";
test(day, () => {
  expect(partOne(getSmallInput(day))).toBe(1320);
  expect(partOne(getFullInput(day))).toBe(518107);

  expect(partTwo(getSmallInput(day))).toBe(145);
  expect(partTwo(getFullInput(day))).toBe(303404);
});
