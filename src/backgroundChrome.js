console.log(`Entering background.js ...`);

importScripts(
    "/browser-polyfill.min.js",
    "/backgroundSubtitlesFetcher.js"
);


browser.tabs.onRemoved.addListener(() => browser.storage.local.clear());