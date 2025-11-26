import type { DeleteResult, ScriptArrange, ScriptCreate, ScriptDelete, ScriptEdit, ScriptTryDelete, ScriptType } from "$types/messages";
import type { State } from "$types/state";
import Server from "$bg/net/server";
import { saveDebounced } from "$bg/state";
import Scripts from "$bg/scripts";
import { englishList } from "$shared/utils";

export default abstract class ScriptHandler {
    type: ScriptType;
    key: "plugins" | "libraries";

    constructor(type: ScriptType, key: "plugins" | "libraries") {
        this.type = type;
        this.key = key;
    }
    
    init() {
        Server.on(`${this.type}Edit`, this.onScriptEdit.bind(this));
        Server.on(`${this.type}Create`, this.onScriptCreate.bind(this));
        Server.on(`${this.type}Delete`, this.onScriptDelete.bind(this));
        Server.on(`${this.type}Arrange`, this.onScriptArrange.bind(this));
        Server.on(`${this.type}DeleteAll`, this.onScriptDeleteAll.bind(this));
        Server.onMessage(`${this.type}TryDelete`, this.onTryDelete.bind(this));
    }

    save() {
        saveDebounced(this.key);
    }

    onScriptEdit(state: State, message: ScriptEdit) {
        const index = state[this.key].findIndex((s) => s.name === message.name);
        if(index === -1) return;

        const script = state[this.key][index];
        script.code = message.code;
        script.name = message.newName;

        // Update scripts
        Scripts.delete(script.name);
        Scripts.createScript(this.type, script);

        this.save();
    }

    abstract onScriptCreate(state: State, message: ScriptCreate): void;

    onScriptDelete(state: State, message: ScriptDelete) {
        const index = state[this.key].findIndex((s) => s.name === message.name);
        if(index === -1) return;

        state[this.key].splice(index, 1);
        Scripts.delete(message.name);
        this.save();
    }

    onScriptArrange(state: State, message: ScriptArrange) {
        const newScripts = [];
        for(const name of message.order) {
            const script = state[this.key].find((s) => s.name === name);
            newScripts.push(script);
        }
        state[this.key] = newScripts;
        this.save();
    }

    onScriptDeleteAll(state: State) {
        Scripts.clearType(this.type);
        state[this.key] = [];
        this.save();
    }

    async onTryDelete(_: State, message: ScriptTryDelete, respond: (response: DeleteResult) => void) {
        const willDisable = Scripts.checkDependents(message.name);

        if(willDisable.length > 0 && !message.confirmed) {
            const names = englishList(willDisable);
            const msg = `Deleting ${message.name} will also disable ${names}. Continue?`;
            respond({ status: "confirm", message: msg });
            return;
        }

        // Disable dependents
        for(const name of willDisable) {
            await Server.executeAndSend("pluginToggled", { name, enabled: false });
        }

        Server.executeAndSend(`${this.type}Delete`, { name: message.name });
        respond({ status: "success" });
    }
}