import type { CustomServer as CustomServerType, CustomServerConfig } from "$types/state";
import Port from "$shared/port.svelte";
import Parcel from "$core/parcel";
import Patcher from "$core/patcher";
import UI from "./ui/ui";
import customServerToggle from "$content/ui/server/customServerToggle";
import Storage from "./storage.svelte";
import toast from "svelte-5-french-toast";

export interface CreatedInfo {
    name: string;
    address: string;
    port: number;
}

export default new class CustomServer {
    config: CustomServerConfig = $state();
    selected: CustomServerType = $derived(this.config.servers[this.config.selected]);
    user: any;

    init(config: CustomServerConfig) {
        this.config = config;

        document.documentElement.classList.toggle("noServerButton", !this.config.enabled);
        Port.on("customServerUpdate", (config) => {
            this.config = config;
            document.documentElement.classList.toggle("noServerButton", !this.config.enabled);
        });        
        this.addJoinToggle();

        // requester
        let params = new URLSearchParams(location.search);
        Parcel.getLazy(null, exports => exports?.request && exports?.generateId, (exports) => {
            let request = exports.request;
            delete exports.request;
            let me = this;

            exports.request = async function(req: any) {
                if(!config.enabled) return request.apply(this, arguments);
    
                // get cosmetics when making games
                if(req.url === "/api/matchmaker/intent/map/play/create" && req.data?.experienceId?.startsWith("gimloader")) {
                    req.url = "/gimloader" + req.url;
                    
                    if(!me.user) me.user = Parcel.query((exports) => exports?.default?.user?.user)?.default;
                    if(me.user) req.data.name = me.user.user.user.firstName;
   
                    me.fetchCosmetics().then((cosmetics) => {
                        req.data.cosmetics = cosmetics;
                        request.apply(this, [req]);
                    });

                    return;
                }

                // get cosmetics when joining games
                if(req.url === "/api/matchmaker/join" && Storage.settings.joiningCustomServer) {
                    req.url = "/gimloader" + req.url;

                    me.fetchCosmetics().then((cosmetics) => {
                        req.data.cosmetics = cosmetics;
                        request.apply(this, [req]);
                    });

                    return;
                }

                // attempt to use the other server type if a code request fails
                const codeUrl = "/api/matchmaker/find-info-from-code";
                if(req.url === codeUrl) {
                    const returnMissing = () => {
                        req.error({ message: { text:"Game not found" }, code: 404 });
                    }

                    const runFetch = async (url: string) => {
                        try {
                            let res = await fetch(url, {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({ code: req.data.code })
                            });
                            if(res.status !== 200) return null;
                            return await res.json();
                        } catch {
                            return null;
                        }
                    }

                    if(Storage.settings.joiningCustomServer) {
                        let customRes = await runFetch("/gimloader" + codeUrl);
                        if(customRes) return req.success(customRes);
                        
                        let mainRes = await runFetch(codeUrl);
                        if(!mainRes) return returnMissing();

                        Storage.updateSetting("joiningCustomServer", false);
                        toast("Automatically switched to default server");
                        req.success(mainRes);
                    } else {
                        let mainRes = await runFetch(codeUrl);
                        if(mainRes) return req.success(mainRes);
                        
                        let customRes = await runFetch("/gimloader" + codeUrl);
                        if(!customRes) return returnMissing();

                        Storage.updateSetting("joiningCustomServer", true);
                        toast("Automatically switched to custom server");
                        req.success(customRes);
                    }

                    return;
                }
                
                // redirect calls to make custom games to the custom server
                if(
                    (location.pathname === "/join" && Storage.settings.joiningCustomServer && req.url.startsWith("/api/matchmaker")) ||
                    (location.pathname === "/host" && params.get("custom") === "true" && req.url.startsWith("/api/matchmaker")) ||
                    (req.url === "/api/experience/map/hooks" && req.data?.experience?.startsWith("gimloader"))
                ) {
                    req.url = "/gimloader" + req.url;
                    return request.apply(this, arguments);
                }
    
                // add the experiences from the custom server
                if(req.url === "/api/experiences") {
                    let onSuccess = req.success;
    
                    Promise.all<any[]>([
                        new Promise(async (res) => {
                            try {
                                let resp = await fetch("/gimloader/api/experiences");
                                let json = await resp.json();
                                res(json);
                            } catch {
                                res([]);
                            }
                        }),
                        new Promise((res) => {
                            Patcher.before(null, req, "success", (_, args) => {
                                res(args[0]);
                            });
                        })
                    ]).then(([ customExperiences, experiences ]) => {
                        onSuccess(customExperiences.concat(experiences));
                    });
                }

                return request.apply(this, arguments);
            }
        });
    }

    updateState(config: CustomServerConfig) {
        this.config = config;
        document.documentElement.classList.toggle("noServerButton", !this.config.enabled);
    }

    save() {
        Port.send("customServerUpdate", $state.snapshot(this.config));
        document.documentElement.classList.toggle("noServerButton", !this.config.enabled);
    }

    addJoinToggle() {
        let innerType = null;

        Parcel.getLazy(null, e => e?.default?.toString?.().includes('inputmode:"numeric"'), (exports) => {
            Patcher.after(null, exports, "default", (_, __, returnVal) => {
                if(innerType) {
                    returnVal.type = innerType;
                    return;
                }

                let type = returnVal.type;
                innerType = function() {
                    let res = type.apply(this, arguments);
                    
                    let controls = res.props.children.props.children[1];
                    let input = controls[0];

                    controls[0] = UI.React.createElement("div",
                    { className: "gl-join-input-wrap" }, [
                        input,
                        UI.React.createElement(customServerToggle)
                    ]);
                    
                    return res;
                }

                returnVal.type = innerType;
            });
        });
    }

    async fetchCosmetics() {
        try {
            let res = await fetch("/api/cosmos/owned-cosmetics");
            let json = await res.json();

            return json.selected;
        } catch {
            return {
                character: { id: "default_gray" },
                trail: null
            }
        }
    }

    arrangeServers(order: string[]) {
        let selected = this.config.servers[this.config.selected];
        let newOrder = [];

        for (let id of order) {
            let server = this.getServer(id);
            if (server) newOrder.push(server);
        }

        this.config.servers = newOrder;
        if(selected) {
            this.config.selected = this.config.servers.indexOf(selected);
        }
        this.save();
    }

    getServer(id: string) {
        return this.config.servers.find(s => s.id === id);
    }

    createServer(info: CreatedInfo) {
        this.config.servers.push({
            ...info,
            id: crypto.randomUUID()
        });

        if(this.config.selected === null) {
            this.config.selected = this.config.servers.length - 1;
        }
        
        this.save();
    }

    deleteServer(server: CustomServerType) {
        this.config.servers = this.config.servers.filter(s => s !== server);
        this.save();
    }

    editServer(server: CustomServerType, info: CreatedInfo) {
        server.name = info.name;
        server.address = info.address;
        server.port = info.port;
        this.save();
    }
}