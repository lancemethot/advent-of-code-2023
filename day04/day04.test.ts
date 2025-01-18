import { getExampleInput, getDayInput } from "advent-of-code-utils";

type Card = {
  cardNumber: number;
  winningNumbers: number[];
  myNumbers: number[];
  copies: number;
};

function parseCard(line: string): Card {
  const parts = line.split(":");
  const numParts = parts[1].split("|");
  return {
    cardNumber: parseInt(parts[0].split(" ").pop() || "0"),
    winningNumbers: numParts[0]
      .split(" ")
      .map((num) => parseInt(num))
      .filter((num) => !isNaN(num)),
    myNumbers: numParts[1]
      .split(" ")
      .map((num) => parseInt(num))
      .filter((num) => !isNaN(num)),
    copies: 1,
  };
}

function getCards(lines: string[]): Card[] {
  return lines.map((line) => parseCard(line));
}

function scoreCard(card: Card): number {
  return card.winningNumbers.reduce((acc, num) => {
    return card.myNumbers.includes(num) ? (acc === 0 ? 1 : acc * 2) : acc;
  }, 0);
}

function partOne(lines: string[]): number {
  const sum = getCards(lines).reduce((acc, card) => {
    return acc + scoreCard(card);
  }, 0);
  return sum;
}

function partTwo(lines: string[]): number {
  const sum = getCards(lines).reduce((acc, card, index, cards) => {
    const matches = card.winningNumbers.reduce((acc, num) => {
      return (acc += card.myNumbers.includes(num) ? 1 : 0);
    }, 0);
    for (let i = index + 1; i <= index + matches; i++) {
      cards[i].copies += card.copies;
    }
    return acc + card.copies;
  }, 0);
  return sum;
} 

const day = "day04";
test(day, () => {
  expect(partOne(getExampleInput(day))).toBe(13);
  expect(partOne(getDayInput(day))).toBe(23673);

  expect(partTwo(getExampleInput(day))).toBe(30);
  expect(partTwo(getDayInput(day))).toBe(12263631);
});