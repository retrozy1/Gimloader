<script lang="ts">
    import type { SettingGroup } from "$types/settings";
    import Setting from "./Setting.svelte";

    let { group }: { group: SettingGroup } = $props();
</script>

{#each group.settings as setting}
    <Setting {setting} />
{/each}