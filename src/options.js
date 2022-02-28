/**
 * @fileoverview Primitives for user settings/options storage and retrieval
 * @description Uses the native browsers' storage.sync as database
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

        var savedCategories =  [...result.categories];
        console.log("Retrieved saved categories :", savedCategories);

        for (category of savedCategories) {
            console.log(`Checking box of category with id=${category}`)
            document.getElementById(category).checked = true;
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
    let getting = browser.storage.sync.get("categories");
    getting.then(setCurrentCategories, onError);
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
