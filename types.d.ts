declare module "src/types/hotkeys" {
    /** @inline */
    export interface HotkeyTrigger {
        /** Should be a keyboardevent [code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) */
        key?: string;
        /** Should be keyboardevent [codes](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) */
        keys?: string[];
        ctrl?: boolean;
        shift?: boolean;
        alt?: boolean;
    }
    /** @inline */
    export interface HotkeyOptions extends HotkeyTrigger {
        preventDefault?: boolean;
    }
    /** @inline */
    export interface ConfigurableHotkeyOptions {
        category: string;
        /** There should be no duplicate titles within a category */
        title: string;
        preventDefault?: boolean;
        default?: HotkeyTrigger;
    }
    export type HotkeyCallback = (e: KeyboardEvent) => void;
}
declare module "src/types/state" {
    import type { HotkeyTrigger } from "src/types/hotkeys";
    export interface PluginInfo {
        script: string;
        name: string;
        enabled: boolean;
    }
    export interface LibraryInfo {
        script: string;
        name: string;
    }
    export type ScriptInfo = PluginInfo | LibraryInfo;
    export type PluginStorage = Record<string, Record<string, any>>;
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
}
declare module "src/content/core/hotkeys/configurable.svelte" {
    import type { ConfigurableHotkeyOptions, HotkeyCallback, HotkeyTrigger } from "src/types/hotkeys";
    export default class ConfigurableHotkey {
        id: string;
        category: string;
        title: string;
        preventDefault: boolean;
        callback: HotkeyCallback;
        trigger: HotkeyTrigger | null;
        default?: HotkeyTrigger;
        pluginName?: string;
        constructor(id: string, callback: HotkeyCallback, options: ConfigurableHotkeyOptions, pluginName?: string);
        loadTrigger(): void;
        reset(): void;
    }
}
declare module "src/shared/consts" {
    import type { Settings } from "src/types/state";
    export const isFirefox: boolean;
    export const algorithm: HmacKeyGenParams;
    export const defaultSettings: Settings;
    export const flipDurationMs = 300;
}
declare module "src/types/messages" {
    import type { HotkeyTrigger } from "src/types/hotkeys";
    import type { ConfigurableHotkeysState, SavedState, State } from "src/types/state";
    export interface StateMessages {
        hotkeyUpdate: {
            id: string;
            trigger: HotkeyTrigger;
        };
        hotkeysUpdate: {
            hotkeys: ConfigurableHotkeysState;
        };
        libraryEdit: {
            name: string;
            newName: string;
            script: string;
        };
        libraryDelete: {
            name: string;
        };
        librariesDeleteAll: void;
        libraryCreate: {
            name: string;
            script: string;
        };
        librariesArrange: {
            order: string[];
        };
        pluginEdit: {
            name: string;
            newName: string;
            script: string;
        };
        pluginDelete: {
            name: string;
        };
        pluginsDeleteAll: void;
        pluginCreate: {
            name: string;
            script: string;
        };
        pluginsArrange: {
            order: string[];
        };
        pluginToggled: {
            name: string;
            enabled: boolean;
        };
        pluginsSetAll: {
            enabled: boolean;
        };
        settingUpdate: {
            key: string;
            value: any;
        };
        pluginValueUpdate: {
            id: string;
            key: string;
            value: string;
        };
        pluginValueDelete: {
            id: string;
            key: string;
        };
        pluginValuesDelete: {
            id: string;
        };
        cacheInvalid: {
            invalid: boolean;
        };
    }
    export interface Messages extends StateMessages {
        setState: SavedState;
        toast: {
            type: "success" | "error" | "normal";
            message: string;
        };
        availableUpdates: string[];
    }
    export interface OnceMessages {
        getState: void;
        setState: SavedState;
        downloadLibraries: {
            libraries: string[];
        };
        applyUpdates: {
            apply: boolean;
        };
        updateAll: void;
        updateSingle: {
            type: "plugin" | "library";
            name: string;
        };
        showEditor: {
            type: "plugin" | "library";
            name?: string;
        };
    }
    export interface OnceResponses {
        getState: State;
        setState: void;
        downloadLibraries: {
            allDownloaded: boolean;
            error?: string;
        };
        applyUpdates: void;
        updateAll: string[];
        updateSingle: {
            updated: boolean;
            failed?: boolean;
            version?: string;
        };
        showEditor: void;
    }
}
declare module "src/shared/port.svelte" {
    import type { State } from "src/types/state";
    import type { Messages, OnceMessages, StateMessages } from "src/types/messages";
    type StateCallback = (state: State) => void;
    const _default: {
        port: chrome.runtime.Port;
        firstMessage: boolean;
        firstState: boolean;
        firstCallback: StateCallback;
        subsequentCallback?: StateCallback;
        disconnected: boolean;
        pendingMessages: Map<string, (response?: any) => void>;
        runtime: typeof chrome.runtime;
        signKeyRes: (key: CryptoKey) => void;
        signKey: Promise<CryptoKey>;
        name?: string;
        init(callback: StateCallback, subsequentCallback?: StateCallback, name?: string): void;
        connectPort(): void;
        postMessage(type: string, message: any, returnId?: string): Promise<void>;
        onMessage(data: any): void;
        send<Channel extends keyof StateMessages>(type: Channel, message?: StateMessages[Channel]): void;
        sendAndRecieve<Channel extends keyof OnceMessages>(type: Channel, message?: OnceMessages[Channel]): Promise<any>;
        keepBackgroundAlive(): void;
        emit<Channel extends keyof StateMessages>(channel: Channel, value: StateMessages[Channel]): boolean;
        on<Channel extends keyof Messages>(channel: Channel, callback: (value: Messages[Channel]) => void): /*elided*/ any | import("eventemitter2").Listener;
        emitAsync(event: import("eventemitter2").event | import("eventemitter2").eventNS, ...values: any[]): Promise<any[]>;
        addListener(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn): /*elided*/ any | import("eventemitter2").Listener;
        prependListener(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn, options?: boolean | import("eventemitter2").OnOptions): /*elided*/ any | import("eventemitter2").Listener;
        once(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn, options?: true | import("eventemitter2").OnOptions): /*elided*/ any | import("eventemitter2").Listener;
        prependOnceListener(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn, options?: boolean | import("eventemitter2").OnOptions): /*elided*/ any | import("eventemitter2").Listener;
        many(event: import("eventemitter2").event | import("eventemitter2").eventNS, timesToListen: number, listener: import("eventemitter2").ListenerFn, options?: boolean | import("eventemitter2").OnOptions): /*elided*/ any | import("eventemitter2").Listener;
        prependMany(event: import("eventemitter2").event | import("eventemitter2").eventNS, timesToListen: number, listener: import("eventemitter2").ListenerFn, options?: boolean | import("eventemitter2").OnOptions): /*elided*/ any | import("eventemitter2").Listener;
        onAny(listener: import("eventemitter2").EventAndListener): /*elided*/ any;
        prependAny(listener: import("eventemitter2").EventAndListener): /*elided*/ any;
        offAny(listener: import("eventemitter2").ListenerFn): /*elided*/ any;
        removeListener(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn): /*elided*/ any;
        off(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn): /*elided*/ any;
        removeAllListeners(event?: import("eventemitter2").event | import("eventemitter2").eventNS): /*elided*/ any;
        setMaxListeners(n: number): void;
        getMaxListeners(): number;
        eventNames(nsAsArray?: boolean): (import("eventemitter2").event | import("eventemitter2").eventNS)[];
        listenerCount(event?: import("eventemitter2").event | import("eventemitter2").eventNS): number;
        listeners(event?: import("eventemitter2").event | import("eventemitter2").eventNS): import("eventemitter2").ListenerFn[];
        listenersAny(): import("eventemitter2").ListenerFn[];
        waitFor(event: import("eventemitter2").event | import("eventemitter2").eventNS, timeout?: number): import("eventemitter2").CancelablePromise<any[]>;
        waitFor(event: import("eventemitter2").event | import("eventemitter2").eventNS, filter?: import("eventemitter2").WaitForFilter): import("eventemitter2").CancelablePromise<any[]>;
        waitFor(event: import("eventemitter2").event | import("eventemitter2").eventNS, options?: import("eventemitter2").WaitForOptions): import("eventemitter2").CancelablePromise<any[]>;
        listenTo(target: import("eventemitter2").GeneralEventEmitter, events: import("eventemitter2").event | import("eventemitter2").eventNS, options?: import("eventemitter2").ListenToOptions): /*elided*/ any;
        listenTo(target: import("eventemitter2").GeneralEventEmitter, events: import("eventemitter2").event[], options?: import("eventemitter2").ListenToOptions): /*elided*/ any;
        listenTo(target: import("eventemitter2").GeneralEventEmitter, events: Object, options?: import("eventemitter2").ListenToOptions): /*elided*/ any;
        stopListeningTo(target?: import("eventemitter2").GeneralEventEmitter, event?: import("eventemitter2").event | import("eventemitter2").eventNS): Boolean;
        hasListeners(event?: String): Boolean;
    };
    export default _default;
}
declare module "src/content/utils" {
    export function log(...args: any[]): void;
    export function error(...args: any[]): void;
    export function validate(fnName: string, args: IArguments, ...schema: [string, string | object][]): boolean;
    export function splicer(array: any[], obj: any): () => void;
    export function overrideKeydown(callback: (e: KeyboardEvent) => void): void;
    export function stopOverrideKeydown(): void;
    export function readUserFile(accept: string, callback: (text: string) => void): void;
    export function showEditor(type: "plugin" | "library", name?: string): void;
    export const domLoaded: Promise<void>;
    export class Deferred<T = void> extends Promise<T> {
        resolve: (value?: T) => void;
        reject: (reason?: any) => void;
        constructor(callback: any);
        static create<T = void>(): Deferred<T>;
    }
}
declare module "src/content/core/hotkeys/hotkeys.svelte" {
    import type { ConfigurableHotkeyOptions, HotkeyCallback, HotkeyOptions, HotkeyTrigger } from "src/types/hotkeys";
    import type { ConfigurableHotkeysState } from "src/types/state";
    import ConfigurableHotkey from "src/content/core/hotkeys/configurable.svelte";
    type DefaultHotkey = HotkeyOptions & {
        callback: HotkeyCallback;
        id: string;
    };
    const _default_1: {
        hotkeys: DefaultHotkey[];
        configurableHotkeys: ConfigurableHotkey[];
        pressedKeys: Set<string>;
        pressed: Set<string>;
        savedHotkeys: ConfigurableHotkeysState;
        init(saved: ConfigurableHotkeysState): void;
        updateState(saved: ConfigurableHotkeysState): void;
        addHotkey(id: any, options: HotkeyOptions, callback: HotkeyCallback): () => void;
        removeHotkeys(id: any): void;
        addConfigurableHotkey(id: string, options: ConfigurableHotkeyOptions, callback: HotkeyCallback, pluginName?: string): () => void;
        removeConfigurableHotkey(id: string): void;
        removeConfigurableFromPlugin(pluginName: string): void;
        releaseAll(): void;
        checkHotkeys(e: KeyboardEvent): void;
        checkTrigger(e: KeyboardEvent, trigger: HotkeyTrigger): boolean;
        saveConfigurable(id: string, trigger: HotkeyTrigger | null): void;
        saveAllConfigurable(): void;
        updateConfigurable(id: string, trigger: HotkeyTrigger | null): void;
        updateAllConfigurable(hotkeys: ConfigurableHotkeysState): void;
    };
    export default _default_1;
}
declare module "src/content/api/hotkeys" {
    import type { HotkeyOptions, ConfigurableHotkeyOptions } from "src/types/hotkeys";
    interface OldConfigurableOptions {
        category: string;
        title: string;
        preventDefault?: boolean;
        defaultKeys?: Set<string>;
    }
    /** @inline */
    type KeyboardCallback = (e: KeyboardEvent) => void;
    class BaseHotkeysApi {
        /**
         * Releases all keys, needed if a hotkey opens something that will
         * prevent keyup events from being registered, such as an alert
         */
        releaseAll(): void;
        /** Which key codes are currently being pressed */
        get pressed(): Set<string>;
        /**
         * @deprecated Use {@link pressed} instead
         * @hidden
         */
        get pressedKeys(): Set<string>;
    }
    class HotkeysApi extends BaseHotkeysApi {
        /**
         * Adds a hotkey with a given id
         * @returns A function to remove the hotkey
         */
        addHotkey(id: string, options: HotkeyOptions, callback: KeyboardCallback): () => void;
        /** Removes all hotkeys with a given id */
        removeHotkeys(id: string): void;
        /**
         * Adds a hotkey which can be changed by the user
         * @param id A unique id for the hotkey, such as `myplugin-myhotkey`
         * @returns A function to remove the hotkey
         */
        addConfigurableHotkey(id: string, options: ConfigurableHotkeyOptions, callback: KeyboardCallback): () => void;
        /** Removes a configurable hotkey with a given id */
        removeConfigurableHotkey(id: string): void;
        /**
         * @deprecated Use {@link addHotkey} instead
         * @hidden
         */
        add(keys: Set<string>, callback: KeyboardCallback, preventDefault?: boolean): void;
        /**
         * @deprecated Use {@link removeHotkeys} instead
         * @hidden
         */
        remove(keys: Set<string>): void;
        /**
         * @deprecated Use {@link addConfigurableHotkey} instead
         * @hidden
         */
        addConfigurable(pluginName: string, hotkeyId: string, callback: KeyboardCallback, options: OldConfigurableOptions): void;
        /**
         * @deprecated Use {@link removeConfigurableHotkeys} instead
         * @hidden
         */
        removeConfigurable(pluginName: string, hotkeyId: string): void;
    }
    class ScopedHotkeysApi extends BaseHotkeysApi {
        private readonly id;
        constructor(id: string);
        /**
         * Adds a hotkey which will fire when certain keys are pressed
         * @returns A function to remove the hotkey
         */
        addHotkey(options: HotkeyOptions, callback: KeyboardCallback): () => void;
        /**
         * Adds a hotkey which can be changed by the user
         * @returns A function to remove the hotkey
         */
        addConfigurableHotkey(options: ConfigurableHotkeyOptions, callback: KeyboardCallback): () => void;
    }
    export { HotkeysApi, ScopedHotkeysApi };
}
declare module "src/content/api/parcel" {
    class BaseParcelApi {
        /**
         * Gets a module based on a filter, returns null if none are found
         * Be cautious when using this- plugins will often run before any modules load in,
         * meaning that if this is run on startup it will likely return nothing.
         * Consider using getLazy instead.
         */
        query(): any;
        /**
         * Returns an array of all loaded modules matching a filter
         * Be cautious when using this- plugins will often run before any modules load in,
         * meaning that if this is run on startup it will likely return nothing.
         * Consider using getLazy instead.
         */
        queryAll(): any[];
    }
    class ParcelApi extends BaseParcelApi {
        /**
         * Waits for a module to be loaded, then runs a callback
         * @returns A function to cancel waiting for the module
         */
        getLazy(): () => void;
        /** Cancels any calls to getLazy with the same id */
        stopLazy(): void;
        /**
         * @deprecated Use {@link getLazy} instead
         * @hidden
         */
        get interceptRequire(): () => () => void;
        /**
         * @deprecated Use {@link stopLazy} instead
         * @hidden
         */
        get stopIntercepts(): () => void;
    }
    class ScopedParcelApi extends BaseParcelApi {
        private readonly id;
        constructor(id: string);
        /**
         * Waits for a module to be loaded, then runs a callback
         * @returns A function to cancel waiting for the module
         */
        getLazy(): () => void;
    }
    export { ParcelApi, ScopedParcelApi };
}
declare module "src/content/ui/showErrorMessage" {
    export default function showErrorMessage(msg: string, title?: string): void;
}
declare module "src/types/scripts" {
    export interface ScriptHeaders {
        name: string;
        description: string;
        author: string;
        version: string | null;
        reloadRequired: string;
        isLibrary: string;
        downloadUrl: string | null;
        webpage: string | null;
        needsLib: string[];
        optionalLib: string[];
        syncEval: string;
        gamemode: string[];
        /** Only available for plugins */
        hasSettings: string;
    }
    export interface OfficialScriptInfo {
        title: string;
        description: string;
        author: string;
        downloadUrl: string;
        webpage: string;
    }
}
declare module "src/shared/parseHeader" {
    import type { ScriptHeaders } from "src/types/scripts";
    export function parseScriptHeaders(code: string): ScriptHeaders;
    export function parseHeader<T>(code: string, headers: T): T;
}
declare module "src/content/core/scripts/libManager.svelte" {
    import { Lib } from "src/content/core/scripts/scripts.svelte";
    import type { LibraryInfo } from "src/types/state";
    const _default_2: {
        libs: Lib[];
        init(libInfo: LibraryInfo[]): void;
        updateState(libInfo: LibraryInfo[]): void;
        get(libName: string): any;
        getLib(libName: string): Lib;
        createLib(script: string, ignoreDuplicates?: boolean, emit?: boolean): Lib;
        deleteLib(lib: Lib, emit?: boolean): void;
        deleteAll(emit?: boolean): void;
        getLibHeaders(name: string): {
            name: string;
            description: string;
            author: string;
            version: string | null;
            reloadRequired: string;
            isLibrary: string;
            downloadUrl: string | null;
            webpage: string | null;
            needsLib: string[];
            optionalLib: string[];
            syncEval: string;
            gamemode: string[];
            hasSettings: string;
        };
        isEnabled(name: string): boolean;
        getLibNames(): string[];
        editLib(library: Lib | string, script: string, emit?: boolean): Promise<void>;
        arrangeLibs(order: string[], emit?: boolean): void;
    };
    export default _default_2;
}
declare module "src/content/core/reloadConfirm.svelte" {
    import { SvelteSet } from "svelte/reactivity";
    const _default_3: {
        needed: SvelteSet<string>;
        names: string[];
        init(): Promise<void>;
        addNeeded(name: string): void;
    };
    export default _default_3;
}
declare module "src/content/core/scripts/scripts.svelte" {
    import type { ScriptHeaders } from "src/types/scripts";
    abstract class BaseScript {
        abstract type: string;
        script: string;
        headers: ScriptHeaders;
        usedLibs: Lib[];
        constructor(script: string, headers?: ScriptHeaders);
        get id(): string;
        runScript(initial: boolean, alreadyStartedLibs?: string[]): Promise<any>;
        checkReloadNeeded(): void;
        loadLibs(initial: boolean, alreadyStartedLibs: string[]): Promise<boolean>;
        unloadLibs(): void;
    }
    export class Plugin extends BaseScript {
        type: string;
        enabled: boolean;
        exported: any;
        onStop: (() => void)[];
        openSettingsMenu: (() => void)[];
        enablePromise: Promise<void> | null;
        errored: boolean;
        constructor(script: string, enabled?: boolean);
        start(initial?: boolean): Promise<void>;
        stop(): void;
    }
    export class Lib extends BaseScript {
        type: string;
        library: any;
        usedBy: Set<string>;
        onStop: (() => void)[];
        enablePromise: Promise<void> | null;
        start(starter?: string, initial?: boolean, alreadyStartedLibs?: string[]): Promise<void>;
        removeUsed(id: string): void;
        stop(): void;
    }
}
declare module "src/content/core/storage.svelte" {
    import type { PluginStorage, Settings } from "src/types/state";
    /** @inline */
    export type ValueChangeCallback = (value: any, remote: boolean) => void;
    interface ValueChangeListener {
        id: string;
        key: string;
        callback: ValueChangeCallback;
    }
    const _default_4: {
        settings: Settings;
        values: PluginStorage;
        updateListeners: ValueChangeListener[];
        init(values: PluginStorage, settings: Settings): void;
        updateState(values: PluginStorage, settings: Settings): void;
        updateSetting(key: string, value: any, emit?: boolean): void;
        getPluginValue(id: string, key: string, defaultVal?: any): any;
        setPluginValue(id: string, key: string, value: any, emit?: boolean): void;
        deletePluginValue(id: string, key: string, emit?: boolean): void;
        deletePluginValues(id: string, emit?: boolean): void;
        onPluginValueUpdate(id: string, key: string, callback: ValueChangeCallback): () => void;
        offPluginValueUpdate(id: string, key: string, callback: ValueChangeCallback): void;
        removeUpdateListeners(id: string): void;
        emit(event: import("eventemitter2").event | import("eventemitter2").eventNS, ...values: any[]): boolean;
        emitAsync(event: import("eventemitter2").event | import("eventemitter2").eventNS, ...values: any[]): Promise<any[]>;
        addListener(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn): import("eventemitter2").Listener | /*elided*/ any;
        on(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn, options?: boolean | import("eventemitter2").OnOptions): import("eventemitter2").Listener | /*elided*/ any;
        prependListener(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn, options?: boolean | import("eventemitter2").OnOptions): import("eventemitter2").Listener | /*elided*/ any;
        once(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn, options?: true | import("eventemitter2").OnOptions): import("eventemitter2").Listener | /*elided*/ any;
        prependOnceListener(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn, options?: boolean | import("eventemitter2").OnOptions): import("eventemitter2").Listener | /*elided*/ any;
        many(event: import("eventemitter2").event | import("eventemitter2").eventNS, timesToListen: number, listener: import("eventemitter2").ListenerFn, options?: boolean | import("eventemitter2").OnOptions): import("eventemitter2").Listener | /*elided*/ any;
        prependMany(event: import("eventemitter2").event | import("eventemitter2").eventNS, timesToListen: number, listener: import("eventemitter2").ListenerFn, options?: boolean | import("eventemitter2").OnOptions): import("eventemitter2").Listener | /*elided*/ any;
        onAny(listener: import("eventemitter2").EventAndListener): /*elided*/ any;
        prependAny(listener: import("eventemitter2").EventAndListener): /*elided*/ any;
        offAny(listener: import("eventemitter2").ListenerFn): /*elided*/ any;
        removeListener(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn): /*elided*/ any;
        off(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn): /*elided*/ any;
        removeAllListeners(event?: import("eventemitter2").event | import("eventemitter2").eventNS): /*elided*/ any;
        setMaxListeners(n: number): void;
        getMaxListeners(): number;
        eventNames(nsAsArray?: boolean): (import("eventemitter2").event | import("eventemitter2").eventNS)[];
        listenerCount(event?: import("eventemitter2").event | import("eventemitter2").eventNS): number;
        listeners(event?: import("eventemitter2").event | import("eventemitter2").eventNS): import("eventemitter2").ListenerFn[];
        listenersAny(): import("eventemitter2").ListenerFn[];
        waitFor(event: import("eventemitter2").event | import("eventemitter2").eventNS, timeout?: number): import("eventemitter2").CancelablePromise<any[]>;
        waitFor(event: import("eventemitter2").event | import("eventemitter2").eventNS, filter?: import("eventemitter2").WaitForFilter): import("eventemitter2").CancelablePromise<any[]>;
        waitFor(event: import("eventemitter2").event | import("eventemitter2").eventNS, options?: import("eventemitter2").WaitForOptions): import("eventemitter2").CancelablePromise<any[]>;
        listenTo(target: import("eventemitter2").GeneralEventEmitter, events: import("eventemitter2").event | import("eventemitter2").eventNS, options?: import("eventemitter2").ListenToOptions): /*elided*/ any;
        listenTo(target: import("eventemitter2").GeneralEventEmitter, events: import("eventemitter2").event[], options?: import("eventemitter2").ListenToOptions): /*elided*/ any;
        listenTo(target: import("eventemitter2").GeneralEventEmitter, events: Object, options?: import("eventemitter2").ListenToOptions): /*elided*/ any;
        stopListeningTo(target?: import("eventemitter2").GeneralEventEmitter, event?: import("eventemitter2").event | import("eventemitter2").eventNS): Boolean;
        hasListeners(event?: String): Boolean;
    };
    export default _default_4;
}
declare module "src/content/core/scripts/pluginManager.svelte" {
    import type { PluginInfo } from "src/types/state";
    import { Deferred } from "src/content/utils";
    import { Plugin } from "src/content/core/scripts/scripts.svelte";
    const _default_5: {
        plugins: Plugin[];
        loaded: Deferred<void>;
        destroyed: boolean;
        init(pluginInfo: PluginInfo[]): Promise<void>;
        updateState(pluginInfo: PluginInfo[]): void;
        getPlugin(name: string): Plugin;
        isEnabled(name: string): boolean;
        createPlugin(script: string, emit?: boolean): Promise<void>;
        deletePlugin(name: Plugin | string, emit?: boolean): void;
        deleteAll(emit?: boolean): void;
        setAll(enabled: boolean, emit?: boolean): void;
        getExports(pluginName: string): any;
        getHeaders(pluginName: string): {
            name: string;
            description: string;
            author: string;
            version: string | null;
            reloadRequired: string;
            isLibrary: string;
            downloadUrl: string | null;
            webpage: string | null;
            needsLib: string[];
            optionalLib: string[];
            syncEval: string;
            gamemode: string[];
            hasSettings: string;
        };
        getPluginNames(): string[];
        editPlugin(name: Plugin | string, script: string, emit?: boolean): Promise<void>;
        arrangePlugins(order: string[], emit?: boolean): void;
        setEnabled(name: Plugin | string, enabled: boolean, emit?: boolean): Promise<void>;
    };
    export default _default_5;
}
declare module "src/content/core/rewriter" {
    interface Import {
        text: string;
        name: string;
    }
    interface ParsedJs {
        imports: Import[];
        code: string;
    }
    type Prefix = string | boolean;
    interface ParseHook {
        pluginName?: string;
        prefix: Prefix;
        callback: (code: string) => string;
    }
    export default class Rewriter {
        static base: URL;
        static cleared: boolean;
        static shared: Record<string, any>;
        static sharedPluginNames: Record<string, string[]>;
        static init(cacheInvalid: boolean): Promise<void>;
        static updateState(cacheInvalid: boolean): void;
        static getName(src: string): string;
        static invalidate(broadcast?: boolean): void;
        static loadingSrcs: Map<string, Promise<string>>;
        static getBlobUrl(name: string, root: boolean): Promise<string>;
        static import(src: string, root: boolean): Promise<any>;
        static importRegex: RegExp;
        static parseHooks: ParseHook[];
        static parse(js: string, name: string, root: boolean): ParsedJs;
        static prepareJs(parsed: ParsedJs): Promise<string>;
        static addParseHook(pluginName: string | null, prefix: Prefix, callback: (code: string) => string): () => void;
        static removeParseHooks(pluginName: string): void;
        static createShared(pluginName: string | null, id: string, value: any): string;
        static removeShared(pluginName: string): void;
        static removeSharedById(pluginName: string, id: string): void;
        static createMemoized(id: string, getter: () => any): string;
        static exposeObject(prefix: Prefix, id: string, substring: string, callback: (val: any) => void): void;
        static exposeObjectBefore(prefix: Prefix, id: string, substring: string, callback: (val: any) => void): void;
        static replaceBetween(text: string, start: string, end: string, withText: string): string;
        static insertAfter(text: string, after: string, withText: string): string;
    }
}
declare module "src/types/stores/editing" {
    interface EditingDevice {
        currentlyEditedDevice: any;
        currentlyEditedGridId: string;
        currentlySortedDeviceId: string;
        screen: string;
        sortingState: any[];
        usingMultiselect: boolean;
        visualEditing: any;
    }
    interface EditingPreferences {
        cameraZoom: number;
        movementSpeed: any;
        phase: any;
        showGrid: any;
        topDownControlsActive: boolean;
    }
    export interface Editing {
        device: EditingDevice;
        preferences: EditingPreferences;
        wire: {
            currentlyEditedWireId: string;
        };
    }
}
declare module "src/types/stores/me" {
    import type { Editing } from "src/types/stores/editing";
    import type { Vector } from "@dimforge/rapier2d-compat";
    interface ExistingDevice {
        action: string;
        id: string;
        shiftX: number;
        shiftY: number;
        use: boolean;
    }
    interface AddingDevices {
        currentlySelectedProp: string;
        existingDevice: ExistingDevice;
        selectedDeviceType: string;
    }
    interface AddingTerrain {
        brushSize: number;
        buildTerrainAsWall: boolean;
        currentlySelectedTerrain: string;
        currentlySelectedTerrainDepth: number;
    }
    interface AddingWires {
        hoveringOverSupportedDevice: boolean;
        pointUnderMouseDeviceId: any;
        startDeviceSelected: boolean;
    }
    interface Adding {
        devices: AddingDevices;
        terrain: AddingTerrain;
        wires: AddingWires;
        mode: string;
    }
    interface CinematicMode {
        charactersVisible: boolean;
        enabled: boolean;
        followingMainCharacter: boolean;
        hidingGUI: boolean;
        mainCharacterVisible: boolean;
        nameTagsVisible: boolean;
    }
    interface ClassDesigner {
        activeClassDeviceId: string;
        lastActivatedClassDeviceId: string;
        lastClassDeviceActivationId: number;
    }
    interface Context {
        cursorIsOverCharacterId: string;
        __devicesUnderCursor: any[];
        __wiresUnderCursor: Set<any>;
    }
    interface CustomAssets {
        currentData: any;
        currentIcon: any;
        currentId: any;
        currentName: any;
        currentOptionId: any;
        isUIOpen: boolean;
        openOptionId: any;
        pendingDeleteId: any;
        showDeleteConfirm: boolean;
    }
    interface DeviceUI {
        current: {
            deviceId: string;
            props: any;
        };
        desiredOpenDeviceId: any;
        serverVersionOpenDeviceId: string;
    }
    interface Health {
        fragility: number;
        health: number;
        lives: number;
        maxHealth: number;
        maxShield: number;
        shield: number;
    }
    interface Interactives {
        deviceId: string;
        info: any;
    }
    interface InteractiveSlot {
        clipSize: number;
        count: number;
        currentClip: number;
        durability: number;
        itemId: string;
        waiting: boolean;
        waitingEndTime: number;
        waitingStartTime: number;
    }
    interface Inventory {
        activeInteractiveSlot: number;
        alertFeed: any;
        alertsFeed: any[];
        currentWaitingEndTime: number;
        infiniteAmmo: boolean;
        interactiveSlotErrorMessageTimeouts: Map<any, any>;
        interactiveSlotErrorMessages: Map<any, any>;
        interactiveSlots: Map<string, InteractiveSlot>;
        interactiveSlotsOrder: number[];
        isCurrentWaitingSoundForItem: boolean;
        lastShotsTimestamps: Map<any, any>;
        maxSlots: number;
        slots: Map<any, any>;
    }
    interface MobileControls {
        left: boolean;
        right: boolean;
        up: boolean;
    }
    interface Mood {
        activeDeviceId: string;
        vignetteActive: boolean;
        vignetteStrength: number;
    }
    interface NonDismissMessage {
        description: string;
        title: string;
    }
    interface Removing {
        deviceIdToRemove: any;
        removingMode: string;
        removingTilesEraserSize: number;
        removingTilesLayer: number;
        removingTilesMode: string;
        tilesToRemove: any[];
        wireIdToRemove: any;
    }
    interface MeSpectating {
        id: string;
        name: string;
        shuffle: boolean;
    }
    interface Xp {
        additionTimeouts: Map<any, any>;
        additions: any[];
        showingLevelUp: boolean;
    }
    interface ZoneDropOverrides {
        allowItemDrop: boolean;
        allowResourceDrop: boolean;
        allowWeaponDrop: boolean;
    }
    export default interface Me {
        adding: Adding;
        cinematicMode: CinematicMode;
        classDesigner: ClassDesigner;
        completedInitialPlacement: boolean;
        context: Context;
        currentAction: string;
        customAssets: CustomAssets;
        deviceUI: DeviceUI;
        editing: Editing;
        gotKicked: boolean;
        health: Health;
        interactives: Interactives;
        inventory: Inventory;
        isRespawning: boolean;
        mobileControls: MobileControls;
        mood: Mood;
        movementSpeed: number;
        myTeam: string;
        nonDismissMessage: NonDismissMessage;
        phase: boolean;
        preferences: {
            startGameWithMode: string;
        };
        properties: Map<string, any>;
        removing: Removing;
        roleLevel: number;
        spawnPosition: Vector;
        spectating: MeSpectating;
        teleportCount: number;
        unredeemeedXP: number;
        xp: Xp;
        zoneDropOverrides: ZoneDropOverrides;
    }
}
declare module "src/types/stores/session" {
    interface Widget {
        id: string;
        placement: string;
        statName: string;
        statValue: number;
        type: string;
        y: number;
    }
    interface GameSession {
        callToAction: any;
        countdownEnd: number;
        phase: string;
        resultsEnd: number;
        widgets: {
            widgets: Widget[];
        };
    }
    export default interface Session {
        allowGoogleTranslate: boolean;
        amIGameOwner: boolean;
        canAddGameTime: boolean;
        cosmosBlocked: boolean;
        customTeams: {
            characterToTeamMap: Map<any, any>;
        };
        duringTransition: boolean;
        gameClockDuration: string;
        gameOwnerId: string;
        gameSession: GameSession;
        gameTime: number;
        gameTimeLastUpdateAt: number;
        globalPermissions: Permissions;
        loadingPhase: boolean;
        mapCreatorRoleLevel: number;
        mapStyle: string;
        modeType: string;
        ownerRole: string;
        phase: string;
        phaseChangedAt: number;
        version: string;
    }
}
declare module "src/types/stores/gui" {
    interface Achievement {
        id: string;
        key: string;
        reset: () => void;
        update: () => void;
    }
    interface BottomInGamePrimaryContent {
        interactionWantsToBeVisible: boolean;
        prioritizeInteraction: boolean;
    }
    interface DamageIndicator {
        show: boolean;
        /**
         * `h` for red, `s` for blue, and any other string for yellow.
         */
        type: string;
    }
    interface Modals {
        closeAllModals: () => void;
        cosmosModalOpen: boolean;
        switchToRegisterScreenWhenCosmosModalOpens: boolean;
    }
    export default interface GUI {
        achievement: Achievement;
        bottomInGamePrimaryContent: BottomInGamePrimaryContent;
        damageIndicator: DamageIndicator;
        guiSlots: any[];
        guiSlotsChangeCounter: number;
        knockoutAlerts: any[];
        modals: Modals;
        none: {
            addMenu: {
                screen: string;
            };
            duringGameScreenVisible: boolean;
            optionsMenu: {
                screen: string;
            };
            screen: string;
        };
        openInputBlockingUI: any[];
        playersManagerUpdateCounter: number;
        scale: number;
        scorebar: any;
        selectedPlayerId: string;
        showingGrid: boolean;
    }
}
declare module "src/types/stores/world" {
    interface Device {
        depth: number;
        deviceOption: any;
        existsBeforeReconnect: boolean;
        hooks: any;
        id: string;
        isPreview: boolean;
        layerId: string;
        name: any;
        options: any;
        props: any;
        x: number;
        y: number;
    }
    interface Devices {
        codeGrids: Map<string, any>;
        devices: Map<string, Device>;
        states: Map<string, any>;
    }
    interface Tile {
        collides: boolean;
        depth: number;
        terrain: string;
        x: number;
        y: number;
    }
    interface Terrain {
        currentTerrainUpdateId: number;
        modifiedHealth: Map<any, any>;
        queuedTiles: Map<any, any>;
        teamColorTiles: Map<any, any>;
        tiles: Map<string, Tile>;
    }
    export default interface World {
        customAssets: {
            customAssets: Map<any, any>;
        };
        devices: Devices;
        height: number;
        width: number;
        mapOptionsJSON: string;
        terrain: Terrain;
        wires: {
            wires: Map<any, any>;
        };
    }
}
declare module "src/types/stores/characters" {
    interface Permissions {
        adding: boolean;
        editing: boolean;
        manageCodeGrids: boolean;
        removing: boolean;
    }
    interface CharacterData {
        allowWeaponFire: boolean;
        existsBeforeReconnect: boolean;
        fragility: number;
        health: number;
        id: string;
        isActive: boolean;
        lastPlayersTeamId: string;
        name: string;
        permissions: Permissions;
        score: number;
        teamId: string;
        type: string;
    }
    export default interface Characters {
        characters: Map<string, CharacterData>;
    }
}
declare module "src/types/stores/memorySystem" {
    interface Costs {
        codeGrid: number;
        collidingTile: number;
        customAssetDefault: number;
        deviceInitialDefault: number;
        deviceSubsequentDefault: number;
        nonCollidingTile: number;
        wire: number;
    }
    interface Counters {
        codeGrids: number;
        collidingTiles: number;
        customAssets: any;
        devices: any;
        nonCollidingTiles: number;
        wires: number;
    }
    interface Limits {
        blocksPerCodeGrid: number;
        codeGrids: number;
        codeGridsPerDevice: number;
        collidingTiles: number;
        customAssetOnMapDefault: number;
        deviceMaxOnMapDefault: number;
        nonCollidingTiles: number;
        wires: number;
    }
    export default interface MemorySystem {
        costs: Costs;
        counters: Counters;
        limits: Limits;
        maxUsedMemory: number;
        usedMemoryCost: number;
    }
}
declare module "src/types/stores/phaser/scene" {
    import type Character from "src/types/stores/phaser/character/character";
    import type { Scene as BaseScene } from "phaser";
    interface Overlay {
        hide: any;
        scene: Scene;
        show: any;
        showing: boolean;
        showingDimensions: any;
        showingPosition: any;
    }
    interface DepthSort {
        overlay: Overlay;
        scene: Scene;
        update: any;
    }
    interface SelectedDevicesOverlay {
        graphics: any;
        hide: any;
        scene: Scene;
        show: any;
        showing: boolean;
    }
    interface MultiSelect {
        addDeviceToSelection: any;
        boundingBoxAroundEverything: any;
        currentlySelectedDevices: any[];
        currentlySelectedDevicesIds: string[];
        endSelectionRect: any;
        findSelectedDevices: any;
        hasSomeSelection: any;
        hideSelection: any;
        hidingSelectionForDevices: boolean;
        isSelecting: boolean;
        modifierKeyDown: boolean;
        mouseShifts: any[];
        movedOrCopiedDevices: any[];
        multiselectDeleteKeyHandler: any;
        multiselectKeyHandler: any;
        onDeviceAdded: any;
        onDeviceRemoved: any;
        overlay: Overlay;
        scene: Scene;
        selectedDevices: any[];
        selectedDevicesIds: string[];
        selectedDevicesOverlay: SelectedDevicesOverlay;
        selection: any;
        setShiftParams: any;
        startSelectionRect: any;
        unselectAll: any;
        update: any;
        updateSelectedDevicesOverlay: any;
        updateSelectionRect: any;
    }
    interface PlatformerEditing {
        setTopDownControlsActive: any;
    }
    interface Removal {
        checkForItem: any;
        createStateListeners: any;
        overlay: Overlay;
        prevMouseWasDown: boolean;
        removeSelectedItems: any;
        scene: Scene;
        update: any;
    }
    interface ActionManager {
        depthSort: DepthSort;
        multiSelect: MultiSelect;
        platformerEditing: PlatformerEditing;
        removal: Removal;
        update: any;
    }
    interface Spectating {
        findNewCharacter: any;
        onBeginSpectating: any;
        onEndSpectating: any;
        setShuffle: any;
    }
    interface CharacterManager {
        addCharacter: any;
        characterContainer: any;
        characters: Map<string, Character>;
        cullCharacters: any;
        removeCharacter: any;
        scene: Scene;
        spectating: Spectating;
        update: any;
    }
    export default interface Scene extends BaseScene {
        actionManager: ActionManager;
        cameraHelper: any;
        characterManager: CharacterManager;
        create: any;
        dt: number;
        inputManager: any;
        resizeManager: any;
        shadowsManager: any;
        spine: any;
        tileManager: any;
        uiManager: any;
        worldManager: any;
    }
}
declare module "src/types/stores/phaser/character/aimingAndLookingAround" {
    import type Character from "src/types/stores/phaser/character/character";
    interface SoundEffect {
        path: string;
        volume: number;
    }
    interface BaseAsset {
        frameHeight: number;
        frameRate: number;
        frameWidth: number;
        imageUrl: string;
        scale: number;
    }
    interface ImpactAsset extends BaseAsset {
        frames: number[];
        hideIfNoHit: boolean;
    }
    interface WeaponAsset extends BaseAsset {
        fireFrames: number[];
        fromCharacterCenterRadius: number;
        hideFireSlash: boolean;
        idleFrames: number;
        originX: number;
        originY: number;
    }
    interface CurrentAppearance {
        explosionSfx: SoundEffect[];
        fireSfx: SoundEffect[];
        id: string;
        impact: ImpactAsset;
        weapon: WeaponAsset;
    }
    export default interface AimingAndLookingAround {
        angleTween: any;
        character: Character;
        characterShouldFlipX: () => boolean;
        currentAngle: number;
        currentAppearance: CurrentAppearance;
        currentWeaponId?: any;
        destroy: () => void;
        isAiming: boolean;
        isCurrentlyAiming: () => boolean;
        lastUsedAngle: number;
        onInventoryStateChange: () => void;
        playFireAnimation: () => void;
        setImage: any;
        setSpriteParams: any;
        setTargetAngle: any;
        sprite: any;
        targetAngle: number;
        update: () => void;
        updateAnotherCharacter: any;
        updateMainCharacterMouse: any;
        updateMainCharacterTouch: any;
    }
}
declare module "src/types/stores/phaser/character/animation" {
    import type Character from "src/types/stores/phaser/character/character";
    interface CharacterState {
        grounded: boolean;
    }
    export default interface Animation {
        availableAnimations: string[];
        blinkTimer: number;
        bodyAnimationLocked: boolean;
        bodyAnimationStartedAt: number;
        character: Character;
        currentBodyAnimation: string;
        currentEyeAnimation: string;
        destroy: () => void;
        lastGroundedAnimationAt: number;
        nonMainCharacterState: CharacterState;
        onAnimationComplete: (callback: () => void) => void;
        onSkinChanged: any;
        playAnimationOrClearTrack: any;
        playBodyAnimation: any;
        playBodySupplementalAnimation: any;
        playEyeAnimation: any;
        playJumpSupplementalAnimation: any;
        playMovementSupplementalAnimation: any;
        prevNonMainCharacterState: any;
        setupAnimations: () => void;
        skinChanged: boolean;
        startBlinkAnimation: () => void;
        stopBlinkAnimation: () => void;
        update: any;
    }
}
declare module "src/types/stores/phaser/character/movement" {
    import type Character from "src/types/stores/phaser/character/character";
    interface Point {
        endTime: number;
        endX: number;
        endY: number;
        startTime: number;
        startX: number;
        startY: number;
        teleported: boolean;
        usedTeleported: boolean;
    }
    interface EndInfo {
        end: number;
        start: number;
        x: number;
        y: number;
    }
    export default interface Movement {
        character: Character;
        currentPoint: Point;
        currentTime: number;
        getCurrentEndInfo: () => EndInfo;
        moveToTargetPosition: () => void;
        nonMainCharacterGrounded: boolean;
        onMainCharacterTeleport: any;
        pointMap: Point[];
        postPhysicsUpdate: any;
        setNonMainCharacterTargetGrounded: any;
        setTargetX: any;
        setTargetY: any;
        setTeleportCount: any;
        targetIsDirty: boolean;
        targetNonMainCharacterGrounded: boolean;
        targetX: number;
        targetY: number;
        teleported: boolean;
        update: () => void;
    }
}
declare module "src/types/stores/phaser/character/physics" {
    import type Scene from "src/types/stores/phaser/scene";
    import type Character from "src/types/stores/phaser/character/character";
    import type { Collider, ColliderDesc, RigidBody, RigidBodyDesc, Vector } from "@dimforge/rapier2d-compat";
    interface Jump {
        actuallyJumped: boolean;
        isJumping: boolean;
        jumpCounter: number;
        jumpTicks: number;
        jumpsLeft: number;
        xVelocityAtJumpStart: number;
    }
    interface MovementState {
        accelerationTicks: number;
        direction: string;
        xVelocity: number;
    }
    interface PhysicsState {
        forces: any[];
        gravity: number;
        grounded: boolean;
        groundedTicks: number;
        jump: Jump;
        lastGroundedAngle: number;
        movement: MovementState;
        velocity: Vector;
    }
    interface Input {
        _jumpKeyPressed: boolean;
        activeClassDeviceId: string;
        angle: null | number;
        ignoredStaticBodies: Set<any>;
        ignoredTileBodies: Set<any>;
        jump: boolean;
        projectileHitForcesQueue: Set<any>;
    }
    interface Bodies {
        character: Character;
        collider: Collider;
        colliderDesc: ColliderDesc;
        rigidBody: RigidBody;
        rigidBodyDesc: RigidBodyDesc;
    }
    export default interface Physics {
        character: Character;
        currentPacketId: number;
        destroy: () => void;
        frameInputsHistory: Map<number, Input>;
        getBody: () => Bodies;
        justAppliedProjectileHitForces: Set<any>;
        lastClassDeviceActivationId: number;
        lastPacketSent: number[];
        lastSentClassDeviceActivationId: number;
        lastSentTerrainUpdateId: number;
        lastTerrainUpdateId: number;
        newlyAddedTileBodies: Set<any>;
        phase: boolean;
        physicsBodyId: string;
        postUpdate: any;
        preUpdate: any;
        prevState: PhysicsState;
        projectileHitForcesHistory: Map<any, any>;
        projectileHitForcesQueue: Set<any>;
        scene: Scene;
        sendToServer: any;
        setServerPosition: any;
        setupBody: any;
        state: PhysicsState;
        tickInput: Input;
        updateDebugGraphics: any;
    }
}
declare module "src/types/stores/phaser/character/character" {
    import type Scene from "src/types/stores/phaser/scene";
    import type AimingAndLookingAround from "src/types/stores/phaser/character/aimingAndLookingAround";
    import type Animation from "src/types/stores/phaser/character/animation";
    import type { Vector } from "@dimforge/rapier2d-compat";
    import type Movement from "src/types/stores/phaser/character/movement";
    import type Physics from "src/types/stores/phaser/character/physics";
    interface Updates {
        update: any;
        updateAlpha: any;
        updateDepth: any;
        updatePosition: any;
        updateScale: any;
    }
    interface TeamState {
        status: string;
        teamId: string;
    }
    interface Alpha {
        character: Character;
        cinematicModeAlpha: number;
        currentAlpha: number;
        getCurrentAlpha: any;
        immunity: number;
        phaseAlpha: number;
        playerAppearanceModifierDeviceAlpha: number;
        scene: Scene;
        setAlpha: any;
        tweenAlpha: any;
        update: () => void;
    }
    interface CharacterTrail {
        character: Character;
        currentAppearance: any;
        currentAppearanceId: string;
        destroy: () => void;
        followCharacter: () => void;
        isReady: boolean;
        lastSetAlpha: number;
        setNewAppearance: any;
        update: () => void;
        updateAppearance: any;
    }
    interface Culling {
        character: Character;
        forceUpdate: () => void;
        hideObject: any;
        isInCamera: boolean;
        needsCullUpdate: boolean;
        onInCamera: any;
        onOutCamera: any;
        scene: Scene;
        shouldForceUpdate: boolean;
        showObject: any;
        updateNeedsUpdate: any;
    }
    interface Depth {
        character: Character;
        currentDepth: number;
        lastY: number;
        update: () => void;
        updateDepth: any;
    }
    interface Dimensions {
        character: Character;
        currentDimensionsId: string;
        onPotentialDimensionsChange: any;
    }
    interface Flip {
        character: Character;
        flipXLastX: number;
        isFlipped: boolean;
        lastX: number;
        lastY: number;
        update: () => void;
        updateFlipForMainCharacter: () => void;
        updateFlipForOthers: () => void;
    }
    interface Healthbar extends Updates {
        character: Character;
        depth: number;
        destroy: () => void;
        isVisible: boolean;
        makeIndicator: any;
        scene: Scene;
        updateValue: any;
    }
    interface Immunity {
        activate: () => void;
        activateClassImmunity: () => void;
        activateSpawnImmunity: () => void;
        character: Character;
        classImmunityActive: boolean;
        deactivate: () => void;
        deactivateClassImmunity: () => void;
        deactivateSpawnImmunity: () => void;
        isActive: () => boolean;
        spawnImmunityActive: boolean;
    }
    interface ImpactAnimation {
        _play: any;
        animations: Map<any, any>;
        character: Character;
        destroy: () => void;
        load: any;
        loadedAnimations: Set<string>;
        play: any;
        scene: Scene;
    }
    interface Indicator extends Updates {
        character: Character;
        characterHeight: number;
        depth: number;
        destroy: () => void;
        image: any;
        isMain: boolean;
        isSpectated: boolean;
        lastCharacterAlpha: number;
        makeIndicator: any;
        scene: Scene;
        teamState: TeamState;
    }
    interface CharacterInput {
        character: Character;
        isListeningForInput: boolean;
        scene: Scene;
        setupInput: any;
    }
    interface Nametag {
        alpha: number;
        character: Character;
        createFragilityTag: any;
        createTag: any;
        creatingTag: boolean;
        depth: number;
        destroy: () => void;
        destroyed: boolean;
        followScale: boolean;
        fragilityTag: any;
        healthMode: string;
        makeVisibleChanges: any;
        name: string;
        playHideAnimation: () => void;
        playShowUpAnimation: () => void;
        scale: number;
        scene: Scene;
        setName: (name: string) => void;
        tag: any;
        teamState: TeamState;
        update: any;
        updateFontColor: any;
        updateFragility: any;
        updateTagAlpha: any;
        updateTagDepth: any;
        updateTagPosition: any;
        updateTagScale: any;
    }
    interface Network {
        lastAngle: number;
        lastAngleUpdate: number;
        updateAimAngle: (angle: number) => void;
    }
    interface Position {
        character: Character;
        update: () => void;
    }
    interface Scale {
        activeScale: number;
        baseScale: number;
        character: Character;
        getCurrentScale: any;
        onSkinChange: any;
        respawningScale: number;
        scaleX: number;
        scaleY: number;
        scene: Scene;
        setScale: any;
        spectatorScale: number;
        tweenScale: any;
        update: any;
        dependencyScale: number;
        isVisible: boolean;
    }
    interface Shadow {
        character: Character;
        createShadow: any;
        destroy: any;
        update: any;
    }
    interface Skin {
        applyEditStyles: any;
        character: Character;
        editStyles: any;
        latestSkinId: string;
        scene: Scene;
        setupSkin: any;
        skinId: string;
        updateSkin: any;
    }
    interface Tint {
        character: Character;
        getTintParams: any;
        scene: Scene;
        setTintParams: any;
        startAnimateTint: any;
        stopAnimateTint: any;
        update: any;
    }
    interface VFX {
        character: Character;
        damageBoostActive: boolean;
        phaseActive: boolean;
        setTintModifier: any;
        setTransparencyModifier: any;
        startDamageBoostAnim: any;
        startPhaseAnim: any;
        stopDamageBoostAnim: any;
        stopPhaseAnim: any;
        tintModifierId: string;
        transparencyModifierId: string;
    }
    export default interface Character {
        aimingAndLookingAround: AimingAndLookingAround;
        alpha: Alpha;
        animation: Animation;
        body: Vector;
        characterTrail: CharacterTrail;
        culling: Culling;
        depth: Depth;
        destroy: () => void;
        dimensions: Dimensions;
        flip: Flip;
        healthbar: Healthbar;
        id: string;
        immunity: Immunity;
        impactAnimation: ImpactAnimation;
        indicator: Indicator;
        input: CharacterInput;
        isActive: boolean;
        isDestroyed: boolean;
        isMain: boolean;
        movement: Movement;
        nametag: Nametag;
        network: Network;
        physics: Physics;
        position: Position;
        prevBody: Vector;
        scale: Scale;
        scene: Scene;
        setIsMain: any;
        shadow: Shadow;
        skin: Skin;
        spine: any;
        teamId: string;
        tint: Tint;
        type: string;
        update: any;
        vfx: VFX;
    }
}
declare module "src/types/stores/phaser/phaser" {
    import type Character from "src/types/stores/phaser/character/character";
    import type Scene from "src/types/stores/phaser/scene";
    export default interface Phaser {
        mainCharacter: Character;
        mainCharacterTeleported: boolean;
        scene: Scene;
    }
}
declare module "src/types/stores/worldOptions" {
    interface CodeGrids {
        blockCategories: string;
        customBlocks: string;
        customBlocksParsed: any[];
    }
    interface CodeGridSchema {
        allowChannelGrids: boolean;
        customBlocks: any[];
        triggers: any[];
    }
    interface OptionSchema {
        options: any[];
    }
    interface DeviceOption {
        codeGridSchema: CodeGridSchema;
        defaultState: any;
        id: string;
        optionSchema: OptionSchema;
        wireConfig: any;
    }
    interface Item {
        description: string;
        editorName: string;
        id: string;
        name: string;
        previewImage: string;
        type: string;
    }
    export default interface WorldOptions {
        codeGrids: CodeGrids;
        customAssetsOptions: any[];
        deviceOptions: DeviceOption[];
        hasAllProps: boolean;
        terrainOptions: Item[];
    }
}
declare module "src/types/stores/stores" {
    import type Me from "src/types/stores/me";
    import type Session from "src/types/stores/session";
    import type GUI from "src/types/stores/gui";
    import type World from "src/types/stores/world";
    import type Characters from "src/types/stores/characters";
    import type MemorySystem from "src/types/stores/memorySystem";
    import type Phaser from "src/types/stores/phaser/phaser";
    import type WorldOptions from "src/types/stores/worldOptions";
    interface ActivityFeed {
        feedItems: {
            id: string;
            message: string;
        }[];
    }
    interface Assignment {
        hasSavedProgress: boolean;
        objective: string;
        percentageComplete: number;
    }
    interface EditingStore {
        accessPoints: Map<any, any>;
        gridSnap: number;
        showMemoryBarAtAllTimes: boolean;
    }
    interface Hooks {
        hookJSON: string;
    }
    interface Loading {
        completedInitialLoad: boolean;
        loadedInitialDevices: boolean;
        loadedInitialTerrain: boolean;
        percentageAssetsLoaded: number;
    }
    interface Matchmaker {
        gameCode: string;
    }
    interface NetworkStore {
        attemptingToConnect: boolean;
        attemptingToReconnect: boolean;
        authId: string;
        client: any;
        clientConnectionString: string;
        error: any;
        errorFindingServerForGame: boolean;
        errorJoiningRoom: boolean;
        failedToReconnect: boolean;
        findingServerForGame: boolean;
        hasJoinedRoom: boolean;
        isOffline: boolean;
        isUpToDateWithPingPong: boolean;
        joinedRoom: boolean;
        phaseBeforeReconnect: any;
        ping: number;
        room: any;
        roomIntentErrorMessage: string;
        syncingAfterReconnection: boolean;
    }
    interface SceneStore {
        currentScene: string;
        gpuTier: number;
        isCursorOverCanvas: boolean;
    }
    interface Team {
        characters: Map<number, string>;
        id: string;
        name: string;
        score: number;
    }
    interface Teams {
        teams: Map<string, Team>;
        updateCounter: number;
    }
    export interface StoresType {
        activityFeed: ActivityFeed;
        assignment: Assignment;
        characters: Characters;
        editing: EditingStore;
        gui: GUI;
        hooks: Hooks;
        loading: Loading;
        matchmaker: Matchmaker;
        me: Me;
        memorySystem: MemorySystem;
        network: NetworkStore;
        phaser: Phaser;
        scene: SceneStore;
        session: Session;
        teams: Teams;
        world: World;
        worldOptions: WorldOptions;
    }
    type Suggestion<T> = {
        [K in keyof T]: T[K] extends object ? Suggestion<T[K]> : T[K];
    } & {
        [key: string | number | symbol]: any;
    };
    /** The stores type is very incomplete and is not guaranteed to be accurate */
    export type Stores = Suggestion<StoresType>;
}
declare module "src/content/core/internals" {
    import EventEmitter2 from "eventemitter2";
    import type { Stores } from "src/types/stores/stores";
    export default class GimkitInternals {
        static stores: Stores;
        static notification: any;
        static platformerPhysics: any;
        static events: EventEmitter2;
        static init(): void;
    }
}
declare module "src/content/core/patcher" {
    /** @inline */
    export type PatcherAfterCallback = (thisVal: any, args: IArguments, returnVal: any) => any;
    /** @inline */
    export type PatcherBeforeCallback = (thisVal: any, args: IArguments) => boolean | void;
    /** @inline */
    export type PatcherInsteadCallback = (thisVal: any, args: IArguments) => void;
    type Patch = {
        callback: PatcherBeforeCallback;
        point: 'before';
    } | {
        callback: PatcherAfterCallback;
        point: 'after';
    } | {
        callback: PatcherInsteadCallback;
        point: 'instead';
    };
    export default class Patcher {
        static patches: Map<object, Map<string, {
            original: any;
            patches: Patch[];
        }>>;
        static unpatchers: Map<string, (() => void)[]>;
        static applyPatches(object: object, property: string): void;
        static addPatch(object: object, property: string, patch: Patch): void;
        static getRemovePatch(id: string | null, object: object, property: string, patch: Patch): () => void;
        static after(id: string | null, object: object, property: string, callback: PatcherAfterCallback): () => void;
        static before(id: string | null, object: object, property: string, callback: PatcherBeforeCallback): () => void;
        static instead(id: string | null, object: object, property: string, callback: PatcherInsteadCallback): () => void;
        static unpatchAll(id: string): void;
    }
}
declare module "src/shared/net" {
    export function formatDownloadUrl(url: string): string;
}
declare module "src/content/core/net/net" {
    export type ConnectionType = "None" | "Colyseus" | "Blueboat";
    interface LoadCallback {
        callback: (type: ConnectionType, gamemode: string) => void;
        id: string;
        gamemodes: string[];
    }
    const _default_6: {
        type: ConnectionType;
        room: any;
        loaded: boolean;
        loadCallbacks: LoadCallback[];
        gamemode: string | null;
        init(): void;
        onColyseusRoom(room: any): void;
        onBlueboatRoom(room: any): void;
        waitForColyseusLoad(): void;
        gamemodeFromUrl(url: string): string;
        send(channel: string, message: any): void;
        downloadLibrary(url: string): Promise<void>;
        onLoad(type: ConnectionType, gamemode: string, ...otherTriggers: string[]): void;
        pluginOnLoad(id: string, callback: (type: ConnectionType, gamemode: string) => void, gamemode?: string | string[]): () => void;
        pluginOffLoad(id: string): void;
        readonly isHost: boolean;
        emit(event: import("eventemitter2").event | import("eventemitter2").eventNS, ...values: any[]): boolean;
        emitAsync(event: import("eventemitter2").event | import("eventemitter2").eventNS, ...values: any[]): Promise<any[]>;
        addListener(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn): import("eventemitter2").Listener | /*elided*/ any;
        on(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn, options?: boolean | import("eventemitter2").OnOptions): import("eventemitter2").Listener | /*elided*/ any;
        prependListener(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn, options?: boolean | import("eventemitter2").OnOptions): import("eventemitter2").Listener | /*elided*/ any;
        once(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn, options?: true | import("eventemitter2").OnOptions): import("eventemitter2").Listener | /*elided*/ any;
        prependOnceListener(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn, options?: boolean | import("eventemitter2").OnOptions): import("eventemitter2").Listener | /*elided*/ any;
        many(event: import("eventemitter2").event | import("eventemitter2").eventNS, timesToListen: number, listener: import("eventemitter2").ListenerFn, options?: boolean | import("eventemitter2").OnOptions): import("eventemitter2").Listener | /*elided*/ any;
        prependMany(event: import("eventemitter2").event | import("eventemitter2").eventNS, timesToListen: number, listener: import("eventemitter2").ListenerFn, options?: boolean | import("eventemitter2").OnOptions): import("eventemitter2").Listener | /*elided*/ any;
        onAny(listener: import("eventemitter2").EventAndListener): /*elided*/ any;
        prependAny(listener: import("eventemitter2").EventAndListener): /*elided*/ any;
        offAny(listener: import("eventemitter2").ListenerFn): /*elided*/ any;
        removeListener(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn): /*elided*/ any;
        off(event: import("eventemitter2").event | import("eventemitter2").eventNS, listener: import("eventemitter2").ListenerFn): /*elided*/ any;
        removeAllListeners(event?: import("eventemitter2").event | import("eventemitter2").eventNS): /*elided*/ any;
        setMaxListeners(n: number): void;
        getMaxListeners(): number;
        eventNames(nsAsArray?: boolean): (import("eventemitter2").event | import("eventemitter2").eventNS)[];
        listenerCount(event?: import("eventemitter2").event | import("eventemitter2").eventNS): number;
        listeners(event?: import("eventemitter2").event | import("eventemitter2").eventNS): import("eventemitter2").ListenerFn[];
        listenersAny(): import("eventemitter2").ListenerFn[];
        waitFor(event: import("eventemitter2").event | import("eventemitter2").eventNS, timeout?: number): import("eventemitter2").CancelablePromise<any[]>;
        waitFor(event: import("eventemitter2").event | import("eventemitter2").eventNS, filter?: import("eventemitter2").WaitForFilter): import("eventemitter2").CancelablePromise<any[]>;
        waitFor(event: import("eventemitter2").event | import("eventemitter2").eventNS, options?: import("eventemitter2").WaitForOptions): import("eventemitter2").CancelablePromise<any[]>;
        listenTo(target: import("eventemitter2").GeneralEventEmitter, events: import("eventemitter2").event | import("eventemitter2").eventNS, options?: import("eventemitter2").ListenToOptions): /*elided*/ any;
        listenTo(target: import("eventemitter2").GeneralEventEmitter, events: import("eventemitter2").event[], options?: import("eventemitter2").ListenToOptions): /*elided*/ any;
        listenTo(target: import("eventemitter2").GeneralEventEmitter, events: Object, options?: import("eventemitter2").ListenToOptions): /*elided*/ any;
        stopListeningTo(target?: import("eventemitter2").GeneralEventEmitter, event?: import("eventemitter2").event | import("eventemitter2").eventNS): Boolean;
        hasListeners(event?: String): Boolean;
    };
    export default _default_6;
}
declare module "src/content/api/net" {
    import { type ConnectionType } from "src/content/core/net/net";
    import EventEmitter2 from "eventemitter2";
    class BaseNetApi extends EventEmitter2 {
        constructor();
        /** Which type of server the client is currently connected to */
        get type(): ConnectionType;
        /** The id of the gamemode the player is currently playing */
        get gamemode(): string;
        /** The room that the client is connected to, or null if there is no connection */
        get room(): any;
        /** Whether the user is the one hosting the current game */
        get isHost(): boolean;
        /** Sends a message to the server on a specific channel */
        send(channel: string, message: any): void;
    }
    /**
     * The net api extends [EventEmitter2](https://github.com/EventEmitter2/EventEmitter2)
     * and uses wildcards with ":" as a delimiter.
     *
     * The following events are emitted:
     *
     * ```ts
     * // fired when data is recieved on a certain channel
     * net.on(CHANNEL, (data, editFn) => {})
     *
     * // fired when data is sent on a certain channel
     * net.on(send:CHANNEL, (data, editFn) => {})
     *
     * // fired when the game loads with a certain type
     * net.on(load:TYPE, (type) => {})
     *
     * // you can also use wildcards, eg
     * net.on("send:*", () => {})
     * ```
     */
    class NetApi extends BaseNetApi {
        constructor();
        /**
         * Runs a callback when the game is loaded, or runs it immediately if the game has already loaded
         * @returns A function to cancel waiting for load
         */
        onLoad(id: string, callback: (type: ConnectionType, gamemode: string) => void, gamemode?: string | string[]): () => void;
        /** Cancels any calls to {@link onLoad} with the same id */
        offLoad(id: string): void;
        /**
         * @deprecated Methods for both transports are now on the base net api
         * @hidden
         */
        get colyseus(): this;
        /**
         * @deprecated Methods for both transports are now on the base net api
         * @hidden
         */
        get blueboat(): this;
        /** @hidden */
        private wrappedListeners;
        /**
         * @deprecated use net.on
         * @hidden
         */
        addEventListener(channel: string, callback: (...args: any[]) => void): void;
        /**
         * @deprecated use net.off
         * @hidden
         */
        removeEventListener(channel: string, callback: (...args: any[]) => void): void;
    }
    /**
     * The net api extends [EventEmitter2](https://github.com/EventEmitter2/EventEmitter2)
     * and uses wildcards with ":" as a delimiter.
     *
     * The following events are emitted:
     *
     * ```ts
     * // fired when data is recieved on a certain channel
     * net.on(CHANNEL, (data, editFn) => {})
     *
     * // fired when data is sent on a certain channel
     * net.on(send:CHANNEL, (data, editFn) => {})
     *
     * // fired when the game loads with a certain type
     * net.on(load:TYPE, (type) => {})
     *
     * // you can also use wildcards, eg
     * net.on("send:*", () => {})
     * ```
     */
    class ScopedNetApi extends BaseNetApi {
        private readonly id;
        private readonly defaultGamemode;
        constructor(id: string, defaultGamemode: string[]);
        /**
         * Runs a callback when the game is loaded, or runs it immediately if the game has already loaded.
         * If the \@gamemode header is set the callback will only fire if the gamemode matches one of the provided gamemodes.
         * @returns A function to cancel waiting for load
         */
        onLoad(callback: (type: ConnectionType, gamemode: string) => void, gamemode?: string | string[]): () => void;
    }
    export { NetApi, ScopedNetApi };
}
declare module "src/content/ui/stores" {
    export let focusTrapEnabled: import("svelte/store").Writable<boolean>;
    export let officialPluginsOpen: import("svelte/store").Writable<boolean>;
}
declare module "src/content/core/ui/addPluginButtons" {
    export function addPluginButtons(): void;
}
declare module "src/content/core/ui/ui" {
    import type * as React from 'react';
    import type * as ReactDOM from 'react-dom/client';
    export default class UI {
        static React: typeof React;
        static ReactDOM: typeof ReactDOM;
        static styles: Map<string, HTMLStyleElement[]>;
        static init(): void;
        static addStyles(id: string | null, styleString: string): () => void;
        static removeStyles(id: string): void;
        static addCoreStyles(): void;
    }
}
declare module "src/content/core/ui/modal" {
    import type { ReactElement } from "react";
    interface ModalButton {
        text: string;
        style?: "primary" | "danger" | "close";
        onClick?: (event: MouseEvent) => boolean | void;
    }
    /** @inline */
    export interface ModalOptions {
        id: string;
        title: string;
        style: string;
        className: string;
        closeOnBackgroundClick: boolean;
        buttons: ModalButton[];
        onClosed: () => void;
    }
    export default function showModal(content: HTMLElement | ReactElement, options?: Partial<ModalOptions>): () => void;
}
declare module "src/content/api/ui" {
    import type { ModalOptions } from "src/content/core/ui/modal";
    import type { ReactElement } from "react";
    class BaseUIApi {
        /** Shows a customizable modal to the user */
        showModal(element: HTMLElement | ReactElement, options?: Partial<ModalOptions>): void;
    }
    class UIApi extends BaseUIApi {
        /**
         * Adds a style to the DOM
         * @returns A function to remove the styles
         */
        addStyles(id: string, style: string): () => void;
        /** Remove all styles with a given id */
        removeStyles(id: string): void;
    }
    class ScopedUIApi extends BaseUIApi {
        private readonly id;
        constructor(id: string);
        /**
         * Adds a style to the DOM
         * @returns A function to remove the styles
         */
        addStyles(style: string): () => void;
    }
    export { UIApi, ScopedUIApi };
}
declare module "src/content/api/storage" {
    import { type ValueChangeCallback } from "src/content/core/storage.svelte";
    class StorageApi {
        /** Gets a value that has previously been saved */
        getValue(pluginName: string, key: string, defaultValue?: any): any;
        /** Sets a value which can be retrieved later, through reloads */
        setValue(pluginName: string, key: string, value: any): void;
        /** Removes a value which has been saved */
        deleteValue(pluginName: string, key: string): void;
        /**
         * @deprecated use {@link deleteValue}
         * @hidden
         */
        get removeValue(): (pluginName: string, key: string) => void;
        /** Adds a listener for when a plugin's stored value with a certain key changes */
        onChange(pluginName: string, key: string, callback: ValueChangeCallback): () => void;
        /** Removes a listener added by onChange */
        offChange(pluginName: string, key: string, callback: ValueChangeCallback): void;
        /** Removes all listeners added by onChange for a certain plugin */
        offAllChanges(pluginName: string): void;
    }
    class ScopedStorageApi {
        private readonly id;
        constructor(id: string);
        /** Gets a value that has previously been saved */
        getValue(key: string, defaultValue?: any): any;
        /** Sets a value which can be retrieved later, persisting through reloads */
        setValue(key: string, value: any): void;
        /** Removes a value which has been saved */
        deleteValue(key: string): void;
        /** Adds a listener for when a stored value with a certain key changes  */
        onChange(key: string, callback: ValueChangeCallback): () => void;
    }
    export { StorageApi, ScopedStorageApi };
}
declare module "src/content/api/patcher" {
    import type { PatcherAfterCallback, PatcherBeforeCallback, PatcherInsteadCallback } from "src/content/core/patcher";
    class PatcherApi {
        /**
         * Runs a callback after a function on an object has been run
         * @returns A function to remove the patch
         */
        after(id: string, object: any, method: string, callback: PatcherAfterCallback): () => void;
        /**
         * Runs a callback before a function on an object has been run.
         * Return true from the callback to prevent the function from running
         * @returns A function to remove the patch
         */
        before(id: string, object: any, method: string, callback: PatcherBeforeCallback): () => void;
        /**
         * Runs a function instead of a function on an object
         * @returns A function to remove the patch
         */
        instead(id: string, object: any, method: string, callback: PatcherInsteadCallback): () => void;
        /** Removes all patches with a given id */
        unpatchAll(id: string): void;
    }
    class ScopedPatcherApi {
        private readonly id;
        constructor(id: string);
        /**
         * Runs a callback after a function on an object has been run
         * @returns A function to remove the patch
         */
        after(object: any, method: string, callback: PatcherAfterCallback): () => void;
        /**
         * Runs a callback before a function on an object has been run.
         * Return true from the callback to prevent the function from running
         * @returns A function to remove the patch
         */
        before(object: any, method: string, callback: PatcherBeforeCallback): () => void;
        /**
         * Runs a function instead of a function on an object
         * @returns A function to remove the patch
         */
        instead(object: any, method: string, callback: PatcherInsteadCallback): () => void;
    }
    export { PatcherApi, ScopedPatcherApi };
}
declare module "src/content/api/rewriter" {
    /**
     * The rewriter API allows you to modify the bundled code of Gimkit in order to expose values
     * or change certain behaviors. Due to the unpredictable nature of bundling, you cannot assume that variable names
     * will remain the same beteen updates.
     * @example
     * ```js
     * const callback = GL.Rewriter.createShared("MyPlugin", "uniqueId", (val) => {
     *  console.log(val);
     * });
     *
     * GL.Rewriter.addParseHook("MyPlugin", "index", (code) => {
     *  let index = code.indexOf("something");
     *  code = code.slice(0, index) + `console.log("something else")` + code.slice(index);
     *  code += `${callback}(someVar)`;
     *  return code;
     * });
     * ```
     */
    class RewriterApi {
        /**
         * Creates a hook that will modify the code of a script before it is run.
         * This value is cached, so this hook may not run on subsequent page loads.
         * addParseHook should always be called in the top level of a script.
         * @param pluginName The name of the plugin creating the hook.
         * @param prefix Limits the hook to only running on scripts beginning with this prefix.
         * Passing `true` will only run on the index script, and passing `false` will run on all scripts.
         * @param callback The function that will modify the code. Should return the modified code. Cannot have side effects.
         */
        addParseHook(pluginName: string, prefix: string | boolean, callback: (code: string) => string): () => void;
        /** Removes all hooks created by a certain plugin */
        removeParseHooks(pluginName: string): void;
        /**
         * Creates a shared value that can be accessed from any script.
         * @param pluginName The name of the plugin creating the shared value.
         * @param id A unique identifier for the shared value.
         * @param value The value to be shared.
         * @returns A string representing the code to access the shared value.
         */
        createShared(pluginName: string, id: string, value: any): string;
        /** Removes all values created by {@link createShared} by a certain plugin */
        removeShared(pluginName: string): void;
        /** Removes the shared value with a certain id created by {@link createShared} */
        removeSharedById(pluginName: string, id: string): void;
    }
    /**
     * The rewriter API allows you to modify the bundled code of Gimkit in order to expose values
     * or change certain behaviors. Due to the unpredictable nature of bundling, you cannot assume that variable names
     * will remain the same beteen updates.
     * @example
     * ```js
     * const api = new GL();
     *
     * const callback = api.Rewriter.createShared("uniqueId", (val) => {
     *  console.log(val);
     * });
     *
     * api.Rewriter.addParseHook("index", (code) => {
     *  let index = code.indexOf("something");
     *  code = code.slice(0, index) + `console.log("something else")` + code.slice(index);
     *  code += `${callback}(someVar)`;
     *  return code;
     * });
     * ```
     */
    class ScopedRewriterApi {
        private readonly id;
        constructor(id: string);
        /**
         * Creates a hook that will modify the code of a script before it is run.
         * This value is cached, so this hook may not run on subsequent page loads.
         * addParseHook should always be called in the top level of a script.
         * @param prefix Limits the hook to only running on scripts beginning with this prefix.
         * Passing `true` will only run on the index script, and passing `false` will run on all scripts.
         * @param callback The function that will modify the code. Should return the modified code. Cannot have side effects.
         */
        addParseHook(prefix: string | boolean, callback: (code: string) => string): () => void;
        /**
         * Creates a shared value that can be accessed from any script.
         * @param id A unique identifier for the shared value.
         * @param value The value to be shared.
         * @returns A string representing the code to access the shared value.
         */
        createShared(id: string, value: any): string;
        /** Removes the shared value with a certain id created by {@link createShared} */
        removeSharedById(id: string): void;
    }
    export { RewriterApi, ScopedRewriterApi };
}
declare module "src/content/api/libs" {
    class LibsApi {
        /** A list of all the libraries installed */
        get list(): string[];
        /** Gets whether or not a plugin is installed and enabled */
        isEnabled(name: string): boolean;
        /** Gets the headers of a library, such as version, author, and description */
        getHeaders(name: string): {
            name: string;
            description: string;
            author: string;
            version: string | null;
            reloadRequired: string;
            isLibrary: string;
            downloadUrl: string | null;
            webpage: string | null;
            needsLib: string[];
            optionalLib: string[];
            syncEval: string;
            gamemode: string[];
            hasSettings: string;
        };
        /** Gets the exported values of a library */
        get(name: string): any;
    }
    export default LibsApi;
}
declare module "src/content/api/plugins" {
    class PluginsApi {
        /** A list of all the plugins installed */
        get list(): string[];
        /** Whether a plugin exists and is enabled */
        isEnabled(name: string): boolean;
        /** Gets the headers of a plugin, such as version, author, and description */
        getHeaders(name: string): {
            name: string;
            description: string;
            author: string;
            version: string | null;
            reloadRequired: string;
            isLibrary: string;
            downloadUrl: string | null;
            webpage: string | null;
            needsLib: string[];
            optionalLib: string[];
            syncEval: string;
            gamemode: string[];
            hasSettings: string;
        };
        /** Gets the exported values of a plugin, if it has been enabled */
        get(name: string): any;
        /**
         * @deprecated Use {@link get} instead
         * @hidden
         */
        getPlugin(name: string): {
            return: any;
        };
    }
    export default PluginsApi;
}
declare module "src/content/scopedApi" {
    import type { Lib, Plugin } from "src/content/core/scripts/scripts.svelte";
    interface ScopedInfo {
        id: string;
        script: Plugin | Lib;
        onStop: (cb: () => void) => void;
        openSettingsMenu?: (cb: () => void) => void;
    }
    export default function setupScoped(type?: string, name?: string): ScopedInfo;
}
declare module "src/content/api/api" {
    import { HotkeysApi, ScopedHotkeysApi } from "src/content/api/hotkeys";
    import { ParcelApi, ScopedParcelApi } from "src/content/api/parcel";
    import { NetApi, ScopedNetApi } from "src/content/api/net";
    import { UIApi, ScopedUIApi } from "src/content/api/ui";
    import { StorageApi, ScopedStorageApi } from "src/content/api/storage";
    import { PatcherApi, ScopedPatcherApi } from "src/content/api/patcher";
    import { RewriterApi, ScopedRewriterApi } from "src/content/api/rewriter";
    import LibsApi from "src/content/api/libs";
    import PluginsApi from "src/content/api/plugins";
    class Api {
        /**
         * @deprecated Gimkit has switched from Parcel to vite, rendering this api useless.
         * @hidden
         */
        static parcel: Readonly<ParcelApi>;
        /** Functions to edit Gimkit's code */
        static rewriter: Readonly<RewriterApi>;
        /** Functions to listen for key combinations */
        static hotkeys: Readonly<HotkeysApi>;
        /**
         * Ways to interact with the current connection to the server,
         * and functions to send general requests
         */
        static net: Readonly<NetApi>;
        /** Functions for interacting with the DOM */
        static UI: Readonly<UIApi>;
        /** Functions for persisting data between reloads */
        static storage: Readonly<StorageApi>;
        /** Functions for intercepting the arguments and return values of functions */
        static patcher: Readonly<PatcherApi>;
        /** Methods for getting info on libraries */
        static libs: Readonly<LibsApi>;
        /** Gets the exported values of a library */
        static lib: (name: string) => any;
        /** Methods for getting info on plugins */
        static plugins: Readonly<PluginsApi>;
        /** Gets the exported values of a plugin, if it has been enabled */
        static plugin: (name: string) => any;
        /** Gimkit's internal react instance */
        static get React(): typeof import("react");
        /** Gimkit's internal reactDom instance */
        static get ReactDOM(): typeof import("react-dom/client");
        /** A variety of Gimkit internal objects available in 2d gamemodes */
        static get stores(): import("$types/stores/stores").Stores;
        /**
         * Gimkit's notification object, only available when joining or playing a game
         *
         * {@link https://ant.design/components/notification}
         */
        static get notification(): any;
        /**
         * @deprecated No longer supported
         * @hidden
         */
        static get contextMenu(): {
            showContextMenu: () => void;
            createReactContextMenu: () => void;
        };
        /**
         * @deprecated No longer supported
         * @hidden
         */
        static get platformerPhysics(): any;
        /**
         * @deprecated The api no longer emits events. Use GL.net.loaded to listen to load events
         * @hidden
         */
        static addEventListener(type: string, callback: () => void): void;
        /**
         * @deprecated The api no longer emits events
         * @hidden
         */
        static removeEventListener(type: string, callback: () => void): void;
        /**
         * @deprecated Use {@link plugins} instead
         * @hidden
         */
        static get pluginManager(): Readonly<PluginsApi>;
        constructor(type?: string, name?: string);
        /**
         * @deprecated Gimkit has switched from Parcel to vite, rendering this api useless.
         * @hidden
         */
        parcel: Readonly<ScopedParcelApi>;
        /** Functions to edit Gimkit's code */
        rewriter: Readonly<ScopedRewriterApi>;
        /** Functions to listen for key combinations */
        hotkeys: Readonly<ScopedHotkeysApi>;
        /**
         * Ways to interact with the current connection to the server,
         * and functions to send general requests
         */
        net: Readonly<ScopedNetApi>;
        /** Functions for interacting with the DOM */
        UI: Readonly<ScopedUIApi>;
        /** Functions for persisting data between reloads */
        storage: Readonly<ScopedStorageApi>;
        /** Functions for intercepting the arguments and return values of functions */
        patcher: Readonly<ScopedPatcherApi>;
        /** Methods for getting info on libraries */
        libs: Readonly<LibsApi>;
        /** Gets the exported values of a library */
        lib: (name: string) => any;
        /** Methods for getting info on plugins */
        plugins: Readonly<PluginsApi>;
        /** Gets the exported values of a plugin, if it has been enabled */
        plugin: (name: string) => any;
        /** Gimkit's internal react instance */
        get React(): typeof import("react");
        /** Gimkit's internal reactDom instance */
        get ReactDOM(): typeof import("react-dom/client");
        /** A variety of gimkit internal objects available in 2d gamemodes */
        get stores(): import("$types/stores/stores").Stores;
        /**
         * Gimkit's notification object, only available when joining or playing a game
         *
         * {@link https://ant.design/components/notification}
         */
        get notification(): any;
        /** Run a callback when the plugin or library is disabled */
        onStop: (callback: () => void) => void;
        /**
         * Run a callback when the plugin's settings menu button is clicked
         *
         * This function is not available for libraries
         */
        openSettingsMenu: (callback: () => void) => void;
    }
    export default Api;
}
