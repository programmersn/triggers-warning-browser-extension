/**
 * @fileoverview Implement storage/retrieval API for video content metadata.
 * @todo Cf. popupStateAPI.js for similar improvement possibilities
 */

/**
**************************************************************************************************** 
 * @summary Save content metadata for current video
 * @description Save the content metadata into the background script through use of sendMessage API.
 * @param { Tab } currTab Object for current tab for which the content metadata is being saved.
**************************************************************************************************** 
 */
export async function saveContentMetadata(currTab) {
    console.log(`Entering popup.js::saveContentMetadata() ...`);

    try {
        const contentId = await getContentId(currTab);
        console.log(`Received contentId=${contentId}`);
        // @todo Add movie name, maybe using netflix api or extract it from html dom.

        console.log("Sending new contentMetadata to be saved into background page");
        browser.runtime.sendMessage(
            {
                command: "saveContentMetadata",
                contentMetadata: {
                    [currTab.id]: {
                        url: currTab.url,
                        contentId: contentId
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
    } catch (error) {
        console.log('%c' + `popup.js::saveContentMetadta(): error: ${error.message}`, "color:red;font-weight:bold");
    }
}

/**
****************************************************************************************************
 * @summary Fetch content metadata for a certain tab.
 * @description Make a request through sendMessage API to the background script holding content 
 * metadata objects in order to fetch the content metadata matching the id of the underlying tab.
 * @param { Number } tabId Identifier of the tab to fetch the content metadata for.
 * @returns { object } Content metadata of the tab having `tabId` as identifier.
**************************************************************************************************** 
 */
export async function fetchContentMetadata(currTab) {
    console.log("Entering popup-report-segment.js::fetchContentMetadata() ...")
    try {
        let response = await browser.runtime.sendMessage(
            {
                command: "fetchContentMetadata",
                tabId: currTab.id,
                senderName: "popup-report-segment.js"
            }
        );

        console.log(`Response from : '${response.receiverName}': contentMetadata=`, response.contentMetadata);
        let contentMetadata = response.contentMetadata;

        if (undefined === contentMetadata)
            contentMetadata = null;

        return contentMetadata;
    } catch (error) {
        console.log('%c' + `popup-report-segment.js::fetchContentMetadata(): error : ${error.message}`, "color:red;font-weight:bold");
    }
}

/**
****************************************************************************************************
 * @description Retrieve the ID of the video content currently playing in the tab.
 * @todo Refactoring: Maybe create a module PlaybackAPI that encapsulates all commands to be sent to
 * contentScriptPlaybackController.js in abstracted functions.
 * @todo For now, it only supports netflix, so the contentId is the one Netflix uses.
****************************************************************************************************
 */
async function getContentId(currTab) {
    console.log("Entering popup.js::getContentId() ...");

    try {
        console.log('%c' + `Sending getContentId command to content script in tab=${currTab.id}`, "color:green;font-weight:bold");
        var response = await browser.tabs.sendMessage(
            currTab.id,
            {
                command: "getContentId",
                senderName: "popup.js"
            }
        );
        console.log('%c' + "response from:" + `${response.receiverName}, ` +
            `message: ${response.message}, result:${response.result}`, "color:green;font-weight:bold");

        return response.result;
    } catch (error) {
        console.log('%c' + `popup.js::getContentId(): error: ${error.message}`, "color:red;font-weight:bold");
    }
}