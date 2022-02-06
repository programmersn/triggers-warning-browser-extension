/**
 * @fileoverview Background script for the extension's popup state storage.
 * @description Implements local per-session database to store popup's states.
 * @see popupStateAPI.js for the API to acces this database.
 */

/**
****************************************************************************************************
 * @summary Saved popup states.
 * @description Javascript Object holding the saved popup states received from the popup, 
 * corresponding to each tab the popup has been opened in.
 * @type { object } Object holding metadata about the popup state.
 * @example Example of popup saved state :
 * <tab_id>: {
 *      "url" : <url>
 *      "sharingan": <"sharingan-unavailable" | "sharingan-disabled" | "sharingan-enabled">
 *  }
 * @note This first implementation of popup state saving mechanism uses Javascript Objects. Later
 * implementations could change that to more sophisticated and performant data structures as Map.
 * @note Consider the idea whether to turn popupStates into a class and keep popupState as object.
****************************************************************************************************
*/
var popupStates = {};

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
 * @todo Try out implementing message handler in another background script, to make sure whether
 * message reception can be deterministically predicted to be handled by one or another background
 * script. 
 * This issue might be avoided if messaging system is connection-based, whereby connection to each 
 * script is identified by its port, allowing for the effective handling of multiple connections 
 * without intermingling messages between receiving scripts.
****************************************************************************************************
 */
function handleReceivedMessages(request, sender, sendResponse) {
    console.log("Entering handleReceivedMessages : ");

    console.log(`Request of type '${request.command}' :`);
    if (sender.tab) {
        console.log(`From content script ${request.senderName} (in tab of url=` +
            `${sender.tab.url})`);
    } else {
        // tofix: sender.url undefined in chrome for extension pages
        console.log(`From extension (source=${request.senderName} at url=${sender.url})`);   
    }

    if ("fetchPopupState" === request.command) {
        if (popupStates[request.tabId])
            console.log(`Sending popup state of tabId=${request.tabId} to fetchPopupState request ` 
            + "...");
        else
            console.log(`Popup state for tabId=${request.tabId} does not exist`);

        return Promise.resolve(
            {
                receiverName: "backgroundPopupState.js",
                popupState: popupStates[request.tabId]
            }
        )
    } else if ("savePopupState" === request.command) {
        console.log("Received new popup state to save: ", request.popupState);

        console.log("Assigning new state");
        Object.assign(popupStates, request.popupState);
        console.log("New state assigned successfully !");

        console.log("Updated popup states list: ", popupStates);

        return Promise.resolve(
            {
                receiverName: "backgroundPopupState.js",
                message: "Popup state saved"
            }
        );
    }
}

/**
**************************************************************************************************** 
 * @summary Remove the popup state indicated by the tab id.
 * @description Remove the popup state of the tab whose identifier is given as a parameter to the 
 * function, from the collection of saved popup states held in the global object `popupStates` 
 * declared in this background script.
 * @param { Number } tabId Identitifer of the tab on which the popup state to remove operated.
**************************************************************************************************** 
 */
function removePopupState(tabId) {
    console.log("Entering removePopupState() ...");
    if (undefined != popupStates[tabId]) {
        console.log("Current popup states list: ", popupStates);
        console.log(`Removing popup saved state for closed tab of tabId=${tabId}`);
        delete popupStates[tabId];
        console.log("Removal complete, current popup states list: ", popupStates);
    }
}

/*
====================================================================================================
                                S C R I P T   E X E C U T I O N
====================================================================================================
*/

console.log("Entering backgroundPopupState script ...");

browser.runtime.onMessage.addListener(handleReceivedMessages);
browser.tabs.onRemoved.addListener(removePopupState);

// @todo: Find a safer/more elegant way of exposing popupStates as global variable
//        Maybe extract popupState as a class in a module of its own, and expose a public getter
//        to access popupStates object
window.popupStates = popupStates
