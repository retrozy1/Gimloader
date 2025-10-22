import LibManager from "$core/scripts/libManager.svelte";
import { validate } from "$content/utils";

class LibsApi {
    /** A list of all the libraries installed */
    get list() { return LibManager.getLibNames() };

    /** Gets whether or not a plugin is installed and enabled */
    isEnabled(name: string) {
        if(!validate("libs.isEnabled", arguments, ['name', 'string'])) return;

        return LibManager.isEnabled(name);
    }

    /** Gets the headers of a library, such as version, author, and description */
    getHeaders(name: string) {
        if(!validate("libs.getHeaders", arguments, ['name', 'string'])) return;

        return LibManager.getLibHeaders(name);
    }

    /** Gets the exported values of a library */
    get<T = any>(name: string) {
        return LibManager.get<T>(name);
    }
}

Object.freeze(LibsApi);
Object.freeze(LibsApi.prototype);
export default LibsApi;