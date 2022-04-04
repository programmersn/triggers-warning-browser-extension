/**
 * @note Most code here is V3 Manifest compatible, unless stated otherwise
 */

import * as crossbrowserAPI from './crossbrowserAPI.js';

/*
====================================================================================================
                                    G E T   C O N T E N T   I D
====================================================================================================
*/

/**
 ****************************************************************************************************
 * @description Retrieve the ID of the video content currently playing in the tab.
 * @note Uses temporary contentScriptNetflixPlaybackController.js that will be discontinued when 
 * Firefox V3 Manifest support is out
 * @todo For now, it only supports netflix, so the contentId is the one Netflix uses.
 ****************************************************************************************************
 */
async function getContentIdFirefox(currTab) {
    console.log("Entering netflixPlaybackAPI.js::getContentId() ...");

    try {
        console.log('%c' + `Sending getContentId command to content script in tab=${currTab.id}`, "color:green;font-weight:bold");
        var response = await browser.tabs.sendMessage(
            currTab.id, {
                command: "getContentId",
                senderName: "netflixPlaybackAPI.js"
            }
        );
        console.log('%c' + "response from:" + `${response.receiverName}, ` +
            `message: ${response.message}, result:`, "color:green;font-weight:bold", response.result);

        return response.result;
    } catch (error) {
        console.log('%c' + `netflixPlaybackAPI.js::getContentId(): error: ${error.message}`, "color:red;font-weight:bold");
    }
}

/**
 ****************************************************************************************************
 * @description Retrieve the ID of the video content currently playing in the tab.
 * @note New implementation compatible with V3 Manifest
 * @todo For now, it only supports netflix, so the contentId is the one Netflix uses.
 ****************************************************************************************************
 */
async function getContentIdChrome(currTab) {
    console.log('%c' + "Entering netflixPlaybackAPI.js::getContentId() ...", "color:blue;font-weight:bold");

    try {
        const codeExecutionComplete = new Promise(
            function(resolve) {
                chrome.scripting.executeScript({
                        target: { tabId: currTab.id },
                        func: () => {
                            console.log('%c' + `Entering getContentId() embedded code ...`, "color:blue;font-weight:bold");

                            try {
                                console.log(`Getting videoPlayer ...`);
                                videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;
                                console.log(`Getting player ...`);
                                player = videoPlayer.getVideoPlayerBySessionId(videoPlayer.getAllPlayerSessionIds()[0]);
                                console.log(`Getting movie ID ...`);
                                var movieId = player.getMovieId();
                                console.log(`movieId:`, movieId);

                                return movieId;
                            } catch (error) {
                                console.log('%c' + `netflixPlaybackAPI.js::getContentId()::embedded code error: ${error.message}`, "color:red;font-weight:bold");
                            }
                        },
                        world: 'MAIN',
                    },
                    resolve
                );
            }
        );

        var injectionResults = await codeExecutionComplete;
        console.log(`Returning contentID result:`, injectionResults[0].result);

        return injectionResults[0].result;
    } catch (error) {
        console.log('%c' + `netflixPlaybackAPI.js::getContentId(): error: ${error.message}`, "color:red;font-weight:bold");
    }
}

export async function getContentId() {}
if ("Chrome" === crossbrowserAPI.getBrowserName()) {
    getContentId = getContentIdChrome;
} else {
    getContentId = getContentIdFirefox;
}

/*
====================================================================================================
                                    E N A B L E   S H A R I N G A N
====================================================================================================
*/

/**
 ****************************************************************************************************
 * @description Use content script embedded code to enable segment skipping in the playback
 * @note Will be replaced by chrome version when V3 manifest will be supported by Firefox
 * @param {*} currTab 
 * @param {*} segments Segments to skip
 ****************************************************************************************************
 */
export async function enableSharinganFirefox(currTab, segments) {
    console.log("Entering netflixPlaybackAPI::enableSharingan() ...");

    try {
        console.log('%c' + `Sending enableSharingan command to content script in tab=${currTab.id}`, "color:green;font-weight:bold", segments);
        var response = await browser.tabs.sendMessage(
            currTab.id, {
                command: "enableSharingan",
                segments: segments,
                senderName: "netflixPlaybackAPI.js"
            }
        );
        console.log('%c' + "response from:" + `${response.receiverName}, ` +
            `message: ${response.message}, result:${response.result}`, "color:green;font-weight:bold");
    } catch (error) {
        console.log('%c' + `netflixPlaybackAPI.js::enableSharingan(): error: ${error.message}`, "color:red;font-weight:bold");
    }

}

