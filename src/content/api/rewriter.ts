import Rewriter from "$content/core/rewriter";
import { validate } from "$content/utils";

/**
 * The rewriter API allows you to modify the bundled code of Gimkit in order to expose values
 * or change certain behaviors. Due to the unpredictable nature of bundling, you cannot assume that variable names
 * will remain the same beteen updates.
 * @example
 * ```js
 * const callback = GL.Rewriter.createShared("uniqueId", (val) => {
 *  console.log(val);
 * });
 * 
 * GL.Rewriter.addParseHook("index", (code) => {
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
     * @param prefix Limits the hook to only running on scripts beginning with this prefix.
     * Passing `true` will only run on the index script, and passing `false` will run on all scripts.
     * @param callback The function that will modify the code. Should return the modified code. Cannot have side effects.
     */
    addParseHook(prefix: string | boolean, callback: (code: string) => string) {
        if(!validate("rewriter.addParseHook", arguments,
            ['prefix', 'string|boolean'], ['callback', 'function'])) return;

        Rewriter.addParseHook(prefix, callback);
    }

    /**
     * Creates a shared value that can be accessed from any script.
     * @id A unique identifier for the shared value. This cannot be shared with Gimloader or other scripts.
     * @value The value to be shared.
     * @returns A string representing the code to access the shared value.
     */
    createShared(id: string, value: any) {
        if(!validate("rewriter.createShared", arguments,
            ['id', 'string'], ['value', 'any'])) return;

        return Rewriter.createShared(id, value);
    }

    /**
     * Similar to {@link createShared}, but the value is gotten from a function.
     * This function is run only once, and the value is cached.
     * @param id A unique identifier for the shared value. This cannot be shared with Gimloader or other scripts.
     * @param getter The function that will return the value to be shared.
     * @return A string representing the code to access the shared value.
     */
    createMemoized(id: string, getter: () => any) {
        if(!validate("rewriter.createMemoized", arguments,
            ['id', 'string'], ['getter', 'function'])) return;

        return Rewriter.createMemoized(id, getter);
    }

    /**
     * A wrapper around {@link addParseHook} that runs a callback with the value of an object found within the code.
     * @param prefix Limits the hook to only running on scripts beginning with this prefix.
     * Passing `true` will only run on the index script, and passing `false` will run on all scripts.
     * @param id A unique identifier for the shared value that will be used for the callback. This cannot be shared with Gimloader or other scripts.
     * @param substring A substring to search for within the object in the code. Should be in the top level of the object.
     * @param callback The function that will be run with the value of the object.
     * @example
     * // Gets GL.stores
     * GL.Rewriter.exposeObject("FixSpinePlugin", "stores", "assignment:new", (stores) => {})
     */
    exposeObject(prefix: string | boolean, id: string, substring: string, callback: (...args: any[]) => void) {
        if(!validate("rewriter.exposeObject", arguments,
            ['prefix', 'string|boolean'], ['id', 'string'], ['substring', 'string'], ['callback', 'function'])) return;

        Rewriter.exposeObject(prefix, id, substring, callback);
    }

    /**
     * A wrapper around {@link addParseHook} that runs a callback with the value of an object in front of a substring found within the code.
     * @param prefix Limits the hook to only running on scripts beginning with this prefix.
     * Passing `true` will only run on the index script, and passing `false` will run on all scripts.
     * @param id A unique identifier for the shared value that will be used for the callback. This cannot be shared with Gimloader or other scripts.
     * @param substring A substring to search for within the object in the code. Should be in the top level of the object.
     * @param callback The function that will be run with the value of the object.
     * @example
     * // Gets the colyseus/blueboat client object
     * GL.Rewriter.exposeObjectByAssignment("index", "netClient", ".Client=", (mod) => {
     */
    exposeObjectBefore(prefix: string | boolean, id: string, substring: string, callback: (val: any) => void) {
        if(!validate("rewriter.exposeObjectBefore", arguments,
            ['prefix', 'string|boolean'], ['id', 'string'], ['substring', 'string'], ['callback', 'function'])) return;

        Rewriter.exposeObjectBefore(prefix, id, substring, callback);
    }

    /**
     * Replaces all text in a string between two substrings with another string.
     */
    replaceBetween(text: string, start: string, end: string, withText: string) {
        if(!validate("rewriter.replaceBetween", arguments,
            ['text', 'string'], ['start', 'string'], ['end', 'string'], ['withText', 'string'])) return;

        return Rewriter.replaceBetween(text, start, end, withText);
    }

    /**
     * Inserts text after a substring in a string.
     */
    insertAfter(text: string, after: string, withText: string) {
        if(!validate("rewriter.insertAfter", arguments,
            ['text', 'string'], ['after', 'string'], ['withText', 'string'])) return;

        return Rewriter.insertAfter(text, after, withText);
    }
}

Object.freeze(RewriterApi);
Object.freeze(RewriterApi.prototype);
export { RewriterApi };