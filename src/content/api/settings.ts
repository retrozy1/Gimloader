import type { Plugin } from "$core/scripts/scripts.svelte";
import type { PluginSetting, PluginSettings, SettingGroup, SettingsMethods } from "$types/settings";
import { error } from "$content/utils";
import Storage from "$core/storage.svelte";
import { showPluginSettings } from "$content/ui/mount";

function applyDefaults(id: string, settings: (PluginSetting | SettingGroup)[]) {
    for(let setting of settings) {
        if(setting.type === "group") {
            applyDefaults(id, setting.settings);
            continue;
        }

        if(Storage.pluginSettings[id][setting.id] !== undefined) continue;

        let defaultValue: any = null;
        if(setting.default !== undefined) defaultValue = setting.default;
        else if(setting.type === "dropdown") defaultValue = setting.allowNone ? null : setting.options[0].value;
        else if(setting.type === "multiselect") defaultValue = [];
        else if(setting.type === "number" || setting.type === "slider") defaultValue = setting.min ?? 0;
        else if(setting.type === "toggle") defaultValue = false;
        else if(setting.type === "text") defaultValue = "";
        else if(setting.type === "radio") defaultValue = setting.options[0].value;
        else if(setting.type === "color") defaultValue = setting.rgba ? "rgba(255,0,0,1)" : "#ff0000";

        Storage.pluginSettings[id][setting.id] = defaultValue;
    }
}

function registerListeners(id: string, settings: (PluginSetting | SettingGroup)[]) {
    for(let setting of settings) {
        if(setting.type === "group") {
            registerListeners(id, setting.settings);
            continue;
        }

        if(!setting.onChange) continue;
        Storage.onPluginSettingUpdate(id, setting.id, setting.onChange);
    }
}

export default function createSettingsApi(plugin: Plugin): PluginSettings {
    const id = plugin.headers.name;

    const methods: SettingsMethods = {
        create(description) {
            plugin.settingsDescription = description;
            plugin.openSettingsMenu.push(() => showPluginSettings(plugin));
            
            Storage.pluginSettings[id] ??= {};
            applyDefaults(id, description);
            registerListeners(id, description);            
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

            Storage.setPluginSetting(id, prop, value);
            return true;
        }
    });

    return settings;
}