import SettingsHandler from "$bg/messageHandlers/settings";
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

        if(!this.enabled) return;
        this.sendRequest();
        await Server.trigger("editOrCreate", { code });
    }
}
