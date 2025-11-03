<script lang="ts">
    import type { PluginSetting } from "$types/settings";

    let { setting }: { setting: PluginSetting } = $props();
</script>

<div>{setting.id} {setting.label}</div>