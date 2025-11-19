import type { Command, CommandAction, CommandCallback, CommandContext, CommandOptions } from "$types/commands";
import { mountCommand } from "$content/ui/mount";
import Hotkeys from "./hotkeys/hotkeys.svelte";
import { clearId } from "$content/utils";

class CancelError extends Error {
    constructor() {
        super("Command cancelled by user");
    }
}

export default new class Commands {
    commands: Command[] = $state([]);
    action: CommandAction | null = $state(null);
    context: CommandContext;
    open = $state(false);

    init() {
        mountCommand();

        Hotkeys.addConfigurableHotkey("openCommandPalette", {
            category: "Gimloader",
            title: "Open Command Palette",
            preventDefault: true,
            default: {
                key: "KeyP",
                ctrl: true,
                shift: true,
                alt: false
            }
        }, () => this.startOpen());

        const createAction = <T extends CommandAction, R>(type: T["type"], options: T["options"]) => {
            this.startOpen();

            return new Promise<R>((res, rej) => {
                this.action = {
                    type,
                    options,
                    callback: (value: R) => {
                        this.startClose();
                        res(value);
                    },
                    cancel: () => {
                        rej(new CancelError());
                    }
                } as T;
            });
        };

        this.context = {
            select: (options) => createAction("select", options),
            number: (options) => createAction("number", options),
            string: (options) => createAction("string", options)
        };
    }

    closeTimeout?: ReturnType<typeof setTimeout>;
    startClose() {
        this.closeTimeout = setTimeout(() => {
            this.open = false;
        }, 20);
    }

    startOpen() {
        if(this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = undefined;
        }

        this.open = true;
    }

    onClosed() {
        if(!this.action) return;

        this.action.cancel();
        this.action = null;
    }

    commandIdentifier = 0;
    addCommand(id: string | null, options: CommandOptions | string, callback: CommandCallback) {
        const identifier = this.commandIdentifier++;

        if(typeof options === "string") {
            this.commands.push({
                text: options,
                id,
                identifier,
                callback
            });
        } else {
            this.commands.push({
                ...options,
                id,
                identifier,
                callback
            });
        }

        return () => {
            const index = this.commands.findIndex(c => c.identifier === identifier);
            if(index === -1) return;

            this.commands.splice(index, 1);
        }
    }

    runCommand(callback: CommandCallback) {
        this.startClose();
        try {
            callback(this.context);
        } catch(e) {
            if(e instanceof CancelError) return;

            throw e;
        }
    }

    removeCommands(id: string) { clearId(this.commands, id) }
}();
