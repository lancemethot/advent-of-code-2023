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

function overlaps(a: Brick, b: Brick): boolean {
    /*
    console.log(`checking ${a.label} ${a.x},${a.y},${a.z} ${a.length}x${a.width}x${a.height} against ${b.label} ${b.x},${b.y},${b.z} ${b.length}x${b.width}x${b.height}` +
       `check x: ${a.x + a.length - 1} >= ${b.x} && ${a.x} < ${b.x + b.length}` + 
       `check y: ${a.y + a.width - 1} >= ${b.y} && ${a.y} < ${b.y + b.width}` + 
       `check z: ${a.z + a.height - 1} >= ${b.z} && ${a.z} < ${b.z + b.height}`);
    */
    return a.x + a.length - 1 >= b.x && a.x < b.x + b.length &&
           a.y + a.width - 1 >= b.y  && a.y < b.y + b.width  &&
           a.z + a.height - 1 >= b.z && a.z < b.z + b.height;
}

function drop(pile: Brick[], brick: Brick): Brick [] {
    let dropped: Brick = { ...brick };
    while(dropped.z > 1) {
        let beneath = pile.filter(b => overlaps(b, { ...dropped, z: dropped.z - 1 }));
        if(beneath.length > 0) {
            beneath.forEach(b => {
                b.above.push(dropped);
                dropped.below.push(b);
            });
            break;
        } else {
            dropped.z--;
        }
    }
    return pile.concat([dropped]);
}

function settle(bricks: Brick[]): Brick[] {
    return bricks.sort((a, b) => { return a.z - b.z; }).reduce((acc, brick) => {
        return drop(acc, brick);
    }, [] as Brick[]);
}

function partOne(input: string[]): number {
    const settled = settle(parseInput(input));
    console.table(settled);
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