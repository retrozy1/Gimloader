import type { ScriptType } from "$types/messages";
import Server from "$bg/net/server";
import { formatDownloadUrl } from "$shared/net/util";
import { parseDep, parseScriptHeaders } from "$shared/parseHeader";
import Scripts, { type Dependency } from "$bg/scripts";

export default class Downloader {
    static async downloadDeps(dependencies: Dependency[]) {
        const failed: string[] = [];

        for(const dep of dependencies) {
            const downloadRes = await this.download(dep.name, dep.url, []);
            failed.push(...downloadRes);
        }

        return failed;
    }

    static async download(name: string, url: string, stack: string[]) {
        const formattedUrl = formatDownloadUrl(url);
        try {
            const response = await fetch(formattedUrl);
            if(!response.ok) throw new Error("Response not OK");

            const text = await response.text();

            // Recursively download dependencies
            const headers = parseScriptHeaders(text);
            if(stack.includes(headers.name) || stack.length > 16) return [];

            let deps = headers.needsLib;
            const type: ScriptType = headers.isLibrary === "false" ? "plugin" : "library";
            if(type === "plugin") deps = deps.concat(headers.needsPlugin);

            const failed: string[] = [];
            for(const dep of deps) {
                const [name, url] = parseDep(dep);
                if(Scripts.has(name)) continue;
                if(!url) {
                    failed.push(`${name} has no download URL`);
                    continue;
                }

                const childRes = await this.download(name, url, [...stack, headers.name]);
                failed.push(...childRes);
            }

            // Create the script after dependencies are installed
            await Server.executeAndSend(`${type}Create`, { name: headers.name, code: text });

            return failed;
        } catch {
            return [`Could not download ${name} from ${url}`];
        }
    }
}