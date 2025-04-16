import type { CustomServerConfig, Settings } from "$types/state";

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

export const defaultCustomServerConfig: CustomServerConfig = {
    enabled: false,
    selected: null,
    servers: []
}

export const flipDurationMs = 300;