<script lang="ts">
    import type { Experiences } from "$types/fetch";
    import type { Gamemodes } from "$types/state";
    import { TabItem, Tabs } from 'flowbite-svelte';
    import CreativeMaps from "./CreativeMaps.svelte";
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
    console.log(gamemodes);

    $effect(() => onChange?.(gamemodes));

    let creativeDisabled = !allGamemodes.has("creative");
    let officialDisabled = !creativeDisabled && allGamemodes.size === 1;
</script>

<Tabs>
    <TabItem title="Official" disabled={officialDisabled} open={!officialDisabled}>
        <div class="h-96"><OfficialGamemodes configurable={!!onChange} {gamemodes} {parsedExperiences} /></div>
    </TabItem>
    <TabItem title="Creative" disabled={creativeDisabled} open={officialDisabled}>
        <div class="h-96"><CreativeMaps configurable={!!onChange} {gamemodes} /></div>
    </TabItem>
</Tabs>