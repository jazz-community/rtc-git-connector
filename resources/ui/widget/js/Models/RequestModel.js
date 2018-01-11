define([
    "dojo/_base/declare"
], function (declare) {
    var RequestModel = declare(null, {
        id: null,           // The request id in the web UI
        title: null,        // The title of the request
        state: null,        // The state of the request
        openedBy: null,     // The user that opened the request (user name or real name)
        openedDate: null,   // The date & time when the request was opened
        webUrl: null,       // The web URL to view the request
        alreadyLinked: null // True if already linked to the current work item
    });

    // Return an instance so that the functions can be used as if they were static
    return new function () {
        // Create a RequestModel object from a GitHub request object
        this.CreateFromGitHubRequest = function (gitHubRequest, alreadyLinkedUrls) {
            var requestModel = new RequestModel();
            requestModel.id = gitHubRequest.number;
            requestModel.title = gitHubRequest.title;
            requestModel.state = gitHubRequest.state;
            requestModel.openedBy = gitHubRequest.user.login;
            requestModel.openedDate = gitHubRequest.created_at;
            requestModel.webUrl = gitHubRequest.html_url;
            requestModel.alreadyLinked = alreadyLinkedUrls.indexOf(requestModel.webUrl) > -1;

            return requestModel;
        };

        // Create a RequestModel object from a GitLab request object
        this.CreateFromGitLabRequest = function (gitLabRequest, alreadyLinkedUrls) {
            var requestModel = new RequestModel();
            requestModel.id = gitLabRequest.iid;
            requestModel.title = gitLabRequest.title;
            requestModel.state = gitLabRequest.state;
            requestModel.openedBy = gitLabRequest.author.name;
            requestModel.openedDate = gitLabRequest.created_at;
            requestModel.webUrl = gitLabRequest.web_url;
            requestModel.alreadyLinked = alreadyLinkedUrls.indexOf(requestModel.webUrl) > -1;

            return requestModel;
        };
    };
});