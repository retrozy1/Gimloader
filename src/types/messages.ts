import type { HotkeyTrigger } from "./hotkeys";
import type { ConfigurableHotkeysState, SavedState, State } from "./state";

export type ScriptType = "plugin" | "library";

// These go both ways
export interface StateMessages {
    hotkeyUpdate: { id: string; trigger: HotkeyTrigger };
    hotkeysUpdate: { hotkeys: ConfigurableHotkeysState };

    libraryEdit: { name: string; newName: string; code: string; updated?: boolean };
    libraryDelete: { name: string };
    libraryDeleteAll: void;
    libraryCreate: { name: string; code: string };
    libraryArrange: { order: string[] };

    pluginEdit: { name: string; newName: string; code: string; updated?: boolean };
    pluginDelete: { name: string };
    pluginDeleteAll: void;
    pluginCreate: { name: string; code: string };
    pluginArrange: { order: string[] };
    pluginToggled: { name: string; enabled: boolean };
    pluginSetAll: { enabled: boolean };

    settingUpdate: { key: string; value: any };

    pluginValueUpdate: { id: string; key: string; value: string };
    pluginValueDelete: { id: string; key: string };
    pluginSettingUpdate: { id: string; key: string; value: string };
    clearPluginStorage: { id: string };

    cacheInvalid: { invalid: boolean };
}

// These only go from the background to content
export interface Messages extends StateMessages {
    setState: SavedState;
    toast: { type: "success" | "error" | "normal"; message: string };
    availableUpdates: string[];
}

export interface OnceMessages {
    getState: void;
    setState: SavedState;
    downloadLibraries: { libraries: string[] };
    applyUpdates: { apply: boolean };
    updateAll: void;
    updateSingle: { type: ScriptType; name: string };
    showEditor: { type: ScriptType; name?: string };
}

export interface OnceResponses {
    getState: State;
    setState: void;
    downloadLibraries: { allDownloaded: boolean; error?: string };
    applyUpdates: void;
    updateAll: string[];
    updateSingle: { updated: boolean; failed?: boolean; version?: string };
    showEditor: void;
}
