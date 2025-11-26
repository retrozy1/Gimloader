import SettingsHandler from "$bg/messageHandlers/settings";
import { saveDebounced, statePromise } from "$bg/state";
import { parseScriptHeaders } from "$shared/parseHeader";
import Server from "$bg/net/server";

export default class Poller {
    static enabled = false;
    static uid = Math.random().toString(36).substring(2);

    static init(enabled: boolean) {
        this.setEnabled(enabled);

        SettingsHandler.on("pollerEnabled", (enabled) => {
            this.setEnabled(enabled);
        });
    }

    static setEnabled(enabled: boolean) {
        this.enabled = enabled;

        if(enabled) this.sendRequest();
    }

    static async sendRequest() {
        if(!this.enabled) return;

        const tryAgain = () => {
            setTimeout(() => this.sendRequest(), 5000);
        };

        const res = await fetch("http://localhost:5822/getUpdate", { headers: { uid: this.uid } })
            .catch(tryAgain);
        if(!res) return;

        if(res.status !== 200) return tryAgain();
        const code = await res.text();
        const state = await statePromise;

        if(!this.enabled) return;
        Server.executeAndSend("cacheInvalid", { invalid: true });

        this.sendRequest();
        const headers = parseScriptHeaders(code);

        if(headers.isLibrary !== "false") {
            const lib = state.libraries.find(l => l.name === headers.name);
            if(lib) {
                lib.code = code;
                Server.send("libraryEdit", { name: lib.name, newName: lib.name, code });
            } else {
                const obj = { code, name: headers.name };
                state.libraries.push(obj);
                Server.send("libraryCreate", obj);
            }

            Server.send("toast", { type: "success", message: `Hot reloaded library ${headers.name}` });
            saveDebounced("libraries");
        } else {
            const plugin = state.plugins.find(p => p.name === headers.name);
            if(plugin) {
                plugin.code = code;
                Server.send("pluginEdit", { name: plugin.name, newName: plugin.name, code });
            } else {
                const obj = { code, name: headers.name, enabled: true };
                state.plugins.push(obj);
                Server.send("pluginCreate", obj);
            }

            Server.send("toast", { type: "success", message: `Hot reloaded plugin ${headers.name}` });
            saveDebounced("plugins");
        }
    }
}
