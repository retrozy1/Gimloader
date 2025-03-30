<script lang="ts">
    import { Modal, Button } from "flowbite-svelte";

    let name = $state("");
    let address = $state("");
    let port = $state(5823);
    let { submitText, onsubmit } = $props();

    let isAddressValid = $derived.by(() => {
        let trimmed = address.trim();

        if(!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            trimmed = "https://" + trimmed;
        }

        let site = trimmed.slice(trimmed.indexOf("://") + 3);
        if(site.includes(":") || site.includes("/") || site.includes(" ")) return false;
        
        try {
            new URL(trimmed);
            return true;
        } catch {
            return false;
        }
    });

    function submit() {
        onsubmit({ name, address, port });
    }

    function cancel() {
        onsubmit(null);
    }
</script>

<Modal class="z-50" open autoclose outsideclose on:close={cancel}>
    <div class="grid text-xl gap-3" style="grid-template-columns: auto 1fr">
        Server name
        <input class="border-b border-x-0 border-t-0 border-gray-700 pl-2 text-lg" 
        bind:value={name} placeholder="Custom Server Name" />
        Server address
        <input class="{isAddressValid ? "border-b border-x-0 border-t-0 border-gray-700" : "!outline-2 outline outline-red-600"}
        pl-2 text-lg" bind:value={address} placeholder="http://localhost" />
        Port
        <input class="border-b border-x-0 border-t-0 border-gray-700 text-lg"
        type="number" placeholder="5823" bind:value={port} />
    </div>
    <svelte:fragment slot="footer">
        <div class="flex w-full justify-end gap-3">
            <Button>Cancel</Button>
            <Button on:click={submit} disabled={!name || !port || !isAddressValid}>{ submitText }</Button>
        </div>
    </svelte:fragment>
</Modal>