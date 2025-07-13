import { $ } from 'bun';
import fs from 'fs';

let eventEmitterTypes = fs.readFileSync("node_modules/eventemitter2/eventemitter2.d.ts").toString();

// get types for Gimloader
await $`bun run buildTypes`;

let types = fs.readFileSync("types.d.ts").toString();
fs.rmSync("types.d.ts");

// remove all the modules that are declared but not used
while(true) {
    const importRegex = / from "(.*)";/g;
    const declareRegex = /declare module "(.*)"[\S\s]*?\n}/g;
    
    let used = new Set<string>([ "content/api/api" ]);
    let match: RegExpMatchArray| null;
    while(match = importRegex.exec(types)) {
        used.add(match[1]);
    }
    
    let removeSections: [number, number][] = [];
    while(match = declareRegex.exec(types)) {
        if(used.has(match[1]) || !match.index) continue;
        removeSections.push([match.index, match.index + match[0].length]);
    }

    if(removeSections.length === 0) break;
    
    // remove the sections in reverse order to not mess up indexes
    for(let i = removeSections.length - 1; i >= 0; i--) {
        let [start, end] = removeSections[i];
        types = types.slice(0, start) + types.slice(end);
    }
}

// kinda scuffed, remove all the whitespace that's built up
for(let i = 0; i < 10; i++) {
    types = types.replaceAll("\n\n", "\n");
}

types = 'declare module "eventemitter2" {\n' + eventEmitterTypes + '\n}\n' + types + `
declare const GL: typeof import('content/api/api').default;
/** @deprecated Use GL.stores */
declare const stores: any;

interface Window {
    GL: typeof import('content/api/api').default;
    /** @deprecated Use GL.stores */
    stores: any;
}`;

fs.writeFileSync("src/editor/gimloaderTypes.txt", types);