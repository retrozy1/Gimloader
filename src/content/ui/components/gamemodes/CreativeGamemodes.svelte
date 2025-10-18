<script lang="ts">
    import type { Gamemodes } from "$types/state";

    interface Props {
        configurable: boolean;
        gamemodes: Gamemodes;
    }
    let { configurable, gamemodes }: Props = $props();

    let searching = $state(false);

    let mode = $state<Gamemodes["creative"]["mode"]>(gamemodes.creative?.mode ?? "all");
    $effect(() => {
        gamemodes.creative.mode = mode;
        searching = false;
    });
</script>

<div class="flex flex-row">
    <div class="flex flex-row">
        <input type="radio" id="creative-all" value="all" bind:group={mode}>
        <label for="creative-all">All</label>
    </div>
    <div class="flex flex-row">
        <input type="radio" id="creative-whitelist" value="whitelist" bind:group={mode}>
        <label for="creative-all">Allow List</label>
    </div>
    <div class="flex flex-row">
        <input type="radio" id="creative-blacklist" value="blacklist" bind:group={mode}>
        <label for="creative-all">Disallow List</label>
    </div>
</div>

{#if mode === "whitelist"}

{:else if mode === "blacklist"}

{/if}