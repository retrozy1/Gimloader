import type { Lib, Plugin } from "$core/scripts/scripts.svelte";
import toast from "svelte-5-french-toast";
import Port from "$shared/net/port.svelte";
import type { UpdateResponse } from "$types/updater";
import Rewriter from "../rewriter";

export async function checkPluginUpdate(plugin: Plugin) {
    Rewriter.invalidate();
    let updated: UpdateResponse = await Port.sendAndRecieve("updateSingle", {
        type: "plugin",
        name: plugin.headers.name
    });

    onUpdated(plugin.headers.name, updated);
}

export async function checkLibUpdate(lib: Lib) {
    Rewriter.invalidate();
    let updated: UpdateResponse = await Port.sendAndRecieve("updateSingle", {
        type: "library",
        name: lib.headers.name
    });

    onUpdated(lib.headers.name, updated);
}

function onUpdated(name: string, updated: UpdateResponse) {
    if(updated.updated) {
        if(updated.version) toast.success(`Updated ${name} to the latest version`);
        else toast.success(`Updated ${name} to v${updated.version}`);
    } else {
        if(updated.failed) {
            toast.error(`Failed to fetch the update for ${name}`);
        } else {
            toast.success(`${name} is already up to date`);
        }
    }
}