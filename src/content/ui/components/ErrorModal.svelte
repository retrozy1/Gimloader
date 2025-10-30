<script lang="ts">
    import * as Dialog from "$shared/ui/dialog";

    interface Props {
        title: string;
        msg: string;
        onClose: () => void;
    }

    let { title, msg, onClose }: Props = $props();
</script>

<Dialog.Root open onOpenChange={onClose}>
    <Dialog.Content class="block" style="max-width: min(760px, calc(100% - 32px))">
        <Dialog.Header class="font-bold text-lg w-full border-b">
            {title}
        </Dialog.Header>
        <pre>{msg}</pre>
    </Dialog.Content>
</Dialog.Root>