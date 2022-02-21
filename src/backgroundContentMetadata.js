/**
 * @fileoverview Background script for current video content metadata storage and retrieval.
 * @description Implements local per-session database to store metadata about the video content
 * watched by the user (movie id, url, title ...)
  */

/**
****************************************************************************************************
 * @summary Saved content metadata.
 * @description Javascript Object holding the video content metadata, corresponding to each tab the 
 * popup has been opened in.
 * @type { object } Object holding metadata about the popup state.
 * @example Example of content metadata
 * <tab_id>: {
 *      "url" : <url>
 *      "contentId": <contentId>
 *  }
 * @todo Cf. backgroundPopupState.js for improvement ideas regarding the storage/retrieval 
 * mechanism.
****************************************************************************************************
*/
var contentMetadata = {};

/**
****************************************************************************************************
 * @summary Requests handler.
 * @description Handles requests received from other components using message-based communication 
 * mechanism.
 * @param { object } request Request received from the sender.
 * @param { runtime.MessageSender } sender Holds metadata about the extension's component that is 
 * sender of the request.
 * @param { CallableFunction } sendResponse Callback that can be used to synchronously respond to
 * the request.
 * @returns { Promise } Appropriate response to send back asynchronously.
****************************************************************************************************
 */
function handleReceivedMessages(request, sender, sendResponse) {
    console.log("Entering backgroundContentMetadata::handleReceivedMessages() : ");

    try {
        console.log(`Request of type '${request.command}' :`);
        if (sender.tab) {
            console.log(`From content script ${request.senderName} (in tab of url=` +
                `${sender.tab.url})`);
        } else {
            // tofix: sender.url undefined in chrome for extension pages
            console.log(`From extension (source=${request.senderName} at url=${sender.url})`);
        }

        if ("fetchContentMetadata" === request.command) {
            if (contentMetadata[request.tabId]) {
                console.log(`Sending content metadata of tabId=${request.tabId} to fetchContentMetadata request `
                    + "...");
            }
            else {
                console.log(`Content metadata for tabId=${request.tabId} does not exist`);
            }

            return Promise.resolve(
                {
                    receiverName: "backgroundContentMetadata.js",
                    contentMetadata: contentMetadata[request.tabId]
                }
            );
        } else if ("saveContentMetadata" === request.command) {
            console.log("Received new content metadata to save: ", request.contentMetadata);

            console.log("Assigning new content metadata");
            Object.assign(contentMetadata, request.contentMetadata);
            console.log("New content metadata assigned successfully !");

            console.log("Updated content metadata list: ", contentMetadata);

            return Promise.resolve(
                {
                    receiverName: "backgroundContentMetadata.js",
                    message: "Content metadata saved"
                }
            );
        }
    } catch (error) {
        console.log('%c' + `backgroundContentMetadata.js::handleReceivedMessages(): error: ${error.message}`, "color:red;font-weight:bold");
    }
}

/**
**************************************************************************************************** 
 * @summary Remove the content metadata indicated by the tab id.
 * @description Remove the content metadata of the tab whose identifier is given as a parameter to 
 * the function, from the collection of saved content metadata held in the global object 
 * `contentMetadata` declared in this background script.
 * @param { Number } tabId Identitifer of the tab on which the content metadata to remove operates.
**************************************************************************************************** 
 */
function removeContentMetadata(tabId) {
    console.log("Entering backgroundContentMetadata::removeContentMetadata() ...");

    try {
        if (undefined != contentMetadata[tabId]) {
            console.log("Current content metadata list: ", contentMetadata);
            console.log(`Removing content metadata for closed tab of tabId=${tabId}`);
            delete contentMetadata[tabId];
            console.log("Removal complete, current content metadata list: ", contentMetadata);
        }
    } catch (error) {
        console.log('%c' + `backgroundContentMetadata.js::removeContentMetadata(): error: ${error.message}`, "color:red;font-weight:bold");
    }
}

/*
====================================================================================================
                                S C R I P T   E X E C U T I O N
====================================================================================================
*/

console.log("Entering backgroundContentMetadata script ...");

browser.runtime.onMessage.addListener(handleReceivedMessages);
browser.tabs.onRemoved.addListener(removeContentMetadata);
