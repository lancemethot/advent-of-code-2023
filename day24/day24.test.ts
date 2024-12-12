import { getFullInput, getSmallInput } from "../utils";

type Axis = 'x' | 'y' | 'z';

type Coord = {
    x: number;
    y: number;
    z: number;
}

type Hailstone = {
    position: Coord;
    velocity: Coord;
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

    // no intersection
    return null;

}

function calculatePotentialVelocities(a: Hailstone, b: Hailstone, axis: Axis, potential: number[]): number[] {
    if(a.velocity[axis] === b.velocity[axis] && Math.abs(a.velocity[axis]) > 100) {
        // if 2 hailstones have the same velocity along an axis,
        // then the distance between them will remain constant.
        let velocities: number[] = [];
        let distance = b.position[axis] - a.position[axis];
        // Return a sampling of velocities that divide evenly into
        // the distance between them.
        for(let velocity = -1000; velocity < 1000; velocity++) {
            if(velocity !== a.velocity[axis] && distance % (velocity - a.velocity[axis]) === 0) {
                velocities.push(velocity);
            }
        }
        // Build a list of velocities common to all previous comparisons.
        potential = potential.length === 0 ? potential.concat(velocities) : potential.filter((v) => velocities.includes(v));
    }
    return potential;
}

function aim(hailstones: Hailstone[]): Hailstone {

    let potentialXVelocities: number[] = [];
    let potentialYVelocities: number[] = [];
    let potentialZVelocities: number[] = [];

    // Compare each hailstone with every other hailstone.
    // Build a list of potential velocity values for each axis.
    hailstones.forEach((a, index) => {
        hailstones.slice(index + 1).forEach((b) => {
            potentialXVelocities = calculatePotentialVelocities(a, b, 'x', potentialXVelocities);
            potentialYVelocities = calculatePotentialVelocities(a, b, 'y', potentialYVelocities);
            potentialZVelocities = calculatePotentialVelocities(a, b, 'z', potentialZVelocities);
        });
    });

    // Take a velocity from each axis and use it to calculate the position of the rock.
    let vx = potentialXVelocities.pop() as number;
    let vy = potentialYVelocities.pop() as number;
    let vz = potentialZVelocities.pop() as number;

    // Take any two hailstones and subtract the calculated velocity.
    // This forms two new lines that can be traced to an origin point.
    let first: Hailstone = {
        position: hailstones[2].position,
        velocity: {
            x: hailstones[2].velocity.x - vx,
            y: hailstones[2].velocity.y - vy,
            z: hailstones[2].velocity.z - vz
        }
    };

    let second: Hailstone = {
        position: hailstones[3].position,
        velocity: {
            x: hailstones[3].velocity.x - vx,
            y: hailstones[3].velocity.y - vy,
            z: hailstones[3].velocity.z - vz
        }
    };

    // The rock's x/y position will be the intersection of the two
    // adjusted hailstone lines.

    let ma = first.velocity.y / first.velocity.x;
    let mb = second.velocity.y / second.velocity.x;
    let ca = first.position.y - (ma * first.position.x);
    let cb = second.position.y - (mb * second.position.x);
    let x = Math.round((cb - ca) / (ma - mb));
    let y = Math.round(ma * x + ca);
    let time = Math.floor((x - first.position.x) / first.velocity.x);
    let z = first.position.z + (first.velocity.z * time);

    return {
        position: {
            x,
            y,
            z
        },
        velocity: {
            x: vx,
            y: vy,
            z: vz
        }
    }
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

function partTwo(input: string[]): number {
    let hailstone = aim(parseInput(input));
    return hailstone.position.x + hailstone.position.y + hailstone.position.z;
}

const day = 'day24';
test(day, () => {
    expect(partOne(getSmallInput(day), 7, 27)).toBe(2);
    expect(partOne(getFullInput(day), 200000000000000, 400000000000000)).toBe(17244);

    expect(partTwo(getFullInput(day))).toBe(1025019997186820);
});