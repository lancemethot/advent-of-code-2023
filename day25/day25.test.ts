import { getFullInput, getSmallInput } from '../utils';
import { PriorityQueue } from './priority-queue.test';

// https://blog.thomasjungblut.com/graph/mincut/mincut/
// https://github.com/jgrapht/jgrapht/blob/master/jgrapht-core/src/main/java/org/jgrapht/alg/StoerWagnerMinimumCut.java

const day = "day25";

type Edge = {
    name: string;
    weight: number;
}

type Graph = Map<string, Edge[]>;

type Cut = {
    s: string;
    t: string;
    weight: number;
}

function parseInput(lines: string[]): Graph {
    return lines.reduce((acc, line) => {
        const [name, connections] = line.split(':');
        let component = name.trim();
        let connected = connections.split(' ').map(c => c.trim()).filter(c => c.length > 0);

        if(!acc.has(component)) acc.set(component, []);
        connected.forEach(neighbor => {
            let componentEdges = acc.get(component)!;
            if(componentEdges.findIndex(edge => edge.name === neighbor) < 0) acc.get(component)?.push({ name: neighbor, weight: 1 });
            if(!acc.has(neighbor)) acc.set(neighbor, []);
            let neighborEdges = acc.get(neighbor)!;
            if(neighborEdges.findIndex(edge => edge.name === component) < 0) acc.get(neighbor)?.push({ name: component, weight: 1 });
        });
        return acc;
    }, new Map<string, Edge[]>() as Graph);
}

/*
MinimumCutPhase(G, a):
  A <- {a}
  while A != V:
    add to A the most tightly connected vertex
  return s, t, and the cut weight as the "cut of the phase"
*/
function minimumCutPhase(graph: Graph, a: string): Cut {
    let s: string = '';
    let t: string = '';
    let weight: number = 0;

    let foundSet: string[] = [ a ];
    let cutWeights: number[] = [];
    let candidates: string[] = [ ... Array.from(graph.keys()).filter(n => n !== a) ];

    // TODO - optimize with heap priority queue?

    while(candidates.length > 0) {
        let maxNextVertex: string = '';
        let maxWeight: number = Number.MIN_VALUE;
        candidates.forEach(candidate => {
            let weightSum: number = 0;
            foundSet.forEach(found => {
                let edge: Edge = graph.get(found)!.filter(edge => edge.name === candidate)[0];
                if(edge !== undefined) {
                    weightSum += edge.weight;
                }
            });

            if(weightSum > maxWeight) {
                maxNextVertex = candidate;
                maxWeight = weightSum;
            }
        });

        candidates = candidates.filter(candidate => candidate !== maxNextVertex);
        foundSet.push(maxNextVertex);
        cutWeights.push(maxWeight);
    }

    t = foundSet.pop()!;
    s = foundSet.pop()!;
    weight = cutWeights.pop()!;

    return { s, t, weight };
}

function minimumCutPhaseWithQueue(graph: Graph, a: string): Cut {
    let workingGraph: Graph = new Map(graph);
    let s: string = '';
    let t: string = a;
    let weight: number = 0;

    let prioritizer = (a: Edge, b: Edge) => b.weight - a.weight;
    let comparator = (a: Edge, b: Edge) => a.name === b.name && a.weight === b.weight;
    let queue: PriorityQueue<Edge> = new PriorityQueue<Edge>(prioritizer, comparator);
    let dmap: Map<string, Edge> = new Map<string, Edge>();

    // Initialize queue
    Array.from(workingGraph.keys()).filter(key => key !== a).forEach(v => {
        let aEdges: Edge[] = workingGraph.get(v)!.filter(edge => edge.name === a);
        let edge: Edge = { name: v, weight: Number.MIN_VALUE };
        if(aEdges.length > 0) edge.weight = aEdges[0].weight;
        queue.enqueue(edge);
        dmap.set(v, edge);
    });

    // Iteratively update the queue to get the required vertex ordering
    while(queue.size > 0) {
        let v: Edge = queue.dequeue() as Edge;
        dmap.delete(v.name);

        s = t;
        t = v.name;
        weight = v.weight;

        workingGraph.get(v.name)!.forEach(e => {
            let neighbor: string = e.name;
            let neighborEdge: Edge | undefined = dmap.get(neighbor); 
            if(neighborEdge !== undefined) {
                queue.remove(neighborEdge);
                neighborEdge.weight += e.weight;
                queue.enqueue(neighborEdge);
            }
        });
    }

    return { s, t, weight };
}

