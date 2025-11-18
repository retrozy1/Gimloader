export interface CommandOptions {
    text: string;
    group: string;
    keywords?: string[];
}

export interface Command {
    id: string | null;
    text: string;
    value: string;
    keywords?: string[];
}

export interface BaseCommandOptions {
    title: string;
}

export interface CommandSelectOptions extends BaseCommandOptions {
    options: { label: string; value: string }[];
}

export interface CommandNumberOptions extends BaseCommandOptions {
    min?: number;
    max?: number;
    decimal?: boolean;
}

export interface CommandStringOptions extends BaseCommandOptions {
    maxLength?: number;
}

export interface CommandContext {
    select(options: CommandSelectOptions): Promise<string>;
    number(options: CommandNumberOptions): Promise<number>;
    string(options: CommandStringOptions): Promise<string>;
}

export type CommandCallback = (context: CommandContext) => void | Promise<void>;

export interface BaseCommandAction<T> {
    callback: (value: T) => void;
    cancel: () => void;
}

export interface CommandSelectAction extends BaseCommandAction<string> {
    type: "select";
    options: CommandSelectOptions;
}

export interface CommandNumberAction extends BaseCommandAction<number> {
    type: "number";
    options: CommandNumberOptions;
}

export interface CommandStringAction extends BaseCommandAction<string> {
    type: "string";
    options: CommandStringOptions;
}

export type CommandAction = CommandSelectAction | CommandNumberAction | CommandStringAction;
