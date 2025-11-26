import type { Script } from "$core/scripts/script.svelte";
import { formatDownloadUrl } from "$shared/net/util";
import PluginManager from "$core/scripts/pluginManager.svelte";
import LibManager from "$core/scripts/libManager.svelte";
import { toast } from "svelte-sonner";

export async function downloadLibrary(url: string) {
    try {
        const resp = await fetch(formatDownloadUrl(url));
        if(resp.status !== 200) throw new Error("Library url returned status " + resp.status);

        const text = await resp.text();
        const lib = await LibManager.create(text);
        toastSuccess(lib);
    } catch (e) {
        console.error(e);
        toast.error(`Failed to download library`);
    }
}

export async function downloadPlugin(url: string) {
    try {
        const resp = await fetch(formatDownloadUrl(url));
        if(resp.status !== 200) throw new Error("Plugin url returned status " + resp.status);

        const text = await resp.text();
        const plugin = await PluginManager.create(text);
        toastSuccess(plugin);
    } catch (e) {
        console.error(e);
        toast.error(`Failed to download plugin`);
    }
}

function toastSuccess(script: Script) {
    toast.success(`Downloaded ${script.headers.name} v${script.headers.version}`);
}
