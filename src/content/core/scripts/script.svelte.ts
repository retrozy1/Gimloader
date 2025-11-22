import type { ScriptHeaders } from "$types/scripts";
import type { ScriptType } from "$types/messages";
import type { ScriptInfo } from "$types/state";
import { englishList, error, getDepName, log } from "$content/utils";
import { parseScriptHeaders } from "$shared/parseHeader";
import { gameState } from "$content/stores";
import Modals from "../modals.svelte";
import { scripts } from "./map";

const apiCreatedRegex = /new\s+GL\s*\(/;

export abstract class Script<T extends ScriptInfo = ScriptInfo> {
    abstract type: ScriptType;
    abstract warnAbout: boolean;
    code: string;
    headers: ScriptHeaders = $state();
    requires: Script[] = [];
    optionalRequires: Script[] = [];
    requiredBy: Script[] = [];
    optionalBy: Script[] = [];
    onStop: (() => void)[] = [];
    exported: any;
    errored: boolean = $state(false);

    constructor(info: T, headers?: ScriptHeaders) {
        this.code = info.code;
        this.updateHeaders(headers);

        // TODO: Command palette
    }

    updateHeaders(headers?: ScriptHeaders) {
        if(headers) this.headers = headers;
        else this.headers = parseScriptHeaders(this.code);
    }

    started = false;
    startPromise: Promise<void> | null = null;
    start(initial: boolean, loaded: string[] = []) {
        if(this.startPromise) return this.startPromise;
        this.started = true;

        this.startPromise = new Promise<void>(async (res, rej) => {
            const newLoaded = [...loaded, this.headers.name];
            const { required, optional } = this.getDependencies();

            // Ensure there are no circular dependencies
            const allDeps = required.concat(optional);
            for(const dep of allDeps) {
                const name = dep.headers.name;

                if(newLoaded.includes(name)) {
                    const stack = newLoaded.join(" -> ") + ` -> ${name}`;
                    rej(new Error(`Circular dependency when loading ${this.headers.name} (${stack})`));
                    return;
                }
            }

            // Load all dependencies
            const [requiredRes, optionalRes] = await Promise.all([
                Promise.allSettled(required.map((dep) => dep.require(this, true, initial, newLoaded))),
                Promise.allSettled(optional.map((dep) => dep.require(this, false, initial, newLoaded)))
            ]);

            // Throw an error if any required dependencies failed to load
            for(const res of requiredRes) {
                if(res.status === "fulfilled") continue;
                rej(res.reason);
                return;
            }

            this.requires = required;

            // Log any error with optional dependencies
            for(let i = 0; i < optionalRes.length; i++) {
                const res = optionalRes[i];
                if(res.status === "fulfilled") {
                    this.optionalRequires.push(optional[i]);
                } else {
                    error(`Failed to load optional dependency for ${this.headers.name}:`, res.reason);
                }
            }

            const uri = encodeURIComponent(this.headers.name);
            const sourceUrl = `\n//# sourceURL=gimloader://${this.type}/${uri}.js`;

            // Only create the api automatically if the plugin doesn't call new GL() itself for backwards compatibility
            const apiDeclaration = this.code.match(apiCreatedRegex) ? "" : `const api = new GL("${this.type}", "${this.headers.name}");\n`;

            const blob = new Blob([apiDeclaration, this.code, sourceUrl], { type: "application/javascript" });
            const url = URL.createObjectURL(blob);

            import(url)
                .then((exports) => {
                    if(!initial) this.checkReloadNeeded();
                    this.exported = exports;

                    if(exports.onStop && typeof exports.onStop === "function") {
                        this.onStop.push(exports.onStop);
                    }

                    this.onImport?.(exports)
                    log(`Loaded ${this.type} ${this.headers.name}`);

                    res();
                })
                .catch(rej)
                .finally(() => URL.revokeObjectURL(url));
        });

        return this.startPromise;
    }

    onImport?(exports: any): void;

    checkReloadNeeded() {
        if(
            this.headers.reloadRequired === "true"
            || this.headers.reloadRequired === ""
            || (this.headers.reloadRequired === "ingame" && gameState.inGame)
            || (this.headers.reloadRequired === "notingame" && !gameState.inGame)
        ) {
            Modals.addReloadNeeded(this.headers.name);
        }
    }

    require(by: Script, required: boolean, initial: boolean, loaded: string[]) {
        if(required) this.requiredBy.push(by);
        else this.optionalBy.push(by);

        return this.start(initial, loaded);
    }

    unrequire(by: Script, required: boolean) {
        if(required) {
            const index = this.requiredBy.indexOf(by);
            if(index !== -1) this.requiredBy.splice(index, 1);
        } else {
            const index = this.optionalBy.indexOf(by);
            if(index !== -1) this.optionalBy.splice(index, 1);
        }
    }

    abstract getDependencyStrings(): Partial<Record<ScriptType, { required?: string[]; optional?: string[] }>>;

    getDependencies() {
        const strings = this.getDependencyStrings();
        const required: Script[] = [];
        const optional: Script[] = [];

        for(let type in strings) {
            const deps = strings[type as ScriptType];
            const requiredDeps = deps.required?.map(getDepName) ?? [];
            const optionalDeps = deps.optional?.map(getDepName) ?? [];
            const allDeps = requiredDeps.concat(optionalDeps);

            // Confirm the dependencies are all the correct type
            for(const depName of allDeps) {
                const script = scripts.get(depName);
                if(!script) continue;

                if(script.type !== type) throw new Error(`${this.headers.name} expected dependency ${depName} to be a ${type}, but it is a ${script.type}`);
            }

            // Confirm all required dependencies exist
            for(const depName of requiredDeps) {
                const script = scripts.get(depName);
                if(!script) throw new Error(`${this.headers.name} is missing ${type} dependency: ${depName}`);
                required.push(script);
            }

            for(const depName of optionalDeps) {
                const script = scripts.get(depName);
                if(!script) continue;
                optional.push(script);
            }
        }

        return { required, optional };
    }

    recursiveGetDependents() {
        const dependents = new Set<Script>();

        // Recursively get the plugins that will be enabled
        const getDependents = (script: Script) => {
            for(let requirer of script.requiredBy) {
                if(dependents.has(requirer)) continue;

                dependents.add(requirer);
                getDependents(requirer);
            }
        }
        getDependents(this);

        return dependents;
    }

    onDependentStopped?(): void;
    
    stopConfirm(action = "Disabling") {
        const willStop = this.recursiveGetDependents();

        // TOOD: Actual prompt
        if(willStop.size > 0) {
            const warnAbout = Array.from(willStop).filter(s => s.warnAbout);
            const names = englishList(warnAbout.map(p => p.headers.name));
            if(!confirm(`${action} ${this.headers.name} will also disable ${names}. Proceed?`)) return false;
        }

        this.stop();
        return true;
    }

    stop() {
        if(!this.started) return;

        try {
            for(const stop of this.onStop) stop?.();
        } catch (e) {
            console.error(`Error stopping ${this.headers.name}:`, e);
        }

        for(const used of this.requires) used.unrequire?.(this, true);
        for(const used of this.optionalRequires) used.unrequire?.(this, false);

        const willStop = this.recursiveGetDependents();
        for(let script of willStop) {
            script.stop();
            script.onDependentStopped?.();
        }

        this.started = false;
        this.onStop = [];
        this.startPromise = null;
        this.exported = null;
        this.errored = false;
        this.requires = [];
        this.optionalRequires = [];
        this.requiredBy = [];
        this.optionalBy = [];

        log(`Stopped ${this.type} ${this.headers.name}`);
    }

    edit(code: string, headers?: ScriptHeaders) {
        this.code = code;
        this.updateHeaders(headers);
    }

    delete() {
        this.stop();
    }
}

// Unfortunately everything needs to be in one file for esbuild to not explode
// because of some circular dependencies
// export abstract class Script {
//     abstract type: ScriptType;
//     script: string;
//     headers: ScriptHeaders = $state();
//     usedLibs: Lib[] = [];
//     cleanupDeleteCommand: () => void;

//     constructor(script: string, headers?: ScriptHeaders) {
//         this.script = script;

//         if(headers) this.headers = headers;
//         else this.headers = parseScriptHeaders(script);
//     }

//     get id() {
//         return `${this.type}-${this.headers.name}`;
//     }

//     runScript(initial: boolean, alreadyStartedLibs: string[] = []) {
//         return new Promise<any>(async (res, rej) => {
//             const success = await this.loadLibs(initial, alreadyStartedLibs)
//                 .catch(rej);
//             if(!success) return;

//             const uri = encodeURIComponent(this.headers.name);
//             const host = this.type === "Plugin" ? "plugins" : "libraries";
//             const sourceUrl = `\n//# sourceURL=gimloader://${host}/${uri}.js`;

//             // Only create the api automatically if the plugin doesn't call new GL() itself for backwards compatibility
//             const apiDeclaration = this.script.match(apiCreatedRegex) ? "" : `const api = new GL("${host}", "${this.headers.name}");\n`;

//             const blob = new Blob([apiDeclaration, this.script, sourceUrl], { type: "application/javascript" });
//             const url = URL.createObjectURL(blob);

//             import(url)
//                 .then((returnVal) => {
//                     if(!initial) this.checkReloadNeeded();
//                     res(returnVal);
//                 })
//                 .catch(rej)
//                 .finally(() => URL.revokeObjectURL(url));
//         });
//     }

//     loadLibs(initial: boolean, alreadyStartedLibs: string[]) {
//         return new Promise<boolean>(async (res, rej) => {
//             this.usedLibs = [];

//             if(this.type === "Library") {
//                 if(alreadyStartedLibs.includes(this.headers.name)) {
//                     // circular import, bad
//                     rej(new Error(`Circular reference when importing library ${this.headers.name}`));
//                     return;
//                 }
//                 alreadyStartedLibs.push(this.headers.name);
//             }

//             const libObjs: Lib[] = [];
//             const optionalLibObjs: Lib[] = [];

//             // load required libs
//             for(const lib of this.headers.needsLib) {
//                 const libName = lib.split("|")[0].trim();
//                 const libObj = LibManager.getLib(libName);

//                 if(!libObj) {
//                     rej(new Error(`${this.type} ${this.headers.name} requires library ${libName} which is not installed`));
//                     return;
//                 }

//                 libObjs.push(libObj);
//             }

//             // load optional libs
//             for(const lib of this.headers.optionalLib) {
//                 const libName = lib.split("|")[0].trim();
//                 const libObj = LibManager.getLib(libName);

//                 if(!libObj) continue;
//                 optionalLibObjs.push(libObj);
//             }

//             this.usedLibs.push(...libObjs, ...optionalLibObjs);

//             const [results, optionalResults] = await Promise.all([
//                 Promise.allSettled(libObjs.map(lib => lib.start(this.id, initial, alreadyStartedLibs))),
//                 Promise.allSettled(optionalLibObjs.map(lib => lib.start(this.id, initial, alreadyStartedLibs)))
//             ]);

//             // log errors with optional libs, but don't fail the load
//             for(const result of optionalResults) {
//                 if(result.status === "rejected") {
//                     log(`Failed to enable optional library for ${this.type.toLowerCase()} ${this.headers.name}:`, result.reason);
//                 }
//             }

//             const failed = results.filter(r => r.status === "rejected") as PromiseRejectedResult[];
//             if(failed.length > 0) {
//                 const failMsg = failed.map(f => f.reason).join("\n");
//                 const err = new Error(`Error while enabling libraries for ${this.type.toLowerCase()} ${this.headers.name}:\n${failMsg}`);
//                 rej(err);
//                 return;
//             }

//             res(true);
//         });
//     }

//     unloadLibs() {
//         for(const lib of this.usedLibs) {
//             lib.removeUsed(this.id);
//         }
//     }

//     onDelete() {
//         this.cleanupDeleteCommand?.();
//     }
// }

// export class Plugin extends Script {
//     type = "Plugin";
//     enabled: boolean = $state();
//     exported: any;
//     onStop: (() => void)[] = [];
//     openSettingsMenu: (() => void)[] = $state([]);
//     enablePromise: Promise<void> | null = null;
//     errored = $state(false);
//     settingsDescription?: PluginSettingsDescription;
//     cleanupConfigureCommand?: () => void;
//     cleanupToggleCommand?: () => void;

//     constructor(script: string, enabled = true) {
//         super(script);
//         this.setEnabled(enabled);

//         this.cleanupDeleteCommand = Commands.addCommand(null, {
//             text: `Delete ${this.headers.name}`,
//             keywords: ["remove", "uninstall"]
//         }, () => this.confirmDelete());

//         this.cleanupToggleCommand = Commands.addCommand(null, {
//             text: () => `${this.enabled ? "Disable" : "Enable"} ${this.headers.name}`,
//             keywords: ["toggle"]
//         }, () => {
//             PluginManager.setEnabled(this, !this.enabled);
//             toast.success(`${this.enabled ? "Enabled" : "Disabled"} ${this.headers.name}`);
//         });

//         this.cleanupConfigureCommand = Commands.addCommand(null, {
//             text: `Configure ${this.headers.name}`,
//             keywords: ["settings"],
//             hidden: () => this.openSettingsMenu.length === 0
//         }, () => {
//             this.openSettingsMenu.forEach(c => c());
//         });
//     }

//     confirmDelete() {
//         if(!confirm(`Are you sure you want to delete ${this.headers.name}?`)) return;
//         PluginManager.deletePlugin(this);
//         toast.success(`Deleted plugin ${this.headers.name}`);
//     }

//     setEnabled(enabled: boolean) {
//         if(this.enabled === enabled) return;

//         this.enabled = enabled;
//     }

//     start(initial = false) {
//         if(this.enablePromise) return this.enablePromise;

//         this.enablePromise = new Promise<void>(async (res, rej) => {
//             this.runScript(initial)
//                 .then((returnVal) => {
//                     this.exported = returnVal;

//                     if(returnVal.onStop && typeof returnVal.onStop === "function") {
//                         this.onStop.push(returnVal.onStop);
//                     }
//                     if(returnVal.openSettingsMenu && typeof returnVal.openSettingsMenu === "function") {
//                         this.openSettingsMenu.push(returnVal.openSettingsMenu);
//                     }

//                     log(`Loaded plugin: ${this.headers.name}`);

//                     res();
//                 })
//                 .catch((e) => {
//                     console.error(e);
//                     this.errored = true;
//                     rej(e);
//                 });
//         });

//         return this.enablePromise;
//     }

//     stop() {
//         if(!this.enabled) return;

//         try {
//             for(const stop of this.onStop) stop?.();
//         } catch (e) {
//             console.error(`Error stopping plugin ${this.headers.name}:`, e);
//         }

//         this.onStop = [];
//         this.openSettingsMenu = [];
//         this.enablePromise = null;
//         this.exported = null;
//         this.errored = false;
//         this.unloadLibs();
//     }

//     onDelete() {
//         this.cleanupDeleteCommand?.();
//         this.cleanupToggleCommand?.();
//         this.cleanupConfigureCommand?.();
//     }
// }

// export class Lib extends Script {
//     type = "Library";
//     library: any;
//     usedBy = new Set<string>();
//     onStop: (() => void)[] = [];
//     enablePromise: Promise<void> | null = null;

//     constructor(script: string, headers?: ScriptHeaders) {
//         super(script, headers);

//         this.cleanupDeleteCommand = Commands.addCommand(null, {
//             text: `Delete ${this.headers.name}`,
//             keywords: ["remove", "uninstall"]
//         }, () => this.confirmDelete());
//     }

//     confirmDelete() {
//         if(!confirm(`Are you sure you want to delete ${this.headers.name}?`)) return;
//         LibManager.deleteLib(this);
//         toast.success(`Deleted library ${this.headers.name}`);
//     }

//     start(starter?: string, initial: boolean = false, alreadyStartedLibs: string[] = []) {
//         if(this.enablePromise) return this.enablePromise;

//         this.enablePromise = new Promise<void>((res, rej) => {
//             if(starter) this.usedBy.add(starter);

//             this.runScript(initial, alreadyStartedLibs)
//                 .then((returnVal) => {
//                     if(returnVal.onStop && typeof returnVal.onStop === "function") {
//                         this.onStop.push(returnVal.onStop);
//                     }

//                     if(returnVal.default) {
//                         returnVal = returnVal.default;
//                     }

//                     this.library = returnVal;
//                     res();
//                 })
//                 .catch(rej);
//         });

//         return this.enablePromise;
//     }

//     removeUsed(id: string) {
//         this.usedBy.delete(id);

//         if(this.usedBy.size === 0) {
//             this.stop();
//         }
//     }

//     stop() {
//         // call onStop if it exists
//         try {
//             for(const stop of this.onStop) stop();
//         } catch (e) {
//             log(`Error stopping library ${this.headers.name}:`, e);
//         }

//         // reset the library
//         this.onStop = [];
//         this.library = null;
//         this.enablePromise = null;
//         this.unloadLibs();
//     }
// }
