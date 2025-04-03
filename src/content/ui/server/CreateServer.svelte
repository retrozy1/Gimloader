<script lang="ts">
    import { Modal, Button } from "flowbite-svelte";

    let { submitText, onsubmit, name: startName = "", address: startAddress = "", port: startPort = 5823 } = $props();
    let name = $state(startName);
    let address = $state(startAddress);
    let port = $state(startPort);

    let addressChanged = $state(false);
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
        <input class="border-b border-x-0 border-t-0 border-gray-700 pl-2 text-lg h-8" 
        bind:value={name} />
        Server address
        <input class="{(isAddressValid || !addressChanged) ? "border-b border-x-0 border-t-0 border-gray-700" : "!outline-2 outline outline-red-600"}
        pl-2 text-lg h-8" bind:value={address} oninput={() => addressChanged = true} />
        Port
        <input class="border-b border-x-0 border-t-0 border-gray-700 text-lg h-8"
        type="number" bind:value={port} />
    </div>
    <svelte:fragment slot="footer">
        <div class="flex w-full justify-end gap-3">
            <Button>Cancel</Button>
            <Button on:click={submit} disabled={!name || !port || !isAddressValid}>{ submitText }</Button>
        </div>
    </svelte:fragment>
</Modal>