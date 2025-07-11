import Imports from "./imports";

export default class GimkitInternals {
    static stores: any;
    static notification: any;
    static platformerPhysics: any;

    static init() {
        // window.stores
        Imports.getExport("FixSpinePlugin", (val) => val?.characters, (stores) => {
            this.stores = stores;
            window.stores = stores;
        });

        // ant-design notifications
        // Parcel.getLazy(null, exports => exports?.default?.useNotification, exports => {
        //     this.notification = exports.default;
        // });

        // platformer physics
        // Parcel.getLazy(null, exports => exports?.CharacterPhysicsConsts, exports => {
        //     this.platformerPhysics = exports.CharacterPhysicsConsts;
        //     window.platformerPhysics = exports.CharacterPhysicsConsts;
        // });
    }
}