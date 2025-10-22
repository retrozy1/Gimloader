<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { MappedMode } from './parseExperiences';

    interface Props {
        interaction?: Snippet<[MappedMode]>;
        gamemodes: MappedMode[];
    }

    let { interaction, gamemodes }: Props = $props();
</script>

<div class="flex flex-col gap-0.5">
    {#each gamemodes as gamemode}
        <div class="flex gap-1">
            {@render interaction?.(gamemode)}
            <img class="rounded-lg" src={gamemode.image} alt={gamemode.name} height={20} width={40}>
            <div>{gamemode.name}</div>
        </div>
    {/each}
</div>