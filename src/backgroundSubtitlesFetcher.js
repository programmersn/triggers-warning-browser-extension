// eslint-disable-next-line import/no-unassigned-import
//import 'options-storage';

/*
====================================================================================
            S U B T I T L E S   R E Q U E S T S  I N T E R C E P T I O N
===================================================================================
*/

function onBeforeRequestListener(requestDetails) {
    console.group("beforeRequestListener triggered for webRequest");
    console.log(`HTTP Method: ${requestDetails.method},
    url: ${requestDetails.url}`);
    console.groupEnd();

    return {};
}

function onCompletedListener(requestDetails) {
    console.group("onCompletedListener triggered for webRequest");
    console.groupEnd();
}

function onErrorOccurredListener(requestDetails) {
    console.group(`error triggered by webRequest for url=${requestDetails.url}: ${requestDetails.error}`);
    console.groupEnd();
}

/*
====================================================================================
                            S C R I P T   E X E C U T I O N
====================================================================================
*/

console.log("Entering backgroundSubtitlesFetcher script ...")

var targets = ["*://*.nflxvideo.net/?o=*"];

browser.webRequest.onBeforeRequest.addListener(
    onBeforeRequestListener,
    {
        urls: targets
    },
    ["blocking"]  // Blocks the request until the listener returns
);

browser.webRequest.onCompleted.addListener(
    onCompletedListener,
    {
        urls: targets
    }
);

browser.webRequest.onErrorOccurred.addListener(
    onErrorOccurredListener,
    {
        urls: targets
    }
);


