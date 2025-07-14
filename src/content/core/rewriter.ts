import { domLoaded } from "$content/utils";
import { get, set, clear } from "idb-keyval";

interface Import {
    text: string;
    name: string;
}

interface ParsedJs {
    imports: Import[];
    code: string;
}

type Prefix = string | true;

interface ParseHook {
    prefix: Prefix;
    callback: (code: string) => string;
}

export default class Rewriter {
    static base: URL;
    static cleared = false;
    static callbacks: Record<string, (val: any) => void> = {};
    static async init() {
        Object.defineProperty(window, "GLImport", {
            value: this.import.bind(this),
            writable: false,
            configurable: false
        });

        Object.defineProperty(window, "GLCallback", {
            value: this.callbacks,
            writable: false,
            configurable: false
        });

        await domLoaded();
        let index = document.querySelector<HTMLScriptElement>("script[src]");

        // Invalidate the database if the index script has changed
        const name = this.getName(index.src);
        if(name !== localStorage.getItem("gl-lastindex")) {
            this.invalidate();
            localStorage.setItem("gl-lastindex", name);
        }
        
        this.base = new URL(index.src);
        this.import(index.src, true);
    }

    static getName(src: string) {
        return src.split("/").pop();
    }

    static invalidate() {
        this.cleared = true;
        clear();
    }

    static loadingSrcs = new Map<string, Promise<string>>();
    static getBlobUrl(name: string, root: boolean) {
        const existing = this.loadingSrcs.get(name);
        if(existing) return existing;

        const promise = new Promise<string>(async (res) => {
            let parsed: ParsedJs;
            if(!this.cleared) parsed = await get(name);

            if(!parsed) {
                const resp = await fetch(`https://www.gimkit.com/gimloader/assets/${name}`);
                const js = await resp.text();
                parsed = this.parse(js, name, root);
                
                set(name, parsed);
            }
            
            const code = await this.prepareJs(parsed);
            const blob = new Blob([ code ], { type: "text/javascript" });
            res(URL.createObjectURL(blob));
        });

        this.loadingSrcs.set(name, promise);
        return promise;
    }

    static import(src: string, root: boolean) {
        return new Promise<any>(async (res, rej) => {
            const url = new URL(src, this.base);
            const name = this.getName(url.pathname);
            const blobUrl = await this.getBlobUrl(name, root);

            import(blobUrl)
                .then(res, rej);
        });
    }

    static importRegex = /(import(?:.+?from)?)"([^"]+)";/g;
    static parseHooks: ParseHook[] = [];
    static parse(js: string, name: string, root: boolean): ParsedJs {
        // Remove dependency preloading
        if(js.startsWith("const __vite__mapDeps")) {
            const start = js.indexOf(";");
            js = "const __vite__mapDeps = () => [];" + js.slice(start + 1);
        }

        // Replace dynamic imports
        js = js.replaceAll("import(", "GLImport(");

        // Replace static imports
        let imports: Import[] = [];
        for(let match of js.matchAll(this.importRegex)) {
            imports.push({ text: match[1], name: this.getName(match[2]) });
        }

        js = js.replace(this.importRegex, "");

        // Run parse hooks
        for(let hook of this.parseHooks) {
            try {
                if(hook.prefix === true && !root) continue;
                if(hook.prefix !== true && !name.startsWith(hook.prefix)) continue;
                
                let edited = hook.callback(js);
                if(edited) js = edited;
            } catch(e) {
                console.error("Error in parse hook:", e);
            }
        }

        // Tack on a source mapping url
        js += `\n//# sourceURL=https://www.gimkit.com/assets/${name}`;

        return {
            code: js,
            imports
        };
    }

    static async prepareJs(parsed: ParsedJs) {
        let imports = await Promise.all(parsed.imports.map(async (imported) => {
            let url = await this.getBlobUrl(imported.name, false);
            return imported.text + `"${url}";`;
        }));

        return imports.join("") + parsed.code;
    }

    static async addParseHook(prefix: Prefix, callback: (code: string) => string) {
        this.parseHooks.push({ prefix, callback });
    }

    static createCallback(id: string, callback: (val: any) => void) {
        this.callbacks[id] = callback;
        return `GLCallback["${id}"]`;
    }

    static exposeObject(prefix: Prefix, id: string, substring: string, callback: (val: any) => void) {
        const cb = this.createCallback(id, callback);

        this.addParseHook(prefix, (code) => {
            let index = code.indexOf(substring);
            if(index === -1) return code;

            let bracketCount = 0;
            while(bracketCount >= 0) {
                if(code[index] === "}") bracketCount++;
                else if(code[index] === "{") bracketCount--;

                index--;
            }

            const nameEnd = index;
            const lastSpace = code.lastIndexOf(" ", nameEnd);
            const lastComma = code.lastIndexOf(",", nameEnd);
            const nameStart = Math.max(lastSpace, lastComma);
            const name = code.slice(nameStart + 1, nameEnd);

            return code + `${cb}(${name});`;
        });
    }

    static exposeObjectByAssignment(prefix: Prefix, id: string, substring: string, callback: (val: any) => void) {
        const cb = this.createCallback(id, callback);

        this.addParseHook(prefix, (code) => {
            let index = code.indexOf(substring);
            if(index === -1) return code;

            const lastComma = code.lastIndexOf(",", index);
            const lastSemicolon = code.lastIndexOf(";", index);
            const start = Math.max(lastComma, lastSemicolon);
            const name = code.slice(start + 1, index);

            return code + `${cb}(${name});`;
        });
    }
}