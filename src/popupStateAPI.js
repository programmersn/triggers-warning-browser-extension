/**
 * @fileoverview Implement storage/retrieval API for popup state
 * @todo Refresh popup state when switching between tabs with keyboard shortcut (e.g ctrl + tab) 
 * or when jumping to a newly opened tab with ctrl + T
 * @todo Regarding popup state saving/retrieval mechanism, current implementation uses background
 * script as a basic storage database for the popup states.
 * Later implementations could bolster this mechanism by considering the following strategies:
 * - sessionStorage API for popup states that are meant to be remembered only within the 
 * browser's session (e.g sharingan state).
 * - If sticking with saving state to background script, then consider switching from 
 * sendMessage API to connect API (more suitable for long-term messaging)       
 * - Using localStorage API to save/retrieve user data that are meant to be persistent 
 * (e.g sensitive scenes preferences) across several browser sessions.
 * See also the autoSave solution at https://stackoverflow.com/questions/60361379/how-to-get-chrome-storage-to-save-on-chrome-extension-popup-close
 * - Also consider polling(cf. pollForContentChange() function in uBlock Origin's https://github.com/gorhill/uBlock/blob/master/src/js/popup.js)
 * - Consider using a global currPopupState object that gets updated each time the popup state
 * changes, and see if it's doable to attach an event listener to currPopupState triggering a 
 * callback each time currPopupState gets changed. 
 * The callback would save the modified popup state into either the background script or through std 
 * storage APIs, as well as redrawing/refreshing popup UI.
 */

/*
====================================================================================================
                                P O P U P   S T A T E   H A N D L I N G
====================================================================================================
*/

/**
**************************************************************************************************** 
 * @summary Save current popup state.
 * @description Save the popup state into the background script through use of sendMessage API.
 * @param { Tab } currTab Object holding metadata on tab for which popup state is being saved.
**************************************************************************************************** 
 */
export function savePopupState(currTab) {
    console.log("Entering savePopupState() ...");

    browser.runtime.sendMessage(
        {
            command: "savePopupState",
            popupState: {
                [currTab.id]: {
                    url: currTab.url,
                    sharingan: getSharinganState()
                }
            },
            senderName: "popup.js"
        }
    ).then(response => {
        console.log("response from:" + `${response.receiverName}, ` +
            `message: ${response.message}`);
    }).catch(error => {
        console.log(`error : ${error.message}`);
    });
}

/**
****************************************************************************************************
 * @summary Fetch popup state for a certain tab.
 * @description Make a request through sendMessage API to the background script holding popup state
 * objects in order to fetch the popup state matching the id of the underlying tab.
 * @param { Number } tabId Identifier of the tab to fetch the popup state for.
 * @returns { object } Popup state of the tab having `tabId` as identifier.
**************************************************************************************************** 
 */
export async function fetchPopupState(tabId) {
    console.log("Entering popupStateAPI.js::fetchPopupState() ...");

    try {
        let response = await browser.runtime.sendMessage(
            {
                command: "fetchPopupState",
                tabId: tabId,
                senderName: "popup.js"
            }
        );

        console.log(`Response from : '${response.receiverName}': popupState=`, response.popupState);
        let popupState = response.popupState;

        if (undefined === popupState)
            popupState = null;

        return popupState;
    } catch (error) {
        console.log(`popupStateAPI.js::fetchPopupState()::error : ${error.message}`);
    }
}

/**
****************************************************************************************************
 * @summary Get current sharingan state.
 * @description Get the sharingan state pertaining to the underlying active tab.
 * Sharingan state is extracted from the html interface of the popup UI's sharingan button.
 * @returns { String } String object describing sharingan state.
****************************************************************************************************
 */
function getSharinganState() {
    console.log("Entering getSharinganState ...");
    const listSharinganClasses = document.querySelector("#toggle-sharingan-button").classList;
    const len = listSharinganClasses.length;

    /* Sharingan state is always defined by the last class of the 
    'toggle-sharingan-button' html element */
    return listSharinganClasses.item(len - 1);
}

/**
****************************************************************************************************
 * @summary Simple function to check whether sharingan is enabled
 * @returns Boolean indicating whether sharingan is enabled
****************************************************************************************************
 */
function isSharinganEnabled() {
    console.log("Entering isSharinganEnabled() ...");

    return "sharingan-enabled" === getSharinganState();
}
