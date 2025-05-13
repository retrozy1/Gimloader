import type Lib from "$core/libManager/lib.svelte";
import { parseScriptHeaders } from "$shared/parseHeader";
import { confirmLibReload, loadLibs, log } from "$content/utils";
import Net from "$core/net/net";
import LibManager from "$core/libManager/libManager.svelte";
import type { ScriptHeaders } from "$types/headers";

export default class Plugin {
    script: string;
    enabled: boolean = $state();
    headers: ScriptHeaders = $state();
    return: any = $state();
    onStop: (() => void)[] = [];
    openSettingsMenu: (() => void)[] = $state([]);
    enablePromise: Promise<void> | null = null;
    errored = $state(false);

    constructor(script: string, enabled = true) {
        this.script = script;
        this.enabled = enabled;
    
        this.headers = parseScriptHeaders(script);
    }

    async start(initial: boolean = false) {
        if(this.enablePromise) return this.enablePromise;

        this.enablePromise = new Promise<void>(async (res, rej) => {
            try {
                await loadLibs(this.headers, initial);
            } catch(err) {
                this.errored = true;
                rej(err);
                return;
            }
        
            // create a blob from the script and import it
            let sourceUrl = `\n//# sourceURL=gimloader://plugins/${encodeURIComponent(this.headers.name)}.js`;

            let blob = new Blob([this.script, sourceUrl], { type: 'application/javascript' });
            let url = URL.createObjectURL(blob);

            import(url)
                .then((returnVal) => {
                    this.return = returnVal;
                    
                    if(returnVal.onStop && typeof returnVal.onStop === "function") {
                        this.onStop.push(returnVal.onStop);
                    }
                    if(returnVal.openSettingsMenu && typeof returnVal.openSettingsMenu === "function") {
                        this.openSettingsMenu.push(returnVal.openSettingsMenu);
                    }
            
                    log(`Loaded plugin: ${this.headers.name}`);
                    
                    if(!initial) {
                        if(
                            this.headers.reloadRequired === 'true' || 
                            this.headers.reloadRequired === '' ||
                            (this.headers.reloadRequired === 'ingame' && Net.type !== "None")
                        ) {
                            let reload = confirm(`${this.headers.name} requires a reload to function properly. Reload now?`);
                            if(reload) {
                                // call the save function directly, rather than the debounced one
                                location.reload();
                            }
                        }
                    }

                    for(let lib of this.headers.needsLib) {
                        let libName = lib.split('|')[0].trim();
                        let libObj = LibManager.getLib(libName);
                        libObj.addUsed(this.headers.name);
                    }

                    res();
                })
                .catch((e: Error) => {
                    console.error(e);
                    this.errored = true;
                    let err = new Error(`Failed to enable plugin ${this.headers.name}:\n${e.stack}`);
                    rej(err);
                })
                .finally(() => {
                    URL.revokeObjectURL(url);
                });
        });

        return this.enablePromise;
    }

    stop() {
        if(!this.enabled) return;
        this.errored = false;

        try {
            for(let stop of this.onStop) stop?.();
        } catch (e) {
            console.error(`Error stopping plugin ${this.headers.name}:`, e);
        }
        this.onStop = [];
        this.openSettingsMenu = [];
        this.enablePromise = null;

        // remove ourselves from all the libraries we were using
        for(let lib of this.headers.needsLib.concat(this.headers.optionalLib)) {
            let libName = lib.split('|')[0].trim();
            let libObj = LibManager.getLib(libName);
            if(libObj) libObj.removeUsed(this.headers.name);
        }

        this.return = null;
    }
}