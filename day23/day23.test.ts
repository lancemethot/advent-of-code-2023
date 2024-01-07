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
    return traverse(tiles, [], start, end, false).reduce((acc, path) => {
        return Math.max(acc, path.pop()!.distance);
    }, 0);
}

const day = 'day23';
test(day, () => {
    expect(partOne(getSmallInput(day))).toBe(94);
    expect(partOne(getFullInput(day))).toBe(2502);

    expect(partTwo(getSmallInput(day))).toBe(154);
    expect(partTwo(getFullInput(day))).toBe(0);
})