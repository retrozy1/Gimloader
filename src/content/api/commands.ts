import Commands from "$content/core/commands.svelte";
import { validate } from "$content/utils";
import type { CommandCallback, CommandOptions } from "$types/commands";

/**
 * An API for adding commands to the command palette
 * @example
 * ```ts
 * commands.addCommand("MyPlugin", {
 *     text: "Do a thing",
 *     group: "My Plugin",
 *     keywords: ["execute", "run"]
 * }, async (context) => {
 *    const choice = await context.select({
 *        title: "Choose an option",
 *        options: [
 *           { label: "Option 1", value: "one" },
 *           { label: "Option 2", value: "two" }
 *        ]
 *    });
 *    const number = await context.number({
 *       title: "Pick a number"
 *       min: 1,
 *       max: 10,
 *       decimal: true
 *    });
 *    const string = await context.string({
 *       title: "Enter a string",
 *       maxLength: 20
 *    });
 * 
 *    console.log("User chose:", { choice, number, string });
 * });
 * ```
 */
export class CommandsApi {
    /** Adds a command to the user's command palette. Can request additional input within the callback. */
    addCommand(id: string, options: CommandOptions, callback: CommandCallback) {
        if(!validate("commands.addCommand", arguments,
            ["id", "string"], ["options", "object"], ["callback", "function"])) return;

        return Commands.addCommand(id, options, callback);
    }

    /** Removes all commands that were added with the same id */
    removeCommands(id: string) {
        if(!validate("commands.removeCommands", arguments, ["id", "string"])) return;

        Commands.removeCommands(id);
    }
}

/**
 * An API for adding commands to the command palette
 * @example
 * ```ts
 * commands.addCommand({
 *     text: "Do a thing",
 *     group: "My Plugin",
 *     keywords: ["execute", "run"]
 * }, async (context) => {
 *    const choice = await context.select({
 *        title: "Choose an option",
 *        options: [
 *           { label: "Option 1", value: "one" },
 *           { label: "Option 2", value: "two" }
 *        ]
 *    });
 *    const number = await context.number({
 *       title: "Pick a number"
 *       min: 1,
 *       max: 10,
 *       decimal: true
 *    });
 *    const string = await context.string({
 *       title: "Enter a string",
 *       maxLength: 20
 *    });
 * 
 *    console.log("User chose:", { choice, number, string });
 * });
 * ```
 */
export class ScopedCommandsApi {
    constructor(private readonly id: string) {}

    /** Adds a command to the user's command palette. Can request additional input within the callback. */
    addCommand(options: CommandOptions, callback: CommandCallback) {
        if(!validate("commands.addCommand", arguments,
            ["options", "object"], ["callback", "function"])) return;

        return Commands.addCommand(this.id, options, callback);
    }
}