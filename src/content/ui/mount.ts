import { domLoaded } from "$content/utils";
import { mount, unmount } from "svelte";
import MenuUI from "./MenuUI.svelte";
import Command from "./Command.svelte";

let menuComponent: MenuUI | null = null;
export function showMenu(tab = "plugins", officialOpen = false) {
    if(menuComponent) {
        menuComponent.setTab(tab, officialOpen);
        return;
    }

    menuComponent = mount(MenuUI, {
        target: document.body,
        props: {
            tab,
            officialOpen,
            onClose: () => {
                menuComponent = null;
                unmount(menuComponent);
                (document.activeElement as HTMLElement)?.blur();
            }
        }
    }) as MenuUI;
}

export async function mountCommand() {
    await domLoaded;
    mount(Command, { target: document.body });
}
