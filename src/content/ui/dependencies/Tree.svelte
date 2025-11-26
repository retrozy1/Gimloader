<script lang="ts">
    import Tree from "./Tree.svelte";
    import { scripts } from "$core/scripts/map";
    import { parseDep } from "$shared/parseHeader";
    import ArrowRightBottom from "svelte-material-icons/ArrowRightBottom.svelte";
    import AlertCircle from "svelte-material-icons/AlertCircleOutline.svelte";
    import AlertTriangle from "svelte-material-icons/AlertOutline.svelte";
    import ArrowLeft from "svelte-material-icons/ArrowLeft.svelte";
    import Link from "svelte-material-icons/Link.svelte";
    import LinkOff from "svelte-material-icons/LinkOff.svelte";
    import { Plugin } from "$core/scripts/plugin.svelte";

    interface Props {
        name: string;
        type: string;
        stack: string[];
        root?: boolean;
        url?: string;
        optional?: boolean;
    }

    let { name, type, stack, root = false, optional = false, url }: Props = $props();

    const script = scripts.get(name);
</script>

{#snippet scriptName()}
    {name}
    {#if optional}
        <span class="text-sm text-gray-500">(optional)</span>
    {/if}
    {#if url}
        <a href={url} target="_blank">
            <Link size={18} />
        </a>
    {:else if !root}
        <LinkOff size={18} />
    {/if}
{/snippet}

{#snippet dependency(dep: string, optional: boolean)}
    {@const [scriptName, url] = parseDep(dep)}
    <div class="flex items-start gap-2">
        <ArrowRightBottom size={24} />
        <Tree name={scriptName} {type} stack={[...stack, name]} {url} {optional} />
    </div>
{/snippet}

{#if !script}
    {#if !optional && !url}
        <div class="text-red-500 flex items-center gap-2">
            {name}
            <AlertCircle size={20} />
            <ArrowLeft size={20} />
            missing and cannot be downloaded
        </div>
    {:else if type === "confirm" && !optional && url}
        <div class="text-yellow-400 flex items-center gap-2">
            {name}
            <AlertTriangle size={20} />
            <ArrowLeft size={20} />
            needs to be downloaded
            <a href={url} target="_blank">
                <Link size={18} />
            </a>
        </div>
    {:else}
        <div class="flex items-center gap-2">
            {@render scriptName()}
        </div>
    {/if}
{:else if stack.includes(name)}
    <div class="flex items-center gap-2 text-red-500">
        {name}
        <AlertCircle size={20} />
        <ArrowLeft size={20} />
        circular dependency
    </div>
{:else}
    <div class="flex flex-col">
        {#if type === "confirm" && !root && script.type === "plugin" && !optional && !(script as Plugin).enabled}
            <div class="text-yellow-400 flex items-center gap-2">
                {name}
                <AlertTriangle size={20} />
                <ArrowLeft size={20} />
                will be enabled
            </div>
        {:else}
            <div class="flex items-center gap-2" class:font-bold={root}>
                {@render scriptName()}
            </div>
        {/if}
        {#each Object.values(script.getDependencyStrings()) as deps}
            {#each deps.required as dep}
                {@render dependency(dep, false)}
            {/each}
            {#each deps.optional as dep}
                {@render dependency(dep, true)}
            {/each}
        {/each}
    </div>
{/if}
