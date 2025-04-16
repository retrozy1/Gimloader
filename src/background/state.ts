import type { ConfigurableHotkeysState, CustomServerConfig, LibraryInfo, PluginInfo, PluginStorage,
    SavedState, ScriptInfo, Settings, State } from "$types/state";
import { defaultCustomServerConfig, defaultSettings } from "$shared/consts";
import debounce from "debounce";

export let statePromise = new Promise<State>(async (res) => {
    let savedState = await chrome.storage.local.get<SavedState>({
        plugins: [],
        libraries: [],
        pluginStorage: {},
        settings: defaultSettings,
        hotkeys: {},
        customServer: defaultCustomServerConfig
    });

    res({
        plugins: sanitizePlugins(savedState.plugins),
        libraries: sanitizeLibraries(savedState.libraries),
        pluginStorage: sanitizePluginStorage(savedState.pluginStorage),
        settings: sanitizeSettings(savedState.settings),
        hotkeys: sanitizeHotkeys(savedState.hotkeys),
        customServer: sanitizeCustomServer(savedState.customServer),
        availableUpdates: []
    });
});

let debounced: Record<string, () => void> = {};

export function saveDebounced(key: keyof SavedState) {
    // debounce just to be safe
    if(!debounced[key]) {
        debounced[key] = debounce(async () => {
            chrome.storage.local.set({ [key]: (await statePromise)[key] })
        }, 100);
    }

    debounced[key]();
}

export function sanitizeScriptInfo(scripts: PluginInfo[], needsEnabled: true): PluginInfo[];
export function sanitizeScriptInfo(scripts: LibraryInfo[], needsEnabled: false): LibraryInfo[];
export function sanitizeScriptInfo(scripts: ScriptInfo[], needsEnabled: boolean) {
    if(!Array.isArray(scripts)) return [];

    for(let i = 0; i < scripts.length; i++) {
        let item = scripts[i];
        if(
            typeof item.name !== "string" ||
            typeof item.script !== "string" ||
            (needsEnabled && typeof (item as PluginInfo).enabled !== "boolean")
        ) {
            scripts.splice(i, 1);
            i--;
            continue;
        };

        scripts[i] = { name: item.name, script: item.script };
        if(needsEnabled) (scripts[i] as PluginInfo).enabled = (item as PluginInfo).enabled;
    }

    // remove duplicates
    for(let i = 0; i < scripts.length - 1; i++) {
        for(let j = i + 1; j < scripts.length; j++) {
            if(scripts[j].name === scripts[i].name) {
                scripts.splice(j, 1);
                j--;
            }
        }
    }

    return scripts;
}

export function sanitizePlugins(plugins: PluginInfo[]) {
    return sanitizeScriptInfo(plugins, true);
}

export function sanitizeLibraries(libraries: LibraryInfo[]) {
    return sanitizeScriptInfo(libraries, false);
}

export function sanitizePluginStorage(storage: PluginStorage) {
    if(typeof storage !== "object" || storage === null) return {};

    for(let key in storage) {
        if(typeof storage[key] !== "object" || storage[key] === null) {
            delete storage[key];
        }
    }

    return storage;
}

export function sanitizeHotkeys(hotkeys: ConfigurableHotkeysState) {
    if(typeof hotkeys !== "object" || hotkeys === null) return {};

    for(let id in hotkeys) {
        const invalidate = () => delete hotkeys[id];

        // null is allowed, it's an unbound hotkey
        if(typeof hotkeys[id] !== "object") { invalidate(); continue; }
        if(hotkeys[id] === null) continue;

        let { key, keys, ctrl, shift, alt } = hotkeys[id];

        if(!key && !keys) { invalidate(); continue; }
        if(key && keys) keys = undefined;

        if(key) {
            if(typeof key !== "string") { invalidate(); continue; }
        } else {
            if(!Array.isArray(keys)) { invalidate(); continue; }

            for(let i = 0; i < keys.length; i++) {
                if(typeof keys[i] !== "string") {
                    keys.splice(i, 1);
                    i--;
                }
            }

            if(keys.length === 0) { invalidate(); continue; }
        }

        if(typeof ctrl !== "boolean") ctrl = undefined;
        if(typeof shift !== "boolean") shift = undefined;
        if(typeof alt !== "boolean") alt = undefined;
        
        hotkeys[id] = { key, keys, ctrl, shift, alt };
    }

    return hotkeys;
}

export function copyOverDefault<T extends Record<string, any>>(obj: T, defaultVal: T): T {
    let newObj = Object.assign({}, defaultVal);
    if(typeof obj !== "object" || obj === null) return newObj;

    for(let key in defaultVal) {
        if(typeof obj[key] === typeof defaultVal[key]) {
            newObj[key] = obj[key];
        }
    }

    return newObj;
}

export function sanitizeSettings(settings: Settings) {
    let newSettings = copyOverDefault(settings, defaultSettings);

    // make sure menu view is either "grid" or "list"
    if(newSettings.menuView !== "grid" && newSettings.menuView !== "list") {
        newSettings.menuView = "grid";
    }

    return newSettings;
}

export function sanitizeCustomServer(config: CustomServerConfig) {
    if(typeof config !== "object" || config === null) return defaultCustomServerConfig;
    
    if(Array.isArray(config.servers)) {
        for(let i = 0; i < config.servers.length; i++) {
            let server = config.servers[i];
            if(typeof server.address !== "string" || typeof server.id !== "string"
                || typeof server.name !== "string" || typeof server.port !== "number") {
                config.servers.splice(i, 1);
                i--;
            }
        }
    } else {
        config.servers = [];
    }

    if(config.servers.length === 0) {
        config.selected = null;
    } else if(config.selected !== null) {
        if(typeof config.selected !== "number" || config.selected < 0 || config.selected >= config.servers.length) {
            config.selected = 0;
        }
    }
    if(typeof config.enabled !== "boolean") config.enabled = false;

    return config;
}