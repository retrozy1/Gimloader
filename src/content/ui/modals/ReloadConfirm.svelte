<script lang="ts">
    import * as AlertDialog from "$shared/ui/alert-dialog";
    import Modals from "$content/core/modals.svelte";

    function ignore() {
        Modals.reloadNeeded.clear();
    }
</script>

{#if Modals.reloadNeeded.size > 0}
    <AlertDialog.Root open={true}>
        <AlertDialog.Content class="z-101">
            {#if Modals.reloadNeeded.size == 1}
                {Modals.reloadNames[0]} requires
            {:else if Modals.reloadNeeded.size == 2}
                {Modals.reloadNames[0]} and {Modals.reloadNames[1]} require
            {:else}
                {Modals.reloadNames.slice(0, -1).join(", ")}, and {Modals.reloadNames.at(-1)} require
            {/if}
            a reload in order to function properly.

            <AlertDialog.Footer class="border-t pt-2">
                <AlertDialog.Cancel onclick={ignore}>Ignore</AlertDialog.Cancel>
                <AlertDialog.Action onclick={() => location.reload()}>Reload Now</AlertDialog.Action>
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>
{/if}