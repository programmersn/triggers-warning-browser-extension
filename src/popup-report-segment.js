

/**
****************************************************************************************************
 * @summary Attach callbacks to relevant events occurring in the popup's report page events.
 * @param { Tab } currTab Object holding current tab's metadata.
****************************************************************************************************
 */
function addListenersToPopup(currTab) {
    console.log("Entering popup.js::addListenersToPopup() ... ");

    /*
    ------------------------------------------------------------------------------------------------
                                POPUP REPORT SEGMENT PAGE EVENTS
    ------------------------------------------------------------------------------------------------
    */

    /**
     * @summary Parse a time string and return the equivalent in milliseconds.
     * @param { String } timeInputString Timestamp in hh:mm:ss format
     * @return Time converted in milliseconds
     * @todo Accept hh|h:mm|m:ss|s format in all possible combinations
     */
    function parseTimeInput(timeInputString) {
        console.log("Entering popup.js::parseTimeInput() ...");
        try {
            if (false === /^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/.test(timeInputString)) {
                console.log(`Input time string '${timeInputString}' ill-formed`);
            }
            console.log(`Parsing ${timeInputString} into milliseconds ...`);

            const [hh, mm, ss] = timeInputString.split(':');

            timeInputMs = (Number(hh) * 3600 + Number(mm) * 60 + Number(ss)) * 1000;
            console.log(`Parsed hh=${hh}, mm=${mm}, ss=${ss}. Ms=${timeInputMs}`);

            return timeInputMs;
        } catch (error) {
            console.log(`popup.js::parseTimeInput() error: ${error.message}`);
        }
    }

    function addSegmentToDB(segment) {
        console.log("Entering addSegmentToDB() ...")
        const dbName = "untrigDB";

        var openingRequest = indexedDB.open(dbName, 3);

        openingRequest.onerror = function (event) {
            console.log(`Error opening ${dbName} database:`, event);
        };

        openingRequest.onupgradeneeded = function (event) {
            console.log("Entering db onupgradeneeded() ... ");
            var db = openingRequest.result;

            var store;
            try {
                //console.log("ObjectStore 'segments' already exists. Retrieving it ..."); o
                store = openingRequest.transaction.objectStore("segments");
            } catch (e) {
                console.log("ObjectStore 'segments' did not exist. Creating Object Store ... ");
                // add contentID in the store name, e.g segments<contentID>
                store = db.createObjectStore("segments", { keyPath: ["timestamps.startTime", "timestamps.endTime"] });
            }

        };

        openingRequest.onsuccess = function (event) {
            console.log("Entering onsuccess() ...");
            var db = openingRequest.result;

            var tx = db.transaction(["segments"], "readwrite");
            var store = tx.objectStore("segments");

            console.log("Store segment metadata in the newly created objectStore ...", segment);

            store.add(segment);
            console.log("segmentsObjectStore:", store);

            tx.oncomplete = function () {
                db.close();
            }
        }
    }

    function reportNewSegment(ev) {
        console.log('%c' + "Entering callback attached to submit button ...", "color:green;font-weight:bold");

        try {
            var startTime = parseTimeInput(document.getElementById("start-time").value);
            console.log('%c' + `User inputs retrieved : startTime=${startTime}`, "color:green;font-weight:bold");

            var endTime = parseTimeInput(document.getElementById("end-time").value);
            console.log('%c' + `User inputs retrieved : endTime=${endTime}`, "color:green;font-weight:bold");

            var segmentCategories = []
            var categoriesChecked = document.querySelectorAll('input[type=checkbox]:checked')

            for (var i = 0; i < categoriesChecked.length; i++) {
                segmentCategories.push(categoriesChecked[i].value)
            }
            // @todo Add movie name, maybe using netflix api or html dom to get it.
            var segment = {
                //contentID: getContentID(),
                contentURL: currTab.url,
                timestamps: { startTime: startTime, endTime: endTime },
                categories: segmentCategories
            };

            console.log('%c' + `Storing new segment into local database:`, "color:green;font-weight:bold", segment);

            addSegmentToDB(segment);

            ev.preventDefault();
        } catch (error) {
            console.log(`popup.js::callback for report-form button submit event listener: ${error.message}`);
        }
    }

    document.getElementById("report-form").addEventListener("submit", reportNewSegment);
}

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
    console.log(`error : ${error.message}`);
});