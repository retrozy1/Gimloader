import Poller from "./poller";
import Server from "./server";
import { statePromise } from "./state";
import Updater from "./updater";

Server.init();
Updater.init();

statePromise.then((state) => {
    console.log(state);
    Poller.init(state.settings.pollerEnabled);
});

// open the editor when requested
Server.onMessage("showEditor", async (_, { type, name }) => {
    let params = new URLSearchParams();
    params.set("type", type);
    if(name) params.set("name", name);

    let tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.create({
        url: `/editor.html?${params.toString()}`,
        openerTabId: tabs[0]?.id
    });
});