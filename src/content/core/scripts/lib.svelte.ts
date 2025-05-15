import { log } from "$content/utils";
import BaseScript from "./baseScript.svelte";

export default class Lib extends BaseScript {
    type = "Library";
    library: any;
    usedBy = new Set<string>();
    onStop: (() => void)[] = [];
    enablePromise: Promise<void> | null = null;

    start(starter?: string, initial: boolean = false, alreadyStartedLibs: string[] = []) {
        if(this.enablePromise) return this.enablePromise;

        this.enablePromise = new Promise<void>((res, rej) => {
            if(starter) this.usedBy.add(starter);

            this.runScript(initial, alreadyStartedLibs)
                .then((returnVal) => {
                    if(returnVal.onStop && typeof returnVal.onStop === "function") {
                        this.onStop.push(returnVal.onStop);
                    }
    
                    if(returnVal.default) {
                        returnVal = returnVal.default;
                    }
            
                    this.library = returnVal;
                    res();
                })
                .catch(rej)
        });

        return this.enablePromise;
    }

    removeUsed(id: string) {
        this.usedBy.delete(id);
    
        if(this.usedBy.size === 0) {
            this.stop();
        }
    }

    stop() {
        // call onStop if it exists
        try {
            for(let stop of this.onStop) stop();
        } catch(e) {
            log(`Error stopping library ${this.headers.name}:`, e);
        }

        // reset the library
        this.onStop = [];
        this.library = null;
        this.enablePromise = null;
        this.unloadLibs();
    }
}