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
    /** Only available for plugins */
    hasSettings: string;
}