import type { BaseFunction, FunctionKeys, PatcherAfterCallback, PatcherBeforeCallback, PatcherInsteadCallback, PatcherSwapCallback } from "$types/api/patcher";
import Patcher, { type PatchOptions } from "$core/patcher";
import { validate } from "$content/utils";
import * as z from "zod";

const PatchOptionsSchema = z.strictObject({
    once: z.boolean().optional()
});

function checkMethod(fnName: string, object: object, method: PropertyKey) {
    const type = typeof object?.[method as keyof typeof object];
    if(type === "function") return;

    throw new Error(`${fnName} expected object.${String(method)} to be a function, but got ${type}`);
}

/** Functions for intercepting the arguments and return values of functions */
class PatcherApi {
    readonly #id: string;

    constructor(id: string) {
        this.#id = id;
    }

    /**
     * Runs a callback after a function on an object has been run
     * @returns A function to remove the patch
     * @example
     * ```js
     * const object = { method: () => 100 };
     * api.patcher.after(object, "method", (thisVal, args, returnVal) => {
     *     console.log("Came after:", returnVal);
     * });
     *
     * object.method(); // Logs "Came after: 100"
     * ```
     */
    after<O extends object, K extends FunctionKeys<O>>(
        object: O,
        method: K,
        callback: PatcherAfterCallback<O[K]>,
        options?: PatchOptions
    ) {
        validate("patcher.after", arguments, ["object", "any"], ["method", "string"], ["callback", "function"], ["options?", PatchOptionsSchema]);
        checkMethod("patcher.after", object, method);

        return Patcher.after(this.#id, object, method, callback, options);
    }

    /**
     * Runs a callback before a function on an object has been run.
     * Return true from the callback to prevent the function from running
     * @returns A function to remove the patch
     * @example
     * ```js
     * const object = { method: (arg1, arg2) => 100 };
     * api.patcher.before(object, "method", (thisVal, args) => {
     *     console.log("Came before:", args);
     * });
     *
     * object.method(5, 6); // Logs "Came before: [5, 6]"
     * ```
     */
    before<O extends object, K extends FunctionKeys<O>>(
        object: O,
        method: K,
        callback: PatcherBeforeCallback<O[K]>,
        options?: PatchOptions
    ) {
        validate("patcher.before", arguments, ["object", "any"], ["method", "string"], ["callback", "function"], ["options?", PatchOptionsSchema]);
        checkMethod("patcher.before", object, method);

        return Patcher.before(this.#id, object, method, callback, options);
    }

    /**
     * Runs a function instead of a function on an object
     * @returns A function to remove the patch
     * @example
     * ```js
     * const object = { method: (arg1, arg2) => 100 };
     * api.patcher.instead(object, "method", (thisVal, args) => {
     *     return args[0] + args[1];
     * });
     *
     * console.log(object.method(5, 6)); // Logs "11" instead of "100"
     * ```
     */
    instead<O extends object, K extends FunctionKeys<O>>(
        object: O,
        method: K,
        callback: PatcherInsteadCallback<O[K]>,
        options?: PatchOptions
    ) {
        validate("patcher.instead", arguments, ["object", "any"], ["method", "string"], ["callback", "function"], ["options?", PatchOptionsSchema]);
        checkMethod("patcher.instead", object, method);

        return Patcher.instead(this.#id, object, method, callback, options);
    }

    /**
     * Replaces a function on an object with another function
     * @returns A function to remove the patch
     * @example
     * ```js
     * const object = { method: (arg1, arg2) => 100 };
     * api.patcher.swap(object, "method", (arg1, arg2) => {
     *     return arg1 + arg2;
     * });
     *
     * console.log(object.method(5, 6)); // Logs "11" instead of "100"
     * ```
     */
    swap<O extends object, K extends FunctionKeys<O>>(
        object: O,
        method: K,
        callback: PatcherSwapCallback<O[K]>,
        options?: PatchOptions
    ) {
        validate("patcher.swap", arguments, ["object", "any"], ["method", "string"], ["callback", "function"], ["options?", PatchOptionsSchema]);
        checkMethod("patcher.swap", object, method);

        return Patcher.swap(this.#id, object, method, callback, options);
    }

    /**
     * Runs a callback after a React component has been run without changing the reference to the original component.
     * @returns A function to remove the patch
     * @example
     * ```js
     * const ReactComponent = () => {...}; // A React component used by Gimkit, likely gotten through `api.rewriter.exposeVar`
     * api.patcher.afterReact(ReactComponent, (thisVal, args, returnVal) => {
     *     console.log("Came after:", returnVal); // Logs once the component is rendered
     * });
     * ```
     */
    afterReact<F extends BaseFunction>(component: F, callback: PatcherAfterCallback<F>, options?: PatchOptions) {
        validate("patcher.afterReact", arguments, ["func", "function"], ["callback", "function"], ["options?", PatchOptionsSchema]);

        return Patcher.afterReact(this.#id, component, callback, options);
    }

    /**
     * Runs a callback before a React component is run without changing the reference to the original component.
     * Return true from the callback to prevent the component from running
     * @returns A function to remove the patch
     * @example
     * ```js
     * const ReactComponent = () => {...}; // A React component used by Gimkit, likely gotten through `api.rewriter.exposeVar`
     * api.patcher.beforeReact(ReactComponent, (thisVal, args) => {
     *     console.log("Came before:", args); // Logs before the component is rendered
     * });
     * ```
     */
    beforeReact<F extends BaseFunction>(component: F, callback: PatcherBeforeCallback<F>, options?: PatchOptions) {
        validate("patcher.beforeReact", arguments, ["func", "function"], ["callback", "function"], ["options?", PatchOptionsSchema]);

        return Patcher.beforeReact(this.#id, component, callback, options);
    }

    /**
     * Runs a callback instead of a React component without changing the reference to the original component.
     * @returns A function to remove the patch
     * @example
     * ```js
     * const ReactComponent = () => {...}; // A React component used by Gimkit, likely gotten through `api.rewriter.exposeVar`
     * api.patcher.insteadReact(ReactComponent, (thisVal, args) => {
     *     return GL.React.createElement("div", null, "New component!");
     * });
     * ```
     */
    insteadReact<F extends BaseFunction>(component: F, callback: PatcherInsteadCallback<F>, options?: PatchOptions) {
        validate("patcher.insteadReact", arguments, ["func", "function"], ["callback", "function"], ["options?", PatchOptionsSchema]);

        return Patcher.insteadReact(this.#id, component, callback, options);
    }

    /**
     * Swaps a React component with another React component without changing the reference to the original component.
     * @returns A function to remove the patch
     * @example
     * ```js
     * const ReactComponent = () => {...}; // A React component used by Gimkit, likely gotten through `api.rewriter.exposeVar`
     * api.patcher.insteadReact(ReactComponent, (arg1, arg2) => {
     *     return GL.React.createElement("div", null, "New component!");
     * });
     * ```
     */
    swapReact<F extends BaseFunction>(component: F, callback: PatcherSwapCallback<F>, options?: PatchOptions) {
        validate("patcher.swapReact", arguments, ["func", "function"], ["callback", "function"], ["options?", PatchOptionsSchema]);

        return Patcher.swapReact(this.#id, component, callback, options);
    }
}
Object.freeze(PatcherApi);
Object.freeze(PatcherApi.prototype);
export default PatcherApi;
