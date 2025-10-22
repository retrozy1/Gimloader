<script lang="ts">
    import type Lib from "$core/scripts/lib.svelte";
    import Card from "../components/Card.svelte";
    import LibManager from "$core/scripts/libManager.svelte";
    import Delete from "svelte-material-icons/Delete.svelte";
    import Pencil from "svelte-material-icons/Pencil.svelte";
    import Update from "svelte-material-icons/Update.svelte";
    import CogPlayOutline from "svelte-material-icons/CogPlayOutline.svelte";
    import ScriptTextOutline from 'svelte-material-icons/ScriptTextOutline.svelte';
    import { checkLibUpdate } from "$core/net/checkUpdates";
    import Gamemodes from '../components/gamemodes/Gamemodes.svelte';
    import ListItem from "../components/ListItem.svelte";
    import Storage from "$core/storage.svelte";
    import { showEditor } from "$content/utils";
    import UI from '$core/ui/ui';

    function deleteLib() {
        let conf = confirm(`Are you sure you want to delete ${library.headers.name}?`);
        if(!conf) return;

        LibManager.deleteLib(library);
    }

    interface Props {
        startDrag: () => void;
        dragDisabled: boolean;
        library: Lib;
        dragAllowed: boolean;
    }

    let {
        startDrag,
        dragDisabled,
        library,
        dragAllowed
    }: Props = $props();

    let gamemodeInfoOpen = $state(false);

    let component = $derived(Storage.settings.menuView === 'grid' ? Card : ListItem);
    const SvelteComponent = $derived(component);
</script>

{#if gamemodeInfoOpen}
    {#await UI.experiencesRes then experiences}
        <Gamemodes
            {experiences}
            header={library?.headers.gamemode}
        />
    {/await}
{/if}

<SvelteComponent {dragDisabled} {startDrag} {dragAllowed}>
    {#snippet header()}
        <h2 class="overflow-ellipsis overflow-hidden whitespace-nowrap flex-grow text-xl font-bold">
            {library?.headers.name}
            {#if library?.headers.version}
                <span class="text-sm">v{library?.headers.version}</span>
            {/if}
        </h2>
    {/snippet}
    {#snippet author()}
        By {library?.headers.author}
    {/snippet}
    {#snippet description()}
        {library?.headers.description}
    {/snippet}
    {#snippet buttons()}
        <button onclick={deleteLib}>
            <Delete size={28} />
        </button>
        <button onclick={() => showEditor("library", library.headers.name)}>
            <Pencil size={28} />
        </button>
        {#if library?.headers.downloadUrl}
            <button onclick={() => checkLibUpdate(library)}>
                <Update size={28} />
            </button>
        {/if}
        {#if library?.headers.gamemode}
            {#await UI.experiencesRes}
                <CogPlayOutline size={28} class="opacity-50" title="Loading gamemodes..." />
            {:then}
                <button onclick={() => gamemodeInfoOpen = true} title="Configure gamemodes">
                    <CogPlayOutline size={28} />
                </button>
            {:catch}
                <CogPlayOutline size={28} color="red" class="opacity-50" title="Gamemodes failed to load" />
            {/await}
        {/if}
        {#if library?.headers.webpage}
            <a href={library.headers.webpage} target="_blank">
                <ScriptTextOutline size={28} />
            </a>
        {/if}
    {/snippet}
</SvelteComponent>