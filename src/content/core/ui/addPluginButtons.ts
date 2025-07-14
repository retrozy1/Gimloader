import wrench from "$assets/wrench.svg";
import { mount, unmount } from "svelte";
import MenuUI from "$content/ui/MenuUI.svelte";
import Patcher from "$core/patcher";
import UI from "$core/ui/ui";
import Hotkeys from '$core/hotkeys/hotkeys.svelte';
import Rewriter from "../rewriter";

let open = false;
function openPluginManager() {
    if(open) return;
    open = true;

    let component = mount(MenuUI, {
        target: document.body,
        props: {
            onClose: () => {
                open = false;
                unmount(component)
            }
        }
    });
}

export function addPluginButtons() {
    document.documentElement.classList.add("noPluginButtons");

    // add a hotkey shift+p to open the plugin manager
    Hotkeys.addHotkey(null, {
        key: "KeyP",
        alt: true
    }, () => openPluginManager());

    // This is definitely very bad- in most apps this would be crazy laggy
    // But this only gets called a few hundred times since Gimkit has very little UI
    Rewriter.exposeObjectByAssignment(true, "jsxRuntime", ".jsxs=", (jsxRuntime) => {
        if(location.pathname === "/join") {
            Patcher.after(null, jsxRuntime, "jsx", (_, args, returnVal) => {
                return onJoinJsx(args, returnVal);
            });
            Patcher.after(null, jsxRuntime, "jsxs", (_, args, returnVal) => {
                return onJoinJsxs(args, returnVal);
            });
        } else if(location.pathname === "/host") {
            Patcher.after(null, jsxRuntime, "jsx", (_, args, returnVal) => {
                return onHostJsx(args, returnVal);
            });
        } else {
            Patcher.after(null, jsxRuntime, "jsx", (_, args, returnVal) => {
                return onHomeJsx(args, returnVal);
            });
        }
    });
}

function onJoinJsx(args: IArguments, returnVal: any) {
    // For some reason the names of components is sometimes not minified
    if(args[0].name === "JoinPrimaryButton") {
        let newButton = UI.React.createElement('button', {
            className: 'openPlugins',
            dangerouslySetInnerHTML: { __html: wrench },
            onClick: () => openPluginManager()
        });

        return UI.React.createElement('div', { className: 'gl-join' }, [returnVal, newButton]);
    }

    return on2dJsx(args, returnVal);
}

function onJoinJsxs(args: IArguments, returnVal: any) {
    if(args[1].style?.paddingLeft === 8) {
        const children = returnVal.props.children;
        const pluginButton = UI.React.createElement("div", {
            className: "gl-1dGameWrench",
            dangerouslySetInnerHTML: { __html: wrench },
            onClick: () => openPluginManager()
        });

        children.splice(3, 0, pluginButton)
    }
}

function onHostJsx(args: IArguments, returnVal: any) {
    // Add the button to the creative screen
    if(args[1].tooltip === "Options") {
        const pluginButton = UI.React.createElement(returnVal.type, {
            tooltip: "Plugins",
            children: UI.React.createElement('div', {
                className: 'gl-wrench',
                dangerouslySetInnerHTML: { __html: wrench }
            }),
            onClick: () => openPluginManager()
        });

        return UI.React.createElement('div', { className: 'gl-row gap' }, [returnVal, pluginButton]);
    }

    if(args[1].children === "Start Game" && !args[1].type && !args[1].className) {
        const pluginButton = UI.React.createElement(returnVal.type, {
            children: "Plugins",
            onClick: () => openPluginManager(),
            className: "gl-1dLobbyButton"
        });

        return UI.React.createElement('div', { className: 'gl-row gap' }, [pluginButton, returnVal]);
    }

    if(args[1].tooltipMessage === "Toggle Music") {
        const pluginButton = UI.React.createElement(returnVal.type, {
            tooltipMessage: "Plugins",
            onClick: () => openPluginManager(),
            icon: UI.React.createElement('div', {
                className: 'gl-1dHostGameWrench',
                dangerouslySetInnerHTML: { __html: wrench }
            })
        });

        return UI.React.createElement('div', { className: 'gl-row' }, [pluginButton, returnVal]);
    }

    return on2dJsx(args, returnVal);
}

function on2dJsx(args: IArguments, returnVal: any) {
    // Add the button to the host/join screen before the game starts
    if(args[1].ariaLabel === "Rewards" && args[1].customColor) {
        const text = UI.React.createElement('div', {}, "Plugins");

        const pluginButton = UI.React.createElement(returnVal.type, {
            ariaLabel: "Plugins",
            children: UI.React.createElement('div', { className: "gl-row gap-sm" }, [
                UI.React.createElement('div', {
                    className: 'gl-wrench lobby',
                    dangerouslySetInnerHTML: { __html: wrench }
                }),
                text
            ]),
            customColor: "#01579b",
            onClick: () => openPluginManager()
        });

        return UI.React.createElement('div', { className: 'gl-row gap' }, [pluginButton, returnVal]);
    }

    // Add the button to the host/join screen ingame
    if(args[1].tooltip === "Sound") {
        const pluginButton = UI.React.createElement(returnVal.type, {
            tooltip: "Plugins",
            children: UI.React.createElement('div', {
                className: 'gl-wrench',
                dangerouslySetInnerHTML: { __html: wrench }
            }),
            onClick: () => openPluginManager()
        });

        return UI.React.createElement('div', { className: 'gl-row' }, [pluginButton, returnVal]);
    }
}

let homeType: () => any;
let light = false;
function onHomeJsx(args: IArguments, returnVal: any) {
    // Add the button to the homescreen
    if(args[1]?.showUpgradeModal) {
        light = args[1].theme !== "light";
        
        if(!homeType) {
            const type = returnVal.type;
            homeType = function() {
                let res = type.apply(this, arguments);
                let children = res.props.children[0].props.items;
                if(!children?.some?.((c: any) => c?.key === 'creative')) return res;

                let icon = UI.React.createElement('div', {
                    className: 'icon',
                    dangerouslySetInnerHTML: { __html: wrench }
                });

                let text = UI.React.createElement('div', {
                    className: "text"
                }, "Plugins");

                let item = UI.React.createElement('div', {
                    className: `gl-homeWrench ${light ? 'light' : ''}`,
                    onClick: () => openPluginManager()
                }, [icon, text]);
    
                children.splice(0, 0, { key: "plugins", item });

                return res;
            }
        }
        returnVal.type = homeType;

        return;
    }
}