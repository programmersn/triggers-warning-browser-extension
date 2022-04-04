console.log(`Entering background.js ...`);

browser.tabs.onRemoved.addListener(() => browser.storage.local.clear());