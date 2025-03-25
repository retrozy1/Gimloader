import type { CustomServerConfig } from "$types/state";
import Port from "$shared/port.svelte";
import Parcel from "$core/parcel";
import Patcher from "$core/patcher";
import UI from "./ui/ui";
import customServerToggle from "$content/ui/server/customServerToggle";
import Storage from "./storage.svelte";

export default new class CustomServer {
    config: CustomServerConfig = $state();
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

            exports.request = function(req: any) {
                if(!config.enabled) return;
    
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

                if(req.url === "/api/matchmaker/join" && Storage.settings.joiningCustomServer) {
                    req.url = "/gimloader" + req.url;

                    me.fetchCosmetics().then((cosmetics) => {
                        req.data.cosmetics = cosmetics;
                        request.apply(this, [req]);
                    });

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
}