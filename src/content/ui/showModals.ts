import type { Lib, Plugin } from "$core/scripts/scripts.svelte";
import { domLoaded } from "$content/utils";
import ErrorModal from "./modals/Error.svelte";
import PluginSettings from "./settings/PluginSettings.svelte";
import { mount, unmount } from "svelte";
import ScriptLibraries from "./components/ScriptLibraries.svelte";

export function showErrorMessage(msg: string, title: string = "Error") {
    const showError = () => {
        let component = mount(ErrorModal, {
            target: document.body,
            props: {
                title,
                msg,
                onClose: () => unmount(component)
            }
        });
    }

    domLoaded.then(showError);
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