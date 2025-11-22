import type { ScriptType } from "$types/messages";
import type { ScriptHeaders } from "$types/scripts";
import type { PluginSettingsDescription } from "$types/settings";
import type { PluginInfo } from "$types/state";
import { englishList } from "$content/utils";
import Port from "$shared/net/port.svelte";
import { Script } from "./script.svelte";

export class Plugin extends Script<PluginInfo> {
    type: ScriptType = "plugin";
    warnAbout = true;
    enabled: boolean = $state();
    openSettingsMenu: (() => void)[] = [];
    settingsDescription?: PluginSettingsDescription;

    constructor(info: PluginInfo, headers?: ScriptHeaders) {
        // The initial plugin.start call is handled externally
        super(info, headers);
        this.enabled = info.enabled;
    }

    getDependencyStrings() {
        return {
            plugin: {
                required: this.headers.needsPlugin
            },
            library: {
                required: this.headers.needsLib,
                optional: this.headers.optionalLib
            }
        }
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        Port.send("pluginToggled", { name: this.headers.name, enabled });
    }

    onDependentStopped() {
        this.setEnabled(false);
    }

    stop() {
        super.stop();

        this.openSettingsMenu = [];
    }

    onImport(exports: any) {
        if(exports.openSettingsMenu && typeof exports.openSettingsMenu === "function") {
            this.openSettingsMenu.push(exports.openSettingsMenu);
        }
    }

    async toggleConfirm(enabled: boolean) {
        if(enabled) await this.enableConfirm();
        else this.disableConfirm();
    }

    async toggle(enabled: boolean) {
        Port.send("pluginToggled", { name: this.headers.name, enabled });
        await this.onToggled(enabled);
    }
    
    async onToggled(enabled: boolean) {
        this.enabled = enabled;

        if(enabled) await this.start(false);
        else this.stop();
    }

    async enableConfirm() {
        const willEnable = new Set<Plugin>();

        // Recursively get the plugins that will be enabled
        const getWillEnable = (plugin: Plugin) => {
            const deps = plugin.getDependencies();
            const pluginDeps = deps.required.filter(d => d instanceof Plugin);

            for(const dep of pluginDeps) {
                if(willEnable.has(dep) || dep.enabled) continue;
                willEnable.add(dep);
                getWillEnable(dep);
            }
        }
        getWillEnable(this);

        if(willEnable.size > 0) {
            // TODO: Actual prompt
            const names = englishList(Array.from(willEnable).map(p => p.headers.name));
            if(!confirm(`Enabling ${this.headers.name} will also enable ${names}. Proceed?`)) return false;
            
            for(let plugin of willEnable) {
                plugin.toggle(true);
            }
        }

        this.setEnabled(true);
        this.start(false);
        return true;
    }

    disableConfirm() {
        this.stopConfirm();
        this.setEnabled(false);
    }
}