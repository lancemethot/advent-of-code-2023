import { isEmpty } from "lodash";
import { getDayInput, getExampleInput } from "advent-of-code-utils";

type MapEntry = {
  sourceStart: number;
  sourceEnd: number;
  destinationStart: number;
  destinationEnd: number;
  length: number;
};

function parseInput(lines: string[]): {
  seeds: number[];
  maps: Map<string, MapEntry[]>;
} {
  const seeds: number[] = [];
  const maps: Map<string, MapEntry[]> = new Map();

  seeds.push(
    ...lines[0]
      .split(":")[1]
      .split(" ")
      .map((seed) => parseInt(seed))
      .filter((seed) => !isNaN(seed))
  );

  let currentMap = "";
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (isEmpty(line)) {
      currentMap = "";
    } else {
      if (line.match(/map/)) {
        currentMap = line.split(" ")[0];
        maps.set(currentMap, []);
      } else {
        const coords: number[] = line
          .split(" ")
          .map((coord) => parseInt(coord))
          .filter((coord) => !isNaN(coord));
        const entry: MapEntry = {
          sourceStart: coords[1],
          sourceEnd: coords[1] + coords[2],
          destinationStart: coords[0],
          destinationEnd: coords[0] + coords[2],
          length: coords[2],
        };
        let entries = maps.get(currentMap);
        entries?.push(entry);
        maps.set(
          currentMap,
          entries?.sort((a, b) => a.sourceStart - b.sourceStart) || []
        );
      }
    }
  }

  return {
    seeds,
    maps,
  };
}

function lookup(
  maps: Map<string, MapEntry[]>,
  map: string,
  value: number
): number {
  return (
    maps.get(map)?.reduce((acc, entry) => {
      if (value >= entry.sourceStart && value < entry.sourceEnd) {
        return entry.destinationStart + (value - entry.sourceStart);
      }
      return acc;
    }, value) || value
  );
}

function reverseLookup(
  maps: Map<string, MapEntry[]>,
  map: string,
  value: number
): number {
  return (
    maps.get(map)?.reduce((acc, entry) => {
      if (value >= entry.destinationStart && value < entry.destinationEnd) {
        return entry.sourceStart + (value - entry.destinationStart);
      }
      return acc;
    }, value) || value
  );
}

function findLocation(maps: Map<string, MapEntry[]>, seed: number): number {
  const soil = lookup(maps, "seed-to-soil", seed);
  const fertilizer = lookup(maps, "soil-to-fertilizer", soil);
  const water = lookup(maps, "fertilizer-to-water", fertilizer);
  const light = lookup(maps, "water-to-light", water);
  const temperature = lookup(maps, "light-to-temperature", light);
  const humidity = lookup(maps, "temperature-to-humidity", temperature);
  return lookup(maps, "humidity-to-location", humidity);
}

function findByLocation(
  maps: Map<string, MapEntry[]>,
  location: number
): number {
  const humidity = reverseLookup(maps, "humidity-to-location", location);
  const temperature = reverseLookup(maps, "temperature-to-humidity", humidity);
  const light = reverseLookup(maps, "light-to-temperature", temperature);
  const water = reverseLookup(maps, "water-to-light", light);
  const fertilizer = reverseLookup(maps, "fertilizer-to-water", water);
  const soil = reverseLookup(maps, "soil-to-fertilizer", fertilizer);
  return reverseLookup(maps, "seed-to-soil", soil);
}

function partOne(lines: string[]): number {
  const { seeds, maps } = parseInput(lines);
  const lowest = seeds
    .map((seed) => findLocation(maps, seed))
    .sort((a, b) => a - b)[0];
  return lowest;
}

function partTwo(lines: string[]): number {
  const { seeds, maps } = parseInput(lines);
  let location = 0;
  let found = false;
  do {
    const seed = findByLocation(maps, ++location);
    for (let i = 0; i < seeds.length - 1; i += 2) {
      if (seed >= seeds[i] && seed < seeds[i] + seeds[i + 1]) {
        found = true;
        break;
      }
    }
  } while (!found);
  return location;
}

const day = "day05";
test(day, () => {
  expect(partOne(getExampleInput(day))).toBe(35);
  expect(partOne(getDayInput(day))).toBe(57075758);

  expect(partTwo(getExampleInput(day))).toBe(46);
  expect(partTwo(getDayInput(day))).toBe(31161857);
});
