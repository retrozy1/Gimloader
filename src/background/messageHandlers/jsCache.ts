import Server from "$bg/net/server";
import { saveDebounced } from "$bg/state";
import type { StateMessages } from "$types/messages";
import type { State } from "$types/state";

export default class JsCacheHandler {
    static init() {
        Server.on("cacheInvalid", this.onCacheInvalid.bind(this));
    }

    static save() {
        saveDebounced("cacheInvalid");
    }

    static onCacheInvalid(state: State, message: StateMessages["cacheInvalid"]) {
        state.cacheInvalid = message.invalid;
        this.save();
    }
}
