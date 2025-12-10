import ScriptManager from "./scriptManager.svelte";
import { Library } from "./library.svelte";
import type { LibraryInfo } from "$types/state";
import Port from "$shared/net/port.svelte";
import Modals from "../modals.svelte";
import { parseScriptHeaders } from "$shared/parseHeader";
import { toast } from "svelte-sonner";

export default new class LibraryManager extends ScriptManager<Library, LibraryInfo> {
    singular = "library";
    plural = "libraries";

    constructor() {
        super(Library, "library");

        Port.on("libraryCreate", (info) => this.onCreate(info));
    }

    async create(code: string) {
        const headers = parseScriptHeaders(code);
        if(headers.isLibrary === "false") {
            toast.error("Libraries must have the @isLibrary header set");
            return;
        }

        const info = { name: headers.name, code };
        this.deleteConflicting(info.name);

        const created = this.onCreate(info);
        Port.send("libraryCreate", info);

        return created;
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
