define(["dojo/_base/declare"], function (declare) {
    var IssueModel = declare(null, {
        id: null, // The issue id in the web UI
        title: null, // The title of the issue
        description: null, // The description of the issue
        labels: null, // A comma separated string with all the labels (spaces are replaced with "-")
        labelsWithSpaces: null, // Same as labels but without replacing spaces
        milestone: null, // The name of the milestone assigned to the issue
        state: null, // The state of the issue
        openedBy: null, // The user that opened the issue (user name or real name)
        openedDate: null, // The date & time when the issue was opened
        webUrl: null, // The web URL to view the issue
        apiUrl: null, // The api URL to view the issue
        alreadyLinked: null, // True if already linked to the current work item
        service: null, // Required for building the work item link urls TODO: find a nicer way to solve this...
        type: "issue",
        projectId: null,
        iid: null,
        linkUrl: null // URL generated for custom hover view and information service
    });

    // Return an instance so that the functions can be used as if they were static
    return new (function () {
        // Create an IssueModel object from a GitHub issue object
        this.CreateFromGitHubIssue = function (gitHubIssue, alreadyLinkedUrls) {
            var issueModel = new IssueModel();
            issueModel.id = gitHubIssue.number;
            issueModel.title = gitHubIssue.title;
            issueModel.description = gitHubIssue.body;
            issueModel.state = gitHubIssue.state;
            issueModel.openedBy = gitHubIssue.user.login;
            issueModel.openedDate = gitHubIssue.created_at;
            issueModel.webUrl = gitHubIssue.html_url;
            issueModel.apiUrl = gitHubIssue.url;
            // TODO: this needs to be adjusted here and everywhere else to properly find the duplicates
            issueModel.alreadyLinked = alreadyLinkedUrls.indexOf(issueModel.webUrl.toLowerCase()) > -1;
            issueModel.service = "github";
            issueModel.milestone = gitHubIssue.milestone && gitHubIssue.milestone.title;

            if (gitHubIssue.labels && gitHubIssue.labels.length) {
                issueModel.labels = gitHubIssue.labels
                    .map(function (label) {
                        return label.name.replace(/ /g, "-");
                    })
                    .join(", ");
                issueModel.labelsWithSpaces = gitHubIssue.labels
                    .map(function (label) {
                        return label.name;
                    })
                    .join(", ");
            }

            return issueModel;
        };

        // Create an IssueModel object from a GitLab issue object
        this.CreateFromGitLabIssue = function (gitLabIssue, alreadyLinkedUrls) {
            var issueModel = new IssueModel();
            issueModel.id = gitLabIssue.iid;
            issueModel.title = gitLabIssue.title;
            issueModel.description = gitLabIssue.description;
            issueModel.state = gitLabIssue.state;
            issueModel.openedBy = gitLabIssue.author.name;
            issueModel.openedDate = gitLabIssue.created_at;
            issueModel.webUrl = gitLabIssue.web_url;
            issueModel.service = "gitlab";
            issueModel.projectId = gitLabIssue.project_id;
            issueModel.iid = gitLabIssue.iid;
            issueModel.linkUrl =
                net.jazz.ajax._contextRoot +
                "/service/org.jazzcommunity.GitConnectorService.IGitConnectorService" +
                "/" +
                "gitlab" +
                "/" +
                new URL(issueModel.webUrl).hostname +
                "/project/" +
                issueModel.projectId +
                "/" +
                issueModel.type +
                "/" +
                issueModel.iid +
                "/link";
            var lowerCaseLinkUrl = issueModel.linkUrl.toLowerCase();
            issueModel.alreadyLinked = alreadyLinkedUrls.some(function (alreadyLinkedUrl) {
                return alreadyLinkedUrl.indexOf(lowerCaseLinkUrl) > -1;
            });
            issueModel.milestone = gitLabIssue.milestone && gitLabIssue.milestone.title;

            if (gitLabIssue.labels && gitLabIssue.labels.length) {
                issueModel.labels = gitLabIssue.labels
                    .map(function (label) {
                        return label.replace(/ /g, "-");
                    })
                    .join(", ");
                issueModel.labelsWithSpaces = gitLabIssue.labels.join(", ");
            }

            return issueModel;
        };
    })();
});
