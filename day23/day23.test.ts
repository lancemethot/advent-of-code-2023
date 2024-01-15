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

type Junction = {
    tile: Tile,
    branches: (Segment | undefined)[],
    exit: boolean,
}

type Segment = {
    start: Tile,
    end: Tile,
    length: number,
    junctions: Junction[],
}

type Path = {
    junctions: Junction[],
    segments: Segment[],
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
            case TileType.PATH:
                north = north?.type as string === Direction.SOUTH ? undefined: north;
                south = south?.type as string === Direction.NORTH ? undefined: south;
                east = east?.type as string === Direction.WEST ? undefined: east;
                west = west?.type as string === Direction.EAST ? undefined: west;
        }
    }
    return [north, south, east, west].map(t => t?.type === TileType.FOREST ? undefined : t) as Tile[];
}

// Contract the map into Junctions and Segments.
// Junctions are points where the path splits into multiple directions.
// Segments are paths between junctions.
function contract(tiles: Tile[][], slippery: boolean = false): Junction[] {
    let start = tiles[0].filter(tile => tile.type === TileType.PATH)[0];
    let end = tiles[tiles.length-1].filter(tile => tile.type === TileType.PATH)[0];
    let junctions: Junction[] = [];
    let segments: Segment[] = [];

    junctions.push({ tile: start, branches: [], exit: false });
    for(let jIndex = 0; jIndex < junctions.length; jIndex++) {
        let junction = junctions[jIndex];
        let next = moves(tiles, junction.tile, slippery);
        junctions[jIndex].branches = next.map((tile, index) => {
            if(tile === undefined) return undefined;
            // Check if we've discovered this segment
            let discovered = segments.findIndex(s => (s.start.x === tile!.x && s.start.y === tile!.y) || (s.end.x === tile!.x && s.end.y === tile!.y));
            if(discovered >= 0) {
                return segments[discovered];
            } else {
                let segment: Segment = {
                    start: tile,
                    end: tile,
                    length: 0,
                    junctions: [junction],
                };

                // Start walking the segment
                let visited: Tile[] = [junction.tile, segment.start];
                for(let vIndex = 1; vIndex < visited.length; vIndex++) {
                    let current: Tile = visited[vIndex];
                    let next = moves(tiles, current, slippery).map(tile => tile && visited.some(v => v.x === tile!.x && v.y === tile!.y) ? undefined : tile);
                    let available = next.filter(tile => tile !== undefined);

                    if(available.length === 0) {
                        // Exit or dead-end
                        if(current.x === end.x && current.y === end.y) {
                            let junction = { tile: current, branches: [], exit: true, deadend: false };
                            junctions.push(junction);
                            segment.junctions.push(junctions[junctions.length - 1]);
                        }
                        break;
                    } else if(available.length === 1) {
                        // Keep moving forward
                        segment.end = current;
                        segment.length++;
                        visited.push(available[0]!);
                    } else {
                        // Hit a junction tile
                        // Check if we've found it already
                        let existing = junctions.findIndex(j => j.tile.x === current.x && j.tile.y === current.y) ;

                        if(existing < 0) {
                            // If junction is new, add it to the list
                            junctions.push({ tile: current, branches: [], exit: false });
                            segment.junctions.push(junctions[junctions.length - 1]);
                        } else {
                            segment.junctions.push(junctions[existing]!);
                        }
                    }
                }

                segments.push(segment);
                return segment;
            }
        });
    }

    return junctions;

}

function traverse(junctions: Junction[], start: Tile): Path[] {
    let paths: Path[] = [];
    paths.push({
        junctions: [junctions.filter(j => j.tile.x === start.x && j.tile.y === start.y)[0]],
        segments: [],
    });

    for(let pIndex = 0; pIndex < paths.length; pIndex++) {
        let path = paths[pIndex];
        for(let jIndex = path.junctions.length - 1; jIndex < path.junctions.length; jIndex++) {
            let junction = path.junctions[jIndex];
            if(junction.exit) continue; // done with path

            // Map branches to segments in this order: [north, south, east, west]
            let next = junction.branches.map(branch => {
                if(branch === undefined) return undefined;
                // Skip segments already visited in this path
                let visitedSegment = path.segments.some(segment => segment.start.x === branch!.start.x && segment.start.y === branch!.start.y && segment.end.x === branch!.end.x && segment.end.y === branch!.end.y);
                // Skip segments with junctions that have already been visited
                let visitedJunction = branch.junctions.every(j => path.junctions.some(j2 => j2.tile.x === j.tile.x && j2.tile.y === j.tile.y));
                return visitedSegment || visitedJunction ? undefined : branch;
            });

            let available = next.filter(segment => segment !== undefined).length;

            if(available === 0) {
                // no moves, remove from paths
                paths.splice(pIndex, 1);
                pIndex--;
                continue;
            }

            // determine direction by checking the previous junction
            // check with branch was chosen to reach current junction
            let direction = jIndex === 0 ? Direction.SOUTH : directions[junctions[jIndex-1]?.branches.findIndex(branch => branch && branch?.junctions?.findIndex(j => j?.tile.x === junction.tile.x && j?.tile.y === junction.tile.y) >= 0) || 0];


            // Choose a segment (prefer perimeter, then straight lines, then north/west)
//            next.sort((a, b) => {
                // preference towards south and east directions (perimeter assuming start is north west)
//                return a.direction === Direction.SOUTH || a.direction === Direction.EAST ? -1 : 1;
//            }).sort((a, b) => {
                // preference towards same direction (straight lines)
  //              return current.direction === a.direction ? -1 : current.direction === b.direction ? 1 : 0;
    //        });

            // queue next segment or queue a new path
            next.filter(s => s !== undefined).forEach((segment, index) => {
                let nextjunction = segment!.junctions.filter(j => j.tile.x !== junction.tile.x || j.tile.y !== junction.tile.y)[0];
                if(index === 0) {
                    path.junctions.push({ ...nextjunction });
                    path.segments.push({ ...segment! });
                } else {
                    paths.push({
                        junctions: path.junctions.slice(0, -1).concat({ ...nextjunction }),
                        segments: path.segments.slice(0, -1).concat({ ...segment! })
                    });
                }
            });

        }
    }

    return paths.filter(path => path.junctions[path.junctions.length - 1].exit);

}

function partOne(input: string[]): number {
    let tiles: Tile[][] = parseInput(input);
    let junctions: Junction [] = contract(tiles, true);
    return traverse(junctions, junctions[0].tile).reduce((acc, path) => {
        let pathLength = path.junctions.length - 1 + path.segments.reduce((acc, segment) => acc + segment.length, 0);
        return Math.max(acc, pathLength);
    }, 0);
}

function partTwo(input: string[]): number {
    let tiles: Tile[][] = parseInput(input);
    let junctions: Junction [] = contract(tiles, false);
    return traverse(junctions, junctions[0].tile).reduce((acc, path) => {
        let pathLength = path.junctions.length - 1 + path.segments.reduce((acc, segment) => acc + segment.length, 0);
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