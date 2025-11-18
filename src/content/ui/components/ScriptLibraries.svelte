<script lang="ts">
    import LibManager from "$core/scripts/libManager.svelte";
    import { checkLibUpdate } from "$core/net/checkUpdates";
    import Net from "$core/net/net";
    import { showErrorMessage } from "../mount";
    import * as Table from "$shared/ui/table";
    import * as Dialog from "$shared/ui/dialog";

    import OpenInNew from "svelte-material-icons/OpenInNew.svelte";
    import Update from "svelte-material-icons/Update.svelte";
    import Download from "svelte-material-icons/Download.svelte";

    interface Props {
        name: string;
        needsLib: string[];
        optionalLib: string[];
        onClose: () => void;
    }

    let { name, needsLib, optionalLib, onClose }: Props = $props();

    interface ILibInfo {
        name: string;
        url?: string;
        required: boolean;
    }

    let libsInitial: ILibInfo[] = [];

    for(let lib of needsLib) {
        let parts = lib.split("|").map((p: string) => p.trim());
        libsInitial.push({ name: parts[0], url: parts[1], required: true });
    }

    for(let lib of optionalLib) {
        let parts = lib.split("|").map((p: string) => p.trim());
        libsInitial.push({ name: parts[0], url: parts[1], required: false });
    }

    let libsInfo: ILibInfo[] = $state(libsInitial);

    function downloadLib(name: string, url: string) {
        Net.downloadLibrary(url)
            .then(() => libsInfo = libsInfo)
            .catch((err) => showErrorMessage(err, `Failed to download library ${name}`));
    }
</script>

<Dialog.Root open={true} onOpenChangeComplete={onClose}>
    <Dialog.Content class="text-gray-600 block" style="max-width: min(760px, calc(100% - 32px))">
        <Dialog.Header class="border-b w-full text-xl font-bold! mb-4">
            Libraries used by {name}
        </Dialog.Header>
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head>Installed?</Table.Head>
                    <Table.Head>Name</Table.Head>
                    <Table.Head>URL</Table.Head>
                    <Table.Head>Required</Table.Head>
                    <Table.Head></Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each libsInfo as libInfo}
                    {@const lib = LibManager.getLib(libInfo.name)}
                    <Table.Row>
                        <Table.Cell>
                            {lib ? "Yes" : "No"}
                        </Table.Cell>
                        <Table.Cell>
                            {libInfo.name}
                        </Table.Cell>
                        <Table.Cell>
                            {#if libInfo.url}
                                <a
                                    class="hover:underline block max-w-80 text-wrap"
                                    href={libInfo.url}
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    {libInfo.url}
                                    <OpenInNew class="inline-block" size={16} />
                                </a>
                            {:else}
                                None
                            {/if}
                        </Table.Cell>
                        <Table.Cell>
                            {libInfo.required ? "Yes" : "No"}
                        </Table.Cell>
                        <Table.Cell>
                            {#if lib && lib.headers.downloadUrl}
                                <button onclick={() => checkLibUpdate(lib)}>
                                    <Update size={25} />
                                </button>
                            {:else if libInfo.url}
                                <button onclick={() => downloadLib(libInfo.name, libInfo.url)}>
                                    <Download size={25} />
                                </button>
                            {/if}
                        </Table.Cell>
                    </Table.Row>
                {/each}
            </Table.Body>
        </Table.Root>
    </Dialog.Content>
</Dialog.Root>