/**
 ****************************************************************************************************
 * @summary Compute a likely approximation of the margin of error corresonding to the 
 * timestamp, derived empirically from playback testing.
 * @description player.seek() function is not deterministic, it jumps to a timestamp 
 * slightly lesser than the one requested. To avoid playback to get stuck in a loop, a 
 * margin of error is taken into account, computed based on these observations : 
 *  - The smaller the endTime, the bigger the margin of error.
 *  - The bigger the endTime, the smaller the margin of error.
 * Maybe a better solution exist out there to fix it in a deterministic manner.
 * @param { Number } endTime Timestamp of the end of the segment to be skipped.
 * @returns Margin of error
 * @todo Refine the error margins and make them more accurate by more intensive testing
 * @note Talen from contentScriptNetflixPlaybackController.js
 ****************************************************************************************************
 */
function computeErrorMargin(endTime) {
    try {
        if (endTime <= 10 * 1000) {
            return 1;
        } else if (endTime <= 20 * 1000) {
            return 0.30;
        } else if (endTime <= 30 * 1000) {
            return 0.30;
        } else if (endTime <= 40 * 1000) {
            return 0.30;
        } else if (endTime <= 50 * 1000) {
            return 0.30;
        } else if (endTime <= 1 * 60 * 1000) {
            return 0.30;
        } else if (endTime <= 2 * 60 * 1000) {
            return 0.30;
        } else if (endTime <= 4 * 60 * 1000) {
            return 0.30;
        } else if (endTime <= 6 * 60 * 1000) {
            return 0.30;
        } else if (endTime <= 8 * 60 * 1000) {
            return 0.20;
        } else if (endTime <= 10 * 60 * 1000) {
            return 0.15;
        } else if (endTime <= 20 * 60 * 1000) {
            return 0.12;
        } else if (endTime <= 30 * 60 * 1000) {
            return 0.10;
        } else if (endTime <= 40 * 60 * 1000) {
            return 0.08;
        } else if (endTime <= 50 * 60 * 1000) {
            return 0.05;
        } else if (endTime <= 60 * 60 * 1000) {
            return 0.03;
        } else if (endTime <= 70 * 60 * 1000) {
            return 0.02;
        } else if (endTime <= 80 * 60 * 1000) {
            return 0.01;
        } else if (endTime <= 90 * 60 * 1000) {
            return 0.008;
        } else if (endTime <= 100 * 60 * 1000) {
            return 0.006;
        } else if (endTime <= 110 * 60 * 1000) {
            return 0.005;
        } else if (endTime <= 120 * 60 * 1000) {
            return 0.004;
        } else if (endTime <= 130 * 60 * 1000) {
            return 0.003;
        } else if (endTime <= 140 * 60 * 1000) {
            return 0.002;
        } else if (endTime <= 150 * 60 * 1000) {
            return 0.0015;
        } else if (endTime <= 160 * 60 * 1000) {
            return 0.0013;
        } else if (endTime <= 170 * 60 * 1000) {
            return 0.0012;
        } else if (endTime <= 180 * 60 * 1000) {
            return 0.0011;
        } else {
            return 0.001;
        }
    } catch (error) {
        console.log('%c' + `netflixPlaybackAPI::computeErrorMargin() error: ${error.message}`, "color:red;font-weight:bold");
    }
}

/**
 ****************************************************************************************
 * @summary Gets the duration of the played video.
 * @returns { Number } Duration of the played video (unit: milliseconds)
 ****************************************************************************************
 */
async function getDuration(currTab) {
    console.log('%c' + "Entering netflixPlaybackAPI.js::getDuration() ...", "color:blue;font-weight:bold");

    try {
        const codeExecutionComplete = new Promise(
            function(resolve) {
                chrome.scripting.executeScript({
                        target: { tabId: currTab.id },
                        func: () => {
                            console.log('%c' + `Entering getDuration() embedded code ...`, "color:blue;font-weight:bold");
                            try {
                                console.log(`Getting videoPlayer ...`);
                                videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;
                                console.log(`Getting player ...`);
                                player = videoPlayer.getVideoPlayerBySessionId(videoPlayer.getAllPlayerSessionIds()[0]);
                                var videoDuration = player.getDuration();
                                console.log(`Video duration:`, videoDuration)
                                return videoDuration
                            } catch (error) {
                                console.log('%c' + `netflixPlaybackAPI.js::getDuration()::embedded code error: ${error.message}`, "color:red;font-weight:bold");
                            }
                        },
                        world: 'MAIN',
                    },
                    resolve
                );
            }
        );

        const injectionResults = await codeExecutionComplete;
        console.log(`Returned videoDuration result:`, injectionResults[0].result)

        return injectionResults[0].result;
    } catch (error) {
        console.log('%c' + `netflixPlaybackAPI.js::getDuration(): error: ${error.message}`, "color:red;font-weight:bold");
    }
}

