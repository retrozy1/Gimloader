import type { Plugin } from "$core/scripts/scripts.svelte";
import type { PluginSettings, SettingsMethods } from "$types/settings";
import { error } from "$content/utils";
import Storage from "$core/storage.svelte";
import { showPluginSettings } from "$content/ui/showModals";

export default function createSettingsApi(plugin: Plugin): PluginSettings {
    const id = plugin.headers.name;

    const methods: SettingsMethods = {
        create(description) {
            plugin.settingsDescription = description;
            plugin.openSettingsMenu.push(() => showPluginSettings(plugin));
        },
        listen(key, callback) {
            return Storage.onPluginSettingUpdate(id, key, callback);   
        }
    }

    const settings = new Proxy(methods, {
        get(target, prop, receiver) {
            if(typeof prop !== "string") return null;

            const method = Reflect.get(target, prop, receiver);
            if(method) return method;

            return Storage.pluginSettings[id]?.[prop] ?? null;
        },
        set(target, prop, value) {
            if(typeof prop !== "string") return false;
            if(prop in methods) {
                error(`settings.${prop} is reserved and cannot be set`);
                return false;
            }

            if(!Storage.pluginSettings[id]) Storage.pluginSettings[id] = {};
            Storage.pluginSettings[id][prop] = value;
            return true;
        }
    });

    return settings;
}