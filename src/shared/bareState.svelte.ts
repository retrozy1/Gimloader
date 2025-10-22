import type { LibraryInfo, PluginInfo, Settings, State } from '$types/state';
import Port from './port.svelte';

export default new class BareState {
    plugins: PluginInfo[] = $state([]);
    libraries: LibraryInfo[] = $state([]);
    settings: Partial<Settings> = $state({});

    init(initial?: (state: State) => void) {
        const onState = (state: State) => {
            this.plugins = state.plugins;
            this.libraries = state.libraries;
            this.settings = state.settings;
        }

        Port.init((state) => {
            onState(state);
            initial?.(state);
        }, onState);    

        // sync plugins
        Port.on("pluginEdit", ({ name, script, newName }) => {
            let plugin = this.plugins.find(p => p.name === name);
            if(!plugin) return;
    
            plugin.script = script;
            plugin.name = newName;
        });
    
        Port.on("pluginCreate", ({ name, script }) => {
            this.plugins.push({ name, script, enabled: true });
        });
    
        Port.on("pluginDelete", ({ name }) => {
            this.plugins = this.plugins.filter(p => p.name !== name);
        });
    
        Port.on("pluginsDeleteAll", () => {
            this.plugins.splice(0, this.plugins.length);
        });
    
        Port.on("pluginsArrange", ({ order }) => {
            let newOrder: PluginInfo[] = [];
            for(let name in order) {
                newOrder.push(this.plugins.find(p => p.name === name));
            }
            this.plugins = newOrder;
        });

        // sync libraries
        Port.on("libraryCreate", (info) => this.libraries.push(info));

        Port.on("libraryDelete", ({ name }) => {
            this.libraries = this.libraries.filter(l => l.name !== name);
        });

        Port.on("libraryEdit", ({ name, script }) => {
            this.libraries.find(l => l.name === name).script = script;
        });

        Port.on("librariesDeleteAll", () => this.libraries = []);

        Port.on("librariesArrange", ({ order }) => {
            let newOrder: LibraryInfo[] = [];
            for(let name in order) {
                newOrder.push(this.libraries.find(l => l.name === name));
            }
            this.libraries = newOrder;
        });

        // sync settings
        Port.on("settingUpdate", (message) => {
            function updateSettingInState<K extends keyof Settings>(message: { key: K, value: Settings[K] }) {
                this.settings[message.key] = message.value;
            }

            updateSettingInState(message);
        });
    }
}