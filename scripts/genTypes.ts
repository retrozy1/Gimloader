import { $ } from 'bun';
import fs from 'fs';

let eventEmitterTypes = fs.readFileSync("node_modules/eventemitter2/eventemitter2.d.ts").toString();

// get types for Gimloader
await $`bun run buildTypes`;
let types = fs.readFileSync("types.d.ts").toString();
fs.rmSync("types.d.ts");

types = types.replaceAll(`import("$types/stores/stores").`, "");

// Gather all the variable/type declarations
const declarations = new Map<string, string>();
const interfaceDeclaration = /    (?:export )?(?:default )?(interface ([A-Z]\S+) .*{[\S\s]+?\n    })/g;
const classDeclaration = /    (?:export )?(?:default )?(class ([A-Z]\S+) .*{[\S\s]+?\n    })/g;
const typeDeclaration = /    (?:export )?(?:default )?(type ([A-Z]\S+) .+)/g;

let match: RegExpExecArray | null;
const addDeclaration = () => {
    if(!match) return;

    if(declarations.has(match[2])) console.log("Duplicate declaration for", match[2]);
    declarations.set(match[2], match[1]);
}

while(match = interfaceDeclaration.exec(types)) addDeclaration();
while(match = classDeclaration.exec(types)) addDeclaration();
while(match = typeDeclaration.exec(types)) addDeclaration();

const useRegexes = new Map<string, RegExp>();

for(let name of declarations.keys()) {
    const regex = new RegExp(`[ <]${name}[^a-zA-Z0-9_:]`, "g");
    useRegexes.set(name, regex);
}

// Figure out which ones need to be used
const added: string[] = [];

const process = (name: string) => {
    added.unshift(name);
    
    const code = declarations.get(name);
    if(!code) return;

    for(let [otherName, regex] of useRegexes) {
        if(code.match(regex)) {
            useRegexes.delete(otherName);
            process(otherName);
        }
    }
}

useRegexes.delete("Api");
process("Api");

// Create the final output
let gimloaderTypes = added.map(name => declarations.get(name)).join("\n\n")
    .replaceAll("\n    ", "\n");
let ee2Types = eventEmitterTypes.replace("export declare class", "class")
    .replace("\n\nexport default EventEmitter2;\n", "");

let declaration =
`declare const api: Gimloader.Api;
declare const GL: typeof Gimloader.Api;
/** @deprecated Use GL.stores */
declare const stores: Gimloader.Stores;
/** @deprecated No longer supported */
declare const platformerPhysics: any;

interface Window {
    api: Gimloader.Api;
    GL: typeof Gimloader.Api;
    /** @deprecated Use GL.stores */
    stores: Gimloader.Stores;
    /** @deprecated No longer supported */
    platformerPhysics: any;
}`;

let header =
`type BaseScene = import("phaser").Scene;
interface Vector { x: number; y: number; }`;

let output = "declare namespace Gimloader {\n" + header + "\n\n" + ee2Types + "\n\n" + gimloaderTypes + "\n}\n\n" + declaration;

fs.writeFileSync("src/editor/gimloaderTypes.txt", output);