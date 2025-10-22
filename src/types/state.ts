import type { HotkeyTrigger } from "./hotkeys";

export interface Gamemodes {
    official?: Set<string>;
    creative?: {
        // This allows users to switch back
        mode: "whitelist" | "blacklist" | "all";
        whitelist: string[];
        blacklist: string[];
    };
}

export interface PluginInfo {
    script: string;
    name: string;
    enabled: boolean;
    gamemodes?: Gamemodes;
}

export interface LibraryInfo {
    script: string;
    name: string;
}

export type ScriptInfo = PluginInfo | LibraryInfo;

export type PluginStorage = Record<string, Record<string, any>>

export type ConfigurableHotkeysState = Record<string, HotkeyTrigger | null>;

export interface Settings {
    pollerEnabled: boolean;
    autoUpdate: boolean;
    autoDownloadMissingLibs: boolean;
    menuView: 'grid' | 'list';
    showPluginButtons: boolean;
}

export interface SavedState {
    plugins: PluginInfo[];
    libraries: LibraryInfo[];
    pluginStorage: PluginStorage;
    settings: Settings;
    hotkeys: ConfigurableHotkeysState;
    cacheInvalid: boolean;
}

export interface State extends SavedState {
    availableUpdates: string[];
}