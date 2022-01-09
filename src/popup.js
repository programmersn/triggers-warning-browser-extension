/**
 * 
 * @file popup.js
 * 
 * @fileoverview  Popup logic implementation, handling user interaction, providing an interface
 *                for decisional layer execution and managing popup state storage/retrieval.
 * 
 * @jargon - 'sharingan' term refers to the set of processes (decisional crowdsourced/AI algorithms, 
 *           video player handling, ...) comprising the detection/classification/video handling 
 *           mechanism.
 *         - 'popup state' is the aggregation of the states of all logical elements of the popup.
 * 
 * @todo Refresh popup state when switching between tabs with keyboard shortcut (e.g ctrl + tab) 
 *       or when jumping to a newly opened tab with ctrl + T
 * @todo Regarding popup state saving/retrieval mechanism, current implementation uses background
 *       script as a basic storage database for the popup states.
 *       Later implementations could bolster this mechanism by considering the following strategies:
 *       - sessionStorage API for popup states that are meant to be remembered only within the 
 *         browser's session (e.g sharingan state).
 *         If sticking with saving state to background script, then consider switching from 
 *         sendMessage API to connect API (more suitable for long-term messaging)       
 *       - Using localStorage API to save/retrieve user data that are meant to be persistent 
 *         (e.g sensitive scenes preferences) across several browser sessions.
 *         See also the autoSave solution at 
 *         https://stackoverflow.com/questions/60361379/how-to-get-chrome-storage-to-save-on-chrome-extension-popup-close
 *         
 *       * Also consider polling(cf. pollForContentChange() function in uBlock Origin's 
 *         https://github.com/gorhill/uBlock/blob/master/src/js/popup.js)
 *       * Consider using a global currPopupState object that gets updated each time the popup state
 *         changes, and see if it's doable to attach an event listener to currPopupState triggering 
 *         a callback each time currPopupState gets changed. 
 *         The callback would save the modified popup state into either the background script or 
 *         through std storage APIs, as well as redrawing/refreshing popup UI.
 * 
 */

/*
====================================================================================================
                                H E L P E R   S T R U C T S
====================================================================================================
*/

/**
****************************************************************************************************
 * @summary Handle error printing, meant to be used by promises.
 * @param { string } error String object containing error message.
**************************************************************************************************** 
 */
function handlePromiseError(error) {
    console.error(`Error caught from promise: ${error.message}`);
}

/*
====================================================================================================
                                P O P U P   S T A T E   H A N D L I N G
====================================================================================================
*/

/**
****************************************************************************************************
 * @summary Fetch popup state for a certain tab.
 * @description Make a request through sendMessage API to the background script holding popup state
 * objects in order to fetch the popup state matching the id of the underlying tab.
 * @param { Number } tabId Identifier of the tab to fetch the popup state for.
 * @returns { object } Popup state of the tab having `tabId` as identifier.
**************************************************************************************************** 
 */
async function fetchPopupState(tabId) {
    console.log("Entering fetchPopupState() ...");

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
        handlePromiseError(error);
    }
}

/**
**************************************************************************************************** 
 * @summary Save current popup state.
 * @description Save the popup state into the background script through use of sendMessage API.
 * @param { Tab } currTab Object holding metadata on tab for which popup state is being saved.
**************************************************************************************************** 
 */
function savePopupState(currTab) {
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
    }).catch(handlePromiseError);
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

/*
====================================================================================================
                                P O P U P   U I   R E N D E R I N G
====================================================================================================
*/

/**
**************************************************************************************************** 
 * @summary Initializes the popup UI.
 * @description Initializes the popup user interface depending on whether the popup state has an 
 * existing saved state on the underlying tab or not.
 * @param { Tab } currTab Object holding metadata about tab on which the popup is openeds.
 * @param { object } popupState The state of the current popup.
**************************************************************************************************** 
 */

function initPopupUI(currTab, popupState) {
    console.log("Entering initPopupUI() ...");

    if (!popupState || currTab.url != popupState.url) {
        console.log("Popup state for current tab is empty, or URL changed in the meantime. " +
            "Init popup UI from scratch ...");
        initPopupUIFromScratch(currTab);
    } else {   // Setup from saved popup state
        console.log("Current tab url matches existing popup saved state url, applying state ....");
        initPopupUIFromState(popupState);
    }
}

