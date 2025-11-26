import Server from "$bg/net/server";
import { sanitizeHotkeys, sanitizeLibraries, sanitizePlugins, sanitizePluginStorage, sanitizeSettings, saveDebounced } from "$bg/state";
import Updater from "$bg/net/updater";
import type { OnceMessages, OnceResponses } from "$types/messages";
import type { State } from "$types/state";

export default class StateHandler {
    static init() {
        Server.onMessage("getState", this.onGetState.bind(this));
        Server.onMessage("setState", this.onSetState.bind(this));
    }

    static onGetState(state: State, _: OnceMessages["getState"], respond: (response: OnceResponses["getState"]) => void) {
        respond(state);
    }

    static onSetState(state: State, newState: OnceMessages["setState"], respond: () => void) {
        const { plugins, libraries, pluginStorage, pluginSettings, settings, hotkeys } = newState;

        if(plugins) state.plugins = sanitizePlugins(plugins);
        if(libraries) state.libraries = sanitizeLibraries(libraries);
        if(pluginStorage) state.pluginStorage = sanitizePluginStorage(pluginStorage);
        if(pluginSettings) state.pluginSettings = sanitizePluginStorage(pluginSettings);
        if(settings) state.settings = sanitizeSettings(settings);
        if(hotkeys) state.hotkeys = sanitizeHotkeys(hotkeys);
        state.cacheInvalid = true;

        Server.send("setState", state);

        saveDebounced("plugins");
        saveDebounced("pluginStorage");
        saveDebounced("libraries");
        saveDebounced("hotkeys");
        saveDebounced("settings");
        saveDebounced("cacheInvalid");

        if(state.settings.autoUpdate) Updater.checkUpdates();
        respond();
    }
}
