<script lang="ts">
    import { Toggle } from 'flowbite-svelte';
    import state from '$shared/bareState.svelte';
    import type { PluginInfo } from '$types/state';
    import Port from '$shared/port.svelte';
    import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
    import Web from 'svelte-material-icons/Web.svelte';
    import GithubIcon from '$assets/github-mark-white.svg';

    function onToggle(plugin: PluginInfo) {
        Port.send("pluginToggled", { name: plugin.name, enabled: plugin.enabled });
    }

    let deleting: PluginInfo | null = null;

    function onDeleteClick(e: MouseEvent, plugin: PluginInfo) {
        if(deleting === plugin) {
            Port.send("pluginDelete", { name: plugin.name });
            state.plugins.splice(state.plugins.indexOf(plugin), 1);
            deleting = null;
            return;
        }

        e.stopPropagation();
        deleting = plugin;
    }

    function openSite() { chrome.tabs.create({ url: "https://gimloader.github.io" }) }
    function openRepo() { chrome.tabs.create({ url: "https://github.com/Gimloader/Gimloader" })}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="w-full h-full preflight bg-slate-900 text-white" onclick={() => deleting = null}>
    <div class="flex items-center gap-2 px-1 border-b">
        <img src="./images/icon128.png" alt="The Gimloader icon" class="w-6 h-6" />
        <h1 class="whitespace-nowrap text-2xl font-bold flex-grow">Gimloader</h1>
        <button onclick={openSite} title="Open official site"><Web width={24} height={24} /></button>
        <button onclick={openRepo} title="Open github repo">{@html GithubIcon}</button>
    </div>
    <div class="max-h-[500px] overflow-y-auto w-full py-1">
        {#if state.plugins.length === 0}
            <div class="w-full text-center text-xl font-semibold">
                No plugins installed!
            </div>
        {:else}
            {#each state.plugins as plugin}
                <div class="text-lg flex items-center px-1" class:bg-red-600={deleting === plugin}>
                    <Toggle size="small" on:change={() => onToggle(plugin)} bind:checked={plugin.enabled} />
                    <div class="flex-grow whitespace-nowrap overflow-ellipsis overflow-x-hidden">
                        {plugin.name}
                    </div>
                    <button onclick={(e) => onDeleteClick(e, plugin)}>
                        <DeleteOutline size={24} />
                    </button>
                </div>
            {/each}
        {/if}
    </div>
</div>