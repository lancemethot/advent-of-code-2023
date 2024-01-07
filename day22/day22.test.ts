import { getFullInput, getSmallInput } from "../utils";

type Brick = {
    label: number;
    x: number;
    y: number;
    z: number;
    length: number;
    width: number;
    height: number;
    above: Brick[];
    below: Brick[];
};

function parseInput(lines: string[]): Brick[] {
    return lines.map((line, index) => {
        const [start, end] = line.split('~');    
        const [x1, y1, z1] = start.split(',').map(s => {
            return parseInt(s);
        });
        const [x2, y2, z2] = end.split(',').map(s => {
            return parseInt(s);
        });
        return {
            label: index+1,
            x: z2 < z1 ? x2 : x1,
            y: z2 < z1 ? y2 : y1,
            z: Math.min(z1, z2),
            length: Math.abs(x1 - x2) + 1,
            width: Math.abs(y1 - y2) + 1,
            height: Math.abs(z1 - z2) + 1,
            above: [],
            below: [],
        } as Brick;
    });
}

// get the bricks that would directly support this brick
// if added to the top of the pile
function beneath(pile: number[][], brick: Brick): number[] {
    let bricks: number[] = [];
    // gather the highest tiles in the pile
    for(let x = brick.x; x < brick.x + brick.length; x++) {
        for(let y = brick.y; y < brick.y + brick.width; y++) {
            if(pile[x][y]) { // Ignore the ground
                if(!bricks.includes(pile[x][y])) {
                    bricks.push(pile[x][y]);
                }
            }
        }
    }
    return bricks;
}

function settle(bricks: Brick[]): Brick[] {
    let length = bricks.reduce((acc, brick) => { return Math.max(acc, brick.x + brick.length) }, 0);
    let width = bricks.reduce((acc, brick) => { return Math.max(acc, brick.y + brick.width) }, 0);
    let brickMap: Map<number, Brick> = new Map();
    const pile: number[][] = Array(length).fill(0).map(() => Array(width).fill(0));
    let dropped: Brick[] = bricks.sort((a, b) => { return a.z - b.z; }).map(brick => {
        let supporters: Brick[] = beneath(pile, brick).map(label => { return brickMap.get(label) as Brick });
        let max = supporters.reduce((acc, b) => { return Math.max(acc, b.z + b.height - 1) }, 0);
        supporters = supporters.filter(b => { return b.z + b.height - 1 === max });
        brick.z = max + 1;
        for(let x = brick.x; x < brick.x + brick.length; x++) {
            for(let y = brick.y; y < brick.y + brick.width; y++) {
                if(pile[x][y] > 0) { // ignore ground
                    let b = brickMap.get(pile[x][y])!;
                    if(supporters.includes(b)) {
                        b.above = b.above.includes(brick) ? b.above : b.above.concat(brick);
                        brick.below = brick.below.includes(b) ? brick.below : brick.below.concat(b);
                        brickMap.set(b.label, b);
                    }
                }
                pile[x][y] = brick.label;
            }
        }
        brickMap.set(brick.label, brick);
        return brick;
    });
    return dropped;
}

function partOne(input: string[]): number {
    const settled = settle(parseInput(input));
    return settled.reduce((acc, brick) => {
        let removable = brick.above.reduce((acc, b) => {
            return acc && (brick.above.length === 0 || brick.above.reduce((acc, b) => {
                return acc && b.below.length > 1;
            }, true));
        }, true);
        return acc + (removable ? 1 : 0);
    }, 0);
}

const day = 'day22';
test(day, () => {
    expect(partOne(getSmallInput(day))).toBe(5);
    expect(partOne(getFullInput(day))).toBe(424);
});