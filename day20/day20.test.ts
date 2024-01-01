import { isNil } from "lodash";
import { getFullInput, getSmallInput } from "../utils";

enum ModuleType {
    FLIP_FLOP = '%',
    CONJUNCTION = '&',
    BROADCASTER = '',
}

enum PulseType {
    LOW = 'low',
    HIGH = 'high',
}

type Module = {
    name: string;
    moduleType: ModuleType;
    on: boolean;
    destinations: string[];
    memory: {[key: string]: PulseType};
}

type Pulse = {
    pulseType: PulseType;
    source: string;
    destination: string;
}

function parseInput(lines: string[]): Map<string, Module> {
    return lines.reduce((acc, line) => {
        const match = line.split('->') as RegExpMatchArray;
        const name = match[0].trim();
        const module: Module = {
            name: name.startsWith(ModuleType.FLIP_FLOP) ? name.substring(1) : name.startsWith(ModuleType.CONJUNCTION) ? name.substring(1) : name,
            moduleType: name.startsWith(ModuleType.FLIP_FLOP) ? ModuleType.FLIP_FLOP : name.startsWith(ModuleType.CONJUNCTION) ? ModuleType.CONJUNCTION : ModuleType.BROADCASTER,
            on: false,
            destinations: match[1].split(',').map((dest) => dest.trim()).filter((dest) => dest.length > 0),
            memory: {},
        };
        acc.set(module.name, module);
        return acc;
    }, new Map<string, Module>());
}

function initialize(modules: Map<string, Module>): Map<string, Module> {
    modules.forEach((value, key) => {
        value.destinations.forEach((dest) => {
            let destmod = modules.get(dest);
            if (destmod?.moduleType === ModuleType.CONJUNCTION) {
                destmod.memory[key] = PulseType.LOW;
            }
        });
    });
    return modules;
}

function pushButton(modules: Map<string, Module>): number {
    const pulses: Pulse[] = [];
    let pulse: Pulse | undefined;
    let index = 1;
    let lowPulses = 0;
    let highPulses = 0;

    for(let count = 0; count < 1000; count++) {
        pulses.push({ pulseType: PulseType.LOW, source: 'button', destination: 'broadcaster'});
        while((pulse = pulses.shift()) !== undefined) {
            index = Math.max(0, index - 1);
            pulse.pulseType === PulseType.LOW ? lowPulses++ : highPulses++;
            const module = modules.get(pulse.destination);
            //console.log(`${pulse.source} -${pulse.pulseType}-> ${pulse.destination}`)
            if (!isNil(module)) {
                if(module.moduleType === ModuleType.FLIP_FLOP) {
                    if(pulse.pulseType === PulseType.LOW) {
                        module.on = !module.on;
                        let send: PulseType = module.on ? PulseType.HIGH : PulseType.LOW;
                        pulses.splice(index, 0, ... module.destinations.map((dest) => ({ pulseType: send, source: module.name, destination: dest })));
                        index += module.destinations.length;
                    }
                } else if(module.moduleType === ModuleType.CONJUNCTION) {
                    module.memory[pulse.source] = pulse.pulseType;
                    let send: PulseType = Object.keys(module.memory).every((key) => module.memory[key] === PulseType.HIGH) ? PulseType.LOW : PulseType.HIGH;
                    pulses.splice(index, 0, ... module.destinations.map((dest) => ({ pulseType: send, source: module.name, destination: dest })));
                    index += module.destinations.length;
                } else {
                    // broadcaster
                    pulses.splice(index, 0, ...module.destinations.map((dest) => ({ pulseType: pulse!.pulseType, source: module.name, destination: dest })));
                    index += module.destinations.length;
                }
            }
        }
    }

    return lowPulses * highPulses;
}

function gcd(a: number, b: number): number {
    return a ? gcd(b % a, a) : b;
}

function lcm(a: number, b: number): number {
    return a * b / gcd(a, b);
}

function cycle(modules: Map<string, Module>): number {
    const pulses: Pulse[] = [];
    let pulse: Pulse | undefined;
    let cycles = 0;
    let index = 1;
    let detector: {[key: string]: number} = {
        hf: 0,  // These 4 modules will active vf
        mk: 0,  // when all are sending 'low'
        pk: 0,  // keep track of how many cycles
        pm: 0,  // it takes to activate each
    }
    while(++cycles > 0) {
        pulses.push({ pulseType: PulseType.LOW, source: 'button', destination: 'broadcaster'});
        while((pulse = pulses.shift()) !== undefined) {
            index = Math.max(0, index - 1);
            const module = modules.get(pulse.destination);
            if (!isNil(module)) {
                if(module.moduleType === ModuleType.FLIP_FLOP) {
                    if(pulse.pulseType === PulseType.LOW) {
                        module.on = !module.on;
                        let send: PulseType = module.on ? PulseType.HIGH : PulseType.LOW;
                        pulses.splice(index, 0, ... module.destinations.map((dest) => ({ pulseType: send, source: module.name, destination: dest })));
                        index += module.destinations.length;
                    }
                } else if(module.moduleType === ModuleType.CONJUNCTION) {
                    module.memory[pulse.source] = pulse.pulseType;
                    let send: PulseType = Object.keys(module.memory).every((key) => module.memory[key] === PulseType.HIGH) ? PulseType.LOW : PulseType.HIGH;
                    // Break when all detectors have been triggered
                    if(detector[module.name] === 0 && send === PulseType.HIGH) {
                        detector[module.name] = cycles;
                        if(Object.keys(detector).every((key) => detector[key] > 0)) {
                            return [detector.hf, detector.mk, detector.pk, detector.pm].reduce(lcm);
                        }
                    }
                    pulses.splice(index, 0, ... module.destinations.map((dest) => ({ pulseType: send, source: module.name, destination: dest })));
                    index += module.destinations.length;
                } else {
                    // broadcaster
                    pulses.splice(index, 0, ...module.destinations.map((dest) => ({ pulseType: pulse!.pulseType, source: module.name, destination: dest })));
                    index += module.destinations.length;
                }
            }
        }
    }

    return 0;
}

function partOne(lines: string[]): number {
    const modules = initialize(parseInput(lines));
    return pushButton(modules);
}

function partTwo(lines: string[]): number {
    const modules = initialize(parseInput(lines));
    return cycle(modules);
}

const day = 'day20';
test(day, () => {
    expect(partOne(getSmallInput(day, 1))).toBe(32000000);
    expect(partOne(getSmallInput(day, 2))).toBe(11687500);
    expect(partOne(getFullInput(day))).toBe(680278040);

    expect(partTwo(getFullInput(day))).toBe(243548140870057);
});