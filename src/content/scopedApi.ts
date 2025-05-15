import PluginManager from "$core/scripts/pluginManager.svelte";
import LibManager from "$core/scripts/libManager.svelte";

const scriptRegex = /gimloader:\/\/(plugins|libraries)\/(.+?)\.js:\d+:\d+/g;

interface ScopedInfo {
    id: string;
    onStop: (cb: () => void) => void;
    openSettingsMenu?: (cb: () => void) => void;
}

export default function setupScoped(): ScopedInfo {
    let stack = new Error().stack;

    // get the uuid of the blob that called this function
    let match: RegExpExecArray, exec: RegExpExecArray;
    while(exec = scriptRegex.exec(stack)) match = exec;
    if(!match) throw new Error("new GL() needs to be called by a plugin or library");

    let type = match[1];
    let name = decodeURIComponent(match[2]);

    if(type === "plugins") {
        let plugin = PluginManager.getPlugin(name);
        if(!plugin) throw new Error("new GL() called in an invalid context");

        return {
            id: plugin.headers.name,
            onStop: (cb: () => void) => plugin.onStop.push(cb),
            openSettingsMenu: (cb: () => void) => plugin.openSettingsMenu.push(cb)
        }
    } else {
        let library = LibManager.getLib(name);
        if(!library) throw new Error("new GL() called in an invalid context");

        return {
            id: library.headers.name,
            onStop: (cb: () => void) => library.onStop.push(cb)
        }
    }
}