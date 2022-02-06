

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

    document.getElementById("report-form").addEventListener(
        "submit",
        function (ev) {
            console.log('%c' + "Entering callback attached to submit button ...", "color:green;font-weight:bold");

            try {
                var startTime = parseTimeInput(document.getElementById("start-time").value);
                console.log('%c' + `User inputs retrieved : startTime=${startTime}`, "color:green;font-weight:bold");

                var endTime = parseTimeInput(document.getElementById("end-time").value);
                console.log('%c' + `User inputs retrieved : endTime=${endTime}`, "color:green;font-weight:bold");

                console.log('%c' + `Send skipSegment command to content script in tab=${currTab.id}`, "color:green;font-weight:bold");
                browser.tabs.sendMessage(
                    currTab.id,
                    {
                        command: "skipSegment",
                        segment: { startTime, endTime },
                        senderName: "popup.js"
                    }
                ).then(response => {
                    console.log('%c' + "response from:" + `${response.receiverName}, ` +
                        `message: ${response.message}, result:${response.result}`, "color:green;font-weight:bold");
                }).catch(error => {
                    console.log('%c' + `report-form submit callback: error : ${error.message}`, "color:green;font-weight:bold");
                });

                ev.preventDefault();
            } catch (error) {
                console.log(`popup.js::callback for report-form button submit event listener: ${error.message}`);
            }
        }
    );
}

console.log('%c' +
    "************************************************************************************************",
    "color:blue; font-weight:bold");

console.log("Entering popup-report-segment.js script ...");


var gettingTabs = browser.tabs.query({ currentWindow: true, active: true });

gettingTabs.then(tabs => {

    var currTab = tabs[0];
    console.log(`currTab : id=${currTab.id}, url=${currTab.url}\n`);

    //console.log("Managing popupState for current tab ...");

    //const fetchingPopupState = fetchPopupState(currTab.id);

    //fetchingPopupState.then(popupState => initPopupUI(currTab, popupState));

    addListenersToPopup(currTab);

}).catch(error => {
    console.log(`error : ${error.message}`);
});