import ScriptManager from "./scriptManager.svelte";
import { Library } from "./library.svelte";
import type { LibraryInfo } from "$types/state";
import type { ScriptHeaders } from "$types/scripts";

export default new class LibraryManager extends ScriptManager<Library, LibraryInfo> {
    singular = "library";
    plural = "libraries";

    constructor() {
        super(Library, "library");
    }

    getScriptInfo(code: string, headers: ScriptHeaders) {
        return { code, name: headers.name };
    }
}

// import { parseScriptHeaders } from "$shared/parseHeader";
// import { Lib } from "./scripts.svelte";
// import type { LibraryInfo } from "$types/state";
// import Port from "$shared/net/port.svelte";
// import toast from "svelte-5-french-toast";
// import Rewriter from "../rewriter";
// import Modals from "../modals.svelte";
// import Commands from "../commands.svelte";

// export default new class LibManagerClass {
//     libs: Lib[] = $state([]);

//     init(libInfo: LibraryInfo[]) {
//         for(const info of libInfo) {
//             const lib = new Lib(info.script);

//             this.libs.push(lib);
//         }

//         Port.on("libraryEdit", ({ name, script, updated }) => this.editLib(name, script, false, updated));
//         Port.on("libraryDelete", ({ name }) => this.deleteLib(this.getLib(name), false));
//         Port.on("librariesDeleteAll", () => this.deleteAll());
//         Port.on("libraryCreate", ({ script }) => this.createLib(script, true, false));
//         Port.on("librariesArrange", ({ order }) => this.arrangeLibs(order, false));

//         Commands.addCommand(null, {
//             text: "Delete All Libraries",
//             keywords: ["remove all", "uninstall all"]
//         }, () => this.deleteAllConfirm());
//     }

//     updateState(libInfo: LibraryInfo[]) {
//         // check if any libraries were added
//         for(const info of libInfo) {
//             if(!this.getLib(info.name)) {
//                 this.createLib(info.script);
//             }
//         }

//         // check if any libraries were removed
//         for(const lib of this.libs) {
//             if(!libInfo.some(i => i.name === lib.headers.name)) {
//                 this.deleteLib(lib);
//             }
//         }

//         // check if any libraries were updated
//         for(const info of libInfo) {
//             const existing = this.getLib(info.name);
//             if(existing.script !== info.script) {
//                 this.editLib(existing, info.script);
//             }
//         }

//         // move the libraries into the correct order
//         const newOrder = [];
//         for(const info of libInfo) {
//             const setLib = this.getLib(info.name);
//             if(setLib) newOrder.push(setLib);
//         }

//         this.libs = newOrder;
//     }

//     get(libName: string) {
//         const lib = this.libs.find(lib => lib.headers.name === libName);
//         return lib?.library ?? null;
//     }

//     getLib(libName: string): Lib {
//         return this.libs.find((lib: Lib) => lib.headers.name === libName);
//     }

//     createLib(script: string, ignoreDuplicates = false, emit = true) {
//         const headers = parseScriptHeaders(script);

//         if(headers.isLibrary === "false") {
//             toast.error("That script doesn't appear to be a library! If it should be, please set the isLibrary header, and if not, please import it as a plugin.");
//             return;
//         }

//         const existing = this.getLib(headers.name);
//         if(existing && !ignoreDuplicates) {
//             const conf = confirm(`A library named ${headers.name} already exists! Do you want to overwrite it?`);
//             if(!conf) return;
//         }

//         if(existing) {
//             this.deleteLib(existing);
//         }

//         const lib = new Lib(script, headers);
//         this.libs.unshift(lib);

//         if(emit) {
//             Port.send("libraryCreate", { script, name: headers.name });
//             Rewriter.invalidate();
//         }

//         return lib;
//     }

//     deleteLib(lib: Lib, emit = true) {
//         if(!lib) return;

//         lib.stop();
//         lib.onDelete();
//         this.libs.splice(this.libs.indexOf(lib), 1);

//         if(emit) {
//             Port.send("libraryDelete", { name: lib.headers.name });
//             Rewriter.invalidate();
//         }
//     }

//     deleteAll(emit = true) {
//         for(const lib of this.libs) {
//             lib.stop();
//         }

//         this.libs = [];

//         if(emit) {
//             Port.send("librariesDeleteAll");
//             Rewriter.invalidate();
//         }
//     }

//     getLibHeaders(name: string) {
//         const lib = this.getLib(name);
//         if(!lib) return null;
//         return $state.snapshot(lib.headers);
//     }

//     isEnabled(name: string) {
//         const lib = this.getLib(name);
//         if(!lib) return null;
//         return lib.enablePromise !== null;
//     }

//     getLibNames(): string[] {
//         return this.libs.map(lib => lib.headers.name);
//     }

//     async editLib(library: Lib | string, script: string, emit = true, updated = false) {
//         const lib = typeof library === "string" ? this.getLib(library) : library;
//         if(!lib) return;

//         const headers = parseScriptHeaders(script);
//         if(updated && headers.changelog.length > 0) {
//             Modals.addUpdated(headers.name, headers.version, headers.changelog);
//         }

//         if(emit) {
//             Port.send("libraryEdit", { name: lib.headers.name, script, newName: headers.name });
//             Rewriter.invalidate();
//         }

//         if(lib.headers.name === headers.name) {
//             if(lib.usedBy.size > 0) {
//                 lib.stop();
//                 lib.script = script;

//                 await lib.start();
//             } else {
//                 lib.script = script;
//             }
//         } else {
//             lib.usedBy.clear();
//             lib.stop();
//             lib.script = script;
//         }

//         lib.headers = headers;
//     }

//     arrangeLibs(order: string[], emit = true) {
//         const newOrder = [];

//         for(const name of order) {
//             const lib = this.getLib(name);
//             if(lib) newOrder.push(lib);
//         }
//         this.libs = newOrder;

//         if(emit) Port.send("librariesArrange", { order });
//     }

//     deleteAllConfirm(shouldToast = true) {
//         if(this.libs.length === 0) {
//             toast.error("No libraries to delete");
//             return;
//         }

//         if(!confirm("Are you sure you want to delete all libraries?")) return;

//         this.deleteAll();
//         if(shouldToast) toast.success("Deleted all libraries");
//     }
// }();
