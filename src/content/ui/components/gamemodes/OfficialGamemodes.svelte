<script lang="ts">
    import type { Gamemodes } from '$types/state';
    import GamemodeList from './GamemodeList.svelte';
    import parsed, { type MappedMode } from './parseExperiences'

    interface Props {
        configurable: boolean;
        gamemodes: Gamemodes;
        parsedExperiences: ReturnType<typeof parsed>;
    }
    const { configurable, gamemodes, parsedExperiences }: Props = $props();

    let { allGamemodes, mappedModes, gamemodes1d, gamemodes2d } = parsedExperiences;

    let visibleGamemodes = $derived([...allGamemodes]
        .filter(gm => gm !== "creative")
        .map(id => mappedModes.find(m => m.id === id))    
    );

    function massAction(modes: MappedMode[], enabled: boolean) {
        if(enabled) {
            gamemodes.official = new Set([...gamemodes.official, ...modes.map(x => x.id)]);
        } else {
            gamemodes.official = new Set([...gamemodes.official].filter(gm => modes.every(g => g.id !== gm)));
        }
    }
</script>

{#snippet button(name: string, modes: MappedMode[], enabled: boolean)}
    <button class="border-2 rounded-md" onclick={() => massAction(modes, enabled)}>{name}</button>
{/snippet}

<div class="flex flex-col gap-2">
    {#if configurable}
        <div class="flex gap-2">
            {@render button("Enable All 1D", gamemodes1d, true)}
            {@render button("Enable All 2D", gamemodes2d, true)}
            {@render button("Disable All 1D", gamemodes1d, false)}
            {@render button("Disable All 2D", gamemodes2d, false)}
        </div>
    {/if}
    <div>
        <GamemodeList gamemodes={visibleGamemodes}>
            {#snippet interaction(gamemode)}
                {#if configurable}
                    <input type="checkbox" checked={gamemodes.official.has(gamemode.id)} onchange={(e) => {
                        if (e.currentTarget.checked) {
                            gamemodes.official = new Set([...gamemodes.official, gamemode.id]);
                            console.log(`checked ${gamemode.id}! gamemodes.official:`)
                            console.log(gamemodes.official);
                            console.log($state.snapshot(gamemodes))
                        } else {
                            gamemodes.official = new Set([...gamemodes.official].filter(gm => gm !== gamemode.id));
                        }
                    }}>
                {/if}
            {/snippet}
        </GamemodeList>
    </div>
</div>