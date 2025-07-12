import wrench from "$assets/wrench.svg";
import { mount, unmount } from "svelte";
import MenuUI from "$content/ui/MenuUI.svelte";
import Patcher from "$core/patcher";
import UI from "$core/ui/ui";
import Hotkeys from '$core/hotkeys/hotkeys.svelte';
import Imports from "../imports";

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
    Imports.getIndexExport((val) => val.jsx && val.jsxs, (jsxRuntime) => {
        if(location.pathname === "/join") {
            Patcher.after(null, jsxRuntime, "jsx", (_, args, returnVal) => {
                return onJoinJsx(args, returnVal);
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

    // add the button to 1d host screens
    // Parcel.getLazy(null,
    // exports => exports?.default?.displayName?.includes?.('inject-with-gameOptions-gameValues-players-kit-ui'),
    // exports => {
    //     Patcher.after(null, exports.default, 'render', (_, __, res) => {
    //         let nativeType = res.type;
            
    //         delete res.type;
    //         res.type = function() {
    //             let res = new nativeType(...arguments);
                
    //             let nativeRender = res.render;
    //             delete res.render;
                
    //             res.render = function() {
    //                 let res = nativeRender.apply(this, arguments);
                    
    //                 let newBtn = UI.React.createElement('button', {
    //                     className: 'gl-1dHostPluginBtn',
    //                     onClick: () => openPluginManager()
    //                 }, 'Plugins')
                    
    //                 res.props.children = [newBtn, res.props.children];
                    
    //                 return res;
    //             }
                
    //             return res;
    //         }
            
    //         return res
    //     })
    // }, true)
    
    // add the button to the 1d host screen while in-game
    // we need to do this to intercept the stupid mobx wrapper which is a massive pain
    // Parcel.getLazy(null, exports => exports?.__decorate, exports => {
    //     Patcher.before(null, exports, '__decorate', (_, args) => {
    //         if(args[1]?.toString?.()?.includes("Toggle Music")) {
    //             let nativeRender = args[1].prototype.render;
    //             args[1].prototype.render = function() {
    //                 let res = nativeRender.apply(this, args);
    //                 let children = res.props.children[2].props.children.props.children

    //                 let newEl = UI.React.createElement(children[1].type, {
    //                     icon: UI.React.createElement('div', {
    //                         className: 'gl-1dHostGameWrench',
    //                         dangerouslySetInnerHTML: { __html: wrench }
    //                     }),
    //                     onClick: () => openPluginManager(),
    //                     tooltipMessage: "Plugins"
    //                 })
                    
    //                 children.splice(0, 0, newEl);
                    
    //                 return res;
    //             }
    //         }
    //     })
    // }, true)

    // add the button to the 1d game screen
    // Parcel.getLazy(null, exports => exports?.observer &&
    // exports.Provider, exports => {
    //     // let nativeObserver = exports.observer;
    //     // delete exports.observer;

    //     // exports.observer = function() {
    //     Patcher.before(null, exports, 'observer', (_, args) => {
    //         if(args[0]?.toString?.().includes('"aria-label":"Menu"')) {
    //             let nativeArgs = args[0];
    //             args[0] = function() {
    //                 let res = nativeArgs.apply(this, arguments);

    //                 // for when we're still on the join screen
    //                 if(res?.props?.children?.props?.children?.props?.src === '/client/img/svgLogoWhite.svg') {
    //                     let props = res.props.children.props

    //                     props.children = [props.children, UI.React.createElement('div', {
    //                         className: 'gl-1dGameWrenchJoin',
    //                         style: { cursor: 'pointer' },
    //                         dangerouslySetInnerHTML: { __html: wrench },
    //                         onClick: () => openPluginManager()
    //                     })];

    //                     return res;
    //                 }
                    
    //                 let children = res?.props?.children?.[0]?.props?.children?.props?.children;
    //                 if(!children) return res;
                    
    //                 let newEl = UI.React.createElement(children[1].type, {
    //                     onClick: () => openPluginManager(),
    //                 }, UI.React.createElement('div', {
    //                     className: 'gl-1dGameWrench',
    //                     dangerouslySetInnerHTML: { __html: wrench }
    //                 }))
                    
    //                 children.splice(3, 0, newEl)
                    
    //                 return res;
    //             }
    //         }
    //     })
    // }, true);
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
    
    // Add the button to the host screen
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
                    className: 'gl-wrench',
                    dangerouslySetInnerHTML: { __html: wrench }
                }),
                text
            ]),
            customColor: "#01579b",
            onClick: () => openPluginManager(),
            className: "gl-hostWrench"
        });

        return UI.React.createElement('div', { className: 'gl-row gap' }, [pluginButton, returnVal]);
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