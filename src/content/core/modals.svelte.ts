import ChangelogModal from "$content/ui/modals/Changelog.svelte";
import ReloadConfirmModal from "$content/ui/modals/ReloadConfirm.svelte";
import { domLoaded } from "$content/utils";
import { mount } from "svelte";
import { SvelteSet } from "svelte/reactivity";

export interface Updated {
    name: string;
    version: string;
    changes: string[];
}

export default new class Modals {
    reloadNeeded = new SvelteSet<string>();
    reloadNames = $derived(Array.from(this.reloadNeeded));
    updated: Updated[] = $state([]);

    async init() {
        await domLoaded;

        const target = document.body;
        mount(ReloadConfirmModal, { target });
        mount(ChangelogModal, { target });
    }

    addReloadNeeded(name: string) {
        this.reloadNeeded.add(name);
    }

    addUpdated(name: string, version: string, changes: string[]) {
        this.updated.push({ name, version, changes });
    }

    clearUpdated() {
        this.updated = [];
    }
}();
