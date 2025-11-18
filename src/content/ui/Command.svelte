<script lang="ts">
    import * as Command from "$shared/ui/command";
    import Commands from "$core/commands.svelte";
    import { watch } from "runed";

    let commandsList = $derived(Object.entries(Commands.groups));
    let value = $state("");

    let inputValue = $state("");
    watch(() => Commands.action, () => {
        inputValue = "";
    });

    function windowKeydown(e: KeyboardEvent) {
        if(e.key !== "Enter" || !Commands.open) return;

        if(Commands.action?.type === "string") {
            if(inputValue.trim() === "") return;
            Commands.action.callback(inputValue);
        } else if(Commands.action?.type === "number") {
            if(!inputValue) return;

            // If the number changes after being clamped, don't submit
            let parsed = parseFloat(inputValue);
            if(Number.isNaN(parsed)) {
                inputValue = "";
                return;
            }

            const options = Commands.action.options;
            if(!options.decimal) parsed = Math.round(parsed);
            if(options.min) parsed = Math.max(parsed, options.min);
            if(options.max) parsed = Math.min(parsed, options.max);
            if(String(parsed) !== inputValue) {
                inputValue = String(parsed);
                return;
            }

            Commands.action.callback(parsed);
        }
    }

    function onSelect() {
        Commands.onSelect(value);
    }

    function onOpenChange(open: boolean) {
        if(open) return;

        Commands.action?.cancel();
        Commands.action = null;
    }

    function inputKeydown(e: KeyboardEvent) {
        if(Commands.action.type !== "number" || e.key.length > 1) return;
        if(e.ctrlKey || e.metaKey || e.altKey) return;

        if(Commands.action.options.decimal) {
            if(!/[0-9.-]/.test(e.key)) e.preventDefault();
        } else {
            if(!/[0-9-]/.test(e.key)) e.preventDefault();
        }
    }
</script>

<svelte:window onkeydown={windowKeydown} />

<Command.Dialog bind:open={Commands.open} bind:value onOpenChangeComplete={onOpenChange}>
    {#if Commands.action}
        <Command.Input
            bind:value={inputValue}
            onkeydown={inputKeydown}
            maxlength={Commands.action.type === "string" ? Commands.action.options.maxLength : null}
            placeholder={Commands.action.options.title}
        />
        {#if Commands.action.type === "select"}
            <Command.List>
                {#each Commands.action.options.options as option}
                    <Command.Item {onSelect}>
                        {option.label}
                    </Command.Item>
                {/each}
            </Command.List>
        {/if}
    {:else}
        <Command.Input placeholder="Type a command or search..." />
        <Command.List>
            <Command.Empty>No results found.</Command.Empty>
            {#each commandsList as [group, commands], i}
                <Command.Group heading={group}>
                    {#each commands as command}
                        <Command.Item {onSelect} value={command.value} keywords={command.keywords}>
                            {command.text}
                        </Command.Item>
                    {/each}
                </Command.Group>
                {#if i < commandsList.length - 1}
                    <Command.Separator />
                {/if}
            {/each}
        </Command.List>
    {/if}
</Command.Dialog>
