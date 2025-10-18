<script lang="ts">
    import type { Experiences } from "$types/fetch";
    import type { Gamemodes } from "$types/state";
    import CreativeGamemodes from "./CreativeGamemodes.svelte";
    import OfficialGamemodes from "./OfficialGamemodes.svelte";
    import parseExperiences from "./parseExperiences";

    interface Props {
        experiences: Experiences;
        header: string[];
        initialGamemodes?: Gamemodes;
        onChange?: (gamemodes: Gamemodes) => void;
    }
    let { experiences, header, initialGamemodes, onChange }: Props = $props();

    let parsedExperiences = parseExperiences(experiences, header);
    let { allGamemodes } = parsedExperiences;

    let gamemodes = $state<Gamemodes>(initialGamemodes ?? { official: allGamemodes });

    $effect(() => onChange?.(gamemodes));

    let hasCreative = allGamemodes.includes("creative");
    let isTabs = allGamemodes.length > 1 && hasCreative;

    let tab = $state<"official" | "creative">(hasCreative ? "creative" : "official");
</script>

{#if isTabs}
    <div class="flex flex-row">
        <button onclick={() => tab = "official"}>Official</button>
        <button onclick={() => tab = "creative"}>Creative</button>
    </div>
{/if}

{#if tab === "official"}
    <OfficialGamemodes configurable={!!onChange} {gamemodes} {parsedExperiences} />
{:else}
    <CreativeGamemodes configurable={!!onChange} {gamemodes} />
{/if}