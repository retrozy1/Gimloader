import { nop } from "$shared/utils";
import type { BaseFunction, FunctionKeys, PatcherAfterCallback, PatcherBeforeCallback, PatcherInsteadCallback, PatcherSwapCallback } from "$types/api/patcher";
import Cleanup from "./scripts/cleanup";

export interface PatchOptions {
    once?: boolean;
}

export interface BasePatch extends PatchOptions {
    cleanup?: () => void;
}

export interface BeforePatch extends BasePatch {
    type: "before";
    callback: PatcherBeforeCallback<any>;
}

export interface AfterPatch extends BasePatch {
    type: "after";
    callback: PatcherAfterCallback<any>;
}

export interface InsteadPatch extends BasePatch {
    type: "instead";
    callback: PatcherInsteadCallback<any>;
}

export interface SwapPatch extends BasePatch {
    type: "swap";
    callback: PatcherSwapCallback<any>;
}

type Patch = BeforePatch | AfterPatch | InsteadPatch | SwapPatch;

interface PatchedProperty {
    original: any;
    patches: Patch[];
}

const originalSymbol = Symbol("originalFunction");
const patchesSymbol = Symbol("patches");

export default class Patcher {
    static patches = new WeakMap<object, Map<PropertyKey, PatchedProperty>>();
    static reactPatches = new WeakMap<BaseFunction, Patch[]>();

    static applyPatches(object: any, property: PropertyKey) {
        const properties = this.patches.get(object);
        if(!properties) return;

        const patches = properties.get(property);
        if(!patches) return;

        delete object[property];
        const reapply = this.applyPatches.bind(this, object, property);

        if(patches.patches.length === 0) {
            object[property] = patches.original;
            this.applyReactPatches(patches.original, patches.original);
            return;
        }

        const newFunction = createPatchedFunction(patches.patches, patches.original, reapply) as any;

        // copy over prototypes and attributes
        for(const key of Object.getOwnPropertyNames(patches.original)) {
            try {
                newFunction[key] = patches.original[key];
            } catch {}
        }

        Object.setPrototypeOf(newFunction, Object.getPrototypeOf(patches.original));
        newFunction.toString = () => patches.original.toString();

        // Show what the patches/original were for react patching and debugging
        newFunction[originalSymbol] = patches.original;
        newFunction[patchesSymbol] = patches;

        this.applyReactPatches(newFunction, patches.original);
        object[property] = newFunction;
    }

    static applyReactPatches(component: any, original: any) {
        const patches = this.reactPatches.get(original);
        if(!patches) return;

        const reapply = this.applyReactPatches.bind(this, component, original);

        if(patches.length === 0) {
            delete component.__overrideReact;
            delete original.__overrideReact;
        } else {
            component.__overrideReact = createPatchedFunction(patches, original, reapply);
        }
    }

    static addPatch(id: string | null, object: any, property: PropertyKey, patch: Patch) {
        if(!this.patches.has(object)) this.patches.set(object, new Map());

        const properties = this.patches.get(object);
        if(!properties) return nop;

        if(!properties.has(property)) {
            properties.set(property, { original: object[property], patches: [] });
        }

        const patches = properties.get(property);
        if(!patches) return nop;

        patches.patches.push(patch);
        this.applyPatches(object, property);

        const cleanup = Cleanup.manualOrAutoCleanup(id, () => {
            const index = patches.patches.indexOf(patch);
            if(index === -1) return;

            patches.patches.splice(index, 1);
            this.applyPatches(object, property);

            if(patches.patches.length > 0) return;
            properties.delete(property);

            if(properties.size > 0) return;
            this.patches.delete(object);
        });

        patch.cleanup = cleanup;
        return cleanup;
    }

    static addReactPatch(id: string | null, component: any, patch: Patch) {
        const originalFunction = component[originalSymbol] ?? component;
        if(!this.reactPatches.has(originalFunction)) this.reactPatches.set(originalFunction, []);

        const patches = this.reactPatches.get(originalFunction);
        if(!patches) return nop;

        patches.push(patch);
        this.applyReactPatches(component, originalFunction);

        const cleanup = Cleanup.manualOrAutoCleanup(id, () => {
            const index = patches.indexOf(patch);
            if(index === -1) return;

            patches.splice(index, 1);
            this.applyReactPatches(component, originalFunction);

            if(patches.length > 0) return;
            this.reactPatches.delete(originalFunction);
        });

        patch.cleanup = cleanup;
        return cleanup;
    }