/**
****************************************************************************************************
 * @summary Initializes the popup from scratch.
 * @description Initializes the popup user interface from scratch, then saves the state of the newly
 * built popup.
 * @param { Tab } currTab Object holding metadata about tab on which the popup is opened.
 * @todo Refactor with setupPopupStateFromFetched().
**************************************************************************************************** 
 */
function initPopupUIFromScratch(currTab) {
    console.log("Entering initPopupUIFromScratch() ...");

    if (!isSupportedStreamingContent(currTab)) {
        updateSharinganButton("sharingan-unavailable");
    }

    savePopupState(currTab);
}

/**
****************************************************************************************************
 * @summary Initializes popup from existing state.
 * @description Initializes popup user interface from existing saved state.
 * @param { object } popupState Object holding popup current state.
 * @todo Refactor with setupPopupStateFromScratch().
****************************************************************************************************
 */
function initPopupUIFromState(popupState) {
    console.log("Entering initPopupUIFromState() ...");

    const sharinganState = popupState["sharingan"];

    updateSharinganButton(sharinganState);
}

/**
**************************************************************************************************** 
 * 
 * @summary Update popup's sharingan button.
 * @description Initializes/modifies the HTML element of the popup's sharingan button using the 
 * sharingan state received as parameter.
 * The sharingan state in the button is implemented as a class of the button's HTML interface.
 * @param { string } sharinganState Sharingan state to apply to the popup's sharingan button
 * @note Sharingan can be in either one of the following states : "unavailable", "disabled", 
 * "enabled".
 * "Disabled" is the default state assigned to the sharingan button's underlying HTML element.
 * 
**************************************************************************************************** 
 */
function updateSharinganButton(sharinganState) {
    console.log("Entering setupSharinganButton() ...");

    console.log(`Sharingan state to apply to sharingan button : "${sharinganState}"`);

    switch (sharinganState) {
        case "sharingan-enabled":
        case "sharingan-unavailable":
            document.querySelector("#toggle-sharingan-button").classList.add(sharinganState);
            break;
        case "sharingan-disabled":        // default state in button's underlying HTML element
            document.querySelector("#toggle-sharingan-button").classList
                .remove("sharingan-enabled");
        default:
            return;
    }
}

/*
====================================================================================================
              S T R E A M I N G   C O N T E N T   S U P P O R T   D E C I S I O N
====================================================================================================
*/

/**
**************************************************************************************************** 
 * @type { Array } Regular expressions matching URL patterns of popular VOD platforms' streaming
 * content supported by our mechanism.
 * @note Only Netflix platform is supported as of now. In the future, other VOD platform URLs 
 * patterns may be added as RegExes (HBO, Disney+, Hulu, Amazon Prime ...).
****************************************************************************************************
 */
const supportedStreamingUrls = [
    /^https?:\/\/([^\/]+\.)?netflix\.com\/(.+\/)?watch\/.+/
];

/**
****************************************************************************************************
 * @summary Decides wether current tab contains supported streaming content.
 * @description Uses regular expressions of URL patterns of popular VOD platforms.
 * @param { Tab } currTab Current tab whose webpage's URL will be checked against supported content
 * streaming plateforms' URLs.
 * @todo Fix the variable supportedStreamingUrls containing the RegEx instead, for refactoring
 * purposes.
**************************************************************************************************** 
 */
function isSupportedStreamingContent(currTab) {
    console.log("Entering isSupportedStreamingContent() ...");

    //var regex = new RegExp(supportedStreamingUrls.join("|"), "i");   // doesn't work

    return /^https?:\/\/([^\/]+\.)?netflix\.com\/(.+\/)?watch\/.+/.test(currTab.url);
}

/**  
****************************************************************************************************
 * @summary Enables sharingan on the current tab's streaming content.
 * @description Inject relevant content scripts coding the sharingan mechanism into current tab's 
 * webpage, then saves the newly built state of the popup.
 * @param { Tab } currTab Current tab whose webpage's streaming content will be subject to the
 * sharingan activation.
 * @todo Consider whether following idea is relevant :
 * Add control on whether current web page has finished loading up, to make sure content scripts 
 * injection will succeed, should loading time drag out.
 * @todo Consider storing content scripts filenames in global array and injecting them by looping
 * through the array, if the idea is at all appropriate.
****************************************************************************************************
 */
