import { getFullInput, getSmallInput } from "../utils";

enum TileType {
    PATH = '.',
    FOREST = '#',
    SLOPE_N = '^',
    SLOPE_S = 'v',
    SLOPE_E = '>',
    SLOPE_W = '<',
}

enum Direction {
    NORTH = '^',
    SOUTH = 'v',
    EAST = '>',
    WEST = '<',
}
const directions: Direction[] = [Direction.NORTH, Direction.SOUTH, Direction.EAST, Direction.WEST];

type Tile = {
    type: TileType,
    x: number,
    y: number,
}

type Segment = {
    direction: Direction,
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

function moves(tiles: Tile[][], tile: Tile, slippery: boolean = true): (Tile | undefined)[] {
    let north: Tile | undefined = tiles[tile.x-1] ? tiles[tile.x-1][tile.y] : undefined;
    let south: Tile | undefined = tiles[tile.x+1] ? tiles[tile.x+1][tile.y] : undefined;
    let east: Tile | undefined = tiles[tile.x][tile.y+1];
    let west: Tile | undefined = tiles[tile.x][tile.y-1];
    if(slippery) {
        switch(tile.type) {
            case TileType.SLOPE_N:
                return [ north as Tile, undefined, undefined, undefined ];
            case TileType.SLOPE_S:
                return [ undefined, south as Tile, undefined, undefined ];
            case TileType.SLOPE_E:
                return [ undefined, undefined, east as Tile, undefined ];
            case TileType.SLOPE_W:
                return [ undefined, undefined, undefined, west as Tile ];
        }
    }
    return [north, south, east, west].filter(t => t?.type === TileType.FOREST ? undefined : t) as Tile[];
}

// Contract path into segments of straight lines that each have a length
// and each branch into other segments. Segments that reach the end are
// are marked as 'exit' segments. Junction tiles between segments are
// marked on each segment as 'from' with a 'direction'.
function contract(tiles: Tile[][], slippery: boolean = false): Segment[] {
    let start = tiles[0].filter(tile => tile.type === TileType.PATH)[0];
    let end = tiles[tiles.length-1].filter(tile => tile.type === TileType.PATH)[0];
    let segments: Segment[] = [];
    segments.push({
        direction: Direction.SOUTH,
        from: start, 
        start: start,
        end: start,
        length: -1, // start tile doesn't count
        branches: [],
        exit: false
    });
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
            let next = moves(tiles, current, slippery).map(tile => tile && visited.some(v => v.x === tile!.x && v.y === tile!.y) ? undefined : tile);
            let available = next.filter(tile => tile !== undefined);

            // Keep moving forward
            if(available.length === 1) {
                segment.end = current;
                visited.push(available[0]!);
            } else {
                // This is an intersection. Branch off into new segments.
                next.forEach((tile, index) => {
                    if(tile === undefined) return;
                    // Check if we've already discovered this segment
                    let discovered = segments.findIndex(s => s.start.x === tile!.x && s.start.y === tile!.y);
                    if(discovered >= 0) {
                        segment.branches.push(segments[discovered].start);
                    } else {
                        let branch: Segment = {
                            direction: directions[index],
                            from: current,
                            start: tile!,
                            end: tile!,
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

function traverse(segments: Segment[], start: Tile): Segment[][] {
    let paths: Segment[][] = [];

    let first = segments.filter(s => s.start.x === start.x && s.start.y === start.y)[0];
    paths.push([first]);

    for(let pIndex = 0; pIndex < paths.length; pIndex++) {
        let path = paths[pIndex];
        for(let sIndex = path.length - 1; sIndex < path.length; sIndex++) {
            let current = path[sIndex];
            if(current.exit) continue; // done with path

            let branches = current.branches.filter(b => !path.some(p => (p.start.x === b.x && p.start.y === b.y) || (p.end.x === b.x && p.end.y === b.y)));
            if(branches.length === 0) {
                // dead-end, remove from paths
                paths.splice(pIndex, 1);
                pIndex--;
                continue;
            }

            // map branches into segments and sort
            let next: Segment[] = branches.map((branch, index) => {
                return segments.filter(s => s.start.x === branch.x && s.start.y === branch.y)[0];
            }).sort((a, b) => {
                // preference towards south and east directions (perimeter assuming start is north west)
                return a.direction === Direction.SOUTH || a.direction === Direction.EAST ? -1 : 1;
            }).sort((a, b) => {
                // preference towards same direction (straight lines)
                return current.direction === a.direction ? -1 : current.direction === b.direction ? 1 : 0;
            });

            // queue next segment or queue a new path
            next.forEach((segment, index) => {
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

function partOne(input: string[]): number {
    let tiles: Tile[][] = parseInput(input);
    let segments = contract(tiles, true);
    return traverse(segments, segments[0].start).filter(p => p[p.length - 1].exit).reduce((acc, path) => {
        let pathLength = path.reduce((acc, segment) => acc + segment.length, 0);
        return Math.max(acc, pathLength);
    }, 0);
}

function partTwo(input: string[]): number {
    let tiles: Tile[][] = parseInput(input);
    let segments = contract(tiles, false);
    return traverse(segments, segments[0].start).filter(p => p[p.length-1].exit).reduce((acc, path, index) => {
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