import type { Command, CommandAction, CommandCallback, CommandContext, CommandOptions } from "$types/commands";
import { mountCommand } from "$content/ui/mount";
import Hotkeys from "./hotkeys/hotkeys.svelte";

class CancelError extends Error {
    constructor() {
        super("Command cancelled by user");
    }
}

export default new class Commands {
    groups: Record<string, Command[]> = $state({});
    callbacks: Record<string, CommandCallback> = {};
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

    onSelect(value: string) {
        const action = this.action;
        if(action?.type === "select") {
            const selected = action.options.options.find(o => o.label === value);
            if(!selected) return;

            action.callback(selected.value);
            return;
        }

        this.startClose();
        const returned = this.callbacks[value]?.(this.context);

        // Automatically catch errors caused by the user cancelling
        if(returned instanceof Promise) {
            returned.catch((err) => {
                if(err instanceof CancelError) return;
                console.error("Error executing command:", err);
            });
        }
    }

    addCommand(id: string | null, options: CommandOptions, callback: CommandCallback) {
        // Find a unique value
        let value = options.text;
        let index = 2;
        while(this.callbacks[value]) {
            value = `${options.text} ${index}`;
            index++;
        }

        this.callbacks[value] = callback;

        const command: Command = {
            id,
            value,
            text: options.text,
            keywords: options.keywords
        };
        this.groups[options.group] ??= [];
        this.groups[options.group].push(command);

        return () => {
            const index = this.groups[options.group].findIndex(c => c.value === value);
            if(index !== -1) this.groups[options.group].splice(index, 1);

            delete this.callbacks[value];

            // If the group is empty, remove it
            if(this.groups[options.group].length === 0) {
                delete this.groups[options.group];
            }
        };
    }

    removeCommands(id: string) {
        for(const group in this.groups) {
            // Remove all commands with the given id
            for(let j = this.groups[group].length - 1; j >= 0; j--) {
                const command = this.groups[group][j];
                if(command.id !== id) continue;

                this.groups[group].splice(j, 1);
                delete this.callbacks[command.value];
            }

            // If the group is empty, remove it
            if(this.groups[group].length === 0) {
                delete this.groups[group];
            }
        }
    }
}();
