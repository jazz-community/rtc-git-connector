define([
    "dojo/_base/declare"
], function (declare) {
    var RequestModel = declare(null, {
        id: null,           // The request id in the web UI
        title: null,        // The title of the request
        state: null,        // The state of the request
        openedBy: null,     // The user that opened the request (user name or real name)
        openedDate: null,   // The date & time when the request was opened
        webUrl: null        // The web URL to view the request
    });

    // Return an instance so that the functions can be used as if they were static
    return new function () {
        // Create a RequestModel object from a GitHub request object
        this.CreateFromGitHubRequest = function (gitHubRequest) {
            console.log("create from git hub request: ", gitHubRequest);
            var requestModel = new RequestModel();


            console.log("created model: ", requestModel);
            return requestModel;
        };

        // Create a RequestModel object from a GitLab request object
        this.CreateFromGitLabRequest = function (gitLabRequest, requestUrlPath) {
            console.log("create from git lab request: ", gitLabRequest);
            var requestModel = new RequestModel();


            console.log("created model: ", requestModel);
            return requestModel;
        };
    };
});