<script lang="ts">
    import { Button, Modal } from "flowbite-svelte";
    import ReloadConfirm from "$core/reloadConfirm.svelte";

    function ignore() {
        ReloadConfirm.needed.clear();
    }
</script>

{#if ReloadConfirm.needed.size > 0}
    <div class="preflight topModal">
        <Modal open dismissable={false}>
            {#if ReloadConfirm.needed.size == 1}
                {ReloadConfirm.names[0]} requires
            {:else if ReloadConfirm.needed.size == 2}
                {ReloadConfirm.names[0]} and {ReloadConfirm.names[1]} require
            {:else}
                {ReloadConfirm.names.slice(0, -1).join(", ")}, and {ReloadConfirm.names.at(-1)} require
            {/if}
            a reload in order to function properly.

            <svelte:fragment slot="footer">
                <div class="w-full flex justify-end gap-5">
                    <Button onclick={() => location.reload()}>Reload Now</Button>
                    <Button onclick={ignore}>Ignore</Button>
                </div>
            </svelte:fragment>
        </Modal>
    </div>
{/if}

<style>
    .topModal > :global(*) {
        z-index: 101;
    }
</style>