/**
 * @fileoverview  Popup main page logic implementation, handling user interaction, providing an 
 * interface for decisional layer execution and managing popup state storage/retrieval.
 * @jargon - 'sharingan' term refers to the set of processes (decisional crowdsourced/AI algorithms, 
 * video player handling, ...) comprising the detection/classification/video handling mechanism.
 *         - 'popup state' is the aggregation of the states of all logical elements of the popup.
 */

import * as popupStateAPI from './popupStateAPI.js';
import * as contentMetadataAPI from './contentMetadataAPI.js';

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
 * @param { Tab } currTab Object holding metadata about tab on which the popup is opened.
 * @param { object } popupState The state of the current popup.
**************************************************************************************************** 
 */

function initPopupUI(currTab, popupState) {
    console.log("Entering initPopupUI() ...");

    try {
        if (!popupState || currTab.url != popupState.url) {
            console.log("Popup state for current tab is empty, or URL changed in the meantime. " +
                "Init popup UI from scratch ...");
            initPopupUIFromScratch(currTab);
        } else {   // Setup from saved popup state
            console.log("Current tab url matches existing popup saved state url, applying state ....");
            initPopupUIFromState(popupState);
        }
    } catch (error) {
        console.log('%c' + `popup.js::initPopupUI(): error: ${error.message}`, "color:red;font-weight:bold");
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

    try {
        if (!isSupportedStreamingContent(currTab)) {
            updateSharinganButton("sharingan-unavailable");
        }
        popupStateAPI.savePopupState(currTab);
    } catch (error) {
        console.log('%c' + `popup.js::initPopupUIFromScratch(): error: ${error.message}`, "color:red;font-weight:bold");
    }


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

    try {
        const sharinganState = popupState["sharingan"];
        updateSharinganButton(sharinganState);
    } catch (error) {
        console.log('%c' + `popup.js::initPopupUIFromState(): error: ${error.message}`, "color:red;font-weight:bold");
    }
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

    try {
        console.log(`Sharingan state to apply to sharingan button : "${sharinganState}"`);

        switch (sharinganState) {
            case "sharingan-enabled":
            case "sharingan-unavailable":
                document.querySelector("#toggle-sharingan-button").classList.add(sharinganState);
                break;
            case "sharingan-disabled":        // default state in button's underlying HTML element
                document.querySelector("#toggle-sharingan-button").classList.remove("sharingan-enabled");
            default:
                return;
        }
    } catch (error) {
        console.log('%c' + `popup.js::updateSharinganButton(): error: ${error.message}`, "color:red;font-weight:bold");
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

    try {
        //var regex = new RegExp(supportedStreamingUrls.join("|"), "i");   // doesn't work

        return /^https?:\/\/([^\/]+\.)?netflix\.com\/(.+\/)?watch\/.+/.test(currTab.url);
    } catch (error) {
        console.log('%c' + `popup.js::isSupportedStreamingContent(): error: ${error.message}`, "color:red;font-weight:bold");
    }
}

/**  
****************************************************************************************************
 * @summary Prepares sharingan on the current tab's streaming content.
 * @description Inject relevant content scripts coding the sharingan mechanism into current tab's 
 * webpage.
 * @param { Tab } currTab Current tab whose webpage's streaming content will be subject to the
 * sharingan activation.
 * @todo Re-inject content script/embedded code into the webpage whenever the web page reloads.
 * Wouls likely require a listener on reloading event on the tab.
 * @todo Consider storing pairs <content script filename, has been injected boolean> in global 
 * array and injecting them by looping through the array, if the idea is at all appropriate, with 
 * the boolean insuring that each content script gets injected only once.
 * Research whether there are better design strategies out there to guarantee unique injection 
 * of content script/embedded code.
****************************************************************************************************
 */
async function prepareSharingan(currTab) {
    console.log("Entering popup.js::prepareSharingan() ...");

    try {
        if (!isSupportedStreamingContent(currTab)) {
            console.log("Unsupported web page for sharingan. Sharingan will no be prepared. Exiting popup.js::prepareSharingan() ...");
            return;
        }

        console.log("Preparing sharingan by injecting the relevant content scripts ...");
        // Has to be injected alongside any content script to make the content script compatible 
        // with Chrome with regards to WebExtension API   
        await browser.tabs.executeScript({ file: "/browser-polyfill.min.js" });
        await browser.tabs.executeScript({ file: "/contentScriptNetflixPlaybackController.js" });

        await contentMetadataAPI.saveContentMetadata(currTab);

        //popupStateAPI.savePopupState(currTab);
        checkContentScriptsHeartbeat(currTab);     // uncomment when a content script exists
    } catch (error) {
        console.log('%c' + `popup.js::prepareSharingan(): error : ${error.message}`, "color:red;font-weight:bold");
    }
}


/**
****************************************************************************************************
 * @description Fetch from database the sensitive segments corresponding to the video content.
 * @param { Tab } currTab 
 * @returns List of the sensitive segments
****************************************************************************************************
 */
async function getSegmentsListFromDB(currTab) {
    console.log("Entering getSegmentListFromDB() ...");

    try {
        return new Promise(
            async function (resolve) {
                var segmentsList;

                const dbName = "untrigDB";
                const contentMetadata = await contentMetadataAPI.fetchContentMetadata(currTab);
                const storeName = "segments-" + contentMetadata.contentId

                var openingRequest = indexedDB.open(dbName, 3);

                openingRequest.onsuccess = function () {
                    var db = openingRequest.result;
                    var tx = db.transaction(storeName, "readwrite");
                    var store = tx.objectStore(storeName);

                    // Query the segment from store
                    var getAllSegmentsQuery = store.getAll();

                    getAllSegmentsQuery.onsuccess = function (event) {
                        segmentsList = getAllSegmentsQuery.result;
                        console.log(`Successfully queried database for segments associated with contentID :`, segmentsList);
                        console.log("Leaving getSegmentListFromDB() and returning segments=", segmentsList);
                        return resolve(segmentsList);
                    };

                    tx.oncomplete = function () {
                        db.close();
                    };
                }
            }
        );
    } catch (error) {
        console.log('%c' + `popup.js::getSegmentsListFromDB(): error: ${error.message}`, "color:red;font-weight:bold");
    }
}

/**
****************************************************************************************************
 * @description Enable sharingan by retrieving and injecting sensitive segments into the video
 * Playback. 
 * The segments retrieved from database are intersected with the sensitive categories of the user.
 * @param { Tab } currTab 
****************************************************************************************************
 */
async function enableSharingan(currTab) {
    console.log("Entering popup.js::enableSharingan() ...");

    try {

        updateSharinganButton("sharingan-enabled");

        var fullSegmentsList = await getSegmentsListFromDB(currTab);
        var userSegmentsList = [];
        const result = await browser.storage.sync.get("categories");
        const userSensitiveCategories = result.categories;
        console.log("Retrieved saved categories :", userSensitiveCategories);

        for (const segment of fullSegmentsList) {
            for (const userSensitiveCategory of userSensitiveCategories) {
                for (const segmentCategory of segment.categories) {
                    console.log(`userSensitiveCategory=${userSensitiveCategory}, segmentCategory=${segmentCategory}, for segment:`, segment);
                    if (userSensitiveCategory === segmentCategory) {
                        console.log(`User sensitive category ${userSensitiveCategory} relates to the segment `, segment)
                        userSegmentsList.push(segment);
                    }
                }
            }
        }

        console.log('%c' + `Sending enableSharingan command to content script in tab=${currTab.id}`, "color:green;font-weight:bold", userSegmentsList);
        var response = await browser.tabs.sendMessage(
            currTab.id,
            {
                command: "enableSharingan",
                segments: userSegmentsList,
                senderName: "popup.js"
            }
        );
        console.log('%c' + "response from:" + `${response.receiverName}, ` +
            `message: ${response.message}, result:${response.result}`, "color:green;font-weight:bold");

        popupStateAPI.savePopupState(currTab);
    } catch (error) {
        console.log('%c' + `popup.js::enableSharingan(): error : ${error.message}`, "color:red;font-weight:bold");
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

    try {

        updateSharinganButton("sharingan-disabled");

        popupStateAPI.savePopupState(currTab);

    } catch (error) {
        console.log('%c' + `popup.js::disableSharingan(): error: ${error.message}`, "color:red;font-weight:bold");
    }
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
    try {
        browser.tabs.sendMessage(
            currTab.id,
            { command: "heartbeat", senderName: "popup.js" }
        ).then(response => {
            console.log("Heartbeat response from content script : " +
                `name='${response.receiverName}', state=${response.receiverState}`);
        }).catch(error => {
            console.log(`error : ${error.message}`);
        });
    } catch (error) {
        console.log('%c' + `popup.js::checkContentScriptsHeartbeat(): error: ${error.message}`, "color:red;font-weight:bold");
    }
}

/*
====================================================================================================
                            P O P U P   E V E N T S   H A N D L I N G
====================================================================================================
*/

/**
****************************************************************************************************
 * @summary Attach callbacks to relevant events occurring in the popup main page
 * @param { Tab } currTab Object holding current tab's metadata.
****************************************************************************************************
 */
function addListenersToPopup(currTab) {
    console.log("Entering popup.js::addListenersToPopup() ... ");

    try {

        /**
        ********************************************************************************************
        * @summary Callback on popup events of type "click".
        * @param { Event } ev Click event dispatched from the popup.
        ********************************************************************************************
        */
        async function clickListener(ev) {
            console.log("Entering popup.js::callback for click event listening ...");

            try {
                console.log(`currTab: id=${currTab.id}, url=${currTab.url}`);

                // Sharingan button
                if (ev.target.classList.contains("sharingan-unavailable")) {
                    console.log(`Clicked on unavailable "${ev.target.innerHTML}" !`);
                    return;
                }

                if (ev.target.classList.contains("sharingan-enabled")) {
                    console.log(`Clicked on the button "${ev.target.innerHTML}". Disabling underway ... !`);
                    disableSharingan(currTab);

                    return;
                }

                if (ev.target.classList.contains("sharingan-disabled")) {
                    console.log(`Clicked on the button "${ev.target.innerHTML}". Enabling underway ... !`);

                    await enableSharingan(currTab);
                }
            } catch (error) {
                console.log('%c' + `popup.js::clickListener(): error: ${error.message}`);
            }
        }

        /*
        --------------------------------------------------------------------------------------------
                                            POPUP'S MAIN PAGE EVENTS
        --------------------------------------------------------------------------------------------
        */
        document.addEventListener("click", clickListener);
    } catch (error) {
        console.log('%c' + `popup.js::addListenersToPopup(): error: ${error.message}`, "color:red;font-weight:bold");
    }

}

/*
====================================================================================================
                                S C R I P T   E X E C U T I O N
====================================================================================================
*/

console.log('%c' +
    "=================================================================================================",
    "color:red; font-weight:bold");

console.log("Entering popup.js script ...");

var gettingTabs = browser.tabs.query({ currentWindow: true, active: true });

gettingTabs.then(tabs => {

    var currTab = tabs[0];
    console.log(`currTab : id=${currTab.id}, url=${currTab.url}\n`);

    prepareSharingan(currTab).then(() => {
        const fetchingPopupState = popupStateAPI.fetchPopupState(currTab.id);

        fetchingPopupState.then(popupState => initPopupUI(currTab, popupState));

        addListenersToPopup(currTab);
    });

}).catch(error => {
    console.log('%c' + `error : ${error.message}`, "color:red;font-weight:bold");
});