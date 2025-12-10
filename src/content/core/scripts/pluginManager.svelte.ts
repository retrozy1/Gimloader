import ScriptManager from "./scriptManager.svelte";
import { Plugin } from "./plugin.svelte";
import Port from "$shared/net/port.svelte";
import { Deferred } from "$content/utils";
import type { PluginInfo } from "$types/state";
import Modals from "../modals.svelte";
import { parseScriptHeaders } from "$shared/parseHeader";

export default new class PluginManager extends ScriptManager<Plugin, PluginInfo> {
    singular = "plugin";
    plural = "plugins";
    loaded = Deferred.create();

    constructor() {
        super(Plugin, "plugin");

        Port.on("pluginCreate", (info) => this.onCreate(info));
        Port.on("pluginSetAll", ({ enabled }) => this.onSetAll(enabled));
        Port.on("pluginToggled", ({ name, enabled }) => this.onToggled(name, enabled));
    }

    async init(info: PluginInfo[]) {
        super.init(info);

        const toRun = this.scripts.filter(p => p.enabled);
        await Promise.allSettled(toRun.map(p => p.onToggled(true)));

        this.loaded.resolve();
    }

    isEnabled(name: string) {
        const script = this.getScript(name);
        if(!script) return false;

        return script.enabled;
    }

    async setAllConfirm(enabled: boolean, confirmed = false) {
        const response = await Port.sendAndRecieve("trySetAllPlugins", {
            enabled,
            confirmed
        });

        switch (response.status) {
            case "dependencyError": {
                const scripts = response.scripts.map(s => this.getScript(s));
                const title = scripts.length > 1 ? "Could not enable some plugins" : `Could not enable ${scripts[0].headers.name}`;

                Modals.open("dependency", {
                    script: scripts,
                    type: "error",
                    title
                });
                return false;
            }
            case "downloadError":
                Modals.open("error", {
                    text: response.message,
                    title: "Download Error"
                });
                return false;
            case "confirm": {
                const scripts = response.scripts.map(s => this.getScript(s));
                const title = "Dependencies need to be downloaded";

                const confirmed = await Modals.open("dependency", {
                    script: scripts,
                    type: "confirm",
                    title
                });
                if(!confirmed) return;

                this.setAllConfirm(enabled, true);
                return;
            }
        }
    }

    setAll(enabled: boolean) {
        this.onSetAll(enabled);
        Port.send("pluginSetAll", { enabled });
    }

    onSetAll(enable: boolean) {
        const toSet = this.scripts.filter(p => p.enabled !== enable);
        for(const plugin of toSet) plugin.onToggled(enable);
    }

    onToggled(name: string, enabled: boolean) {
        const plugin = this.getScript(name);
        if(!plugin) return;

        plugin.onToggled(enabled);
    }

    async create(code: string) {
        const headers = parseScriptHeaders(code);
        const info = { name: headers.name, code, enabled: false };
        const created = this.onCreate(info);

        // Create it disabled and enable it to 
        Port.send("pluginCreate", info);
        created.toggleConfirm(true);

        return created;
    }

    onCreate(info: PluginInfo) {
        const plugin = super.onCreate(info);
        if(info.enabled) plugin.start(false);

        return plugin;
    }
}();
