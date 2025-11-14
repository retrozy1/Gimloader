import type { PluginInfo } from "$types/state";
import { showErrorMessage } from "$content/ui/mount";
import { Deferred, log } from "$content/utils";
import { parseScriptHeaders } from "$shared/parseHeader";
import { Plugin } from "./scripts.svelte";
import Storage from "$core/storage.svelte";
import Port from "$shared/net/port.svelte";
import toast from "svelte-5-french-toast";
import Rewriter from "../rewriter";
import Modals from "../modals.svelte";

export default new class PluginManager {
    plugins: Plugin[] = $state([]);
    loaded = Deferred.create();
    destroyed = false;
    
    async init(pluginInfo: PluginInfo[]) {
        // load plugins from storage
        for(let info of pluginInfo) {
            let pluginObj = new Plugin(info.script, info.enabled);
            this.plugins.push(pluginObj);
        }

        Port.on("pluginEdit", ({ name, script, updated }) => this.editPlugin(name, script, false, updated));
        Port.on("pluginCreate", ({ script }) => this.createPlugin(script, false));
        Port.on("pluginDelete", ({ name }) => this.deletePlugin(name, false));
        Port.on("pluginToggled", ({ name, enabled }) => this.setEnabled(name, enabled, false));
        Port.on("pluginsArrange", ({ order }) => this.arrangePlugins(order, false));
        Port.on("pluginsSetAll", ({ enabled }) => this.setAll(enabled, false));
        Port.on("pluginsDeleteAll", () => this.deleteAll(false));

        let shouldStart = this.plugins.filter(p => p.enabled);
        let results = await Promise.allSettled(shouldStart.map(p => p.start(true)));
        let fails = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];

        if(fails.length > 0) {
            let msg = fails.map(f => f.reason).join('\n');
            showErrorMessage(msg, `Failed to enable ${fails.length} plugin${fails.length > 1 ? 's' : ''}`);
        }

        this.loaded.resolve();
        log('All plugins loaded');
    }

    updateState(pluginInfo: PluginInfo[]) {
        // check for plugins that were added
        for(let info of pluginInfo) {
            if(!this.getPlugin(info.name)) {
                this.createPlugin(info.script, false);
            }
        }

        // check for plugins that were removed
        for(let plugin of this.plugins) {
            if(!pluginInfo.find(i => i.name === plugin.headers.name)) {
                this.deletePlugin(plugin);
            }
        }

        // check if any scripts were updated
        for(let info of pluginInfo) {
            let plugin = this.getPlugin(info.name);
            if(!plugin) continue;

            if(plugin.script !== info.script) {
                this.editPlugin(plugin, info.script);
            }
        }

        // check if any plugins were enabled/disabled
        for(let info of pluginInfo) {
            let plugin = this.getPlugin(info.name);
            if(!plugin) continue;

            if(plugin.enabled !== info.enabled) {
                if(info.enabled) {
                    plugin.start()
                        .catch((e: Error) => {
                            showErrorMessage(e.message, `Failed to enable plugin ${info.name}`);
                        });
                }
                else plugin.stop();
            }
        }

        // move the plugins into the correct order
        let newOrder = [];
        for (let info of pluginInfo) {
            let plugin = this.getPlugin(info.name);
            if (plugin) newOrder.push(plugin);
        }

        this.plugins = newOrder;
    }

    getPlugin(name: string) {
        return this.plugins.find(p => p.headers.name === name) ?? null;
    }

    isEnabled(name: string) {
        let plugin = this.getPlugin(name);
        return (plugin?.enabled ?? false) && !plugin?.errored;
    }

    async createPlugin(script: string, emit = true) {
        let headers = parseScriptHeaders(script);

        if(headers.isLibrary !== "false") {
            toast.error("That script doesn't appear to be a plugin! If it should be, please remove the isLibrary header, and if not, please import it as a library.");
            return;
        }

        let existing = this.getPlugin(headers.name);
        if(existing) {
            let conf = confirm(`A plugin named ${headers.name} already exists! Do you want to overwrite it?`);
            if(!conf) return;

            this.deletePlugin(existing);
        }

        let plugin = new Plugin(script, true);
        this.plugins.unshift(plugin);

        if(emit) {
            if(Storage.settings.autoDownloadMissingLibs) {
                let res = await Port.sendAndRecieve("downloadLibraries", { libraries: headers.needsLib });
                if(res.error) {
                    showErrorMessage(res.error, "Failed to automatically download libraries");
                }

                Port.send("pluginCreate", { name: headers.name, script });
                if(!res.allDownloaded) return;
            } else {
                Port.send("pluginCreate", { name: headers.name, script });
            }

            Rewriter.invalidate();
        }

        plugin.start()
            .catch((e: Error) => {
                showErrorMessage(e.message, `Failed to enable plugin ${plugin.headers.name}`);
            });
    }

    deletePlugin(name: Plugin | string, emit = true) {
        let plugin = typeof name === "string" ? this.getPlugin(name) : name;
        if(!plugin) return;

        plugin.stop();
        this.plugins = this.plugins.filter(p => p !== plugin);

        if(emit) {
            Port.send("pluginDelete", { name: plugin.headers.name });
            Rewriter.invalidate();
        }
        
        Storage.deletePluginStorage(plugin.headers.name);
        log(`Deleted plugin: ${plugin.headers.name}`);
    }

    deleteAll(emit = true) {
        for(let plugin of this.plugins) this.deletePlugin(plugin, false);
        this.plugins = [];

        if(emit) {
            Port.send("pluginsDeleteAll");
            Rewriter.invalidate();
        }
    }

    setAll(enabled: boolean, emit = true) {
        if(emit) Port.send("pluginsSetAll", { enabled });
        for(let plugin of this.plugins) plugin.enabled = enabled;

        if(enabled) {
            Promise.allSettled(this.plugins.filter(p => !p.enabled).map(p => p.start()))
                .then(results => {
                    let fails = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
                    if(fails.length > 0) {
                        let msg = fails.map(f => f.reason).join('\n');
                        showErrorMessage(msg, `Failed to enable ${results.length} plugin${results.length > 1 ? 's' : ''}`);
                    }
                });
        } else {
            for(let plugin of this.plugins) {
                if(plugin.enabled) plugin.stop();
            }
        }

        if(emit) Rewriter.invalidate();
    }

    getExports(pluginName: string) {
        let plugin = this.plugins.find(lib => lib.headers.name === pluginName);
        return plugin?.exported ?? null;
    }

    getHeaders(pluginName: string) {
        let plugin = this.plugins.find(lib => lib.headers.name === pluginName);
        if(!plugin.headers) return null;
        return $state.snapshot(plugin.headers);
    }

    getPluginNames(): string[] {
        return this.plugins.map(p => p.headers.name);
    }

    async editPlugin(name: Plugin | string, script: string, emit = true, updated = false) {
        let plugin = typeof name === "string" ? this.getPlugin(name) : name;
        if(!plugin) return;

        let headers = parseScriptHeaders(script);
        if(updated && headers.changelog.length > 0) {
            Modals.addUpdated(headers.name, headers.version, headers.changelog);
        }

        if(plugin.enabled) plugin.stop();

        // message other windows
        if(emit) {
            if(Storage.settings.autoDownloadMissingLibs) {
                let res = await Port.sendAndRecieve("downloadLibraries", { libraries: headers.needsLib });
                if(res.error) {
                    showErrorMessage(res.error, "Failed to automatically download libraries");
                }

                Port.send("pluginEdit", { name: plugin.headers.name, script, newName: headers.name });
                if(!res.allDownloaded) return;
            } else {
                Port.send("pluginEdit", { name: plugin.headers.name, script, newName: headers.name });
            }
        }

        plugin.script = script;
        plugin.headers = headers;

        if(plugin.enabled) {
            plugin.start(false)
                .catch((e) => {
                    showErrorMessage(e.message, `Failed to enable plugin ${plugin.headers.name}`);
                });
        }

        if(emit) Rewriter.invalidate();
    }

    arrangePlugins(order: string[], emit = true) {
        let newOrder = [];

        for (let name of order) {
            let plugin = this.getPlugin(name);
            if (plugin) newOrder.push(plugin);
        }
        this.plugins = newOrder;

        if(emit) Port.send("pluginsArrange", { order });
    }

    async setEnabled(name: Plugin | string, enabled: boolean, emit = true) {
        let plugin = typeof name === "string" ? this.getPlugin(name) : name;
        if(!plugin) return;
        
        if(enabled) {
            plugin.enabled = true;
            if(emit) Port.send("pluginToggled", { name: plugin.headers.name, enabled: true });
            await plugin.start()
                .catch((e) => {
                    if(!e?.message) return;
                    showErrorMessage(e.message, `Failed to enable plugin ${plugin.headers.name}`);
                });
        } else {
            plugin.stop();
            plugin.enabled = false;
            if(emit) Port.send("pluginToggled", { name: plugin.headers.name, enabled: false });
        }

        if(emit) Rewriter.invalidate();
    }
}