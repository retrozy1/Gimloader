import Poller from "./net/poller";
import Server from "./net/server";
import { statePromise } from "./state";
import Updater from "./net/updater";

Server.init();
Updater.init();

statePromise.then((state) => {
    console.log(state);
    Poller.init(state.settings.pollerEnabled);
});

// open the editor when requested
Server.onMessage("showEditor", async (_, { type, name }) => {
    const params = new URLSearchParams({
        type,
        name
    });

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.create({
        url: `/editor.html?${params.toString()}`,
        openerTabId: tabs[0]?.id
    });
});
