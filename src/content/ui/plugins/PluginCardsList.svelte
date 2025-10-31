<script lang="ts">
    import { flip } from "svelte/animate";
    import { dndzone } from "svelte-dnd-action";
    import Plugin from "./Plugin.svelte";
    import { readUserFile, showEditor } from "$content/utils";
    import { Button } from "$shared/ui/button";
    import Search from '../components/Search.svelte';
    import PluginManager from "$core/scripts/pluginManager.svelte";
    import Storage from "$core/storage.svelte";
    import Port from "$shared/net/port.svelte";
    import { flipDurationMs } from "$shared/consts";
    import ViewControl from "../components/ViewControl.svelte";
    import { officialPluginsOpen } from "../stores";
    import * as Select from "$shared/ui/select";
    
    import PlusBoxOutline from 'svelte-material-icons/PlusBoxOutline.svelte';
    import Import from 'svelte-material-icons/Import.svelte';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    
    let searchValue = $state("");
    let items = $state(PluginManager.plugins.map((plugin) => ({ id: plugin.headers.name })));

    $effect(() => {
        items = PluginManager.plugins
            .filter((plugin) => plugin.headers.name.toLowerCase().includes(searchValue.toLowerCase()))
            .map((plugin) => ({ id: plugin.headers.name }));
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
        PluginManager.arrangePlugins(order);
    }

    function startDrag() {
        dragDisabled = false;
    }

    function importPlugin() {
        readUserFile(".js", (code) => {
            code = code.replaceAll("\r\n", "\n");
            PluginManager.createPlugin(code);
        });
    }

    let sortOpen = $state(false);

    function sortEnabled() {
        sortOpen = false;
        let enabled = PluginManager.plugins.filter((p) => p.enabled);
        let disabled = PluginManager.plugins.filter((p) => !p.enabled);
        PluginManager.plugins = enabled.concat(disabled);
        Port.send("pluginsArrange", { order: PluginManager.plugins.map(p => p.headers.name) })
    }

    function sortAlphabetical() {
        sortOpen = false;
        let sorted = PluginManager.plugins.sort((a, b) => a.headers.name.localeCompare(b.headers.name));
        PluginManager.plugins = sorted;
        Port.send("pluginsArrange", { order: sorted.map(p => p.headers.name) });
    }

    let bulkOpen = $state(false);

    function deleteAll() {
        bulkOpen = false;

        if(PluginManager.plugins.length === 0) return;
        const conf = confirm("Are you sure you want to delete all plugins?");
        if (!conf) return;

        PluginManager.deleteAll();
    }
</script>

<div class="flex flex-col max-h-full">
    <div class="flex items-center mb-[3px]">
        <Button class="h-7" onclick={() => officialPluginsOpen.set(true)}>
            Official Plugins
        </Button>
        <button onclick={() => showEditor("plugin")}>
            <PlusBoxOutline size={32} />
        </button>
        <button onclick={importPlugin}>
            <Import size={32} />
        </button>
        <Select.Root type="single">
            <Select.Trigger class="h-7">
                Bulk actions
            </Select.Trigger>
            <Select.Content>
                <Select.Item onclick={deleteAll}>Delete all</Select.Item>
                <Select.Item onclick={() => PluginManager.setAll(true)}>Enable all</Select.Item>
                <Select.Item onclick={() => PluginManager.setAll(false)}>Disable all</Select.Item>
            </Select.Content>
        </Select.Root>
        <Select.Root type="single">
            <Select.Trigger class="h-7 mx-2!">
                Sort by...
            </Select.Trigger>
            <Select.Content>
                <Select.Item onclick={sortEnabled}>Enabled</Select.Item>
                <Select.Item onclick={sortAlphabetical}>Alphabetical</Select.Item>
            </Select.Content>
        </Select.Root>
        <ViewControl />
        <Search bind:value={searchValue} />
    </div>
    {#if PluginManager.plugins.length === 0}
        <h2 class="text-xl w-full text-center">
            No plugins installed! Check out the
            <button class="underline" onclick={() => officialPluginsOpen.set(true)}>
                Official Plugins
            </button>
            or import or create your own.
        </h2>
    {/if}
    <div class="overflow-y-auto outline-none grid gap-4 pb-1 grow view-{Storage.settings.menuView}"
    use:dndzone={{ items, flipDurationMs, dragDisabled, dropTargetStyle: {} }}
    onconsider={handleDndConsider} onfinalize={handleDndFinalize}>
        {#key searchValue}
            {#each items as item (item.id)}
                {@const plugin = PluginManager.getPlugin(item.id)}
                <div animate:flip={{ duration: flipDurationMs }}>
                    <Plugin {plugin} {startDrag} {dragDisabled} dragAllowed={searchValue == ""} />
                </div>
            {/each}
        {/key}
    </div>
</div>