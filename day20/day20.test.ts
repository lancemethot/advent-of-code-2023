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

function partOne(lines: string[]): number {
    const modules = initialize(parseInput(lines));
    return pushButton(modules);
}

const day = 'day20';
test(day, () => {
    expect(partOne(getSmallInput(day, 1))).toBe(32000000);
    expect(partOne(getSmallInput(day, 2))).toBe(11687500);
    expect(partOne(getFullInput(day))).toBe(680278040);
});