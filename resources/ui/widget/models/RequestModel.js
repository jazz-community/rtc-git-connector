define(["dojo/_base/declare"], function (declare) {
    var RequestModel = declare(null, {
        id: null, // The request id in the web UI
        title: null, // The title of the request
        labels: null, // A comma separated string with all the labels
        state: null, // The state of the request
        openedBy: null, // The user that opened the request (user name or real name)
        openedDate: null, // The date & time when the request was opened
        webUrl: null, // The web URL to view the request
        apiUrl: null, // The api URL to view the request
        alreadyLinked: null, // True if already linked to the current work item
        service: null,
        type: null,
        projectId: null,
        iid: null,
        linkUrl: null
    });

    // Return an instance so that the functions can be used as if they were static
    return new (function () {
        // Create a RequestModel object from a GitHub request object
        this.CreateFromGitHubRequest = function (gitHubRequest, alreadyLinkedUrls) {
            var requestModel = new RequestModel();
            requestModel.id = gitHubRequest.number;
            requestModel.title = gitHubRequest.title;
            requestModel.state = gitHubRequest.state;
            requestModel.openedBy = gitHubRequest.user.login;
            requestModel.openedDate = gitHubRequest.created_at;
            requestModel.webUrl = gitHubRequest.html_url;
            requestModel.apiUrl = gitHubRequest.url;
            requestModel.service = "github";
            requestModel.alreadyLinked = alreadyLinkedUrls.indexOf(requestModel.webUrl.toLowerCase()) > -1;

            if (gitHubRequest.labels && gitHubRequest.labels.length) {
                requestModel.labels = gitHubRequest.labels
                    .map(function (label) {
                        return label.name;
                    })
                    .join(", ");
            }

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
            requestModel.service = "gitlab";
            requestModel.type = "merge-request";
            requestModel.projectId = gitLabRequest.project_id;
            requestModel.iid = gitLabRequest.iid;
            requestModel.linkUrl =
                net.jazz.ajax._contextRoot +
                "/service/org.jazzcommunity.GitConnectorService.IGitConnectorService" +
                "/" +
                "gitlab" +
                "/" +
                new URL(requestModel.webUrl).hostname +
                "/project/" +
                requestModel.projectId +
                "/" +
                requestModel.type +
                "/" +
                requestModel.iid +
                "/link";
            var lowerCaseLinkUrl = requestModel.linkUrl.toLowerCase();
            requestModel.alreadyLinked = alreadyLinkedUrls.some(function (alreadyLinkedUrl) {
                return alreadyLinkedUrl.indexOf(lowerCaseLinkUrl) > -1;
            });

            if (gitLabRequest.labels && gitLabRequest.labels.length) {
                requestModel.labels = gitLabRequest.labels.join(", ");
            }

            return requestModel;
        };
    })();
});
