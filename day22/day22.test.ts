import { isNil } from "lodash";
import { getSmallInput } from "../utils";

type Brick = {
    label: number;
    x: number;
    y: number;
    z: number;
    length: number;
    width: number;
    height: number;
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
        } as Brick;
    });
}

function printCube(cube: Brick[][][]) {
    cube.forEach((slice, z) => {
        console.log(`z=${z}`);
        console.log(slice.map(row => row.map(brick => isNil(brick) ? '.' : brick.label).join('')).join('\n'));
    });
}

function partOne(input: string[]): number {
    const bricks = parseInput(input).sort((a, b) => { return a.z - b.z; });
    console.table(bricks);

    let length = bricks.reduce((acc, brick) => { return Math.max(acc, brick.x + brick.length); }, 0);
    let width = bricks.reduce((acc, brick) => { return Math.max(acc, brick.y + brick.width); }, 0)
    let height = bricks.reduce((acc, brick) => { return Math.max(acc, brick.z + brick.height); }, 0)

    console.log(`cube dimensions: ${length}x${width}x${height}`);

    const cube: Brick[][][] = Array(height).fill(null).map(z => Array(length).fill(null).map(x => Array(width).fill(null)));
    bricks.forEach(brick => {
        for (let z = brick.z; z < brick.z + brick.height; z++) {
            for (let x = brick.x; x < brick.x + brick.length; x++) {
                for (let y = brick.y; y < brick.y + brick.width; y++) {
                    cube[z][x][y] = brick;
                }
            }
        }
    });

    printCube(cube);

    return 0;
}

const day = 'day22';
test(day, () => {
    expect(partOne(getSmallInput(day))).toBe(5);
});