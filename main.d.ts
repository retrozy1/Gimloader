declare module '*.css' {
    const content: string;
    export default content;
}

declare module '*.svg' {
    const content: string;
    export default content;
}

declare module '*.svelte' {
    const component: import('svelte').SvelteComponent;
    export default component;

    // To get typescript to shut up about some components
    export const buttonVariants;
    export const ButtonProps;
    export const ButtonVariant;
    export const ButtonSize;
}

declare const GL: typeof import('./src/content/api/api').default;
/** @deprecated Use GL.stores */
declare const stores: import('./src/types/stores/stores').Stores;
/** @deprecated No longer supported */
declare const platformerPhysics: any;

interface Window {
    GL: typeof import('./src/content/api/api').default;
    /** @deprecated Use GL.stores */
    stores: import('./src/types/stores/stores').Stores;
    /** @deprecated No longer supported */
    platformerPhysics: any;
}