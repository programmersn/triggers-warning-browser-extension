/**
 * @fileoverview Primitives for user settings/options storage and retrieval
 * @description Uses the native browsers storage.sync as database, never to be cleared !
 * @note storage.sync is never to be cleared ! Use storage.local for temporary data instead. 
 * Cf. popupStateAPI and contentMetadataAPI
 */

/*
====================================================================================================
                            O P T I O N S   S T O R A G E   &   R E T R I E V A L
====================================================================================================
*/

/**
 ****************************************************************************************************
 * @summary Save options chosen by user from options.html page
 * @description Retrieve the categories checked by the user in options.html
 * @param { Event } event Event triggered when user clicks on save categories button
 ****************************************************************************************************
 */
function saveOptions(event) {
    console.log("Entering options.js saveOptions() ...");
    event.preventDefault();

    var sensitiveCategories = []
    var categoriesChecked = document.querySelectorAll('input[type=checkbox]:checked')

    for (var i = 0; i < categoriesChecked.length; i++) {
        console.log(`Saving category ${categoriesChecked[i].id} ...`);
        sensitiveCategories.push(categoriesChecked[i].id)
    }

    browser.storage.sync.set({
        categories: sensitiveCategories
    });
}

/**
 ****************************************************************************************************
 * @description Restore options into options.html page as soon as the page's DOM has loaded
 ****************************************************************************************************
 */
function restoreOptions() {
    console.log("Entering options.js::restoreOptions() ...");

    /**
     ************************************************************************************************
     * @summary Listener triggered when data is fetched from storage.sync
     * @description Fetches the sensitive categories of user and applies them into the options.html
     * page by checking all the relevant checkboxes.
     * @param { object } result Object 
     ************************************************************************************************
     */
    function setCurrentCategories(result) {
        console.log("Entering options.js::restoreOptions()::setCurrentCategories() ...");

        try {
            console.log(`browser.storage.sync.get() returned result=`, result)
            if (undefined === result.categories || null === result.categories) {
                console.log("browser.storage.sync.get() returned null or undefined categories object. Exiting function ...");
                return;
            }

            console.log(`Setting user saved categories in html page: `, result.categories);
            var savedCategories = Object.values(result.categories);

            for (category of savedCategories) {
                console.log(`Checking box of category with id=${category}`);
                document.getElementById(category).checked = true;
            }
        } catch (error) {
            console.log('%c' + `options.js::restoreOptions()::setCurrentCategories() error: ${error.message}`, "color:red;font-weight:bold")
        }
    }

    /**
     ************************************************************************************************
     * @summary Triggered when error occurs on browser.sync data fetching
     * @param { Error } error 
     ************************************************************************************************
     */
    function onError(error) {
        console.log(`options.js::restoreOptions()::onError(): error : ${error.message}`);
    }

    /*
    ------------------------------------------------------------------------------------------------
                                    EXECUTING FUNCTION
    ------------------------------------------------------------------------------------------------
    */
    try {
        let getting = browser.storage.sync.get("categories");
        getting.then(setCurrentCategories, onError);
    } catch (error) {
        console.log('%c' + `options.js::restoreOptions() error: ${error.message}`, "color:red;font-weight:bold")
    }
}

/*
====================================================================================================
                                S C R I P T   E X E C U T I O N
====================================================================================================
*/

console.log('%c' +
    "************************************************************************************************",
    "color:green; font-weight:bold");

try {
    document.addEventListener("DOMContentLoaded", restoreOptions);
    document.getElementById("save-categories").addEventListener("submit", saveOptions);
} catch (error) {
    console.log('%c' + `options.js: error: ${error.message}`, "color:red;font-weight:bold")
}