/**
 ****************************************************************************************************
 * @summary Prepares the playback so as to skip the indicated sensitive segment
 * @description Sets a timeout callback (polling function)
 * @param { Number } startTime Segment start time
 * @param { Number } endTime Segment end time
 * @note Does leaving the timeout on introduce any latency/lag in the player ? So long 
 * as the skipSegment() callback doesn't use console.log, no such latency is noticed.
 * @todo Check whether that segment has already been set to be skipped.
 * @todo In catch section, in case of error, create CustomEvent object with error 
 * message to transmit to the content script and handle the error appropriately.
 * @todo Return timeout ID via V3 API injected functions mechanism and store it in an array with
 * other timeout IDs. These timeout IDs will be used to disable sharingan by deleting all timeouts.
 ****************************************************************************************************
 */
async function setSegmentToSkip(currTab, startTime, endTime, videoDuration) {
    console.log('%c' + "Entering netflixPlaybackAPI.js::setSegmentToSkip() ...", "color:red;font-weight:bold");

    try {
        if (startTime < 0) {
            throw RangeError(`timestamps invalid range in video playback: startTime=${startTime} < 0`);
        } else if (startTime >= videoDuration) {
            throw RangeError(`timestamps invalid range in video playback: startTime=${startTime} >= videoDuration=${videoDuration}`);
        } else if (endTime <= 0) {
            throw RangeError(`timestamps invalid range in video playback: endTime=${endTime} <= 0`);
        } else if (endTime > videoDuration) {
            throw RangeError(`timestamps invalid range in video playback: endTime=${endTime} > videoDuration=${videoDuration}`);
        } else if (startTime >= endTime) {
            throw RangeError(`timestamps invalid range in video playback: startTime=${startTime} >= endTime=${endTime}`);
        }

        var errorMargin = computeErrorMargin(endTime);

        await chrome.scripting.executeScript({
            target: { tabId: currTab.id },
            func: (startTime, endTime, errorMargin) => {
                console.log('%c' + `Entering setSegmentToSkip() embedded code ...`, "color:red;font-weight:bold");
                try {
                    console.log('%c' + `Setting timeout to skip segment (${startTime}, ${endTime}). Error margin for this range: ${100 * errorMargin} %`, "color:green;font-weight:bold");
                    setTimeout(
                        async function skipSegment() {
                            videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;
                            player = videoPlayer.getVideoPlayerBySessionId(videoPlayer.getAllPlayerSessionIds()[0]);
                            var currTimestamp = player.getCurrentTime();
                            //console.log('%c' + `Timeout skipSegment polling function: currTimestamp=${currTimestamp}, startTime=${startTime}, endTime=${endTime} `, "color:green;font-weight:bold");
                            if (currTimestamp >= startTime && currTimestamp < endTime) {
                                console.log('%c' + "Reached start time for a segment. Skipping ...", "color:red;font-weight:bold;font-style:italic");
                                player.seek(endTime + endTime * errorMargin);
                                console.log('%c' + `Seek jumped at ${player.getCurrentTime()}`, "color:red;font-weight:bold;font-style:italic");
                                console.log('%c' + `Skipped ${player.getCurrentTime() - endTime} ms ahead of endTime, so errorMargin = ${100 * (player.getCurrentTime() - endTime) / endTime} %`, "color:red;font-weight:bold;font-style:italic");
                            }
                            setTimeout(skipSegment, 500);
                        },
                        500,
                        startTime,
                        endTime,
                        errorMargin
                    );
                } catch (error) {
                    console.log(`setSegmentToSkip embedded code error: ${error.message}`);
                }
            },
            args: [startTime, endTime, errorMargin],
            world: 'MAIN',
        });
    } catch (error) {
        console.log('%c' + `netflixPlaybackAPI.js::setSegmentToSkip(): error: ${error.message}`, "color:red;font-weight:bold");
    }
}

/**
 ****************************************************************************************************
 * @description Enable sharingan (skipping of sensitive segments) by injecting embedded
 * code for each sensitive segment.
 * @param { Array } segments List of segments to skip.
 * @note Taken from contenScriptNetflixPlaybackController.js
 ****************************************************************************************************
 */
async function enableSharinganChrome(currTab, segments) {
    console.log('%c' + "Entering netflixPlaybackAPI.js::enableSharingan() ...", "color:red;font-weight:bold");

    try {
        let videoDuration = await getDuration(currTab);
        console.log(`Received videoDuration=`, videoDuration);

        console.log(`Injecting timeouts to skip segments :`, segments);

        for (const segment of segments) {
            console.log("Injecting segment", segment);
            setSegmentToSkip(currTab, Number(segment.startTime), Number(segment.endTime), videoDuration);
        }
    } catch (error) {
        console.log('%c' + `netflixPlaybackAPI.js::enableSharingan(): error: ${error.message}`, "color:red;font-weight:bold");
    }
}

export async function enableSharingan() {}
if ("Chrome" === crossbrowserAPI.getBrowserName()) {
    enableSharingan = enableSharinganChrome;
} else {
    enableSharingan = enableSharinganFirefox;
}