import { getDayInput, getExampleInput } from "advent-of-code-utils";

enum HandType {
  FIVE_OF_A_KIND = 7,
  FOUR_OF_A_KIND = 6,
  FULL_HOUSE = 5,
  THREE_OF_A_KIND = 4,
  TWO_PAIR = 3,
  ONE_PAIR = 2,
  HIGH_CARD = 1,
}

type Hand = {
  cards: string[];
  bid: number;
  handType: HandType;
};

function parseInput(lines: string[]): Hand[] {
  return lines.map((line) => {
    const [cardStr, bid] = line.split(" ");
    const cards = cardStr.split("");
    const hand: Hand = {
      cards: cards,
      bid: parseInt(bid),
      handType: determineHandType(cards),
    };
    return hand;
  });
}

function calculateCardStrength(
  card: string,
  wildcard: boolean = false
): number {
  return (wildcard ? "J23456789TQKA" : "23456789TJQKA").indexOf(card[0]);
}

function countCards(cards: string[]): Map<string, number> {
  const map: Map<string, number> = new Map();
  cards.forEach((card) => {
    if (map.has(card)) {
      map.set(card, (map.get(card) as number) + 1);
    } else {
      map.set(card, 1);
    }
  });
  return map;
}

function determineHandType(cards: string[]): HandType {
  const map = countCards(cards);
  const values = Array.from(map.values());
  if (values.includes(5)) {
    return HandType.FIVE_OF_A_KIND;
  } else if (values.includes(4)) {
    return HandType.FOUR_OF_A_KIND;
  } else if (values.includes(3) && values.includes(2)) {
    return HandType.FULL_HOUSE;
  } else if (values.includes(3)) {
    return HandType.THREE_OF_A_KIND;
  } else if (values.filter((v) => v === 2).length === 2) {
    return HandType.TWO_PAIR;
  } else if (values.filter((v) => v === 2).length === 1) {
    return HandType.ONE_PAIR;
  } else {
    return HandType.HIGH_CARD;
  }
}

function determineJokerHandType(cards: string[]): HandType {
  const map = countCards(cards);

  if (map.has("J")) {
    const jokers = map.get("J") as number;
    map.delete("J");
    const sorted = Array.from(map.entries()).sort((a, b) => {
      const diff = b[1] - a[1];
      return diff === 0
        ? calculateCardStrength(b[0]) - calculateCardStrength(a[0])
        : diff;
    });
    const best = sorted[0] || ["A", 0];
    map.set(best[0], best[1] + jokers);
  }

  const values = Array.from(map.values());
  if (values.includes(5)) {
    return HandType.FIVE_OF_A_KIND;
  } else if (values.includes(4)) {
    return HandType.FOUR_OF_A_KIND;
  } else if (values.includes(3) && values.includes(2)) {
    return HandType.FULL_HOUSE;
  } else if (values.includes(3)) {
    return HandType.THREE_OF_A_KIND;
  } else if (values.filter((v) => v === 2).length === 2) {
    return HandType.TWO_PAIR;
  } else if (values.filter((v) => v === 2).length === 1) {
    return HandType.ONE_PAIR;
  } else {
    return HandType.HIGH_CARD;
  }
}

function sortHandFunc(
  first: Hand,
  second: Hand,
  wildcard: boolean = false
): number {
  if (first.handType > second.handType) {
    return 1;
  } else if (first.handType < second.handType) {
    return -1;
  }

  // Same hand type, check characters
  for (let i = 0; i < first.cards.length; i++) {
    const cardFromFirst = first.cards[i];
    const cardFromSecond = second.cards[i];
    if (
      calculateCardStrength(cardFromFirst, wildcard) >
      calculateCardStrength(cardFromSecond, wildcard)
    ) {
      return 1;
    } else if (
      calculateCardStrength(cardFromFirst, wildcard) <
      calculateCardStrength(cardFromSecond, wildcard)
    ) {
      return -1;
    }
  }
  return 0;
}

function partOne(lines: string[]): number {
  const sum = parseInput(lines)
    .sort(sortHandFunc)
    .reduce((acc, val, index) => {
      return (acc += val.bid * (index + 1));
    }, 0);
  return sum;
}

function partTwo(lines: string[]): number {
  const sum = parseInput(lines)
    .map((hand) => {
      hand.handType = determineJokerHandType(hand.cards);
      return hand;
    })
    .sort((a, b) => {
      return sortHandFunc(a, b, true);
    })
    .reduce((acc, val, index) => {
      return (acc += val.bid * (index + 1));
    }, 0);
  return sum;
}

const day = "day07";
test(day, () => {
  expect(partOne(getExampleInput(day))).toBe(6440);
  expect(partOne(getDayInput(day))).toBe(249204891);

  expect(partTwo(getExampleInput(day))).toBe(5905);
  expect(partTwo(getDayInput(day))).toBe(249666369);
});
