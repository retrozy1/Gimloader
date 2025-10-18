<script lang="ts">
    import type { Gamemodes } from '$types/state';
    import parsed, { type MappedMode } from './parseExperiences'

    interface Props {
        configurable: boolean;
        gamemodes: Gamemodes;
        parsedExperiences: ReturnType<typeof parsed>;
    }
    let { configurable, gamemodes, parsedExperiences }: Props = $props();

    let { allGamemodes, mappedModes, gamemodes1d, gamemodes2d } = parsedExperiences;

    function massAction(modes: MappedMode[], enabled: boolean) {
        if (enabled) {
            modes.forEach((gm) => {
                if (!gamemodes.official.includes(gm.id)) gamemodes.official.push(gm.id);
            });
        } else {
            gamemodes.official = gamemodes.official.filter(gm => modes.every(g => g.id !== gm));
        }
    }
</script>

{#if configurable}
    <div class="flex flex-row">
        <button onclick={() => massAction(gamemodes1d, true)}>Enable All 1D</button>
        <button onclick={() => massAction(gamemodes2d, true)}>Enable All 2D</button>
        <button onclick={() => massAction(gamemodes1d, false)}>Disable All 1D</button>
        <button onclick={() => massAction(gamemodes2d, false)}>Disable All 2D</button>
    </div>
{/if}
<div>
    {#each allGamemodes.filter(gm => gm !== "creative") as gamemodeId}
        {@const gamemode = mappedModes.find(m => m.id === gamemodeId)}
        <div class="flex flex-row">
            {#if configurable}
                <input type="checkbox" checked={gamemodes.official.includes(gamemodeId)} onchange={(e) => {
                    if (e.currentTarget.checked) {
                        gamemodes.official.push(gamemodeId);
                    } else {
                        gamemodes.official.filter(gm => gm !== gamemodeId);
                    }
                }}>
            {/if}
            <img src={gamemode.image} alt={gamemode.name}>
            {gamemode.name}
        </div>
    {/each}
</div>