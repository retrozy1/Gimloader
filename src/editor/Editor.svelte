<script lang="ts">
    import Port from "$shared/port.svelte";
    import * as monaco from "monaco-editor";
    import ContentSaveAlertOutline from "svelte-material-icons/ContentSaveAlertOutline.svelte";
    import ContentSaveOutline from "svelte-material-icons/ContentSaveOutline.svelte";
    import Close from "svelte-material-icons/Close.svelte";
    import { defaultLibraryScript, defaultPluginScript } from "./consts";
    import State from "$shared/bareState.svelte";
    import { parseLibHeader, parsePluginHeader } from "$shared/parseHeader";

    const params = new URLSearchParams(location.search);
    const type = params.get("type") as "plugin" | "library";
    let name: string | undefined = $state(params.get("name"));

    let existing = $derived.by(() => {
        console.log(State.plugins)
        if(type === "plugin") return State.plugins.find(p => p.name === name);
        else return State.libraries.find(l => l.name === name);
    });

    let editorDiv: HTMLElement = $state();
    let saved = $state(true);
    let editor: monaco.editor.IStandaloneCodeEditor;

    State.init(() => {
        let value: string;

        if(existing) value = existing.script;
        else if(type === "plugin") value = defaultPluginScript;
        else value = defaultLibraryScript;

        editor = monaco.editor.create(editorDiv, {
            value,
            language: "javascript",
            theme: "vs-dark"
        });

        editor.getModel().onDidChangeContent(() => saved = false);
    });

    function save() {
        let script = editor.getValue();
        let headers = parsePluginHeader(script); // works fine for both types, for what we need

        if(type === "plugin") {
            if(headers.isLibrary !== "false") {
                alert("Plugins must not have the @isLibrary header");
                return;
            }
        } else {
            if(headers.isLibrary === "false") {
                alert("Libraries must have the @isLibrary header");
                return;
            }
        }

        if(existing) {
            Port.send(`${type}Edit`, { name, newName: headers.name, script });
            existing.name = headers.name;
        } else {
            Port.send(`${type}Create`, { name: headers.name, script });
            if(type === "plugin") State.plugins.push({ name: headers.name, enabled: true, script });
            else State.libraries.push({ name: headers.name, script });
        }
    
        name = headers.name;
        saved = true;
    }

    function beforeUnload(e: BeforeUnloadEvent) {
        if(!saved) e.preventDefault();
    }

    function close() {
        if(!saved && !confirm("You have unsaved changes! Are you sure you want to exit?")) return;

        chrome.tabs.getCurrent().then((tab) => chrome.tabs.remove(tab.id));
    }
</script>

<svelte:window on:beforeunload={beforeUnload} />

<div class="w-screen h-screen bg">
    {#if type !== "plugin" && type !== "library"}
        <h1 class="w-full text-center text-8xl text-white m-0">Invalid URL</h1>
    {:else}
        <div class="h-10 border-0 border-solid border-b border-white text-white text-2xl flex gap-2 items-center px-2">
            <div>
                {existing ? "Editing" : "Creating"}
                {#if name}
                    {type} {name}
                {:else}
                    a new {type}
                {/if}
            </div>
            <div class="flex-grow"></div>
            <button class="bg-white rounded-full flex items-center gap-2 px-2 cursor-pointer"
                onclick={save}>
                {#if saved}
                    <ContentSaveOutline size={24} />
                {:else}
                    <ContentSaveAlertOutline size={24} />
                {/if}
                Save
            </button>
            <button class="bg-white rounded-full flex items-center gap-2 px-2 cursor-pointer"
                onclick={close}>
                <Close size={24} />
                Exit
            </button>
        </div>
        <div style="height: calc(100vh - 41px)" class="w-full" bind:this={editorDiv}></div>
    {/if}
</div>

<style>
    .bg {
        font-family: Consolas, "Courier New", monospace;
        background-color: #1e1e1e;
    }
</style>