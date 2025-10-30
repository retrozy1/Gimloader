<script lang="ts">
    import * as AlertDialog from "$shared/ui/alert-dialog";
    import ReloadConfirm from "$core/reloadConfirm.svelte";

    function ignore() {
        ReloadConfirm.needed.clear();
    }
</script>

{#if ReloadConfirm.needed.size > 0}
    <AlertDialog.Root open={true}>
        <AlertDialog.Content class="z-101">
            {#if ReloadConfirm.needed.size == 1}
                {ReloadConfirm.names[0]} requires
            {:else if ReloadConfirm.needed.size == 2}
                {ReloadConfirm.names[0]} and {ReloadConfirm.names[1]} require
            {:else}
                {ReloadConfirm.names.slice(0, -1).join(", ")}, and {ReloadConfirm.names.at(-1)} require
            {/if}
            a reload in order to function properly.

            <AlertDialog.Footer class="border-t pt-2">
                <AlertDialog.Cancel onclick={ignore}>Ignore</AlertDialog.Cancel>
                <AlertDialog.Action onclick={() => location.reload()}>Reload Now</AlertDialog.Action>
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>
{/if}