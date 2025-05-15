import { log } from "$content/utils";
import BaseScript from "./baseScript.svelte";

export default class Plugin extends BaseScript {
    type = "Plugin";
    enabled: boolean = $state();
    exported: any;
    onStop: (() => void)[] = [];
    openSettingsMenu: (() => void)[] = $state([]);
    enablePromise: Promise<void> | null = null;
    errored = $state(false);

    constructor(script: string, enabled = true) {
        super(script);

        this.enabled = enabled;
    }

    start(initial = false) {
        if(this.enablePromise) return this.enablePromise;

        this.enablePromise = new Promise<void>(async (res, rej) => {
            this.runScript(initial)
                .then((returnVal) => {
                    this.exported = returnVal;

                    if(returnVal.onStop && typeof returnVal.onStop === "function") {
                        this.onStop.push(returnVal.onStop);
                    }
                    if(returnVal.openSettingsMenu && typeof returnVal.openSettingsMenu === "function") {
                        this.openSettingsMenu.push(returnVal.openSettingsMenu);
                    }
            
                    log(`Loaded plugin: ${this.headers.name}`);

                    res();
                })
                .catch((e) => {
                    console.error(e);
                    this.errored = true;
                    rej(e);
                })
        });

        return this.enablePromise;
    }

    stop() {
        if(!this.enabled) return;

        try {
            for(let stop of this.onStop) stop?.();
        } catch (e) {
            console.error(`Error stopping plugin ${this.headers.name}:`, e);
        }

        this.onStop = [];
        this.openSettingsMenu = [];
        this.enablePromise = null;
        this.exported = null;
        this.errored = false;
        this.unloadLibs();
    }
}