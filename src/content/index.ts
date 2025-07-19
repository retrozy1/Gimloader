import Api from "./api/api";
import Net from "$core/net/net";
import UI from "$core/ui/ui";
import GimkitInternals from "$core/internals";
import { log } from "./utils";
import Port from "$shared/port.svelte";
import { version } from "../../package.json";
import { fixRDT } from "$core/rdt";
import StateManager from "$core/state";
import ReloadConfirm from "$core/reloadConfirm.svelte";
import Rewriter from "./core/rewriter";

Object.defineProperty(window, "GL", {
    value: Api,
    writable: false,
    configurable: false
});

UI.init();
Net.init();
GimkitInternals.init();
StateManager.init();
ReloadConfirm.init();

Port.init((state) => {
    StateManager.initState(state);
}, (state) => {
    log("Resynchronizing with state", state);
    StateManager.syncWithState(state);
}, "game");

fixRDT();

log(`Gimloader v${version} loaded`);