import type { StateMessages } from "$types/messages";
import type { Settings, State } from "$types/state";
import Server from "$bg/server";
import { saveDebounced } from "$bg/state";
import Updater from "$bg/updater";
import EventEmitter2 from "eventemitter2";

export default new class SettingsHandler extends EventEmitter2 {
    init() {
        Server.on("settingUpdate", this.onSettingUpdate.bind(this));   
    }

    save() {
        saveDebounced('settings');
    }

    updateSettingInState<K extends keyof Settings>(state: State, message: { key: K, value: Settings[K] }) {
        state.settings[message.key] = message.value;
    }

    onSettingUpdate(state: State, message: StateMessages["settingUpdate"]) {
        this.updateSettingInState(state, message);
        this.save();
        this.emit(message.key, message.value);

        if(message.key === "autoUpdate" && message.value === true) {
            // the cooldown is intentionally ignored so you can re-check updates by toggling the setting on and off
            Updater.checkUpdates();
        }
    }
}