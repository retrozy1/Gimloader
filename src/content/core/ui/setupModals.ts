import Changelog from "$content/ui/modals/Changelog.svelte";
import ReloadConfirm from "$content/ui/modals/ReloadConfirm.svelte";
import { domLoaded } from "$content/utils";
import { mount } from "svelte";
import Modals from "../modals.svelte";
import DependencyModal from "$content/ui/dependencies/DependencyModal.svelte";
import Error from "$content/ui/modals/Error.svelte";
import PluginSettings from "$content/ui/settings/PluginSettings.svelte";
import Confirm from "$content/ui/modals/Confirm.svelte";

export default async function setupModals() {
    Modals.register("dependency", DependencyModal);
    Modals.register("error", Error);
    Modals.register("confirm", Confirm);
    Modals.register("pluginSettings", PluginSettings);
    
    await domLoaded;
    
    const target = document.body;
    mount(ReloadConfirm, { target });
    mount(Changelog, { target });
}