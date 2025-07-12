import { getObjectByKey, splicer } from "$content/utils";

interface ExportCallback {
	prefix: string;
	filter: (value: any) => boolean;
	callback: (value: any) => void;
}

export default class Imports {
	static seen = new Set<string>();

	static init() {
		getObjectByKey("f", (mapDeps) => {
			mapDeps.f = new Proxy(mapDeps.f, {
				get: (target, prop, receiver) => {
					const value = Reflect.get(target, prop, receiver);

					if(!this.seen.has(value)) {
						this.seen.add(value);
						this.triggerImported(value);
					}

					return value;
				}
			});
		}, (fn) => typeof fn === "function" && fn.name === "__vite__mapDeps");
	}

	static exportCallbacks: ExportCallback[] = [];
	static triggerImported(url: string) {
		if(!url.endsWith(".js")) return;
		url = url.replace("assets/", "");

		if(!this.exportCallbacks.some(obj => url.startsWith(obj.prefix))) return;

		const importUrl = `https://www.gimkit.com/assets/${url}`;
		import(importUrl).then((exports) => {
			const values = Object.values(exports);

			for(let i = 0; i < this.exportCallbacks.length; i++) {
				const obj = this.exportCallbacks[i];
				const value = values.find(obj.filter);

				if(!value) continue;

				obj.callback(value);
				this.exportCallbacks.splice(i, 1);
				i--;
			}
		});
	}

	static getExport(prefix: string, filter: (value: any) => boolean, callback: (value: any) => void) {
		const obj: ExportCallback = {
			prefix,
			filter,
			callback
		}

		this.exportCallbacks.push(obj);

		return splicer(this.exportCallbacks, obj);
	}

	static indexImport: Promise<any>;
	static async getIndexExport(filter: (value: any) => boolean, callback: (value: any) => void) {
		if(!this.indexImport) {
			this.indexImport = new Promise(async (res) => {
				if(document.readyState !== "complete") {
					await new Promise(res => document.addEventListener("DOMContentLoaded", res, { once: true }));
				}

				const script = document.querySelector<HTMLScriptElement>("script[src]");
				import(script.src).then(res);
			});
		}

		this.indexImport.then((exports) => {
			const value = Object.values(exports).find(filter);
			if(value) callback(value);
		});
	}
}