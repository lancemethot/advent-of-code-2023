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
    type: TileType;
    x: number;
    y: number;
}

type Junction = {
    tile: Tile;
    branches: Branch[];
    exit: boolean;
}

type Branch = {
    direction: Direction;
    length: number;
    start?: Tile;
    end?: Tile;
    junction?: Junction;
}

type Path = {
    steps: {
        junction: Junction;
        direction: Direction;
        length: number;
    }[];
}

function parseInput(lines: string[]): Tile[][] {
    return lines.map((line, x) => {
        return line.split('').map((char, y) => {
            return {
                x,
                y,
                type: char as TileType,
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

// Contract the map into Junctions and Branches.
// Junctions are points where the path splits into multiple directions.
// Branches are paths between junctions.
function contract(tiles: Tile[][], slippery: boolean = false): Junction[] {
    let start = tiles[0].filter(tile => tile.type === TileType.PATH)[0];
    let end = tiles[tiles.length-1].filter(tile => tile.type === TileType.PATH)[0];

    let junctions: Junction[] = [];
    junctions.push({ tile: start, branches: [], exit: false });

    for(let jIndex = 0; jIndex < junctions.length; jIndex++) {
        let junction = junctions[jIndex];
        let next = moves(tiles, junction.tile, slippery);
        junctions[jIndex].branches = next.map((tile, index) => {
            let branch: Branch = {
                direction: directions[index],
                start: tile,
                end: tile,
                length: 0,
            };

            if(tile !== undefined) {
                // Start walking the branch
                let visited: Tile[] = [junction.tile, branch.start as Tile];
                for(let vIndex = 1; vIndex < visited.length; vIndex++) {
                    let current: Tile = visited[vIndex];
                    let next = moves(tiles, current, slippery).map(tile => tile && visited.some(v => v.x === tile!.x && v.y === tile!.y) ? undefined : tile);
                    let available = next.filter(tile => tile !== undefined);

                    if(available.length === 1) {
                        // Keep moving forward
                        branch.end = current;
                        branch.length++;
                        visited.push(available[0]!);
                        continue;
                    }

                    // Hit a junction tile
                    let junction = {
                        tile: current,
                        branches: [],
                        exit: current.x === end.x && current.y === end.y,
                    }

                    if(available.length === 0 && !junction.exit) {
                        // Dead-end
                        break;
                    }

                    branch.junction = junction;

                    // Check if we've found it already
                    let existing = junctions.findIndex(j => j.tile.x === current.x && j.tile.y === current.y) ;
                    if(existing < 0) {
                        // If junction is new, add it to the list
                        junctions.push(junction);
                    }
                }            
            }

            return branch;
        });
    }

    return junctions;
}

function traverse(junctions: Junction[], start: Tile): Path[] {
    let paths: Path[] = [];
    paths.push({
        steps: [{
            junction: junctions.filter(j => j.tile.x === start.x && j.tile.y === start.y)[0],
            direction: Direction.SOUTH,
            length: 0,
        }],
    });

    for(let pIndex = 0; pIndex < paths.length; pIndex++) {
        let path = paths[pIndex];
        for(let jIndex = path.steps.length - 1; jIndex < path.steps.length; jIndex++) {
            let junction = path.steps[jIndex].junction;
            if(junction.exit) continue; // done with path

            // determine direction by checking the previous junction
            // check with branch was chosen to reach current junction
            let direction = jIndex === 0 ? Direction.SOUTH : directions[path.steps[jIndex-1]?.junction.branches.findIndex(branch => branch && branch?.junction?.tile.x === junction.tile.x && branch.junction.tile.y === junction.tile.y) || 0];

            // Map branches to segments in this order: [north, south, east, west]
            let branches = junction.branches.filter(b => b !== undefined && b.junction !== undefined).map(branch => {
                // Skip branches if junction has already been visited
                let visited = path.steps.some(s => s.junction.tile.x === branch!.junction!.tile.x && s.junction.tile.y === branch!.junction!.tile.y);
                return visited ? undefined : branch;
            }).filter(b => b !== undefined).sort((a, b) => {
                return a?.direction === Direction.SOUTH || a?.direction == Direction.EAST ? -1 : 1;
            }).sort((a, b) => {
                return direction === a?.direction ? -1 : direction === b?.direction ? 1 : 0;
            });

            if(branches.length === 0) {
                // no moves, remove from paths
                paths.splice(pIndex, 1);
                pIndex--;
                continue;
            }

            // queue next segment or queue a new path
            branches.forEach((branch, index) => {
                let step = {
                    direction: branch!.direction,
                    length: branch!.length,
                    junction: junctions.filter(j => j.tile.x === branch!.junction!.tile.x && j.tile.y === branch!.junction!.tile.y)[0]
                };

                if(index === 0) {
                    path.steps.push(step);
                } else {
                    paths.push({
                        steps: path.steps.slice(0, -1).concat(step),
                    });
                }
            });

        }
    }

    return paths.filter(path => path.steps[path.steps.length - 1].junction.exit);

}

function partOne(input: string[]): number {
    let tiles: Tile[][] = parseInput(input);
    let junctions: Junction [] = contract(tiles, true);
    return traverse(junctions, junctions[0].tile).reduce((acc, path) => {
        let pathLength = path.steps.reduce((acc, step) => {
            return acc + (step?.length || 0);
        }, path.steps.length - 1);
        return Math.max(acc, pathLength);
    }, 0);
}

function partTwo(input: string[]): number {
    let tiles: Tile[][] = parseInput(input);
    let junctions: Junction [] = contract(tiles, false);
    return traverse(junctions, junctions[0].tile).reduce((acc, path) => {
        let pathLength = path.steps.reduce((acc, step) => {
            return acc + (step?.length || 0);
        }, path.steps.length - 1);
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