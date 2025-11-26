import { splicer } from "$content/utils";
import { domLoaded } from "$content/utils";
import { clear, get, set } from "idb-keyval";
import PluginManager from "./scripts/pluginManager.svelte";
import Port from "$shared/net/port.svelte";
import { englishList, error } from "$shared/utils";
import Modals from "./modals.svelte";

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
    callback: (code: string) => string | undefined;
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
        const index = document.querySelector<HTMLScriptElement>('script[type="module"][src^="/assets/index"]');

        // Invalidate the database if the index script has changed
        const name = this.getName(index.src);
        if(name !== localStorage.getItem("gl-lastindex")) {
            this.invalidate();
            localStorage.setItem("gl-lastindex", name);
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
        if(this.cleared) return;
        this.cleared = true;
        clear();

        if(broadcast) {
            Port.send("cacheInvalid", { invalid: false });
        }
    }

    static loadingSrcs = new Map<string, Promise<string>>();
    static getBlobUrl(name: string, root: boolean, skipPluginHooks = false) {
        const existing = this.loadingSrcs.get(name);
        if(existing) return existing;

        const promise = new Promise<string>(async (res) => {
            let parsed: ParsedJs;
            if(!this.cleared && !skipPluginHooks) parsed = await get(name);

            if(!parsed) {
                const resp = await fetch(`https://www.gimkit.com/gimloader/assets/${name}`);
                const js = await resp.text();
                parsed = this.parse(js, name, root, skipPluginHooks);

                if(!skipPluginHooks) set(name, parsed);
            }

            const code = await this.prepareJs(parsed);
            const blob = new Blob([code], { type: "text/javascript" });
            res(URL.createObjectURL(blob));
        });

        this.loadingSrcs.set(name, promise);
        return promise;
    }

    static async import(src: string, root: boolean) {
        const url = new URL(src, this.base);
        const name = this.getName(url.pathname);
        const blobUrl = await this.getBlobUrl(name, root);

        // Negligible impact on load time
        await PluginManager.loaded;

        try {
            const imported = await import(blobUrl);
            URL.revokeObjectURL(blobUrl);
            return imported;
        } catch (e) {
            error("Error importing", src, e);

            // Create an error message that lists plugins that might be causing the issue
            const usedHooks = this.getHooks(name, root, false)
                .map(hook => hook.pluginName).filter(name => name);

            // If no hooks were used, just give up
            if(usedHooks.length === 0) {
                this.invalidate();
                const text = `Critical error loading script ${name}.\n\n`
                    + "This error is likely caused by Gimloader itself. Please try reloading the page. "
                    + "If this issue persists open an issue at https://github.com/Gimloader/Gimloader.";
                Modals.open("error", { text, title: "Error loading script" });
                return;
            }

            const text = `Error loading script ${name}. Gimloader may still be intact, but some plugins may not work as expected.\n\n`
                + `This error is likely caused by ${englishList(usedHooks, "or")}. `
                + `Try disabling ${usedHooks.length > 1 ? "these plugins" : "this plugin"} and reloading.`;
            Modals.open("error", { text, title: "Error loading script" });

            // Load it again without hooks
            this.loadingSrcs.delete(name);
            const newUrl = await this.getBlobUrl(name, root, true);

            // If this fails, whatever
            const imported = await import(newUrl);
            URL.revokeObjectURL(newUrl);
            return imported;
        }
    }

    static importRegex = /(import(?:.+?from)?)"([^"]+)";/g;
    static parseHooks: ParseHook[] = [];
    static parse(js: string, name: string, root: boolean, skipPluginHooks: boolean): ParsedJs {
        // Remove dependency preloading
        if(js.startsWith("const __vite__mapDeps")) {
            const start = js.indexOf(";");
            js = "const __vite__mapDeps = () => [];" + js.slice(start + 1);
        }

        // Replace dynamic imports
        js = js.replaceAll("import(", "GLImport(");

        // Replace static imports
        const imports: Import[] = [];
        for(const match of js.matchAll(this.importRegex)) {
            imports.push({ text: match[1], name: this.getName(match[2]) });
        }

        js = js.replace(this.importRegex, "");

        // Run parse hooks
        const hooks = this.getHooks(name, root, skipPluginHooks);
        for(const hook of hooks) {
            try {
                const edited = hook.callback(js);
                if(edited) js = edited;
            } catch (e) {
                error("Error in parse hook:", e);
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
        const imports = await Promise.all(parsed.imports.map(async (imported) => {
            const url = await this.getBlobUrl(imported.name, false);
            return imported.text + `"${url}";`;
        }));

        return imports.join("") + parsed.code;
    }

    static getHooks(name: string, root: boolean, skipPluginHooks: boolean) {
        return this.parseHooks.filter((hook) => {
            if(skipPluginHooks && hook.pluginName) return false;
            if(hook.prefix === false) return true;
            if(hook.prefix === true) return root;
            return name.startsWith(hook.prefix);
        });
    }

    static addParseHook(pluginName: string | null, prefix: Prefix, callback: (code: string) => string) {
        const object: ParseHook = { prefix, callback };
        if(pluginName) object.pluginName = pluginName;

        return splicer(this.parseHooks, object);
    }

    static removeParseHooks(pluginName: string) {
        for(let i = 0; i < this.parseHooks.length; i++) {
            const hook = this.parseHooks[i];
            if(hook.pluginName === pluginName) {
                this.parseHooks.splice(i, 1);
                i--;
            }
        }
    }

    static createShared(pluginName: string | null, id: string, value: any) {
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

        for(const id of this.sharedPluginNames[pluginName]) {
            delete this.shared[id];
        }

        delete this.sharedPluginNames[pluginName];
    }

    static removeSharedById(pluginName: string, id: string) {
        delete this.shared[`${pluginName}-${id}`];
    }

    static createMemoized(id: string, getter: () => any) {
        let stored: any;
        const shared = this.createShared(null, id, () => {
            if(stored) return stored;

            stored = getter();
            return stored;
        });

        return `${shared}?.()`;
    }

    static exposeObject(prefix: Prefix, id: string, substring: string, callback: (val: any) => void) {
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

    static exposeObjectBefore(prefix: Prefix, id: string, substring: string, callback: (val: any) => void) {
        const cb = this.createShared(null, id, callback);

        this.addParseHook(null, prefix, (code) => {
            const index = code.indexOf(substring);
            if(index === -1) return code;

            const lastComma = code.lastIndexOf(",", index);
            const lastSemicolon = code.lastIndexOf(";", index);
            const start = Math.max(lastComma, lastSemicolon);
            const name = code.slice(start + 1, index);

            return code + `${cb}?.(${name});`;
        });
    }

    static replaceBetween(text: string, start: string, end: string, withText: string) {
        const startIndex = text.indexOf(start);
        const endIndex = text.indexOf(end, startIndex) + end.length;

        return text.slice(0, startIndex) + withText + text.slice(endIndex);
    }

    static insertAfter(text: string, after: string, withText: string) {
        const index = text.indexOf(after) + after.length;
        return text.slice(0, index) + withText + text.slice(index);
    }
}
