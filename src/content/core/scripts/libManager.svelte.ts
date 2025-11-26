import ScriptManager from "./scriptManager.svelte";
import { Library } from "./library.svelte";
import type { LibraryInfo } from "$types/state";
import type { ScriptHeaders } from "$types/scripts";
import Port from "$shared/net/port.svelte";
import Modals from "../modals.svelte";

export default new class LibraryManager extends ScriptManager<Library, LibraryInfo> {
    singular = "library";
    plural = "libraries";

    constructor() {
        super(Library, "library");
    }

    getScriptInfo(code: string, headers: ScriptHeaders) {
        return { code, name: headers.name };
    }

    async deleteAllConfirm(confirmed = false) {
        const response = await Port.sendAndRecieve("tryDeleteAllLibraries", { confirmed });

        if(response.status === "confirm") {
            const title = "Plugins depend on some libraries";
            const confirmed = await Modals.open("confirm", {
                text: response.message,
                title
            });
            if(!confirmed) return;
            
            this.deleteAllConfirm(true);
        }
    }
}();