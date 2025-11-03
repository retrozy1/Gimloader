import Port from "$shared/net/port.svelte";

export function log(...args: any[]) {
    console.log('%c[GL]', 'color:#5030f2', ...args);
}

export function error(...args: any[]) {
    console.error('%c[GL]', 'color:#5030f2', ...args);
}

function typeMatches(val: any, type: string) {
    if(type.endsWith("?")) {
        type = type.slice(0, -1);
        if(val === undefined) return true;
    }

    return type.split("|").includes(typeof val);
}

export function validate(fnName: string, args: IArguments, ...schema: [string, string | object][]) {
    for(let i = 0; i < schema.length; i++) {
        let [ name, type ] = schema[i];

        if(typeof type === "string" && type.endsWith("?") && args[i] === undefined) {
            continue;
        }

        // check whether the key argument is present
        if(args[i] === undefined) {
            error(fnName, 'called without argument', name);
            return false;
        }
        if(type === "any") continue;

        if(typeof type === "object") {
            if(typeof args[i] !== "object") {
                error(fnName, 'recieved', args[i], `for argument ${name}, expected type object`);
                return false;
            }

            for(let key in type) {
                if(args[i][key] === undefined) {
                    if(type[key].endsWith("?")) {
                        continue;
                    } else {
                        error(fnName, `called without argument ${name}.${key}`);
                        return false;
                    }
                }

                if(!typeMatches(args[i][key], type[key])) {
                    error(fnName, 'recieved', args[i][key], `for argument ${name}.${key}, expected type ${type[key]}`);
                    return false;
                }
            }
        } else {
            if(!typeMatches(args[i], type)) {
                error(fnName, 'recieved', args[i], `for argument ${name}, expected type ${type}`);
                return false;
            }
        }
    }

    return true;
}

export function splicer(array: any[], obj: any) {
    return () => {
        let index = array.indexOf(obj);
        if(index !== -1) array.splice(index, 1);
    }
}

export function clearId<T extends { id: string }>(array: T[], id: string) {
    for(let i = 0; i < array.length; i++) {
        if(array[i].id === id) {
            array.splice(i, 1);
            i--;
        }
    }
}

export function readUserFile(accept: string, callback: (text: string) => void) {
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    
    input.addEventListener('change', () => {        
        let file = input.files?.[0];
        if(!file) return;
        
        let reader = new FileReader();
        reader.onload = () => {
            callback(reader.result as string);
        }

        reader.readAsText(file);
    });

    input.click();
}

export function showEditor(type: "plugin" | "library", name?: string) {
    Port.sendAndRecieve("showEditor", { type, name });
}

export const domLoaded = new Promise<void>((res) => {
    if(document.readyState !== "loading") {
        res();
        return;
    }

    document.addEventListener("readystatechange", () => res(), { once: true });
});

// Because of some nonsense with the spec subclassing promises is wonky
export class Deferred<T = void> extends Promise<T> {
    resolve: (value?: T) => void;
    reject: (reason?: any) => void;
    
    constructor(callback: any) {
        let resolve: (value?: T) => void;
        let reject: (reason?: any) => void;

        super((res, rej) => {
            resolve = res;
            reject = rej;
            callback(res, rej);
        });

        this.resolve = resolve;
        this.reject = reject;
    }

    static create<T = void>() {
        return new Deferred<T>(() => {});
    }
}