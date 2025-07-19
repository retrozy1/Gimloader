import Rewriter from "$content/core/rewriter";
import { validate } from "$content/utils";

/**
 * The rewriter API allows you to modify the bundled code of Gimkit in order to expose values
 * or change certain behaviors. Due to the unpredictable nature of bundling, you cannot assume that variable names
 * will remain the same beteen updates.
 * @example
 * ```js
 * const callback = GL.Rewriter.createShared("MyPlugin", "uniqueId", (val) => {
 *  console.log(val);
 * });
 * 
 * GL.Rewriter.addParseHook("MyPlugin", "index", (code) => {
 *  let index = code.indexOf("something");
 *  code = code.slice(0, index) + `console.log("something else")` + code.slice(index);
 *  code += `${callback}(someVar)`;
 *  return code;
 * });
 * ```
 */
class RewriterApi {
    /**
     * Creates a hook that will modify the code of a script before it is run.
     * This value is cached, so this hook may not run on subsequent page loads.
     * addParseHook should always be called in the top level of a script.
     * @param pluginName The name of the plugin creating the hook.
     * @param prefix Limits the hook to only running on scripts beginning with this prefix.
     * Passing `true` will only run on the index script, and passing `false` will run on all scripts.
     * @param callback The function that will modify the code. Should return the modified code. Cannot have side effects.
     */
    addParseHook(pluginName: string, prefix: string | boolean, callback: (code: string) => string) {
        if(!validate("rewriter.addParseHook", arguments,
            ['pluginName', 'string'], ['prefix', 'string|boolean'], ['callback', 'function'])) return;

        return Rewriter.addParseHook(pluginName, prefix, callback);
    }

    /** Removes all hooks created by a certain plugin */
    removeParseHooks(pluginName: string) {
        if(!validate("rewriter.removeParseHooks", arguments, ['pluginName', 'string'])) return;

        Rewriter.removeParseHooks(pluginName);
    }

    /**
     * Creates a shared value that can be accessed from any script.
     * @param pluginName The name of the plugin creating the shared value.
     * @param id A unique identifier for the shared value.
     * @param value The value to be shared.
     * @returns A string representing the code to access the shared value.
     */
    createShared(pluginName: string, id: string, value: any) {
        if(!validate("rewriter.createShared", arguments,
            ['pluginName', 'string'], ['id', 'string'], ['value', 'any'])) return;

        return Rewriter.createShared(pluginName, id, value);
    }

    /** Removes all values created by {@link createShared} by a certain plugin */
    removeShared(pluginName: string) {
        if(!validate("rewriter.removeShared", arguments, ['pluginName', 'string'])) return;

        this.removeShared(pluginName);
    }

    /** Removes the shared value with a certain id created by {@link createShared} */
    removeSharedById(pluginName: string, id: string) {
        if(!validate("rewriter.removeSharedById", arguments,
            ['pluginName', 'string'], ['id', 'string'])) return;

        Rewriter.removeSharedById(pluginName, id);
    }
}

/**
 * The rewriter API allows you to modify the bundled code of Gimkit in order to expose values
 * or change certain behaviors. Due to the unpredictable nature of bundling, you cannot assume that variable names
 * will remain the same beteen updates.
 * @example
 * ```js
 * const api = new GL();
 * 
 * const callback = api.Rewriter.createShared("uniqueId", (val) => {
 *  console.log(val);
 * });
 * 
 * api.Rewriter.addParseHook("index", (code) => {
 *  let index = code.indexOf("something");
 *  code = code.slice(0, index) + `console.log("something else")` + code.slice(index);
 *  code += `${callback}(someVar)`;
 *  return code;
 * });
 * ```
 */
class ScopedRewriterApi {
    constructor(private readonly id: string) {}

    /**
     * Creates a hook that will modify the code of a script before it is run.
     * This value is cached, so this hook may not run on subsequent page loads.
     * addParseHook should always be called in the top level of a script.
     * @param prefix Limits the hook to only running on scripts beginning with this prefix.
     * Passing `true` will only run on the index script, and passing `false` will run on all scripts.
     * @param callback The function that will modify the code. Should return the modified code. Cannot have side effects.
     */
    addParseHook(prefix: string | boolean, callback: (code: string) => string) {
        if(!validate("rewriter.addParseHook", arguments,
            ['prefix', 'string|boolean'], ['callback', 'function'])) return;

        return Rewriter.addParseHook(this.id, prefix, callback);
    }

    /**
     * Creates a shared value that can be accessed from any script.
     * @param id A unique identifier for the shared value.
     * @param value The value to be shared.
     * @returns A string representing the code to access the shared value.
     */
    createShared(id: string, value: any) {
        if(!validate("rewriter.createShared", arguments,
            ['id', 'string'], ['value', 'any'])) return;

        return Rewriter.createShared(this.id, id, value);
    }

    /** Removes the shared value with a certain id created by {@link createShared} */
    removeSharedById(id: string) {
        if(!validate("rewriter.removeSharedById", arguments, ['id', 'string'])) return;

        Rewriter.removeSharedById(this.id, id);
    }
}

Object.freeze(RewriterApi);
Object.freeze(RewriterApi.prototype);
Object.freeze(ScopedRewriterApi);
Object.freeze(ScopedRewriterApi.prototype);
export { RewriterApi, ScopedRewriterApi };