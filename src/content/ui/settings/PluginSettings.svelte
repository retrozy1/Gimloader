<script lang="ts">
    import type { Plugin } from "$core/scripts/scripts.svelte";
    import Storage from "$core/storage.svelte";
    import * as Dialog from "$shared/ui/dialog";
    import Setting from "./Setting.svelte";
    import SettingsGroup from "./SettingsGroup.svelte";

    interface Props {
        plugin: Plugin;
        onClose: () => void;
    }

    let { plugin, onClose }: Props = $props();
</script>

<Dialog.Root open onOpenChange={onClose}>
    <Dialog.Content class="flex flex-col gap-2" style="max-width: min(760px, calc(100% - 32px))">
        <Dialog.Header class="text-xl font-bold!">
            Settings for {plugin.headers.name}
        </Dialog.Header>
        {#each plugin.settingsDescription as setting}
            {#if setting.type === "group"}
                <SettingsGroup group={setting} />
            {:else}
                <Setting {setting} />
            {/if}
        {/each}
    </Dialog.Content>
</Dialog.Root>