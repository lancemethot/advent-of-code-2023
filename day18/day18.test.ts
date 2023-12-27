import { getFullInput, getSmallInput } from "../utils";

enum Direction {
    LEFT = 'L',
    RIGHT = 'R',
    UP = 'U',
    DOWN = 'D',
}

enum Symbol {
  DUG = '#',
  UNDUG = '.',
}

enum CornerType {
  DOWN_RIGHT = 'L',
  RIGHT_DOWN = '7',
  DOWN_LEFT = 'J',
  LEFT_DOWN = 'F', 
}

type DigSite = {
    x: number;
    y: number;
    color?: string;
    symbol: Symbol;
    corner?: CornerType;
}

type DigPlan = {
    direction: Direction;
    length: number;
    color: string;
    x?: number;
    y?: number;
}

function parseInput(lines: string[]): DigPlan[] {
    return lines.map(line => {
        const match = line.split(/([LRUD]) ([\d]+) \((#[a-f0-9]{6})\)/gi) as RegExpMatchArray;
        return {
            direction: match[1],
            length: parseInt(match[2]),
            color: match[3],
        } as DigPlan;
    });
}

function cornerType(site: DigSite[][], x: number, y: number): CornerType | undefined {
  const north: DigSite | undefined = x > 0 ? site[x-1][y] : undefined;
  const south: DigSite | undefined = x < site.length - 1 ? site[x+1][y] : undefined;
  const west: DigSite | undefined = y > 0 ? site[x][y-1] : undefined;
  const east: DigSite | undefined = y < site[x].length - 1 ? site[x][y+1] : undefined;

  if(north?.symbol === Symbol.DUG && east?.symbol === Symbol.DUG) {
    // L shaped corners
    return CornerType.DOWN_RIGHT;
  } else if(west?.symbol === Symbol.DUG && south?.symbol === Symbol.DUG) {
    // 7 shaped corners
    return CornerType.RIGHT_DOWN;
  } else if(north?.symbol === Symbol.DUG && west?.symbol === Symbol.DUG) {
    // J shaped corners
    return CornerType.DOWN_LEFT;
  } else if(east?.symbol === Symbol.DUG && south?.symbol === Symbol.DUG) {
    // F shaped corners
    return CornerType.LEFT_DOWN
  }
}

// Check if a corner is a 'bad' corner for digTrench logic
//    e.g. 'L' or '7' shaped corners
function isTrickyCorner(site: DigSite[][], x: number, y: number): boolean {
    return site[x][y].corner !== undefined && (site[x][y].corner === CornerType.DOWN_RIGHT || site[x][y].corner === CornerType.RIGHT_DOWN);
}

// Diagonal dig pattern
function digTrench(site: DigSite[][]): DigSite[][] {
  let edgesFound = 0;
  // Start at bottom left corner of grid and move up
  for (let i = site.length - 1; i >= 0; i--) {
    edgesFound = 0;
    // Scan left to right x number of tiles
    for (let x = i, y = 0; x < site.length; x++, y++) {
      // Count the number of dug tiles in the diagonal
      if (site[x][y].symbol === Symbol.DUG) {
        // Ignore bend right or bend down pieces
        if(!isTrickyCorner(site, x, y)) {
            edgesFound++;
        //} else {
        //  console.log(`tricky corner: ${x}, ${y}`);
        //  console.log(site.map((row, i) => row.map((cell, j) => (x === i && y === j) ? 'O' : cell.symbol).join('')).join('\n'));
        }
      } else {
        site[x][y].symbol =
          edgesFound % 2 === 0 || x === site.length - 1 ? Symbol.UNDUG : Symbol.DUG;
      }
      if (y === site[x].length - 1) {
        break;
      }
    }
  }
  // Start with x = 0, and y = 1 (skip first tile as it was scanned above)
  // and move left
  for (let i = 1; i < site[0].length; i++) {
    edgesFound = 0;
    // Scan left to right x number of tiles and ignore bends
    for (let x = 0, y = i; x < site.length; x++, y++) {
      if (site[x][y].symbol === Symbol.DUG) {
        if (!isTrickyCorner(site, x, y)) {
          edgesFound++;
        //} else {
        //  console.log(`tricky corner: ${x}, ${y}`);
        //  console.log(site.map((row, i) => row.map((cell, j) => (x === i && y === j) ? 'O' : cell.symbol).join('')).join('\n'));
        }
      } else {
        site[x][y].symbol =
          edgesFound % 2 === 0 || x === site.length - 1 ? Symbol.UNDUG : Symbol.DUG;
      }
      if (y === site[x].length - 1) {
        break;
      }
    }
  }
  //console.log('trench');
  //console.log(site.map(row => row.map(cell => cell.corner ? cell.corner : cell.symbol).join('')).join('\n'));
  return site;
}

function digBorder(plan: DigPlan[]): DigSite[][] {
    let minX: number = 0, maxX: number = 0, x: number = 0;
    let minY: number = 0, maxY: number = 0, y: number = 0;
    for(let i = 0; i < plan.length; i++) {
        x += plan[i].direction === Direction.DOWN ? plan[i].length : plan[i].direction === Direction.UP ? -plan[i].length : 0;
        y += plan[i].direction === Direction.RIGHT ? plan[i].length : plan[i].direction === Direction.LEFT ? -plan[i].length : 0;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }
    const offsetX = Math.abs(minX);
    const offsetY = Math.abs(minY);
    const height = maxX - minX + 1;
    const width = maxY - minY + 1;

    // Prepare a dig site and clear it
    let site: DigSite[][] = Array(height).fill([]);
    for(let i = 0; i < height; i++) {
        site[i] = Array(width).fill([]);
    }
    site = site.map((row, x) => row.map((cell, y) => {
        // init to empty
        return { x, y, symbol: Symbol.UNDUG } as DigSite;
    }));

    // Dig the border
    x = offsetX;
    y = offsetY;
    plan.forEach((next) => {
        site[x][y].color = next.color;
        for(let steps = 0; steps < next.length; steps++) {
          x += next.direction === Direction.DOWN ? 1 : next.direction === Direction.UP ? -1 : 0;
          y += next.direction === Direction.RIGHT ? 1 : next.direction === Direction.LEFT ? -1 : 0;
          site[x][y].symbol = Symbol.DUG;
        }
        // console.log(site.map(row => row.map(cell => cell.symbol).join('')).join('\n'));
    });

    // Identify corner types
    site = site.map((row, x) => row.map((cell, y) => {
        return cell.color ? { ...cell, corner: cornerType(site, x, y) } as DigSite : cell;
    }));

    //console.log('border:');
    //console.log(site.map(row => row.map(cell => cell.corner ? cell.corner : cell.symbol).join('')).join('\n'));
    return site;
}

function dig(plan: DigPlan[]): DigSite[][] {
  return digTrench(digBorder(plan));
}

function partOne(lines: string[]): number {
    return dig(parseInput(lines)).reduce((acc, row) => {
        return acc + row.filter(cell => cell.symbol === Symbol.DUG).length;
    }, 0);
}

const day = 'day18';
test(day, () => {
    expect(partOne(getSmallInput(day))).toBe(62);
    expect(partOne(getFullInput(day))).toBe(50603);
})