define([
    "dojo/_base/declare"
], function (declare) {
    var RequestModel = declare(null, {


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