import type { HotkeyTrigger } from "./hotkeys";
import type { ConfigurableHotkeysState, SavedState, State } from "./state";

export type ScriptType = "plugin" | "library";
export type ScriptEdit = { name: string; newName: string; code: string; updated?: boolean };
export type ScriptDelete = { name: string };
export type ScriptCreate = { name: string; code: string };
export type ScriptArrange = { order: string[] };

// These go both ways
export interface StateMessages {
    hotkeyUpdate: { id: string; trigger: HotkeyTrigger };
    hotkeysUpdate: { hotkeys: ConfigurableHotkeysState };

    libraryEdit: ScriptEdit;
    libraryDelete: ScriptDelete;
    libraryDeleteAll: void;
    libraryCreate: ScriptCreate;
    libraryArrange: ScriptArrange;

    pluginEdit: ScriptEdit;
    pluginDelete: ScriptDelete;
    pluginDeleteAll: void;
    pluginCreate: ScriptCreate;
    pluginArrange: ScriptArrange;
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

export interface ScriptTryDelete {
    name: string;
    confirmed?: boolean;
}

export interface OnceMessages {
    getState: void;
    setState: SavedState;
    applyUpdates: { apply: boolean };
    updateAll: void;
    updateSingle: { type: ScriptType; name: string };
    showEditor: { type: ScriptType; name?: string };
    pluginTryDelete: ScriptTryDelete;
    libraryTryDelete: ScriptTryDelete;
    tryDeleteAllLibraries: { confirmed?: boolean };
    tryTogglePlugin: { name: string; enabled: boolean; confirmed?: boolean };
    trySetAllPlugins: { enabled: boolean; confirmed?: boolean };
}

interface ToggleSuccess {
    status: "success";
}
interface ToggleDependencyError {
    status: "dependencyError";
    message: string;
}
interface ToggleDownloadError {
    status: "downloadError";
    message: string;
}
interface ToggleConfirm {
    status: "confirm";
    message: string;
}
type ToggleResult = ToggleSuccess | ToggleDependencyError | ToggleDownloadError | ToggleConfirm;

interface DeleteSuccess {
    status: "success";
}
interface DeleteConfirm {
    status: "confirm";
    message: string;
}
export type DeleteResult = DeleteSuccess | DeleteConfirm;

interface SetAllSuccess {
    status: "success";
}
interface SetAllDependencyError {
    status: "dependencyError";
    scripts: string[];
    message: string;
}
interface SetAllDownloadError {
    status: "downloadError";
    message: string;
}
interface SetAllConfirm {
    status: "confirm";
    scripts: string[];
    message: string;
}
type SetAllResult = SetAllSuccess | SetAllDependencyError | SetAllDownloadError | SetAllConfirm;

export interface OnceResponses {
    getState: State;
    setState: void;
    applyUpdates: void;
    updateAll: string[];
    updateSingle: { updated: boolean; failed?: boolean; version?: string };
    showEditor: void;
    pluginTryDelete: DeleteResult;
    libraryTryDelete: DeleteResult;
    tryDeleteAllLibraries: DeleteResult;
    tryTogglePlugin: ToggleResult;
    trySetAllPlugins: SetAllResult;
}
