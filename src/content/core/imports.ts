import { splicer } from "$content/utils";
import Patcher from "./patcher";

interface GetObjectByKeyOptions {
	key: string;
	callback: (obj: any) => void;
	filter?: (obj: any) => boolean;
	once?: boolean;
}

const defineProperty = Object.defineProperty;
export function getObjectByKey({ key, callback, filter, once = true }: GetObjectByKeyOptions) {
    defineProperty(Object.prototype, key, {
        set(val) {
            // Use the normal value
            defineProperty(this, key, {
                value: val,
                enumerable: true,
                configurable: true,
                writable: true
            });
			
            if(filter && !filter(this)) return;

			if(once) delete Object.prototype[key];
            callback(this);
        },
		configurable: true
	});
}

let keyCallbacks = new Map<string, GetObjectByKeyOptions>();
export function getObjectByDefinedKey(options: GetObjectByKeyOptions) {
    keyCallbacks.set(options.key, options);
}

Patcher.after(null, Object, "defineProperty", (_, [obj, key]) => {
	const options = keyCallbacks.get(key);
	if(options) {
		if(options.filter && !options.filter(obj)) return;
		if(options.once) keyCallbacks.delete(key);
		options.callback(obj);
	}
});

interface ExportCallback {
	prefix: string;
	filter: (value: any) => boolean;
	callback: (value: any) => void;
}

export default class Imports {
	static init() {
		// The first time that mapDeps is called the proxy isn't used
		// So we get the used deps from the .map call later
		let nextMapImportsArray: string[] | null = null;
		Patcher.before(null, Array.prototype, "map", (thisVal) => {
			if(!nextMapImportsArray) return;

			for(let i = 0; i < thisVal.length; i++) {
				this.triggerImported(nextMapImportsArray[i]);
			}

			nextMapImportsArray = null;
		});

		getObjectByKey({
			key: "f",
			callback: (mapDeps) => {
				nextMapImportsArray = mapDeps.f;
				mapDeps.f = new Proxy(mapDeps.f, {
					get: (target, prop, receiver) => {
						const value = Reflect.get(target, prop, receiver);
						this.triggerImported(value);

						return value;
					}
				});
			},
			filter: (fn) => typeof fn === "function" && fn.name === "__vite__mapDeps",
			once: false
		});
	}

	static seen = new Set<string>();
	static exportCallbacks: ExportCallback[] = [];
	static triggerImported(url: string) {
		if(!url.endsWith(".js")) return;
		if(this.seen.has(url)) return;
		this.seen.add(url);

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