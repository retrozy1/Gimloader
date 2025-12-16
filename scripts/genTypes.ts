import { $ } from 'bun';
import fs from 'fs';

let eventEmitterTypes = fs.readFileSync("node_modules/eventemitter2/eventemitter2.d.ts").toString();

// get types for Gimloader
await $`bun run buildTypes`;
let types = fs.readFileSync("types.d.ts").toString();
fs.rmSync("types.d.ts");

types = types.replaceAll(`import("$types/stores/stores").`, "")
    .replaceAll(`import("types/stores/stores").`, "")
    .replaceAll(`import("types/scripts").`, "")
    .replaceAll("Input.Pointer", "import(\"phaser\").Input.Pointer")
    .replaceAll("Types.Tweens", "import(\"phaser\").Types.Tweens")
    .replaceAll(" Tweens.Tween", " import(\"phaser\").Tweens.Tween")
    .replaceAll("GameObjects", "import(\"phaser\").GameObjects");

// Gather all the variable/type declarations
const declarations = new Map<string, string>();
const interfaceDeclaration = /    (?:export )?(?:default )?(interface ([A-Z]\S+) .*{[\S\s]+?\n    })/g;
const classDeclaration = /    (?:export )?(?:default )?(class ([A-Z]\S+) .*{[\S\s]+?\n    })/g;
const typeDeclaration = /    (?:export )?(?:default )?(type ([A-Z]\S+) [\S\s]+?;\n)(?=}|    \w)/g;

let match: RegExpExecArray | null;
const addDeclaration = () => {
    if(!match) return;

    const name = match[2]
        .replace("<T>", "")
        .replace("<T", "");
    
    if(declarations.has(name)) console.log("Duplicate declaration for", name);
    declarations.set(name, match[1]);
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
const storesAdded: string[] = [];

const process = (name: string, inStores: boolean) => {
    if(inStores) storesAdded.unshift(name);
    else added.unshift(name);
    
    const code = declarations.get(name);
    if(!code) return;

    for(let [otherName, regex] of useRegexes) {
        if(code.match(regex)) {
            useRegexes.delete(otherName);
            if(otherName === "Stores") process(otherName, true);
            else process(otherName, inStores);
        }
    }
}

useRegexes.delete("Api");
process("Api", false);

// Create the final output
let gimloaderTypes =
`namespace Stores {
interface Vector { x: number; y: number; }
type BaseScene = import("phaser").Scene;\n\n`

gimloaderTypes += storesAdded.map(name => declarations.get(name)).join("\n\n")
    .replaceAll("\n    ", "\n")
    .replaceAll("ReactElement", "import('react').ReactElement");

gimloaderTypes += "\n}\n\n";

gimloaderTypes += added.map(name => declarations.get(name)).join("\n\n")
    .replaceAll("\n    ", "\n")
    .replaceAll("ReactElement", "import('react').ReactElement");

gimloaderTypes = gimloaderTypes.replaceAll(": Stores", ": Stores.Stores");

let declaration =
`declare const api: Gimloader.Api;
declare const GL: typeof Gimloader.Api;
/** @deprecated Use GL.stores */
declare const stores: Gimloader.Stores.Stores;
/** @deprecated No longer supported */
declare const platformerPhysics: any;

interface Window {
    api: Gimloader.Api;
    GL: typeof Gimloader.Api;
    /** @deprecated Use GL.stores */
    stores: Gimloader.Stores.Stores;
    /** @deprecated No longer supported */
    platformerPhysics: any;
}`;

let ee2Types = eventEmitterTypes.replace("export declare class", "class")
    .replace("\n\nexport default EventEmitter2;\n", "");

let output = "declare namespace Gimloader {\n" + ee2Types + "\n\n" + gimloaderTypes + "\n}\n\n" + declaration;

fs.writeFileSync("src/editor/gimloaderTypes.txt", output);