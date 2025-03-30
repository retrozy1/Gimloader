<script lang="ts">
    import CustomServer, { type CreatedInfo } from "$core/customServer.svelte";
    import type { CustomServer as CustomServerType } from "$types/state";
    import { Checkbox } from "flowbite-svelte";
    import Card from "../components/Card.svelte";
    import ListItem from "../components/ListItem.svelte";
    import Storage from "$core/storage.svelte";

    import Delete from "svelte-material-icons/Delete.svelte";
    import Pencil from "svelte-material-icons/Pencil.svelte";
    import CreateServer from "./CreateServer.svelte";

    interface Props {
        startDrag: () => void;
        dragDisabled: boolean;
        server: CustomServerType;
        index: number;
    }

    let {
        startDrag,
        dragDisabled,
        server,
        index
    }: Props = $props();

    function toggleEnabled() {
        if(CustomServer.config.selected === index) {
            CustomServer.config.selected = null;
        } else {
            CustomServer.config.selected = index;
        }
        CustomServer.save();
    }

    let editingOpen = $state(false);

    function onSubmit(info: CreatedInfo | null) {
        editingOpen = false;
        if(info) CustomServer.editServer(server, info);
    }

    function deleteServer() {
        if(!confirm(`Do you want to delete ${server.name}?`)) return;
        CustomServer.deleteServer(server);
    }

    let component = $derived(Storage.settings.menuView === 'grid' ? Card : ListItem);
    const SvelteComponent = $derived(component);
</script>

{#if editingOpen}
    <CreateServer submitText="Update" onsubmit={onSubmit} />
{/if}

<SvelteComponent {dragDisabled} {startDrag} dragAllowed={true}>
    {#snippet header()}
        <h2 class="overflow-ellipsis overflow-hidden whitespace-nowrap flex-grow text-xl font-bold">
            {server?.name}
        </h2>
    {/snippet}
    {#snippet toggle()}
        <Checkbox onclick={toggleEnabled} class="h-6 w-6" checked={CustomServer.selected === server} />
    {/snippet}
    {#snippet description()}
        <div>Address: {server?.address}</div>
        <div>Port: {server?.port}</div>
    {/snippet}
    {#snippet buttons()}
        <button onclick={deleteServer}>
            <Delete size={28} />
        </button>
        <button onclick={() => editingOpen = true}>
            <Pencil size={28} />
        </button>
    {/snippet}
</SvelteComponent>