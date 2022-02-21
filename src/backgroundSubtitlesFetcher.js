/**
 * @fileoverview Subtitle fetching mechanism for the running content
 * @description Implement listeners for request events in order to catch subtitle data for the video
 * content running in the tab.
 * 
 */

/*
====================================================================================================
                    S U B T I T L E S   R E Q U E S T S  I N T E R C E P T I O N
====================================================================================================
*/

/**
****************************************************************************************************
 * @summary Instructions to be processed before the request is triggered
 * @param { Object } requestDetails 
****************************************************************************************************
 */
function onBeforeRequestListener(requestDetails) {
    console.group("Entering backgroundSubtitlesFetcher::onBeforeRequestListener() ...");

    try {
        console.log(`HTTP Method: ${requestDetails.method}, url: ${requestDetails.url}`);
        console.groupEnd();

        return {};
    } catch (error) {
        console.log('%c' + `backgroundSubtitlesFetcher::onBeforeRequestListener(): error: ${error.message}`, "color:red;font-weight:bold")
        console.groupEnd();
    }
}

/**
****************************************************************************************************
 * @summary Fired when the target request is completed.
 * @param { Object } requestDetails 
****************************************************************************************************
 */
function onCompletedListener(requestDetails) {
    console.group("Entering backgroundSubtitlesFetcher.js::onCompletedListener() ...");
    console.groupEnd();
}

/**
****************************************************************************************************
 * @summary Listener fired when an error occurs during request processing
 * @param { Object } requestDetails 
****************************************************************************************************
 */
function onErrorOccurredListener(requestDetails) {
    console.group("Entering onErrorOccurredListener() ...");

    try {
        console.log(`error triggered by webRequest for url=${requestDetails.url}: ${requestDetails.error}`);
        console.groupEnd();
    } catch (error) {
        console.log('%c' + `backgroundSubtitlesFetcher::onErrorOccurredListener(): error: ${error.message}`, "color:red;font-weight:bold")
        console.groupEnd();
    }
}

/*
====================================================================================================
                                S C R I P T   E X E C U T I O N
====================================================================================================
*/

console.log("Entering backgroundSubtitlesFetcher.js script ...")

/**
 * URL pattern for target requests
 */
var targets = ["*://*.nflxvideo.net/?o=*"];


try {
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
} catch (error) {
    console.log('%c' + `backgroundSubtitlesFetcher::onErrorOccurredListener(): error: ${error.message}`, "color:red;font-weight:bold")
}

