<script lang="ts">
    import type { PluginInfo } from "$types/state";
    import { Switch } from "$shared/ui/switch";
    import state from "$shared/net/bareState.svelte";
    import Port from "$shared/net/port.svelte";
    import DeleteOutline from "svelte-material-icons/DeleteOutline.svelte";
    import Web from "svelte-material-icons/Web.svelte";
    import GithubIcon from "$assets/github-mark-white.svg";
    import Xml from "svelte-material-icons/Xml.svelte";
    import { version } from "../../package.json";
    import { parseScriptHeaders } from "$shared/parseHeader";
    import { toast, Toaster } from "svelte-5-french-toast";

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

    function openSite() {
        chrome.tabs.create({ url: "https://gimloader.github.io" });
    }
    function openRepo() {
        chrome.tabs.create({ url: "https://github.com/Gimloader/Gimloader" });
    }
    function copyDebugInfo() {
        const plugins = state.plugins
            .toSorted((a, b) => a.name.localeCompare(b.name))
            .toSorted((a, b) => a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1);
        const libraries = state.libraries
            .toSorted((a, b) => a.name.localeCompare(b.name));

        let debugInfo = `**Core:**\nGimloader v${version}`;
        debugInfo += `\n\n**Plugins:**\n` + plugins.map((plugin) => {
            const headers = parseScriptHeaders(plugin.script);
            return `- ${plugin.name} v${headers.version || "unknown"} [${plugin.enabled ? "enabled" : "disabled"}]`;
        }).join("\n");
        debugInfo += `\n\n**Libraries:**\n` + libraries.map((library) => {
            const headers = parseScriptHeaders(library.script);
            return `- ${library.name} v${headers.version || "unknown"}`;
        }).join("\n");

        navigator.clipboard.writeText(debugInfo)
            .then(() => toast.success("Debug info copied to clipboard"))
            .catch(() => toast.error("Failed to copy debug info to clipboard"));
    }
</script>

<svelte:window onclick={() => deleting = null} />

<Toaster position="bottom-right" toastOptions={{ duration: 5000 }} />

<div class="w-full h-full bg-slate-900 text-white">
    <div class="flex items-center gap-2 px-1 border-b">
        <img src="./images/icon128.png" alt="The Gimloader icon" class="w-6 h-6" />
        <h1 class="whitespace-nowrap text-2xl font-bold grow">Gimloader</h1>
        <button onclick={openSite} title="Open official site"><Web size={24} /></button>
        <button onclick={openRepo} title="Open github repo">{@html GithubIcon}</button>
        <button onclick={copyDebugInfo} title="Copy debug info"><Xml size={24} /></button>
    </div>
    <div class="max-h-[500px] overflow-y-auto w-full py-1">
        {#if state.plugins.length === 0}
            <div class="w-full text-center text-xl font-semibold">
                No plugins installed!
            </div>
        {:else}
            {#each state.plugins as plugin}
                <div class="text-lg flex items-center px-1" class:bg-red-600={deleting === plugin}>
                    <Switch onCheckedChange={() => onToggle(plugin)} bind:checked={plugin.enabled} />
                    <div class="pl-2 grow whitespace-nowrap overflow-ellipsis overflow-x-hidden">
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
