import { getDayInput, getExampleInput } from "advent-of-code-utils";

type Race = {
  time: number;
  distance: number;
  winningStrategies: number[];
};

function parseInput(lines: string[]): Race[] {
  const races: Race[] = [];

  const times: number[] = lines[0]
    .split(":")[1]
    .split(" ")
    .map((time) => parseInt(time))
    .filter((time) => !isNaN(time));
  const distances: number[] = lines[1]
    .split(":")[1]
    .split(" ")
    .map((distance) => parseInt(distance))
    .filter((distance) => !isNaN(distance));

  times.forEach((time, index) => {
    races.push({
      time: time,
      distance: distances[index],
      winningStrategies: [],
    });
  });

  return races;
}

function calculateDistance(chargeTime: number, totalTime: number): number {
  return (totalTime - chargeTime) * chargeTime;
}

function determineWinningStrategies(race: Race): Race {
  for (let charge = 1; charge < race.time - 1; charge++) {
    const distance = calculateDistance(charge, race.time);
    if (distance > race.distance) {
      race.winningStrategies.push(charge);
    }
  }
  return race;
}

function partOne(lines: string[]): number {
  const winningStrategies = parseInput(lines)
    .map(determineWinningStrategies)
    .reduce((acc, val) => {
      return (acc *= val.winningStrategies.length);
    }, 1);

  return winningStrategies;
}

function partTwo(lines: string[]): number {
  const time: number = parseInt(lines[0].split(":")[1].split(" ").join(""));
  const distance: number = parseInt(lines[1].split(":")[1].split(" ").join(""));

  const race: Race = {
    time: time,
    distance: distance,
    winningStrategies: [],
  };

  return determineWinningStrategies(race).winningStrategies.length;
}

const day = "day06";
test(day, () => {
  expect(partOne(getExampleInput(day))).toBe(288);
  expect(partOne(getDayInput(day))).toBe(633080);

  expect(partTwo(getExampleInput(day))).toBe(71503);
  expect(partTwo(getDayInput(day))).toBe(20048741);
});
