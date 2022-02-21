/**
 * @description Logic handling for popup-report-segment.html page
 */

import * as contentMetadataAPI from './contentMetadataAPI.js';

/**
****************************************************************************************************
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
     * @return Time converted in milliseconds
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
    function addSegmentToDB(segment) {
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
                    store = db.createObjectStore(storeName, { keyPath: ["timestamps.startTime", "timestamps.endTime"] });
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

            const contentMetadata = await contentMetadataAPI.fetchContentMetadata(currTab);

            console.log(`Fetched contentMetadata`, contentMetadata);

            var segment = {
                contentId: contentMetadata.contentId,
                contentURL: currTab.url,
                timestamps: { startTime: startTime, endTime: endTime },
                categories: segmentCategories
            };

            console.log(`Storing new segment into local database:`, segment);

            addSegmentToDB(segment);

            ev.preventDefault();
        } catch (error) {
            console.log('%c' + `popup.js::reportNewSegment(): error : ${error.message}`, "color:red;font-weight:bold");
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