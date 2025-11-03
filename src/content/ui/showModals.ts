import type { Plugin } from "$core/scripts/scripts.svelte";
import type { PluginSettingsDescription } from "$types/settings";
import { domLoaded } from "$content/utils";
import ErrorModal from "./components/ErrorModal.svelte";
import PluginSettings from "./settings/PluginSettings.svelte";
import { mount, unmount } from "svelte";

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