async function enableSharingan(currTab) {
    console.log("Entering enableSharingan() ...");

    try {
        await browser.tabs.executeScript({ file: "/browser-polyfill.min.js" });
        await browser.tabs.executeScript({ file: "/contentScriptSubtitlesSelector.js" })
        updateSharinganButton("sharingan-enabled");

        savePopupState(currTab);
        checkContentScriptsHeartbeat(currTab);
    } catch (error) {
        handlePromiseError(error);
    }
}

/**
****************************************************************************************************
 * @summary Disable sharingan on current web page.
 * @description Disable sharingan on current tabs's webpage by updating sharingan button state.
 * @note Default state of sharingan is 'sharingan-disabled', so it is sufficient to remove 
 * affixed 'sharingan-enabled' class from the html sharingan button to fall back into the default 
 * disabled state.
 * @todo Send a 'stop'/'freeze' command to the content script so that it freezes the execution of 
 * the decisional/detection algorithms of the sharingan.
****************************************************************************************************
 */
function disableSharingan(currTab) {
    console.log("Entering disableSharingan() ...");

    updateSharinganButton("sharingan-disabled");

    savePopupState(currTab);
}

/*
====================================================================================================
                            C O N T E N T   S C R I P T S   H A N D L I N G
====================================================================================================
*/

/**
 ***************************************************************************************************
 * @summary Heartbeat check of the content script injected in the current tab's web page.
 * @param { Tab } currTab Current tab whose webpage contains the injected content script to be 
 * checked.
 * @todo Handle multiple injected content scripts when switching to connection-based messaging
 * (if at all possible).
 ***************************************************************************************************
 */
function checkContentScriptsHeartbeat(currTab) {
    browser.tabs.sendMessage(
        currTab.id,
        { command: "heartbeat", senderName: "popup.js" }
    ).then(response => {
        console.log("Heartbeat response from content script : " +
            `name='${response.receiverName}', state=${response.receiverState}`);
    }).catch(handlePromiseError);
}

/*
====================================================================================================
                            P O P U P   E V E N T S   H A N D L I N G
====================================================================================================
*/

/**
****************************************************************************************************
 * @summary Attach callbacks to relevant events occurring in the popup.
 * @param { Tab } currTab Object holding current tab's metadata.
****************************************************************************************************
 */
function addListenersToPopup(currTab) {
    console.log("Entering addListenersToPopup() ... ");

    /*
    ------------------------------------------------------------------------------------------------
                                            POPUP CLICK EVENTS
    ------------------------------------------------------------------------------------------------
    */
    document.addEventListener(
        "click",

        /**
        ********************************************************************************************
        * @summary Callback on popup events of type "click".
        * @param { Event } ev Click event dispatched from the popup.
        ********************************************************************************************
        */
        async function (ev) {
            console.log("Entering callback for click event listening ...");

            console.log(`currTab: id=${currTab.id}, url=${currTab.url}`);

            if (ev.target.classList.contains("sharingan-unavailable")) {
                console.log("Clicked on disabled button !");
                return;
            }

            if (ev.target.classList.contains("sharingan-enabled")) {
                console.log("Clicked on the button \"Toggle Sharingan\". Disabling underway ... !");
                disableSharingan(currTab);
                return;
            }

            if (ev.target.classList.contains("sharingan-disabled")) {
                console.log("Clicked on the button \"Toggle Sharingan\". Enabling underway ... !");

                await enableSharingan(currTab);
            }
        }
    );
}

/*
====================================================================================================
                                S C R I P T   E X E C U T I O N
====================================================================================================
*/

console.log("------------------------------------------------------------------------------------");
console.log("Entering popup.js script ...");

var gettingTabs = browser.tabs.query({ currentWindow: true, active: true });

gettingTabs.then(tabs => {

    var currTab = tabs[0];
    console.log(`currTab : id=${currTab.id}, url=${currTab.url}\n`);

    console.log("Managing popupState for current tab ...");

    const fetchingPopupState = fetchPopupState(currTab.id);

    fetchingPopupState.then(popupState => initPopupUI(currTab, popupState));

    addListenersToPopup(currTab);

}).catch(handlePromiseError);
