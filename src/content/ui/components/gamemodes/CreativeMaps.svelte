<script lang="ts">
    import type { ListCreativeMap, SingleCreativeMap } from '$types/fetch';
    import type { Gamemodes } from "$types/state";
    import PlusBoxOutline from 'svelte-material-icons/PlusBoxOutline.svelte';
    import Delete from "svelte-material-icons/Delete.svelte";
    import { ListPlaceholder } from 'flowbite-svelte';
    import { onMount } from 'svelte';
    import GamemodeList from './GamemodeList.svelte';
    import type { MappedMode } from './parseExperiences';

    interface Props {
        configurable: boolean;
        gamemodes: Gamemodes;
    }
    const { configurable, gamemodes }: Props = $props();

    let query = $state("");
    // Array for results, null for loading
    let searchResults = $state<MappedMode[] | null>([]);

    let setMaps = $state<MappedMode[] | null>([]);

    onMount(async () => {
        if (!gamemodes.creative) return;
        let mapIds = [...gamemodes.creative.whitelist, ...gamemodes.creative.blacklist];
        setMaps = null;
        setMaps = await Promise.all(mapIds.map(id => 
            fetch(`/api/created-map/listing/info/${id}`)
                .then<SingleCreativeMap>(res => res.json())
                .then(data => ({
                    name: data.title,
                    image: data.image,
                    id
                }))
        ));
    });

    let debounceTimeout: Timer;
    $effect(() => {
        searchResults = null;
        clearTimeout(debounceTimeout);

        if (!query.trim()) {
            searchResults = [];
            return;
        }

        debounceTimeout = setTimeout(async () => {
            const results = await fetch("api/created-map/listing/discovery/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query })
            })
                .then<ListCreativeMap[]>(res => res.json());

            searchResults = results.map(map => ({
                name: map.title,
                image: map.image,
                id: map._id
            }));
        }, 300);
    });

    gamemodes.creative ??= {
        mode: "all",
        blacklist: [],
        whitelist: []
    };

    console.log(gamemodes)

    let mode = $state<Gamemodes["creative"]["mode"]>(gamemodes.creative.mode);
    let listMode: "blacklist" | "whitelist" = $derived(mode === "blacklist" ? "blacklist" : "whitelist");
    let gamemodesMode = $derived(gamemodes.creative[listMode]);

    $effect(() => {
        gamemodes.creative.mode = mode;
        query = "";
        searchResults = null;
    });

    function addMap(map: MappedMode) {
        setMaps.push(map);
        gamemodes.creative[listMode].push(map.id);
    }

    function removeMap(map: MappedMode) {
        setMaps = setMaps.filter(m => m.id !== map.id);
        gamemodes.creative[listMode] = gamemodesMode.filter(m => m !== map.id)
    }
</script>

<div class="flex flex-row">
    <div class="flex flex-row">
        <input type="radio" disabled={!configurable} id="creative-all" value="all" bind:group={mode}>
        <label for="creative-all">All</label>
    </div>
    <div class="flex flex-row">
        <input type="radio" disabled={!configurable} id="creative-whitelist" value="whitelist" bind:group={mode}>
        <label for="creative-whitelist">Allow List</label>
    </div>
    <div class="flex flex-row">
        <input type="radio" disabled={!configurable} id="creative-blacklist" value="blacklist" bind:group={mode}>
        <label for="creative-blacklist">Disallow List</label>
    </div>
</div>

{#if mode === "all"}
    This plugin will run on all creative maps.
{:else}
    <input type="text" placeholder="Search..." bind:value={query}>
    {#if !query.trim()}
        <div>
            <GamemodeList gamemodes={gamemodesMode.map(id => setMaps.find(map => map.id === id))}>
                {#snippet interaction(map)}
                    <button onclick={() => removeMap(map)}><Delete size={20} /></button>
                {/snippet}
            </GamemodeList>
        </div>
    {:else}
        {#if searchResults}
            {#if searchResults.length}
                <GamemodeList gamemodes={searchResults}>
                    {#snippet interaction(map)}
                        <button onclick={() => {
                            addMap(map);
                            query = "";
                        }}><PlusBoxOutline size={32} /></button>
                    {/snippet}
                </GamemodeList>
            {:else}
                No maps found.
            {/if}
        {:else}
            <ListPlaceholder />
        {/if}
    {/if}
{/if}