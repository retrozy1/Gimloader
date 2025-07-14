import { log } from "$content/utils";
import { parseScriptHeaders } from "$shared/parseHeader";
import type { ScriptHeaders } from "$types/headers";
import Net from "$core/net/net";
import type Lib from "./lib.svelte";
import LibManager from "./libManager.svelte";
import ReloadConfirm from "../reloadConfirm.svelte";

export default abstract class BaseScript {
    abstract type: string;
    script: string;
    headers: ScriptHeaders = $state();
    usedLibs: Lib[] = [];

    constructor(script: string, headers?: ScriptHeaders) {
        this.script = script;

        if(headers) this.headers = headers;
        else this.headers = parseScriptHeaders(script);
    }

    get id() {
        return `${this.type}-${this.headers.name}`;
    }

    runScript(initial: boolean, alreadyStartedLibs: string[] = []) {
        return new Promise<any>(async (res, rej) => {
            let success = await this.loadLibs(initial, alreadyStartedLibs)
                .catch(rej);
            if(!success) return;

            let uri = encodeURIComponent(this.headers.name);
            let host = this.type === "Plugin" ? "plugins" : "libraries";
            let sourceUrl = `\n//# sourceURL=gimloader://${host}/${uri}.js`;
    
            if(this.headers.syncEval !== "false") {
                try {
                    // append code for module.exports syntax
                    let code = "const module = { exports: {} };\n" + this.script + "\nmodule" + sourceUrl;
                    let returned = eval.apply(window, [code]);
                    returned = returned?.exports;
                    if(!returned) returned = {};

                    if(!initial) this.checkReloadNeeded();
                    res(Object.freeze(returned));
                } catch(e) {
                    rej(e);
                }
                return;
            }
    
            const blob = new Blob([this.script, sourceUrl], { type: "application/javascript" });
            const url = URL.createObjectURL(blob);
    
            import(url)
                .then((returnVal) => {
                    if(!initial) this.checkReloadNeeded();
                    res(returnVal);
                })
                .catch(rej)
                .finally(() => URL.revokeObjectURL(url));
        });
    }

    checkReloadNeeded() {
        if(
            this.headers.reloadRequired === 'true' || 
            this.headers.reloadRequired === '' ||
            (this.headers.reloadRequired === 'ingame' && Net.type !== "None")
        ) {
            ReloadConfirm.addNeeded(this.headers.name);
        }
    }

    loadLibs(initial: boolean, alreadyStartedLibs: string[]) {
        return new Promise<boolean>(async (res, rej) => {
            this.usedLibs = [];

            if(this.type === "Library") {
                if(alreadyStartedLibs.includes(this.headers.name)) {
                    // circular import, bad
                    rej(new Error(`Circular reference when importing library ${this.headers.name}`));
                    return;
                }
                alreadyStartedLibs.push(this.headers.name);
            }

            let libObjs: Lib[] = [];
            let optionalLibObjs: Lib[] = [];

            // load required libs
            for(let lib of this.headers.needsLib) {
                let libName = lib.split('|')[0].trim();
                let libObj = LibManager.getLib(libName);

                if(!libObj) {
                    rej(new Error(`${this.type} ${this.headers.name} requires library ${libName} which is not installed`));
                    return;
                }

                libObjs.push(libObj);
            }

            // load optional libs
            for(let lib of this.headers.optionalLib) {
                let libName = lib.split('|')[0].trim();
                let libObj = LibManager.getLib(libName);

                if(!libObj) continue;
                optionalLibObjs.push(libObj);
            }

            this.usedLibs.push(...libObjs, ...optionalLibObjs);

            let [results, optionalResults] = await Promise.all([
                Promise.allSettled(libObjs.map(lib => lib.start(this.id, initial, alreadyStartedLibs))),
                Promise.allSettled(optionalLibObjs.map(lib => lib.start(this.id, initial, alreadyStartedLibs)))
            ]);

            // log errors with optional libs, but don't fail the load
            for(let result of optionalResults) {
                if(result.status === 'rejected') {
                    log(`Failed to enable optional library for ${this.type.toLowerCase()} ${this.headers.name}:`, result.reason);
                }
            }

            let failed = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
            if(failed.length > 0) {
                let failMsg = failed.map(f => f.reason).join("\n");
                let err = new Error(`Error while enabling libraries for ${this.type.toLowerCase()} ${this.headers.name}:\n${failMsg}`);
                rej(err);
                return;
            }

            res(true);
        });
    }

    unloadLibs() {
        for(let lib of this.usedLibs) {
            lib.removeUsed(this.id);
        }
    }
}