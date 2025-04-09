import type { CustomServerConfig, CustomServer, Settings } from "$types/state";

export const isFirefox = navigator.userAgent.includes("Firefox");

export const algorithm: HmacKeyGenParams = {
    name: "HMAC",
    hash: { name: "SHA-512" }
};

export const defaultSettings: Settings = {
    pollerEnabled: false,
    autoUpdate: true,
    autoDownloadMissingLibs: true,
    menuView: 'grid',
    showPluginButtons: true,
    showCustomServer: false,
    joiningCustomServer: true
}

export const makeDefaultCustomServer = (): CustomServer => {
    return {
        name: "Default",
        address: "localhost",
        port: 5823,
        id: crypto.randomUUID()
    }
}

export const defaultCustomServerConfig: CustomServerConfig = {
    enabled: false,
    selected: 0,
    servers: [ makeDefaultCustomServer() ]
}

export const flipDurationMs = 300;