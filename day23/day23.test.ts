import { getFullInput, getSmallInput } from "../utils";

enum TileType {
    PATH = '.',
    FOREST = '#',
    SLOPE_N = '^',
    SLOPE_S = 'v',
    SLOPE_E = '>',
    SLOPE_W = '<',
}

type Tile = {
    type: TileType,
    x: number,
    y: number,
    distance: number,
}

type Segment = {
    from: Tile,
    start: Tile,
    end: Tile,
    length: number,
    branches: Tile[],
    exit: boolean,
}

function parseInput(lines: string[]): Tile[][] {
    return lines.map((line, x) => {
        return line.split('').map((char, y) => {
            return {
                x,
                y,
                type: char as TileType,
                distance: Number.MAX_VALUE,
            } as Tile
        });
    });
}

function moves(tiles: Tile[][], tile: Tile, slippery: boolean = true): Tile[] {
    let north: Tile | undefined = tiles[tile.x-1] ? tiles[tile.x-1][tile.y] : undefined;
    let south: Tile | undefined = tiles[tile.x+1] ? tiles[tile.x+1][tile.y] : undefined;
    let east: Tile | undefined = tiles[tile.x][tile.y+1];
    let west: Tile | undefined = tiles[tile.x][tile.y-1];
    if(slippery) {
        switch(tile.type) {
            case TileType.SLOPE_N:
                return [north as Tile];
            case TileType.SLOPE_S:
                return [south as Tile];
            case TileType.SLOPE_E:
                return [east as Tile];
            case TileType.SLOPE_W:
                return [west as Tile];
        }
    }
    return [north, south, east, west].filter(t => t !== undefined).filter(t => t?.type !== TileType.FOREST) as Tile[];
}

function traverse(tiles: Tile[][], path: Tile[], start: Tile, end: Tile, slippery: boolean = true): Tile[][] {
    let visited: Tile[] = path.map(t => { return { ...t } }).concat([{ ...start }]);
    visited[visited.length-1].distance = visited[visited.length-2]?.distance + 1 || 0;
    let index = visited.length - 1;
    while(index < visited.length) {
        let current = visited[index];
        if(current.x === end.x && current.y === end.y) {
            return [visited];
        }
        let next = moves(tiles, current, slippery).filter(tile => !visited.some(v => v.x === tile.x && v.y === tile.y));
        if(next.length === 1) {
            visited.push({
                ...next[0],
                distance: current.distance + 1,
            });
        } else {
            return next.reduce((acc, tile) => {
                return acc.concat(traverse(tiles, visited, tile, end, slippery));
            }, [] as Tile[][]);
        }
        index++;
    }
    return [visited];
}

// Contract path into segments of straight lines that each have a length
// and each branch into other segments.
function contract(tiles: Tile[][], start: Tile, end: Tile, slippery: boolean = false): Segment[] {
    let segments: Segment[] = [];
    segments.push({ from: start, start, end: start, length: -1, branches: [], exit: false });
    for(let sIndex = 0; sIndex < segments.length; sIndex++) {
        let segment = segments[sIndex];
        let visited: Tile[] = [segment.from, segment.start];
        for(let vIndex = 1; vIndex < visited.length; vIndex++) {
            let current: Tile = visited[vIndex];
            segment.length++;

            if(current.x === end.x && current.y === end.y) {
                segment.exit = true;
                break;
            }
            let next = moves(tiles, current, slippery).filter(tile => !visited.some(v => v.x === tile.x && v.y === tile.y));
            // Keep moving forward
            if(next.length === 1) {
                segment.end = current;
                visited.push(next[0]);
            } else {
                // This is an intersection. Branch off into new segments.
                next.forEach(tile => {
                    // Check if we've already discovered this segment
                    let discovered = segments.findIndex(s => s.start.x === tile.x && s.start.y === tile.y);
                    if(discovered >= 0) {
                        segment.branches.push(segments[discovered].start);
                    } else {
                        let branch: Segment = {
                            from: current,
                            start: tile,
                            end: tile,
                            length: 0,
                            branches: [],
                            exit: false,
                        };
                        segments.push(branch);
                        segment.branches.push(branch.start);
                    }
                });
                break;
            }
        }
    }
    return segments;
}

function traverseSegments(segments: Segment[], start: Tile): Segment[][] {
    let paths: Segment[][] = [];

    let first = segments.filter(s => s.start.x === start.x && s.start.y === start.y)[0];
    paths.push([first]);

    for(let pIndex = 0; pIndex < paths.length; pIndex++) {
        let path = paths[pIndex];
        for(let sIndex = path.length - 1; sIndex < path.length; sIndex++) {
            let current = path[sIndex];
            let branches = current.branches.filter(b => !path.some(p => (p.start.x === b.x && p.start.y === b.y) || (p.end.x === b.x && p.end.y === b.y)));

            if(branches.length === 0) {
                // done with path
                continue;
            }

            // queue next segment or queue a new path
            branches.forEach((branch, index) => {
                let segment = segments.filter(s => s.start.x === branch.x && s.start.y === branch.y)[0];
                if(index === 0) {
                    path.push(segment);
                } else {
                     paths.push(path.slice(0, -1).concat(segment));
                }
            });
        }
    }

    return paths;

}

function printMap(tiles: Tile[][], segments: Segment[]) {
    let map = tiles.map(line => line.map(tile => tile.type as string));
    for(let s = 0; s < segments.length; s++) {
        map[segments[s].from.x][segments[s].from.y] = 'O';
        let x = segments[s].start.x;
        let y = segments[s].start.y;
        for(let i = 0; i < segments[s].length; i++) {
            map[x][y] = 'O';
            let next = moves(tiles, { x, y, type: TileType.PATH, distance: 0 }, false).filter(tile => map[tile.x][tile.y] !== 'O');
            if(next.length > 0) {
                x = next[0].x;
                y = next[0].y;
            }
        }
    }
    console.log(map.map(line => line.join('')).join('\n'));
}

function partOne(input: string[]): number {
    let tiles: Tile[][] = parseInput(input);
    let start = tiles[0].filter(tile => tile.type === TileType.PATH)[0];
    start.distance = 0;
    let end = tiles[tiles.length-1].filter(tile => tile.type === TileType.PATH)[0];
    return traverse(tiles, [], start, end, true).reduce((acc, path) => {
        return Math.max(acc, path.pop()!.distance);
    }, 0);
}

function partTwo(input: string[]): number {
    let tiles: Tile[][] = parseInput(input);
    let start = tiles[0].filter(tile => tile.type === TileType.PATH)[0];
    start.distance = 0;
    let end = tiles[tiles.length-1].filter(tile => tile.type === TileType.PATH)[0];
    let contracted = contract(tiles, start, end, false);
    //console.log(contracted.map(segment => `${segment.from.x},${segment.from.y} -> ${segment.start.x},${segment.start.y} ${segment.length} units ${segment.exit ? 'EXIT' : `${segment.branches.length} branches: ${segment.branches.map(b => `${b.x},${b.y}`).join(', ')}`}`).join('\n'));
    return traverseSegments(contracted, contracted[0].start).filter(p => p[p.length-1].exit).reduce((acc, path, index) => {
        let pathLength = path.reduce((acc, segment) => acc + segment.length, 0);
        return Math.max(acc, pathLength);
    }, 0);
}

const day = 'day23';
test(day, () => {
    expect(partOne(getSmallInput(day))).toBe(94);
    expect(partOne(getFullInput(day))).toBe(2502);

    expect(partTwo(getSmallInput(day))).toBe(154);
    //expect(partTwo(getFullInput(day))).toBe(0);
})