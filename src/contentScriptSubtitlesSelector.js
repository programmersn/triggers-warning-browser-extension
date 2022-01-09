/**
 * 
 * @file contentScriptSubtitlesSelector.js
 * 
 * @fileoverview Inject in supported content streaming webpage in order to retrieve subtitles of the
 * streaming content.
 * 
 */


try {
    (function () {

        /**
         ******************************************************************************************* 
         * @summary Requests handler.
         * @description Handles requests received from other components using message-based 
         * communication mechanism.
         * @param { object } request Request received from the sender.
         * @param { runtime.MessageSender } sender Holds metadata about the extension's component 
         * that is the sender of the request.
         * @param { CallableFunction } sendResponse Callback that can be used to synchronously
         * respond to the request.
         * @returns { Promise } Appropriate response to send back asynchronously.
         * @todo Implement the handling of a 'stop'/'freeze' command that could be sent from the 
         * extension so that execution of the decisional/detection algorithms of the sharingan can
         * be frozen/stopped.
         *******************************************************************************************
         */
        function handleReceivedMessages(request, sender, sendResponse) {
            console.log("Entering handleReceivedMessages : Message received :");

            if (sender.tab) {
                console.log(`From content script ${request.senderName} (in tab of url=` +
                    `${sender.tab.url})`);
            } else {
                console.log(`From extension (source=${request.senderName} at url=${sender.url}`);   // tofix: sender.url undefined in chrome for extension pages
            }

            if ("heartbeat" === request.command) {
                console.log("Sending answer to heartbeat request ...")
                return Promise.resolve(
                    {
                        receiverName: "contentScriptSubtitlesSelector.js",
                        receiverState: "Alive"
                    }
                )
            }
        }

        /*-------------------------------- Script execution --------------------------------------*/
        if (window.hasRun) {
            return;
        }
        window.hasRun = true;

        console.group("Entering contentScriptSubtitlesSelector script ...");

        browser.runtime.onMessage.addListener(handleReceivedMessages);

        console.groupEnd();
    })();
} catch (error) {
    console.log(`Content script main function error: ${error.message}`);
}