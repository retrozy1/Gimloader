<script lang="ts">
    import CustomServer, { type CreatedInfo } from "$content/core/customServer.svelte";
    import { Toggle } from "flowbite-svelte";
    import CustomServerComponent from "./CustomServer.svelte";
    import { dndzone } from "svelte-dnd-action";
    import Storage from "$core/storage.svelte";
    import { flipDurationMs } from "$shared/consts";
    import { flip } from "svelte/animate";
    import ViewControl from "../components/ViewControl.svelte";
    import PlusBoxOutline from "svelte-material-icons/PlusBoxOutline.svelte";
    import CreateServer from "./CreateServer.svelte";

    let items = $state(CustomServer.config.servers.map((server) => ({ id: server.id })));
    $effect(() => {
        items = CustomServer.config.servers
            .map((server) => ({ id: server.id }));
    });

    let dragDisabled = $state(true);

    function handleDndConsider(e: any) {
        items = e.detail.items;
    }

    function handleDndFinalize(e: any) {
        items = e.detail.items;
        dragDisabled = true;

        // Update the order of the plugins
        let order = items.map(i => i.id);
        CustomServer.arrangeServers(order);
    }

    function startDrag() {
        dragDisabled = false;
    }

    let showCreate = $state(false);
    function onCreated(info: CreatedInfo | null) {
        showCreate = false;
        if(info) CustomServer.createServer(info);
    }
</script>

<h1 class="text-xl font-bold">Custom Server</h1>
<div class="flex items-center text-xl gap-2">
    <Toggle bind:checked={CustomServer.config.enabled} on:change={() => CustomServer.save()} />
    Enable Custom Server
</div>

{#if showCreate}
    <CreateServer submitText="Create" onsubmit={onCreated} />
{/if}

<div class="{CustomServer.config.enabled ? "" : "opacity-50 pointer-events-none"}">
    <h1 class="text-xl font-bold pt-3">Servers</h1>
    <div class="flex items-center mb-[3px]">
        <button onclick={() => showCreate = true}>
            <PlusBoxOutline size={32} />
        </button>
        <ViewControl />
    </div>
    <div class="max-h-full overflow-y-auto grid gap-4 pb-1 flex-grow view-{Storage.settings.menuView}"
        use:dndzone={{ items, flipDurationMs, dragDisabled, dropTargetStyle: {} }}
        onconsider={handleDndConsider} onfinalize={handleDndFinalize}>
        {#each items as item, i (item.id)}
            {@const server = CustomServer.getServer(item.id)}
            <div animate:flip={{ duration: flipDurationMs }}>
                <CustomServerComponent {server} {startDrag} {dragDisabled} index={i} />
            </div>
        {/each}
    </div>
</div>