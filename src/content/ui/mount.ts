import type { Lib, Plugin } from "$core/scripts/scripts.svelte";
import { domLoaded } from "$content/utils";
import ErrorModal from "./modals/Error.svelte";
import PluginSettings from "./settings/PluginSettings.svelte";
import { mount, unmount } from "svelte";
import ScriptLibraries from "./components/ScriptLibraries.svelte";
import MenuUI from "./MenuUI.svelte";
import Command from "./Command.svelte";

let menuOpen = false;
export function showMenu() {
    if(menuOpen) return;
    menuOpen = true;

    let component = mount(MenuUI, {
        target: document.body,
        props: {
            onClose: () => {
                menuOpen = false;
                unmount(component);
                (document.activeElement as HTMLElement)?.blur();
            }
        }
    });
}

export async function mountCommand() {
    await domLoaded;
    mount(Command, { target: document.body });
}

export async function showErrorMessage(msg: string, title: string = "Error") {
    await domLoaded;
    
    let component = mount(ErrorModal, {
        target: document.body,
        props: {
            title,
            msg,
            onClose: () => unmount(component)
        }
    });
}

export function showPluginSettings(plugin: Plugin) {
    let component = mount(PluginSettings, {
        target: document.body,
        props: {
            plugin,
            onClose: () => unmount(component)
        }
    });
}

export function showScriptLibs(script: Plugin | Lib) {
    let component = mount(ScriptLibraries, {
        target: document.body,
        props: {
            name: script.headers.name,
            needsLib: script.headers.needsLib,
            optionalLib: script.headers.optionalLib,
            onClose: () => unmount(component)
        }
    });
}