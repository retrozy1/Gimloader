import LibManager from "$core/scripts/libManager.svelte";
import { validate } from "$content/utils";

class LibsApi {
    /** A list of all the libraries installed */
    get list() {
        return LibManager.getScriptNames();
    }

    /** Gets whether or not a plugin is installed and enabled */
    isEnabled(name: string) {
        validate("libs.isEnabled", arguments, ["name", "string"]);

        return LibManager.isRunning(name);
    }

    /** Gets the headers of a library, such as version, author, and description */
    getHeaders(name: string) {
        validate("libs.getHeaders", arguments, ["name", "string"]);

        return LibManager.getHeaders(name);
    }

    /** Gets the exported values of a library */
    get<T extends keyof Gimloader.Libraries>(name: T): Gimloader.Libraries[T] {
        validate("libs.get", arguments, ["name", "string"]);

        return LibManager.getExports(name as string);
    }
}

Object.freeze(LibsApi);
Object.freeze(LibsApi.prototype);
export default LibsApi;
