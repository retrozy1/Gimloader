import type { OnceMessages, OnceResponses, ScriptType } from "$types/messages";
import type { State } from "$types/state";
import Server from "$bg/net/server";
import { formatDownloadUrl } from "$shared/net/util";
import { parseDep, parseScriptHeaders } from "$shared/parseHeader";
import Scripts, { type Dependency } from "$bg/scripts";
import { englishList } from "$shared/utils";

export default class Downloader {
    static maxDepth = 16;
    static fetchCache = new Map<string, string>();

    static init() {
        Server.onMessage("downloadScript", this.downloadScript.bind(this));
    }

    static async downloadScript(state: State, message: OnceMessages["downloadScript"], respond: (response: OnceResponses["downloadScript"]) => void) {
        if(!message.url.startsWith("http://") && !message.url.startsWith("https://")) {
            respond({ status: "downloadError", message: "Invalid URL" });
            return;
        }

        if(message.confirmed) {
            const errors = await this.download(message.url, 0);
            this.fetchCache.clear();

            if(errors.length > 0) {
                const message = `Download failed: ${errors.join("\n")}`;
                respond({ status: "downloadError", message });
                return;
            }
            return;
        }

        this.fetchCache.clear();
        const { error, willDownload } = await this.checkMissing(message.url);

        if(error) {
            respond({ status: "downloadError", message: error });
            return;
        }

        // Check if confirmation is needed
        const warnAbout = willDownload.filter((dep) => (
            (dep.type === "library" && !state.settings.autoDownloadMissingLibs)
            || (dep.type === "plugin" && !state.settings.autoDownloadMissingPlugins)
        ));
        if(warnAbout.length > 0) {
            const message = `${englishList(warnAbout.map(d => d.name))} will also be downloaded. Continue?`;
            respond({ status: "confirm", message });
            return;
        }

        // Actually download it
        const errors = await this.download(message.url, 0);
        this.fetchCache.clear();
        if(errors.length > 0) {
            const message = `Download failed: ${errors.join("\n")}`;
            respond({ status: "downloadError", message });
            return;
        }

        respond({ status: "success" });
    }

    static async checkMissing(url: string) {
        let error: string | null = null;
        const willDownload: Dependency[] = [];

        const checkScripts = async (url: string, depth: number) => {
            if(depth > this.maxDepth || error) {
                error = "Maximum dependency depth exceeded";
                return;
            }

            try {
                const { text, dependencies } = await this.fetchScript(url, true);
                this.fetchCache.set(url, text);

                // Check if missing dependencies can be downloaded
                for(const dep of dependencies) {
                    if(Scripts.has(dep.name)) continue;

                    if(!dep.url) {
                        error = `${dep.name} is required and cannot be automatically downloaded`;
                        return;
                    }

                    if(!willDownload.includes(dep)) willDownload.push(dep);
                    await checkScripts(dep.url, depth + 1);
                }
            } catch {
                error = `Could not download script from ${url}`;
            }
        };

        await checkScripts(url, 0);
        return { error, willDownload };
    }

    static async fetchScript(url: string, cache = false) {
        let text = this.fetchCache.get(url);

        if(!text) {
            const response = await fetch(formatDownloadUrl(url));
            if(!response.ok) throw new Error("Response not OK");

            text = await response.text();
            if(cache) this.fetchCache.set(url, text);
        }

        const headers = parseScriptHeaders(text);

        // Get dependencies
        const type: ScriptType = headers.isLibrary === "false" ? "plugin" : "library";
        const dependencies: Dependency[] = [];

        for(const dep of headers.needsLib) {
            const [name, url] = parseDep(dep);
            dependencies.push({ name, type: "library", url });
        }

        if(type === "plugin") {
            for(const dep of headers.needsPlugin) {
                const [name, url] = parseDep(dep);
                dependencies.push({ name, type: "plugin", url });
            }
        }

        return { text, headers, dependencies, type };
    }

    static async downloadDeps(dependencies: Dependency[]) {
        const failed: string[] = [];

        for(const dep of dependencies) {
            const downloadRes = await this.download(dep.url, 0);
            failed.push(...downloadRes);
        }

        return failed;
    }

    static async download(url: string, depth: number) {
        if(depth > this.maxDepth) return [`Maximum dependency depth exceeded`];

        try {
            const { text, headers, dependencies, type } = await this.fetchScript(url);

            const failed: string[] = [];
            for(const dep of dependencies) {
                if(Scripts.has(dep.name)) continue;
                if(!dep.url) {
                    failed.push(`${dep.name} is required and cannot be automatically downloaded`);
                    continue;
                }

                const childRes = await this.download(dep.url, depth + 1);
                failed.push(...childRes);
            }

            // Create the script after dependencies are installed
            await Server.executeAndSend(`${type}Create`, { name: headers.name, code: text });

            return failed;
        } catch {
            return [`Could not download ${url}`];
        }
    }
}
