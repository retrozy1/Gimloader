import ReloadConfirmComponent from "$content/ui/ReloadConfirm.svelte";
import { domLoaded } from "$content/utils";
import { mount } from "svelte";
import { SvelteSet } from "svelte/reactivity"

export default new class ReloadConfirm {
    needed = new SvelteSet<string>();
    names = $derived(Array.from(this.needed));
    
    async init() {
        await domLoaded();

        mount(ReloadConfirmComponent, {
            target: document.body
        });
    }

    addNeeded(name: string) {
        this.needed.add(name);
    }
}