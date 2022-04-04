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
export async function savePopupState(currTab) {
    console.log("Entering savePopupState() ...");

    try {
        const popupState = {
            [currTab.id]: {
                url: currTab.url,
                sharingan: getSharinganState()
            }
        };

        let items = await browser.storage.local.get(null);

        console.log(`Retrieved popupStates in localStorage:`, items, items.popupStates);
        if (items.popupStates) {
            Object.assign(items.popupStates, popupState);
        } else {
            Object.assign(items, { popupStates: popupState });
        }

        console.log(`Saving updated popupStates in localStorage:`, items.popupStates);
        await browser.storage.local.set(items);
    } catch (error) {
        console.log('%c' + `popupStateAPI.js::savePopupState()::error : ${error.message}`, "color:red;font-weight:bold;");
    }
}

/**
 ****************************************************************************************************
 * @summary Fetch popup state for a certain tab.
 * @description Make a request through sendMessage API to the background script holding popup state
 * objects in order to fetch the popup state matching the id of the underlying tab.
 * @param { Tab } currTab Current tab to fetch the popup state for.
 * @returns { object } Popup state of the current tab 
 **************************************************************************************************** 
 */
export async function fetchPopupState(currTab) {
    console.log('%c' + "Entering popupStateAPI.js::fetchPopupState() ...", "color:red; font-weight:bold; font-style:italic");

    try {
        const items = await browser.storage.local.get(null);
        console.log(`Fetched all items from from localStorage:`, items);

        console.log(`popupStates from localStorage:`, items.popupStates);

        console.log(`Returning popupState for curr currTab.id=${currTab.id} from localStorage:`, items.popupStates[currTab.id]);

        return items.popupStates[currTab.id];
    } catch (error) {
        console.log('%c' + `popupStateAPI.js::fetchPopupState()::error : ${error.message}`, "color:red;font-weight:bold;");
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

    try {
        const listSharinganClasses = document.querySelector("#toggle-sharingan-button").classList;
        const len = listSharinganClasses.length;

        // Sharingan state is always defined by the last class of the 'toggle-sharingan-button' 
        // html element 
        let sharinganState = listSharinganClasses.item(len - 1);

        console.log('%c' + "Returning sharinganState=", "font-weight:bold;font-decoration:underline", sharinganState)
        return sharinganState;
    } catch (error) {
        console.log('%c' + `popupStateAPI.js::getSharinganState()::error : ${error.message}`, "color:red;font-weight:bold;");
    }
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