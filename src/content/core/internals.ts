import Imports, { getObjectByKey } from "./imports";
import EventEmitter from "eventemitter2";

export default class GimkitInternals {
    static stores: any;
    static notification: any;
    static events = new EventEmitter();

    static init() {
        // window.stores
        Imports.getExport("FixSpinePlugin", (val) => val?.characters, (stores) => {
            this.stores = stores;
            window.stores = stores;

            this.events.emit("stores", stores);
        });

        // ant-design notifications
        getObjectByKey({
            key: "success",
            callback: (notification) => {
                this.notification = notification;
                this.events.emit("notification", notification);
            },
            filter: (val) => val.useNotification,
            once: true
        });
    }
}