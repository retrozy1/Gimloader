import { parseScriptHeaders } from "$shared/parseHeader";
import type { ScriptHeaders } from "$types/scripts";
import type { OnceMessages, OnceResponses } from "$types/messages";
import type { LibraryInfo, PluginInfo, State } from "$types/state";
import type { Update } from "$types/updater";
import Server from "./server";
import { saveDebounced, statePromise } from "./state";
import { formatDownloadUrl } from "$shared/net/util";

export default class Updater {
    static updates: Update[] = [];

    static async init() {
        Server.onMessage("applyUpdates", this.applyUpdates.bind(this));
        Server.onMessage("updateAll", this.updateAll.bind(this));
        Server.onMessage("updateSingle", this.updateSingle.bind(this));

        const state = await statePromise;
        if(!state.settings.autoUpdate) return;

        const stored = await chrome.storage.local.get({
            lastUpdateCheck: 0
        });

        const diff = Date.now() - stored.lastUpdateCheck;

        // check for updates once every hour
        if(diff < 60 * 60 * 1000) return;

        this.checkUpdates();
    }

    static async checkUpdates(broadcast = true) {
        return new Promise<void>(async (res) => {
            const state = await statePromise;
            const updaters: (() => Promise<void>)[] = [];

            const checkUpdate = (headers: ScriptHeaders, type: "plugin" | "library") => {
                return () => {
                    return new Promise<void>(async (res) => {
                        const text = await this.getText(formatDownloadUrl(headers.downloadUrl));
                        if(!text) return res();

                        // it doesn't matter whether we use parse lib or plugin header here
                        const newHeaders = parseScriptHeaders(text);
                        if(!this.shouldUpdate(headers, newHeaders)) return res();

                        this.updates.push({
                            type,
                            name: headers.name,
                            newName: newHeaders.name,
                            script: text
                        });

                        res();
                    });
                };
            };

            for(const plugin of state.plugins) {
                const headers = parseScriptHeaders(plugin.script);
                if(!headers.downloadUrl) continue;
                updaters.push(checkUpdate(headers, "plugin"));
            }

            for(const lib of state.libraries) {
                const headers = parseScriptHeaders(lib.script);
                if(!headers.downloadUrl) continue;
                updaters.push(checkUpdate(headers, "library"));
            }

            let finished = false;

            const advance = () => {
                const update = updaters.shift();
                if(!update) {
                    if(finished) return;
                    finished = true;

                    chrome.storage.local.set({ lastUpdateCheck: Date.now() });

                    if(broadcast) {
                        state.availableUpdates = this.updates.map(s => s.name);
                        Server.send("availableUpdates", state.availableUpdates);
                    }
                    res();
                    return;
                }

                update().finally(advance);
            };

            const maxConcurrent = 5;
            for(let i = 0; i < Math.min(maxConcurrent, updaters.length); i++) {
                advance();
            }
        });
    }

    static shouldUpdate(oldHeaders: ScriptHeaders, newHeaders: ScriptHeaders) {
        if(!oldHeaders.version) return true;
        if(!newHeaders.version) return false;

        const oldParts = oldHeaders.version.split(".").map((n) => parseInt(n, 10));
        const newParts = newHeaders.version.split(".").map((n) => parseInt(n, 10));

        for(let i = 0; i < newParts.length; i++) {
            const oldPart = oldParts[i];
            const newPart = newParts[i];

            if(newPart > oldPart) return true;
            if(newPart < oldPart) return false;
        }

        if(newParts.length > oldParts.length) return true;

        return false;
    }

    static getText(url: string) {
        return new Promise<string | null>((res) => {
            fetch(url)
                .catch(() => res(null))
                .then((resp) => {
                    if(!resp) return res(null);
                    if(resp.status !== 200) return res(null);
                    resp.text().then(res, () => res(null));
                });
        });
    }

    static async applyUpdate(state: State, update: Update) {
        const { type, name, newName, script } = update;
        const message = { name, newName, script, updated: true };

        if(type === "plugin") {
            // if a plugin with the new name exists, just overwrite it
            // not the best solution but this should almost never happen and the consequences are bad if it's not adressed
            if(name !== newName) {
                const existing = state.plugins.find(p => p.name === newName);
                if(existing) {
                    await Server.executeAndSend("pluginDelete", { name: newName });
                }
            }

            const plugin = state.plugins.find(p => p.name === name);
            if(!plugin) return;
            plugin.name = newName;
            plugin.script = update.script;

            saveDebounced("plugins");
            Server.send("pluginEdit", message);
        } else {
            if(name !== newName) {
                const existing = state.libraries.find(l => l.name === newName);
                if(existing) {
                    await Server.executeAndSend("libraryDelete", { name: newName });
                }
            }

            const library = state.libraries.find(l => l.name === name);
            if(!library) return;
            library.name = newName;
            library.script = update.script;

            saveDebounced("libraries");
            Server.send("libraryEdit", message);
        }
    }

    static applyUpdates(state: State, apply: boolean) {
        if(apply) {
            for(const update of this.updates) {
                this.applyUpdate(state, update);
            }
        }

        this.updates = [];
        state.availableUpdates = [];
        Server.send("availableUpdates", []);
    }

    static onApplyUpdates(state: State, message: OnceMessages["applyUpdates"], respond: () => void) {
        this.applyUpdates(state, message.apply);

        respond();
    }

    static async updateAll(state: State, _: OnceMessages["updateAll"], respond: (names: OnceResponses["updateAll"]) => void) {
        await this.checkUpdates(false);
        const names = this.updates.map(u => u.name);

        this.applyUpdates(state, true);
        respond(names);
    }

    static async updateSingle(state: State, message: OnceMessages["updateSingle"], respond: (updated: OnceResponses["updateSingle"]) => void) {
        let script: PluginInfo | LibraryInfo;
        if(message.type === "plugin") script = state.plugins.find(p => p.name === message.name);
        else script = state.libraries.find(l => l.name === message.name);

        const headers = parseScriptHeaders(script.script);
        if(!headers.downloadUrl) return respond({ updated: false });

        const text = await this.getText(formatDownloadUrl(headers.downloadUrl));
        if(!text) return respond({ updated: false, failed: true });

        const newHeaders = parseScriptHeaders(text);
        if(!this.shouldUpdate(headers, newHeaders)) return respond({ updated: false });

        this.applyUpdate(state, {
            type: message.type,
            name: headers.name,
            script: text,
            newName: newHeaders.name
        });

        respond({ updated: true, version: newHeaders.version });
    }
}
