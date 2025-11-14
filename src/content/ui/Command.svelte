<script lang="ts">
    import Hotkeys from "$core/hotkeys/hotkeys.svelte";
    import * as Command from "$shared/ui/command";
    import Commands from "$core/commands.svelte";

    let commandsList = $derived(Object.entries(Commands.groups));
    let open = $state(false);
    let value = $state("");

    Hotkeys.addConfigurableHotkey("openCommandPalette", {
        category: "Gimloader",
        title: "Open Command Palette",
        preventDefault: true,
        default: {
            key: "KeyP",
            ctrl: true,
            shift: true,
            alt: false
        }
    }, () => open = true);

    function onKeydown(e: KeyboardEvent) {
        if(e.key !== "Enter" || !open) return;
        onSelect();
    }

    function onSelect() {
        Commands.onSelect(value);
        open = false;
    }
</script>

<svelte:window onkeydown={onKeydown} />

<Command.Dialog bind:open bind:value>
    <Command.Input placeholder="Type a command or search..." />
    <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        {#each commandsList as [group, commands], i}
            <Command.Group heading={group}>
                {#each commands as command}
                    <Command.Item {onSelect} value={command.id} keywords={command.keywords}>
                        {command.text}
                    </Command.Item>
                {/each}
            </Command.Group>
            {#if i < commandsList.length - 1}
                <Command.Separator />
            {/if}
        {/each}
    </Command.List>
</Command.Dialog>