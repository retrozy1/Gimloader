import { domLoaded, splicer } from "$content/utils";
import { get, set, clear } from "idb-keyval";
import PluginManager from "./scripts/pluginManager.svelte";
import Port from "$shared/port.svelte";
import { version } from "../../../package.json";

interface Import {
    text: string;
    name: string;
}

interface ParsedJs {
    imports: Import[];
    code: string;
}

// true = index only, false = anything
type Prefix = string | boolean;

interface ParseHook {
    pluginName?: string;
    prefix: Prefix;
    callback: (code: string) => string;
}

export default class Rewriter {
    static base: URL;
    static cleared = false;
    static shared: Record<string, any> = {};
    static sharedPluginNames: Record<string, string[]> = {};

    static async init(cacheInvalid: boolean) {
        if(cacheInvalid) this.invalidate(true);

        Port.on("cacheInvalid", ({ invalid }) => {
            if(invalid) this.invalidate(true);
        });

        Object.defineProperties(window, {
            "GLImport": {
                value: this.import.bind(this),
                writable: false,
                configurable: false
            },
            "GLShared": {
                value: this.shared,
                writable: false,
                configurable: false
            }
        });

        await domLoaded;
        let index = document.querySelector<HTMLScriptElement>("script[src]");

        // Invalidate the database if the index script has changed
        const name = this.getName(index.src);
        if(name !== localStorage.getItem("gl-lastindex")) {
            this.invalidate();
            localStorage.setItem("gl-lastindex", name);
        }

        if(version !== localStorage.getItem("gl-version")) {
            this.invalidate();
            localStorage.setItem("gl-version", version);
        }
        
        this.base = new URL(index.src);
        this.import(index.src, true);
    }

    static updateState(cacheInvalid: boolean) {
        if(cacheInvalid) this.invalidate(true);
    }

    static getName(src: string) {
        return src.split("/").pop();
    }

    static invalidate(broadcast = false) {
        this.cleared = true;
        clear();

        if(broadcast) {
            Port.send("cacheInvalid", { invalid: false });
        }
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

            // Negligible impact on load time
            await PluginManager.loaded;

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
                if(hook.prefix !== false) {
                    if(hook.prefix === true && !root) continue;
                    if(hook.prefix !== true && !name.startsWith(hook.prefix)) continue;
                }
                
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

    static addParseHook(pluginName: string | null, prefix: Prefix, callback: (code: string) => string) {
        let object: ParseHook = { prefix, callback };
        
        if(pluginName) object.pluginName = pluginName;
        this.parseHooks.push(object);

        return splicer(this.parseHooks, object);
    }

    static removeParseHooks(pluginName: string) {
        for(let i = 0; i < this.parseHooks.length; i++) {
            let hook = this.parseHooks[i];
            if(hook.pluginName === pluginName) {
                this.parseHooks.splice(i, 1);
                i--;
            }
        }
    }

    static createShared<T = any>(pluginName: string | null, id: string, value: T) {
        let sharedId = id;

        if(pluginName !== null) {
            sharedId = `${pluginName}-${id}`;
            this.sharedPluginNames[pluginName] ??= [];
            this.sharedPluginNames[pluginName].push(sharedId);
        }

        this.shared[sharedId] = value;
        return `GLShared["${sharedId}"]`;
    }

    static removeShared(pluginName: string) {
        if(!this.sharedPluginNames[pluginName]) return;

        for(let id of this.sharedPluginNames[pluginName]) {
            delete this.shared[id];
        }

        delete this.sharedPluginNames[pluginName];
    }

    static removeSharedById(pluginName: string, id: string) {
        delete this.shared[`${pluginName}-${id}`];
    }

    static createMemoized<T = any>(id: string, getter: () => T) {
        let stored: T;
        let shared = this.createShared(null, id, () => {
            if(stored) return stored;

            stored = getter();
            return stored;
        });

        return `${shared}?.()`;
    }

    static exposeObject<T = any>(prefix: Prefix, id: string, substring: string, callback: (val: T) => void) {
        const cb = this.createShared(null, id, callback);

        this.addParseHook(null, prefix, (code) => {
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

    static exposeObjectBefore<T = any>(prefix: Prefix, id: string, substring: string, callback: (val: T) => void) {
        const cb = this.createShared(null, id, callback);

        this.addParseHook(null, prefix, (code) => {
            let index = code.indexOf(substring);
            if(index === -1) return code;

            const lastComma = code.lastIndexOf(",", index);
            const lastSemicolon = code.lastIndexOf(";", index);
            const start = Math.max(lastComma, lastSemicolon);
            const name = code.slice(start + 1, index);

            return code + `${cb}?.(${name});`;
        });
    }

    static replaceBetween(text: string, start: string, end: string, withText: string) {
        let startIndex = text.indexOf(start);
        let endIndex = text.indexOf(end, startIndex) + end.length;

        return text.slice(0, startIndex) + withText + text.slice(endIndex);
    }

    static insertAfter(text: string, after: string, withText: string) {
        let index = text.indexOf(after) + after.length;
        return text.slice(0, index) + withText + text.slice(index);
    }
}