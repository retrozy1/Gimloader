import Net from "$core/net/net";
import { loadLibs, log } from "$content/utils";
import { parseScriptHeaders } from "$shared/parseHeader";
import type { ScriptHeaders } from "$types/headers";

export default class Lib {
    script: string;
    library: any;
    headers: ScriptHeaders = $state();
    usedBy = new Set<string>();
    onStop: (() => void)[] = [];
    enablePromise: Promise<boolean> | null = null;
    
    constructor(script: string, headers?: ScriptHeaders) {
        this.script = script;

        if(headers) {
            this.headers = headers;
        } else {
            this.headers = parseScriptHeaders(script);
        }
    }

    start(initial: boolean = false, alreadyStartedLibs: string[] = []) {
        if(this.enablePromise) return this.enablePromise;

        this.enablePromise = new Promise(async (res, rej) => {
            if(alreadyStartedLibs.includes(this.headers.name)) {
                // circular import, bad
                rej(new Error(`Circular reference when importing library ${this.headers.name} (${alreadyStartedLibs.join(", ")})`));
                return;
            }
            alreadyStartedLibs.push(this.headers.name);

            try {
                await loadLibs(this.headers, initial, alreadyStartedLibs);
            } catch(err) {
                rej(err);
                return;
            }

            let sourceUrl = `\n//# sourceURL=gimloader://libraries/${encodeURIComponent(this.headers.name)}.js`;

            let blob = new Blob([this.script, sourceUrl], { type: 'application/javascript' });
            let url = URL.createObjectURL(blob);
    
            import(url)
                .then((returnVal) => {
                    if(returnVal.onStop && typeof returnVal.onStop === "function") {
                        this.onStop.push(returnVal.onStop);
                    }

                    if(returnVal.default) {
                        returnVal = returnVal.default;
                    }

                    let needsReload = this.headers.reloadRequired === 'true' || 
                        this.headers.reloadRequired === '' ||
                        (this.headers.reloadRequired === 'ingame' && Net.type !== "None");
            
                    this.library = returnVal;
                    res(!initial && needsReload);
                })
                .catch((e) => {
                    let error = new Error(`Failed to enable library ${this.headers.name}:\n${e}`)
                    rej(error);
                })
                .finally(() => {
                    URL.revokeObjectURL(url);
                });
        });

        return this.enablePromise;
    }

    addUsed(pluginName: string) {
        this.usedBy.add(pluginName);
    }

    removeUsed(pluginName: string) {
        this.usedBy.delete(pluginName);
    
        if(this.usedBy.size === 0) {
            this.disable();
        }
    }

    disable() {
        // call onStop if it exists
        try {
            for(let stop of this.onStop) stop();
        } catch(e) {
            log(`Error stopping library ${this.headers.name}:`, e);
        }
        this.onStop = [];

        // reset the library
        this.library = null;
        this.enablePromise = null;
    }
}