    static after<O extends object, K extends FunctionKeys<O>>(
        id: string | null,
        object: O,
        property: K,
        callback: PatcherAfterCallback<O[K]>,
        options: PatchOptions = {}
    ) {
        const patch: Patch = { ...options, callback, type: "after" };

        return this.addPatch(id, object, property, patch);
    }

    static before<O extends object, K extends FunctionKeys<O>>(
        id: string | null,
        object: O,
        property: K,
        callback: PatcherBeforeCallback<O[K]>,
        options: PatchOptions = {}
    ) {
        const patch: Patch = { ...options, callback, type: "before" };

        return this.addPatch(id, object, property, patch);
    }

    static instead<O extends object, K extends FunctionKeys<O>>(
        id: string | null,
        object: O,
        property: K,
        callback: PatcherInsteadCallback<O[K]>,
        options: PatchOptions = {}
    ) {
        const patch: Patch = { ...options, callback, type: "instead" };

        return this.addPatch(id, object, property, patch);
    }

    static swap<O extends object, K extends FunctionKeys<O>>(
        id: string | null,
        object: O,
        property: K,
        callback: PatcherSwapCallback<O[K]>,
        options: PatchOptions = {}
    ) {
        const patch: Patch = { ...options, callback, type: "swap" };

        return this.addPatch(id, object, property, patch);
    }

    static afterReact<F extends BaseFunction>(
        id: string | null,
        component: F,
        callback: PatcherAfterCallback<F>,
        options: PatchOptions = {}
    ) {
        const patch: Patch = { ...options, callback, type: "after" };

        return this.addReactPatch(id, component, patch);
    }

    static beforeReact<F extends BaseFunction>(
        id: string | null,
        component: F,
        callback: PatcherBeforeCallback<F>,
        options: PatchOptions = {}
    ) {
        const patch: Patch = { ...options, callback, type: "before" };

        return this.addReactPatch(id, component, patch);
    }

    static insteadReact<F extends BaseFunction>(
        id: string | null,
        component: F,
        callback: PatcherBeforeCallback<F>,
        options: PatchOptions = {}
    ) {
        const patch: Patch = { ...options, callback, type: "before" };

        return this.addReactPatch(id, component, patch);
    }

    static swapReact<F extends BaseFunction>(
        id: string | null,
        component: F,
        callback: PatcherSwapCallback<F>,
        options: PatchOptions = {}
    ) {
        const patch: Patch = { ...options, callback, type: "swap" };

        return this.addReactPatch(id, component, patch);
    }
}

function createPatchedFunction(patches: Patch[], original: any, reapply: () => void) {
    return function PatchedFunction(this: any) {
        const initialNumPatches = patches.length;
        let shouldRunOriginal = true;
        let returnValue: any;
        let patchIndex = patches.length - 1;

        // Run patches in reverse order
        for(; patchIndex >= 0; patchIndex--) {
            const patch = patches[patchIndex];
            if(patch.type === "after") continue;

            if(patch.once) {
                patches.splice(patchIndex, 1);
                patch.cleanup?.();
            }

            if(patch.type === "before") {
                const cancel = patch.callback(this, arguments as any);
                if(cancel) {
                    if(patches.length !== initialNumPatches) reapply();
                    return;
                }
            } else if(patch.type === "instead") {
                returnValue = patch.callback(this, arguments as any);
                shouldRunOriginal = false;
                break;
            } else if(patch.type === "swap") {
                returnValue = patch.callback.apply(this, arguments as any);
                shouldRunOriginal = false;
                break;
            }
        }

        if(shouldRunOriginal) returnValue = original.apply(this, arguments);
        if(patchIndex < 0) patchIndex = 0;

        // Go back up the stack for after patches
        for(; patchIndex < patches.length; patchIndex++) {
            const patch = patches[patchIndex];
            if(patch.type !== "after") continue;

            if(patch.once) {
                patches.splice(patchIndex, 1);
                patch.cleanup?.();
                patchIndex--;
            }

            const newReturn = patch.callback(this, arguments as any, returnValue);
            if(newReturn) returnValue = newReturn;
        }

        if(patches.length !== initialNumPatches) reapply();
        return returnValue;
    };
}
