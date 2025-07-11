class BaseParcelApi {
    /**
     * Gets a module based on a filter, returns null if none are found
     * Be cautious when using this- plugins will often run before any modules load in,
     * meaning that if this is run on startup it will likely return nothing.
     * Consider using getLazy instead.
     */
    query(): any {}
    
    /**
     * Returns an array of all loaded modules matching a filter
     * Be cautious when using this- plugins will often run before any modules load in,
     * meaning that if this is run on startup it will likely return nothing.
     * Consider using getLazy instead.
     */
    queryAll(): any[] { return [] }
}

class ParcelApi extends BaseParcelApi {
    /** 
     * Waits for a module to be loaded, then runs a callback
     * @returns A function to cancel waiting for the module
     */
    getLazy() {
        return () => {};
    }

    /** Cancels any calls to getLazy with the same id */
    stopLazy() {}

    /**
     * @deprecated Use {@link getLazy} instead
     * @hidden
     */
    get interceptRequire() { return this.getLazy };
    
    /**
     * @deprecated Use {@link stopLazy} instead
     * @hidden
     */
    get stopIntercepts() { return this.stopLazy };
}

class ScopedParcelApi extends BaseParcelApi {
    constructor(private readonly id: string) { super() }
    
    /** 
     * Waits for a module to be loaded, then runs a callback
     * @returns A function to cancel waiting for the module
     */
    getLazy() {
        return () => {};
    }
}

Object.freeze(BaseParcelApi);
Object.freeze(BaseParcelApi.prototype);
Object.freeze(ParcelApi);
Object.freeze(ParcelApi.prototype);
Object.freeze(ScopedParcelApi);
Object.freeze(ScopedParcelApi.prototype);
export { ParcelApi, ScopedParcelApi };