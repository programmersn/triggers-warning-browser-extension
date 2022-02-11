/**
 * @fileoverview Content script to control Netflix video playback via re-implementation of a subset
 * of Netflix's internal frontend playback API.
 */

(function () {
    try {
        if (window.hasRun) {
            return;
        }
        window.hasRun = true;
        console.log("Entering contentScriptNetflixPlaybackController script ...");

        /*
        ====================================================================================================
                                        P L A Y B A C K   C O N T R O L L E R
        ====================================================================================================
        */

        /**
        ****************************************************************************************************
         * @summary Interface to control Netflix video streaming playback
         * @description Reverse engineered interface that gives handles into a subset of the frontend 
         * internal Netflix video streaming API, allowing for fine-grained control over the video playback.
         * @note Netflix internal frontend video playback API is built over HTML5 video streaming API
         * @note Cannot extract this class in a module of its own and import it here as it's not supported
         * by browsers. Maybe there is a way to do it but didn't find it.
        ****************************************************************************************************
         */
        class PlaybackController {

            /**
            ************************************************************************************************
             * @summary Declares basic handles over API Netflix uses to render streaming content
             * @description Declares and defines variables to control Netflix's video stream 
             * programmatically into Netflix streaming webpage's namespace.
             * @see https://stackoverflow.com/questions/42105028/netflix-video-player-in-chrome-how-to-seek
             * @see https://stackoverflow.com/questions/42679738/simulate-click-on-change-value-of-arias-netflix-slider-programatically
            ************************************************************************************************
             */
            static _playerHandlesDecl =
                `
                videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;
                player = videoPlayer.getVideoPlayerBySessionId(videoPlayer.getAllPlayerSessionIds()[0]);
                `;

            /**
            ************************************************************************************************
             * @summary Inject javascript code as embedded code into webpage's DOM content
             * @param { String } embeddedCode Code to inject and execute
             * @todo Turn into a private method when full support for private class features is rolled out
             * in ECMA std.
            ************************************************************************************************
             */
            static injectEmbeddedCode(embeddedCode) {
                try {
                    console.log("Entering in contentScriptNetlixPlaybackController::Playback.injectEmbeddedCode() ...");
                    console.log(`Embedding and executing ${embeddedCode} into webpage ... `);
                    var script = document.createElement('script');
                    script.textContent = embeddedCode;
                    (document.head || document.documentElement).appendChild(script);
                    script.remove();
                } catch (error) {
                    console.log(`contentScriptNetlixPlaybackController::Playback.injectEmbeddedCode() error: ${error.message}`);
                }

            }

            /**
            ************************************************************************************************
             * @summary Gets the duration of the played video.
             * @description Uses custom event to collect return value from NEtflix's internal API and send
             * it over to the content script.
             * @returns { Number } Duration of the played video (unit: milliseconds)
            ************************************************************************************************
             */
            static getDuration() {
                console.log("Entering contenScriptNetflixPlaybackController::Playback.getDuration() ...");

                try {
                    var embeddedCode =
                        `
                (function() {
                    try { 
                        ${PlaybackController._playerHandlesDecl};
                        var duration = player.getDuration();
                        var event = new CustomEvent("getDurationEvent", { detail: { duration: duration } });
                        console.log('%c'+ "Created custom event:", "color:green;font-weight:bold", event);
                        window.dispatchEvent(event);
                        console.log('%c'+ "Dispatched event", "color:green;font-weight:bold");
                    } catch (error) { 
                        console.log(\`seek embedded code error: \${error.message}\`);
                    }
                })();                
                `;

                    var result;
                    console.log('%c' + "Adding listener to custom getDuration() result event", "color:green;font-weight:bold");
                    window.addEventListener(
                        "getDurationEvent",
                        event => {
                            result = event.detail.duration;
                            console.log('%c' + `Intercepted event with getDuration() result from playback: result=${result}`, "color:green;font-weight:bold");
                        }
                    );

                    PlaybackController.injectEmbeddedCode(embeddedCode);

                    return result;
                } catch (error) {
                    console.log(`contenScriptNetflixPlaybackController::Playback.getDuration() error: ${error.message}`);
                }
            }

            /**
            ************************************************************************************************
             * @summary Jump the scrubber/slider of the video to the indicated position.
             * @description Inject into the webpage's header the embedded code using Netflix API to seek
             * to the indicated position
             * @param { Number } timestamp Timestamp to reach in the video (unit: )
             * @returns 
            ************************************************************************************************
             */
            static seek(timestamp) {
                console.log("Entering contenScriptNetflixPlaybackController::Playback.seek() ...");

                try {
                    if (timestamp <= 0 || timestamp > PlaybackController.getDuration()) {
                        throw RangeError(`timestamp ${timestamp} invalid range in video playback`)
                    }

                    var embeddedCode =
                        `
                (function() {
                    try {
                        ${PlaybackController._playerHandlesDecl};
                        player.seek(${timestamp});
                    } catch (error) {
                        console.log(\`seek embedded code error: \${error.message}\`);
                    }
                })();                
                `;

                    PlaybackController.injectEmbeddedCode(embeddedCode);

                    return result;
                } catch (error) {
                    console.log(`contenScriptNetflixPlaybackController::Playback.seek() error: ${error.message}`);
                }
            }

            /**
            ************************************************************************************************
             * @summary Compute a likely approximation of the margin of error corresonding to the 
             * timestamp, derived empirically from playback testing.
             * @description player.seek() function is not deterministic, it jumps to a timestamp slightly 
             * lesser than the one requested. To avoid playback to get stuck in a loop, a margin of error 
             * is taken into account, computed based on these observations : 
             *  - The smaller the endTime, the bigger the margin of error.
             *  - The bigger the endTime, the smaller the margin of error.
             * Maybe a better solution exist out there to fix it in a deterministic manner.
             * @param { Number } endTime Timestamp
             * @returns Margin of error
             * @todo Refine the error margins and make them more accurate by more intensive testing
             * @todo Turn into a private method when full support for private class features is rolled out
             * in ECMA std.
            ************************************************************************************************
             */
            static computeErrorMargin(endTime) {
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
                    console.log(`contenScriptNetflixPlaybackController::Playback.computeErrorMargin() error: ${error.message}`);
                }
            }

            /**
            ************************************************************************************************
             * @summary Prepares the playback so as to skip the indicated sensitive segment
             * @description Sets a timeout callback (polling function)
             * @param { Number } startTime Segment start time
             * @param { Number } endTime Segment end time
             * @note Does leaving the timeout on introduce any latency/lag in the player ? So long as 
             * the skipSegment() callback doesn't use console.log, no such latency is noticed.
             * @todo Check whether that segment has already been set to be skipped.
             * @todo In catch section, in case of error, create CustomEvent object with error message to
             * transmit to the content script and handle the error appropriately.
             * @todo Send the timeout ID via CustomEvent to be stored in a class variable array with
             * other timeout IDs. These timeout IDs will be used to disable sharingan by deleting
             * all timeouts.
            ************************************************************************************************
             */
            static setSegmentToSkip(startTime, endTime) {
                try {
                    console.log("Entering contenScriptNetflixPlaybackController::Playback.setSegmentToskip() ...");

                    let videoDuration = PlaybackController.getDuration();
                    if (startTime < 0 || startTime >= videoDuration ||
                        endTime <= 0 || endTime > videoDuration ||
                        startTime >= endTime) {
                        throw RangeError(`timestamps invalid range in video playback`);
                    }

                    var errorMargin = PlaybackController.computeErrorMargin(endTime);

                    var embeddedCode =
                        `
                        (function() {
                            try {
                                var startTime = ${startTime};
                                var endTime = ${endTime};
                                var errorMargin = ${errorMargin}
                                console.log('%c' + \`Setting timeout to skip segment (\${startTime}, \${endTime}). Error margin for this range: \${100*errorMargin} %\`, "color:green;font-weight:bold");
                                setTimeout(
                                    async function skipSegment() {
                                        ${PlaybackController._playerHandlesDecl};
                                        var currTimestamp = player.getCurrentTime();
                                        //console.log('%c' + \`Timeout skipSegment polling function: currTimestamp=\${currTimestamp}, startTime=\${startTime}, endTime=\${endTime} \`, "color:green;font-weight:bold");
                                        if (currTimestamp >= startTime && currTimestamp < endTime) {
                                            console.log('%c' + "Reached start time for a segment. Skipping ...", "color:red;font-weight:bold;font-style:italic");
                                            player.seek(endTime + endTime*errorMargin);
                                            console.log('%c' + \`Seek jumped at \${player.getCurrentTime()}\`, "color:red;font-weight:bold;font-style:italic");
                                            console.log('%c' + \`Skipped \${player.getCurrentTime() - endTime} ms ahead of endTime, so errorMargin = \${100*(player.getCurrentTime()-endTime)/endTime} %\`, "color:red;font-weight:bold;font-style:italic");
                                        }
                                        setTimeout(skipSegment, 500);
                                    },
                                    500,
                                    startTime,
                                    endTime,
                                    errorMargin
                                );
                            } catch (error) {
                                console.log(\`setSegmentToSkip embedded code error: \${error.message}\`);
                            }
                        })();
                        `;

                    PlaybackController.injectEmbeddedCode(embeddedCode);
                } catch (error) {
                    console.log(`contenScriptNetflixPlaybackController::Playback.setSegmentToSkip() error: ${error.message}`);
                }
            }

            static enableSharingan(segments) {
                console.log("Entering contentScriptNetflixPlaybackController::enableSharingan() ...");

                console.log(`Injecting timeouts to skip segments :`, segments);

                for (const segment of segments) {
                    console.log("Injecting segment", segment);
                    PlaybackController.setSegmentToSkip(segment.timestamps.startTime, segment.timestamps.endTime);
                }
            }
        }

        /*
        ====================================================================================================
                                        P L A Y B A C K   A P I
        ====================================================================================================
        */

        /**
         *************************************************************************************************** 
         * @summary Requests handler.
         * @description Handles requests received from other components using message-based 
         * communication mechanism.
         * Exposes API to other components of the extension to control Netflix video playback.
         * @param { object } request Request received from the sender.
         * @param { runtime.MessageSender } sender Holds metadata about the extension's component 
         * that is the sender of the request.
         * @param { CallableFunction } sendResponse Callback that can be used to synchronously
         * respond to the request.
         * @returns { Promise } Appropriate response to send back asynchronously.
         * @todo Implement the handling of a 'stop'/'freeze' command that could be sent from the 
         * extension so that execution of the decisional/detection algorithms of the sharingan can
         * be frozen/stopped.
         ***************************************************************************************************
         */
        function handleReceivedMessages(request, sender, sendResponse) {
            console.log("Entering handleReceivedMessages : Message received :");

            if (sender.tab) {
                console.log(`From content script ${request.senderName} (in tab of url=` +
                    `${sender.tab.url})`);
            } else {
                // @tofix: sender.url undefined in chrome for extension pages
                console.log(`From extension (source=${request.senderName} at url=${sender.url}`);
            }
            if ("enableSharingan" === request.command) {
                console.log("Executing enableSharingan command with segments ", request.segments);

                PlaybackController.enableSharingan(request.segments);
                return Promise.resolve(
                    {
                        receiverName: "contentScriptNetflixPlaybackController.js",
                        message: "enableSharingan command executed: timeouts for all sensitive segments" +
                            " to skip injected into Netflix playback webpage",
                    }
                );
            } else if ("seek" === request.command) {
                console.log("Executing seek command ");
                PlaybackController.seek(request.timestamp);
                return Promise.resolve(
                    {
                        receiverName: "contentScriptNetflixPlaybackController.js",
                        message: "Seek code embedded and executed into Netflix playback webpage",
                    }
                );

            } else if ("getDuration" === request.command) {
                console.log("Executing getDuration command ");
                let result = PlaybackController.getDuration();
                return Promise.resolve(
                    {
                        receiverName: "contentScriptNetflixPlaybackController.js",
                        message: "Duration of video stream retrieved from playback",
                        result: result
                    }
                );

            } else if ("skipSegment" === request.command) {
                console.log("Sending response to skipSegment command ");
                PlaybackController.setSegmentToSkip(request.segment.startTime, request.segment.endTime);
                return Promise.resolve(
                    {
                        receiverName: "contentScriptNetflixPlaybackController.js",
                        message: "Set range of segment to skip",
                    }
                );

            } else if ("heartbeat" === request.command) {
                console.log("Sending response to heartbeat request ...")
                return Promise.resolve(
                    {
                        receiverName: "contentScriptNetflixPlaybackController.js",
                        receiverState: "Alive"
                    }
                );
            }
        }

        /*
        ====================================================================================================
                                     C O N T E N T   S C R I P T   E X E C U T I O N
        ====================================================================================================
        */


        browser.runtime.onMessage.addListener(handleReceivedMessages);
    } catch (error) {
        console.log(`Content script main function error: ${error.message}`);
    }
})();