/*
MinimumCut(G):
  minimum cut = nil
  while |V| > 1:
    choose any a from V
    cut of the phase = MinimumCutPhase(G, a)
    if the "cut of the phase" cut is lighter than the current minimum cut:
      minimum cut = cut of the phase
    shrink G by merging the two vertices from the "cut of the phase" (s, t)
  return the minimum cut
*/
function minimumCut(graph: Graph): Cut {

    let currentPartition: Set<string> = new Set<string>();
    let currentBestPartition: Set<string>;
    let currentBestCut: Cut = { s: '', t: '', weight: Number.MAX_VALUE};

    while(graph.size > 1) {
        let cutOfThePhase: Cut = minimumCutPhaseWithQueue(graph, Array.from(graph.keys())[0]);
        if(cutOfThePhase.weight < currentBestCut.weight) {
            currentBestCut = cutOfThePhase;
            currentBestPartition = new Set(currentPartition);
            currentBestPartition.add(cutOfThePhase.t);
        }
        currentPartition.add(cutOfThePhase.t);
        // merge s and t and their edges together
        graph = mergeNodes(graph, cutOfThePhase);
    }

    return currentBestCut;
}

function mergeNodes(graph: Graph, cutOfThePhase: Cut): Graph {

    let merged: Graph = new Map(graph);
    
    let s: string = cutOfThePhase.s;
    let t: string = cutOfThePhase.t;

    let sEdges: Edge[] = merged.get(s)!.filter(edge => edge.name !== cutOfThePhase.t);
    let tEdges: Edge[] = merged.get(t)!.filter(edge => edge.name !== cutOfThePhase.s);

    let newNode: string = `${s}-${t}`;
    let newEdges: Edge[] = [];

    // filter out the common edges from t that are found in s
    tEdges = tEdges.filter(edge => sEdges.findIndex(e => e.name === edge.name) < 0);

    // for all s edges
    sEdges.forEach(edge => {
        let newEdge: Edge = { name: newNode, weight: edge.weight };
        let check: Edge[] = merged.get(edge.name)!;
        let tIndex = check.findIndex(e => e.name === t);
        if(tIndex >= 0) {
            newEdge.weight += check[tIndex].weight;
            merged.get(edge.name)!.splice(tIndex, 1);
        }
        merged.get(edge.name)!.splice(check.findIndex(e => e.name === s), 1);
        merged.get(edge.name!)?.push(newEdge);
        newEdges.push({ name: edge.name, weight: newEdge.weight });
    });

    // for all t edges that aren't in s
    tEdges.forEach(edge => {
        let tIndex = merged.get(edge.name)!.findIndex(e => e.name === t);
        merged.get(edge.name)!.splice(tIndex, 1);
        merged.get(edge.name!)?.push({ name: newNode, weight: edge.weight });
        newEdges.push({ name: edge.name, weight: edge.weight });
    });

    merged.delete(s);
    merged.delete(t);
    merged.set(newNode, newEdges);

    return merged;
}

function partOne(input: string[]): number {
    let graph: Graph = parseInput(input);
    let keys: number = graph.size;
    let cut: Cut = minimumCut(graph);
    let cutLength: number = cut.t.split('-').length;
    let remainingLength = keys - cutLength;
    return cutLength * remainingLength;
}

test(day, () => {
    expect(partOne(getSmallInput(day))).toBe(54);
    expect(partOne(getFullInput(day))).toBe(555702);
});