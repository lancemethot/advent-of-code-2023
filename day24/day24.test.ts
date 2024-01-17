import { getFullInput, getSmallInput } from "../utils";

type Coord = {
    x: number;
    y: number;
    z: number;
}

type Hailstone = {
    position: Coord;
    velocity: Coord;
    direction: Coord;
}

function parseInput(lines: string[]): Hailstone [] {
    return lines.map(line => {
        let parts = line.split('@');
        let pos = parts[0].split(',').map(p => p.trim()).filter(p => p !== '');
        let vel = parts[1].split(',').map(p => p.trim()).filter(p => p !== '');
        return {
            position: {
                x: parseInt(pos[0]),
                y: parseInt(pos[1]),
                z: parseInt(pos[2]),
            },
            velocity: {
                x: parseInt(vel[0]),
                y: parseInt(vel[1]),
                z: parseInt(vel[2]),
            },
            direction: {
                x: parseInt(pos[0]) + parseInt(vel[0]),
                y: parseInt(pos[0]) + parseInt(vel[1]),
                z: parseInt(pos[0]) + parseInt(vel[2]),
            }
        } as Hailstone;
    });
}

function intersection(a: Hailstone, b: Hailstone): Coord | null {

    if(a.position.x === b.position.x && a.position.y === b.position.y) {
        return a.position;
    }

    let dx = b.position.x - a.position.x;
    let dy = b.position.y - a.position.y;

    let det = b.velocity.x * a.velocity.y - b.velocity.y * a.velocity.x;

    if(det === 0) {
        // parallel lines
        return null;
    }

    let u = (dy * b.velocity.x - dx * b.velocity.y) / det;
    let v = (dy * a.velocity.x - dx * a.velocity.y) / det;

    if(u >= 0 && v >= 0) {
        return {
            x: a.position.x + a.velocity.x * u,
            y: a.position.y + a.velocity.y * u,
            z: 0,
        };
    }

    return null;

}

function partOne(input: string[], min: number, max: number): number {
    return parseInput(input).reduce((acc, hailstone, index, hailstones) => {
        for(let i = index + 1; i < hailstones.length; i++) {
            let cross = intersection(hailstone, hailstones[i]);
            if(cross !== null) {
                if(cross.x >= min && cross.x <= max && cross.y >= min && cross.y <= max) {
                    acc++;
                }
            }
        }
        return acc;
    }, 0);
}

const day = 'day24';
test(day, () => {
    expect(partOne(getSmallInput(day), 7, 27)).toBe(2);
    expect(partOne(getFullInput(day), 200000000000000, 400000000000000)).toBe(17244);
});