export interface ScriptHeaders {
    name: string;
    description: string;
    author: string;
    version: string | null;
    reloadRequired: string;
    isLibrary: string;
    downloadUrl: string | null;
    webpage: string | null;
    needsLib: string[];
    optionalLib: string[];
    syncEval: string;
    /** Only available for plugins */
    hasSettings: string;
    gamemode: string[];
}

export interface OfficialScriptInfo {
    title: string;
    description: string;
    author: string;
    downloadUrl: string;
    webpage: string;
}