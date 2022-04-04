/**
 * @fileoverview Implement storage/retrieval API for video content metadata.
 * @todo Cf. popupStateAPI.js for similar improvement possibilities
 */
import * as netflixPlaybackAPI from './netflixPlaybackAPI.js';

/**
 **************************************************************************************************** 
 * @summary Save content metadata for current video
 * @description Save the content metadata into the background script through use of sendMessage API.
 * @param { Tab } currTab Object for current tab for which the content metadata is being saved.
 * @todo Check whether contentId already exists in contentMetadata, if it does then no need to query
 * the content script anymore
 * @todo Add videoDuration to the contentMetadata object
 **************************************************************************************************** 
 */
export async function saveContentMetadata(currTab) {
    console.log(`Entering contentMetadataAPI.js::saveContentMetadata() ...`);

    try {
        const contentId = await netflixPlaybackAPI.getContentId(currTab);
        console.log(`Received contentId=${contentId}`);

        // @todo Add movie name, maybe using netflix api or extract it from html dom.
        //browser.runtime.sendMessage({
        //    command: "saveContentMetadata",
        //    contentMetadata: {
        //        [currTab.id]: {
        //            url: currTab.url,
        //            contentId: contentId
        //        }
        //    },
        //    senderName: "contentMetadataAPI.js"
        //}).then(response => {
        //    console.log("response from:" + `${response.receiverName}, message: ${response.message}`);
        //}).catch(error => {
        //    console.log(`error : ${error.message}`);
        //});
        //

        const contentMetadatum = {
            [currTab.id]: {
                url: currTab.url,
                contentId: contentId
            }
        };

        browser.storage.local.get(null).then(
            items => {
                console.log(`Retrieved contentMetadata in localStorage:`, items, items.contentMetadata);
                if (items.contentMetadata)
                    Object.assign(items.contentMetadata, contentMetadatum);
                else
                    Object.assign(items, { contentMetadata: contentMetadatum });
                console.log(`Saving updated contentMetadata in localStorage:`, items.contentMetadata);
                browser.storage.local.set(items);
            }
        );
    } catch (error) {
        console.log('%c' + `contentMetadataAPI::saveContentMetadta(): error: ${error.message}`, "color:red;font-weight:bold");
    }
}

/**
 ****************************************************************************************************
 * @summary Fetch content metadata for a certain tab.
 * @description Make a request through sendMessage API to the background script holding content 
 * metadata objects in order to fetch the content metadata matching the id of the underlying tab.
 * @param { Tab } currTab Current tab to fetch the content metadata for.
 * @returns { object } Content metadata of the tab having `currTab.id` as identifier.
 **************************************************************************************************** 
 */
export async function fetchContentMetadata(currTab) {
    console.log("Entering contentMetadataAPI.js::fetchContentMetadata() ...");
    try {
        //let response = await browser.runtime.sendMessage({
        //    command: "fetchContentMetadata",
        //    tabId: currTab.id,
        //    senderName: "contentMetadataAPI.js"
        //});
        //
        //console.log(`Response from : '${response.receiverName}': contentMetadata=`, response.contentMetadata);
        //let contentMetadata = response.contentMetadata;
        //
        //if (undefined === contentMetadata)
        //    contentMetadata = null;
        //
        //return contentMetadata;

        const items = await browser.storage.local.get(null);
        console.log(`Fetched all items from from localStorage:`, items);

        console.log(`contentMetadata from localStorage:`, items.contentMetadata);

        console.log(`Returning contentMetadatum for curr currTab.id=${currTab.id} from localStorage:`, items.contentMetadata[currTab.id]);

        return items.contentMetadata[currTab.id];
    } catch (error) {
        console.log('%c' + `contentMetadataAPI.js::fetchContentMetadata(): error : ${error.message}`, "color:red;font-weight:bold");
    }
}