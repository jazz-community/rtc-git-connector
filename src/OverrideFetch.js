// Save the original window fetch function for using later
const originalFetch = window.fetch;

// Ugly hack to get the credentials (cookies) sent along with fetch requests
// This is needed for the requests made by the GitHub library to be authenticated
// with jazz (the requests are sent to the GitConnectorService service which acts as a proxy)
window.fetch = function (url, options) {
    // Don't override the credentials if it's already set
    if (options && !options.credentials) {
        options.credentials = 'same-origin';
    }

    // Create a new object if there are no options
    if (!options) {
        options = {
            credentials: 'same-origin'
        };
    }

    // Run the normal (original) browser fetch with the new options
    return originalFetch.apply(this, arguments);
};