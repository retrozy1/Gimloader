import blackWrenchSvg from "$assets/wrench.svg";
import whiteWrenchSvg from "$assets/wrench-light.svg";
import { mount, unmount } from "svelte";
import MenuUI from "$content/ui/MenuUI.svelte";
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

    const blackWrench = Rewriter.createMemoized("blackWrenchSvg", () => {
        const wrenchBlob = new Blob([blackWrenchSvg], { type: "image/svg+xml" });
        return URL.createObjectURL(wrenchBlob);
    });

    const whiteWrench = Rewriter.createMemoized("whiteWrenchSvg", () => {
        const wrenchBlob = new Blob([whiteWrenchSvg], { type: "image/svg+xml" });
        return URL.createObjectURL(wrenchBlob);
    });

    const openUI = Rewriter.createShared(null, "openPluginManager", openPluginManager);
    const createElement = `window.GL.React.createElement`;

    // Add the wrench button the homescreen
    Rewriter.addParseHook(null, "App", (code) => {
        let index = code.indexOf("/client/img/header/creative.svg");
        if(index === -1) return;

        const start = code.lastIndexOf(" ", index) + 1;
        const end = code.indexOf("})}),", index) + 5;
        let insert = code.slice(start, end);
        
        insert = insert.replace("Creative", "Plugins");

        // Change the wrench icon based on the theme
        let themeStart = insert.indexOf("theme:") + 6;
        let themeEnd = insert.indexOf(",", themeStart);
        let theme = insert.slice(themeStart, themeEnd);
        insert = insert.replace(`"/client/img/header/creative.svg"`, `${theme}==="dark"?${whiteWrench}:${blackWrench}`);

        let iconStart = insert.indexOf("icon:") + 5;
        let iconEnd = insert.indexOf("}),", iconStart) + 2;
        insert = insert.slice(0, iconStart) + `${createElement}("div",{className:"gl-listButton",display:"contents"},`
            + insert.slice(iconStart, iconEnd) + ")" + insert.slice(iconEnd);

        // Add the custom onClick
        insert = Rewriter.replaceBetween(insert, "path:", ",", `onClick:()=>${openUI}(),`);

        code = code.slice(0, start) + insert + code.slice(start);
        return code;
    });

    // Add the wrench button to the ingame 2d HUD
    Rewriter.addParseHook(null, "App", (code) => {
        let index = code.indexOf(`tooltip:"Sound"`);
        if(index === -1) return;

        const start = code.lastIndexOf("[", index) + 1;
        const end = code.indexOf("})}),", index) + 5;
        let insert = code.slice(start, end);

        insert = insert.replace("Sound", "Plugins");
        insert = insert.replace("fa-waveform", "fa-wrench gl-button5");
        
        code = code.slice(0, start) + insert + code.slice(start);
        return code;
    });

    // Add the wrench button the pregame 2d HUD
    Rewriter.addParseHook(null, "App", (code) => {
        let index = code.indexOf(`"#01579b",onClick:()=>`);
        if(index === -1) return;

        const start = code.lastIndexOf(",", code.lastIndexOf(".jsx(", index));
        const end = code.indexOf("})})", index) + 4;
        let insert = code.slice(start, end);

        insert = insert.replace("flex vc", "flex vc gl-button3");
        insert = Rewriter.replaceBetween(insert, "onClick:", "}", `onClick:()=>${openUI}()`);
        insert = Rewriter.replaceBetween(insert, "}),", "name]", `}),"Plugins"]`);
        insert = Rewriter.replaceBetween(insert, "src:", "iconImage,", `src:${whiteWrench},`);
        
        code = code.slice(0, start) + insert + code.slice(start);
        code = code.replace("space-between", "flex-start;\n  gap: 8px;");
        code = Rewriter.insertAfter(code, "sticker}s`,", "style:{flexGrow:1},");

        return code;
    });

    // Add the wrench button to the join screen
    const wrapJoin = Rewriter.createShared(null, "wrapJoinButton", (joinButton: () => any) => {
        return function() {
            let element = joinButton.apply(this, arguments);
            let newButton = UI.React.createElement('button', {
                className: 'openPlugins',
                dangerouslySetInnerHTML: { __html: whiteWrenchSvg },
                onClick: () => openPluginManager()
            });

            return UI.React.createElement('div', { className: 'gl-join' }, [element, newButton]);
        }
    });

    Rewriter.addParseHook(null, "App", (code) => {
        let index = code.indexOf("JoinPrimaryButton");
        if(index === -1) return;

        // Just wrap it with a function here, it's easier
        let start = code.indexOf("=", index) + 1;
        let end = code.indexOf("onClick})", index) + 9;
        let component = code.slice(start, end);
        code = code.slice(0, start) + wrapJoin + "(" + component + ")" + code.slice(end);
        return code;
    });

    // Add the wrench button to the creative screem
    Rewriter.addParseHook(null, "App", (code) => {
        let index = code.indexOf(`tooltip:"Options"`);
        if(index === -1) return;

        let start = code.lastIndexOf("children:", index) + 9;
        let end = code.indexOf("})})", index) + 4;
        let insert = code.slice(start, end);

        insert = insert.replace("Options", "Plugins");
        insert = insert.replace("fa-cog", "fa-wrench gl-button5");

        code = code.slice(0, start) + `${createElement}("div",{className:"gl-row"},[`
            + code.slice(start, end) + "," + insert + "])" + code.slice(end);
        return code;
    });

    // Add the button to the 1d host lobby
    Rewriter.addParseHook(null, "index", (code) => {
        let index = code.indexOf("getButtonInfo()");
        if(index === -1) return;

        let start = code.indexOf("children:", index) + 9;
        let end = code.indexOf("})", start) + 2;
        let insert = code.slice(start, end);
        insert = Rewriter.replaceBetween(insert, "{", "}",
            `{onClick:()=>${openUI}(),children:"Plugins",className:"gl-button"}`);

        code = code.slice(0, start) + `${createElement}("div",{className:"gl-row"},[`
            + insert + "," + code.slice(start, end) + "])" + code.slice(end);

        return code;
    });

    // Add the button to the 1d player lobby
    Rewriter.addParseHook(null, "index", (code) => {
        let index = code.indexOf("/client/img/svgLogoWhite.svg");
        if(index === -1) return;

        let start = code.lastIndexOf("children:", index) + 9;
        let end = code.indexOf("})", index) + 2;

        code = code.slice(0, start) + "[" + code.slice(start, end) +
            `,${createElement}("img",{src:${whiteWrench},style:{height:"30px",marginLeft:"8px",cursor:"pointer"},` + 
            `onClick:()=>${openUI}(),className:"gl-button"})]` + code.slice(end);

        return code;
    });

    // Add the button to the 1d host game screen
    Rewriter.addParseHook(null, "index", (code) => {
        let index = code.indexOf("this.toggleMusic,");
        if(index === -1) return;

        let start = code.lastIndexOf(".jsx(", index) - 1;
        let end = code.indexOf(`"})`, index) + 3;
        let insert = code.slice(start, end);

        insert = Rewriter.replaceBetween(insert, "{", `"})`,
            `{onClick:()=>${openUI}(),icon:${createElement}("img",{src:${whiteWrench},` +
            `style:{width:"20px",marginTop:"-3px"},className:"gl-button2"}),tooltipMessage:"Plugins"})`);

        let insertIndex = code.lastIndexOf("[", start) + 1;
        code = code.slice(0, insertIndex) + insert + "," + code.slice(insertIndex);
        return code;
    });

    // Add the button to the 1d player game screen
    Rewriter.addParseHook(null, "index", (code) => {
        let index = code.indexOf(`label":"Menu"`);
        if(index === -1) return;

        let insertIndex = code.indexOf("{}),", index) + 4;
        code = code.slice(0, insertIndex)
            + `${createElement}("img",{src:${whiteWrench},style:{height:"22px",marginLeft:"10px",cursor:"pointer"},`
            + `onClick:()=>${openUI}(),className:"gl-button"}),` + code.slice(insertIndex);

        return code;
    });
}