import { mountCommand } from "$content/ui/mount";
import { splicer } from "$content/utils";

interface Command {
    id: string | null;
    text: string;
    value: string;
    keywords?: string[];
}

export default new class Commands {
    groups: Record<string, Command[]> = $state({});
    callbacks: Record<string, () => void> = {};

    init() {
        mountCommand();
    }

    onSelect(value: string) {
        this.callbacks[value]?.();
    }

    addCommand(id: string | null, group: string, text: string, callback: () => void) {
        // Find a unique value
        let value = text;
        let index = 2;
        while(this.callbacks[value]) {
            value = `${text} ${index}`;
            index++;
        }

        this.callbacks[value] = callback;
        this.groups[group] ??= [];

        return splicer(this.groups[group], { id, text, value });
    }

    removeCommands(id: string) {
        for(let group in this.groups) {
            // Remove all commands with the given id
            for(let j = this.groups[group].length - 1; j >= 0; j--) {
                let command = this.groups[group][j];
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
}