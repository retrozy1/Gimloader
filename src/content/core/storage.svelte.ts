import { splicer } from "$content/utils";
import { defaultSettings } from "$shared/consts";
import Port from "$shared/port.svelte";
import type { StateMessages } from "$types/messages";
import type { PluginStorage, Settings } from "$types/state";
import EventEmitter2 from "eventemitter2";

/** @inline */
export type ValueChangeCallback = (value: any, remote: boolean) => void;

interface ValueChangeListener {
    id: string;
    key: string;
    callback: ValueChangeCallback;
}

export default new class Storage extends EventEmitter2 {
    settings: Settings = $state(defaultSettings);
    values: PluginStorage;
    updateListeners: ValueChangeListener[] = [];

    init(values: PluginStorage, settings: Settings) {
        this.values = values;
        this.settings = settings;

        if(this.settings.showPluginButtons) {
            document.documentElement.classList.remove("noPluginButtons");
        }

        Port.on("settingUpdate", ({ key, value }) => this.updateSetting(key, value, false));
        Port.on("pluginValueUpdate", ({ id, key, value }) => this.setPluginValue(id, key, value, false));
        Port.on("pluginValueDelete", ({ id, key }) => this.deletePluginValue(id, key, false));
        Port.on("pluginValuesDelete", ({ id }) => this.deletePluginValues(id, false));
    }

    updateState(values: PluginStorage, settings: Settings) {
        this.values = values;
        this.settings = settings;

        document.documentElement.classList.toggle("noPluginButtons", !this.settings.showPluginButtons);
    }

    updateSetting<K extends keyof Settings>(key: K, value: Settings[K], emit = true) {        
        this.settings[key] = value;
        if(emit) {
            let payload = { key, value };
            Port.send("settingUpdate", payload as StateMessages['settingUpdate']);
        }
        else this.emit(key, value);

        switch(key) {
            case "showPluginButtons":
                document.documentElement.classList.toggle("noPluginButtons", !value);
                break;
        }
    }

    getPluginValue<T = unknown>(id: string, key: string, defaultVal?: T) {
        let val: T = this.values[id]?.[key];
        if(val !== undefined) return val;
        return defaultVal ?? null;
    }
    
    setPluginValue<T = unknown>(id: string, key: string, value: T, emit = true) {
        if(!this.values[id]) this.values[id] = {};
        this.values[id][key] = value;

        for(let listener of this.updateListeners) {
            if(listener.id === id && listener.key === key) {
                // if we are emitting it's not remote, and vice versa
                listener.callback(value, !emit);
            }
        }

        if(emit) Port.send("pluginValueUpdate", { id, key, value });
    }

    deletePluginValue(id: string, key: string, emit = true) {
        let plugin = this.values[id];
        if(!plugin) return;
        delete plugin[key];
        if(emit) Port.send("pluginValueDelete", { id, key });
    }
    
    deletePluginValues(id: string, emit = true) {
        delete this.values[id];
        if(emit) Port.send("pluginValuesDelete", { id });
    }

    onPluginValueUpdate(id: string, key: string, callback: ValueChangeCallback) {
        let obj: ValueChangeListener = { id, key, callback };
        this.updateListeners.push(obj);

        return splicer(this.updateListeners, obj);
    }

    offPluginValueUpdate(id: string, key: string, callback: ValueChangeCallback) {
        for(let i = 0; i < this.updateListeners.length; i++) {
            let listener = this.updateListeners[i];
            if(listener.id === id && listener.key === key && listener.callback === callback) {
                this.updateListeners.splice(i, 1);
                return;
            }
        }
    }

    removeUpdateListeners(id: string) {
        for(let i = 0; i < this.updateListeners.length; i++) {
            if(this.updateListeners[i].id === id) {
                this.updateListeners.splice(i, 1);
                i--;
            }
        }
    }
}