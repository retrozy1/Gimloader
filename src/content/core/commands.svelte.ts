import { mountCommand } from "$content/ui/mount";

interface CommandOptions {
    text: string;
    group: string;
    keywords?: string[];
}

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

    addCommand(id: string | null, options: CommandOptions, callback: () => void) {
        // Find a unique value
        let value = options.text;
        let index = 2;
        while(this.callbacks[value]) {
            value = `${options.text} ${index}`;
            index++;
        }

        this.callbacks[value] = callback;

        const command: Command = {
            id, value,
            text: options.text,
            keywords: options.keywords
        }
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
        }
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