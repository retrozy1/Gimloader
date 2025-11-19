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
import Commands from "../commands.svelte";

export default new class PluginManager {
    plugins: Plugin[] = $state([]);
    loaded = Deferred.create();
    destroyed = false;

    async init(pluginInfo: PluginInfo[]) {
        // load plugins from storage
        for(const info of pluginInfo) {
            const pluginObj = new Plugin(info.script, info.enabled);
            this.plugins.push(pluginObj);
        }

        Port.on("pluginEdit", ({ name, script, updated }) => this.editPlugin(name, script, false, updated));
        Port.on("pluginCreate", ({ script }) => this.createPlugin(script, false));
        Port.on("pluginDelete", ({ name }) => this.deletePlugin(name, false));
        Port.on("pluginToggled", ({ name, enabled }) => this.setEnabled(name, enabled, false));
        Port.on("pluginsArrange", ({ order }) => this.arrangePlugins(order, false));
        Port.on("pluginsSetAll", ({ enabled }) => this.setAll(enabled, false));
        Port.on("pluginsDeleteAll", () => this.deleteAll(false));

        const shouldStart = this.plugins.filter(p => p.enabled);
        const results = await Promise.allSettled(shouldStart.map(p => p.start(true)));
        const fails = results.filter(r => r.status === "rejected") as PromiseRejectedResult[];

        if(fails.length > 0) {
            const msg = fails.map(f => f.reason).join("\n");
            showErrorMessage(msg, `Failed to enable ${fails.length} plugin${fails.length > 1 ? "s" : ""}`);
        }

        Commands.addCommand(null, {
            text: "Delete All Plugins",
            keywords: ["remove all", "uninstall all"]
        }, () => this.confirmDeleteAll());
        Commands.addCommand(null, {
            text: "Enable All Plugins",
            keywords: ["turn on all"]
        }, () => this.toastSetAll(true));
        Commands.addCommand(null, {
            text: "Disable All Plugins",
            keywords: ["turn off all"]
        }, () => this.toastSetAll(false));

        this.loaded.resolve();
        log("All plugins loaded");
    }

    updateState(pluginInfo: PluginInfo[]) {
        // check for plugins that were added
        for(const info of pluginInfo) {
            if(!this.getPlugin(info.name)) {
                this.createPlugin(info.script, false);
            }
        }

        // check for plugins that were removed
        for(const plugin of this.plugins) {
            if(!pluginInfo.find(i => i.name === plugin.headers.name)) {
                this.deletePlugin(plugin);
            }
        }

        // check if any scripts were updated
        for(const info of pluginInfo) {
            const plugin = this.getPlugin(info.name);
            if(!plugin) continue;

            if(plugin.script !== info.script) {
                this.editPlugin(plugin, info.script);
            }
        }

        // check if any plugins were enabled/disabled
        for(const info of pluginInfo) {
            const plugin = this.getPlugin(info.name);
            if(!plugin) continue;

            if(plugin.enabled !== info.enabled) {
                if(info.enabled) {
                    plugin.start()
                        .catch((e: Error) => {
                            showErrorMessage(e.message, `Failed to enable plugin ${info.name}`);
                        });
                } else plugin.stop();
            }
        }

        // move the plugins into the correct order
        const newOrder = [];
        for(const info of pluginInfo) {
            const plugin = this.getPlugin(info.name);
            if(plugin) newOrder.push(plugin);
        }

        this.plugins = newOrder;
    }

    getPlugin(name: string) {
        return this.plugins.find(p => p.headers.name === name) ?? null;
    }

    isEnabled(name: string) {
        const plugin = this.getPlugin(name);
        return (plugin?.enabled ?? false) && !plugin?.errored;
    }

    async createPlugin(script: string, emit = true) {
        const headers = parseScriptHeaders(script);

        if(headers.isLibrary !== "false") {
            toast.error("That script doesn't appear to be a plugin! If it should be, please remove the isLibrary header, and if not, please import it as a library.");
            return;
        }

        const existing = this.getPlugin(headers.name);
        if(existing) {
            const conf = confirm(`A plugin named ${headers.name} already exists! Do you want to overwrite it?`);
            if(!conf) return;

            this.deletePlugin(existing);
        }

        const plugin = new Plugin(script, true);
        this.plugins.unshift(plugin);

        if(emit) {
            if(Storage.settings.autoDownloadMissingLibs) {
                const res = await Port.sendAndRecieve("downloadLibraries", { libraries: headers.needsLib });
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
        const plugin = typeof name === "string" ? this.getPlugin(name) : name;
        if(!plugin) return;

        plugin.stop();
        plugin.onDelete();
        this.plugins = this.plugins.filter(p => p !== plugin);

        if(emit) {
            Port.send("pluginDelete", { name: plugin.headers.name });
            Rewriter.invalidate();
        }

        Storage.deletePluginStorage(plugin.headers.name);
        log(`Deleted plugin: ${plugin.headers.name}`);
    }

    deleteAll(emit = true) {
        for(const plugin of this.plugins) this.deletePlugin(plugin, false);
        this.plugins = [];

        if(emit) {
            Port.send("pluginsDeleteAll");
            Rewriter.invalidate();
        }
    }

    setAll(enabled: boolean, emit = true) {
        if(emit) Port.send("pluginsSetAll", { enabled });

        const togglePlugins = this.plugins.filter(p => p.enabled !== enabled);
        for(const plugin of togglePlugins) plugin.setEnabled(enabled);

        if(enabled) {
            Promise.allSettled(togglePlugins.map(p => p.start()))
                .then(results => {
                    const fails = results.filter(r => r.status === "rejected") as PromiseRejectedResult[];
                    if(fails.length > 0) {
                        const msg = fails.map(f => f.reason).join("\n");
                        showErrorMessage(msg, `Failed to enable ${results.length} plugin${results.length > 1 ? "s" : ""}`);
                    }
                });
        } else {
            for(const plugin of togglePlugins) {
                plugin.stop();
            }
        }

        if(emit) Rewriter.invalidate();
        return togglePlugins.length;
    }

    getExports(pluginName: string) {
        const plugin = this.plugins.find(lib => lib.headers.name === pluginName);
        return plugin?.exported ?? null;
    }

    getHeaders(pluginName: string) {
        const plugin = this.plugins.find(lib => lib.headers.name === pluginName);
        if(!plugin.headers) return null;
        return $state.snapshot(plugin.headers);
    }

    getPluginNames(): string[] {
        return this.plugins.map(p => p.headers.name);
    }

    async editPlugin(name: Plugin | string, script: string, emit = true, updated = false) {
        const plugin = typeof name === "string" ? this.getPlugin(name) : name;
        if(!plugin) return;

        const headers = parseScriptHeaders(script);
        if(updated && headers.changelog.length > 0) {
            Modals.addUpdated(headers.name, headers.version, headers.changelog);
        }

        if(plugin.enabled) plugin.stop();

        // message other windows
        if(emit) {
            if(Storage.settings.autoDownloadMissingLibs) {
                const res = await Port.sendAndRecieve("downloadLibraries", { libraries: headers.needsLib });
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
        const newOrder = [];

        for(const name of order) {
            const plugin = this.getPlugin(name);
            if(plugin) newOrder.push(plugin);
        }
        this.plugins = newOrder;

        if(emit) Port.send("pluginsArrange", { order });
    }

    async setEnabled(name: Plugin | string, enabled: boolean, emit = true) {
        const plugin = typeof name === "string" ? this.getPlugin(name) : name;
        if(!plugin) return;

        if(enabled) {
            plugin.setEnabled(true);
            if(emit) Port.send("pluginToggled", { name: plugin.headers.name, enabled: true });
            await plugin.start()
                .catch((e) => {
                    if(!e?.message) return;
                    showErrorMessage(e.message, `Failed to enable plugin ${plugin.headers.name}`);
                });
        } else {
            plugin.stop();
            plugin.setEnabled(false);
            if(emit) Port.send("pluginToggled", { name: plugin.headers.name, enabled: false });
        }

        if(emit) Rewriter.invalidate();
    }

    confirmDeleteAll(shouldToast = true) {
        if(this.plugins.length === 0) {
            toast.error("No plugins to delete");
            return;
        }

        if(!confirm("Are you sure you want to delete all plugins?")) return;

        this.deleteAll();
        if(shouldToast) toast.success("Deleted all plugins");
    }

    toastSetAll(enabled: boolean) {
        const changed = this.setAll(enabled);
        const action = enabled ? "Enabled" : "Disabled";
        toast.success(`${action} ${changed} plugin${changed !== 1 ? "s" : ""}`);
    }
}();
