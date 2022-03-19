/**
 * @description Logic handling for popup-report-segment.html page
 */

import * as contentMetadataAPI from './contentMetadataAPI.js';

/**
*****************************import ***********************************************************************
 * @summary Attach callbacks to relevant events occurring in the popup's report page events.
 * @param { Tab } currTab Object holding current tab's metadata.
****************************************************************************************************
 */
function addListenersToPopup(currTab) {
    console.log("Entering popup.js::addListenersToPopup() ... ");

    /**
    ************************************************************************************************
     * @summary Parse a time string and return the equivalent in milliseconds.
     * @param { String } timeInputString Timestamp in hh:mm:ss format
     * @return { Number } Time converted in milliseconds
     * @todo Accept hh|h:mm|m:ss|s format in all possible combinations
    ************************************************************************************************
     */
    function parseTimeInput(timeInputString) {
        console.log("Entering popup-report-segment.js::parseTimeInput() ...");
        try {
            if (false === /^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/.test(timeInputString)) {
                console.log(`Input time string '${timeInputString}' ill-formed`);
            }
            console.log(`Parsing ${timeInputString} into milliseconds ...`);

            const [hh, mm, ss] = timeInputString.split(':');

            var timeInputMs = (Number(hh) * 3600 + Number(mm) * 60 + Number(ss)) * 1000;
            console.log(`Parsed hh=${hh}, mm=${mm}, ss=${ss}. Ms=${timeInputMs}`);

            return timeInputMs;
        } catch (error) {
            console.log('%c' + `popup.js::parseTimeInput() error: ${error.message}`, "color:red;font-weight:bold");
        }
    }

    /**
    ************************************************************************************************
     * @description Add segment object to the backend database
     * @param { object } segment 
     * @todo For now the backend database is a local indexedDB. 
    ************************************************************************************************
     */
    function addSegmentToIndexedDB(segment) {
        console.log("Entering popup-report-segment.js::addSegmentToDB() ...")

        try {
            const dbName = "untrigDB";
            // add contentID in the store name, e.g segments<contentID>
            const storeName = "segments-" + segment.contentId;

            console.log(`Opening indexedDB ${dbName}`);
            var openingRequest = indexedDB.open(dbName, 3);

            openingRequest.onerror = function (event) {
                console.log(`Error opening ${dbName} database:`, event);
            };

            openingRequest.onupgradeneeded = function (event) {
                console.log("Entering db popup-report-segment.js::addSegmentToDB()::onupgradeneeded() ... ");
                var db = openingRequest.result;

                if (!db.objectStoreNames.contains(storeName)) {
                    console.log(`Store ${storeName} doesn't exist in ${dbName} database. Creating it ...`);
                    store = db.createObjectStore(storeName, { keyPath: ["startTime", "endTime"] });
                }
            };

            openingRequest.onsuccess = function () {
                console.log("Entering popup-report-segment.js::addSegmentToDB()::onsuccess() ...");
                var db = openingRequest.result;

                var tx = db.transaction([storeName], "readwrite");
                var store = tx.objectStore(storeName);

                console.log(`Store segment metadata in the newly created objectStore ${storeName} ...`, segment);

                store.add(segment);
                console.log(`Added segment, ${storeName}:`, store);

                tx.oncomplete = function () {
                    console.log(`Entering popup-report-segment.js::addSegmentToDB()::onsuccess()::oncomplete()`);
                    db.close();
                };
            };
        } catch (error) {
            console.log('%c' + `popup-report-segment.js::addSegmentToDB(): error : ${error.message}`, "color:red;font-weight:bold");
        }
    }

    /** 
     * 
     * @param {*} segment 
     * @todo Add authentication to the API
     */
    async function addSegmentToDjangoAPI(segment) {
        console.log(`Entering popup.js::addSegmentToDjangoAPI() ...`);

        try {
            const url = 'https://untrig.herokuapp.com/api/segments/';
            //const url = 'http://localhost:5000/api/segments/';

            fetch(url,
                {
                    method: "post",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'                        
                    },
                    body: JSON.stringify(segment)
                })
                .then(response => {
                    console.log(`Response to post request :`, response);
                })
                .catch(error => {
                    console.log(`Error from post request:`, error);
                });
        } catch (error) {
            console.log('%c' + `popup-report-segment.js::addSegmentToDjangoAPI(): error: ${error.message}`, "color:red;font-weight:bold");
        }
    }

    const addSegmentToDB = addSegmentToDjangoAPI;

    /**
    ************************************************************************************************
     * @description Listener to report new segment indicated by user, triggered when user clicks
     * on report button
     * @param { Event } ev 
    ************************************************************************************************
     */
    async function reportNewSegment(ev) {
        console.log("Entering popup-report-segment.js::reportNewSegment() ...");

        try {
            var startTime = parseTimeInput(document.getElementById("start-time").value);
            console.log(`User inputs retrieved : startTime=${startTime}`);

            var endTime = parseTimeInput(document.getElementById("end-time").value);
            console.log(`User inputs retrieved : endTime=${endTime}`);

            var segmentCategories = [];
            var categoriesChecked = document.querySelectorAll('input[type=checkbox]:checked');

            for (var i = 0; i < categoriesChecked.length; i++) {
                segmentCategories.push(categoriesChecked[i].id)
            }

            console.log(`User selected categories:`, segmentCategories);
            if (0 === segmentCategories.length) {
                throw RangeError("The user must select at least one category to report a segment");
            }

            const contentMetadata = await contentMetadataAPI.fetchContentMetadata(currTab);

            console.log(`Fetched contentMetadata`, contentMetadata);

            const [currTabUrl, ...rest] = currTab.url.split("?trackId=");
            console.log(`Extracted useful prefix '${currTabUrl}' from current tab url, to be embedded into the segment object`);

            var segment = {
                contentId: contentMetadata.contentId.toString(),
                contentURL: currTabUrl,
                startTime: startTime.toString(),
                endTime: endTime.toString(),
                categories: segmentCategories
            };

            console.log(`Storing new segment into database:`, segment);

            await addSegmentToDB(segment);
        } catch (error) {
            console.log('%c' + `popup-report-segment.js::reportNewSegment(): error : ${error.message}`, "color:red;font-weight:bold");
        }
    }

    /*
    ------------------------------------------------------------------------------------------------
                                POPUP-REPORT-SEGMENT'S PAGE EVENTS
    ------------------------------------------------------------------------------------------------
    */
    document.getElementById("report-form").addEventListener("submit", reportNewSegment);
}

/*
====================================================================================================
                                S C R I P T   E X E C U T I O N
====================================================================================================
*/

console.log('%c' +
    "************************************************************************************************",
    "color:blue; font-weight:bold");

console.log("Entering popup-report-segment.js script ...");

var gettingTabs = browser.tabs.query({ currentWindow: true, active: true });

gettingTabs.then(tabs => {

    var currTab = tabs[0];
    console.log(`currTab : id=${currTab.id}, url=${currTab.url}\n`);

    addListenersToPopup(currTab);
}).catch(error => {
    console.log('%c' + `popup-report-segment.js: error : ${error.message}`, "color:red;font-weight:bold");
});