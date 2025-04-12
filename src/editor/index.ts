import * as monaco from 'monaco-editor';
import types from "./gimloaderTypes.txt";
import { mount } from 'svelte';
import Editor from './Editor.svelte';
import styles from "../shared/tailwind.scss";

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

mount(Editor, { target: document.body });