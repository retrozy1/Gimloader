import * as monaco from 'monaco-editor';
import types from "./gimloaderTypes.txt";
import { mount } from 'svelte';
import Editor from './Editor.svelte';
import styles from "../shared/tailwind.scss";
import type { EditorOptions } from '$types/editor';

self.MonacoEnvironment = {
	getWorkerUrl: function (moduleId, label) {
		if (label === 'javascript') {
			return '/js/editor/vs/language/typescript/ts.worker.js';
		}
		return '/js/editor/vs/editor/editor.worker.js';
	}
};

monaco.languages.typescript.javascriptDefaults.addExtraLib(types, "@types/gimloader/gimloader.d.ts");

let style = document.createElement("style");
style.innerHTML = styles;
document.head.appendChild(style);

mount(Editor, {
	props: {
		createEditor: (options: EditorOptions) => {
			let editor = monaco.editor.create(options.element, {
				value: options.code,
				language: "javascript",
				theme: "vs-dark",
				automaticLayout: true
			});
	
			editor.getModel().onDidChangeContent(options.onChange);

			return {
				getValue: () => editor.getValue()
			}
		}
	},
	target: document.body
});