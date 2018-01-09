define([
    "dojo/_base/declare"
], function (declare) {
    var IssueModel = declare(null, {
        id: null,           // The issue id in the web UI
        title: null,        // The title of the issue
        state: null,        // The state of the issue
        openedBy: null,     // The user that opened the issue (user name or real name)
        openedDate: null,   // The date & time when the issue was opened
        webUrl: null,       // The web URL to view the issue
        alreadyLinked: null // True if already linked to the current work item
    });

    // Return an instance so that the functions can be used as if they were static
    return new function () {
        // Create an IssueModel object from a GitHub issue object
        this.CreateFromGitHubIssue = function (gitHubIssue) {
            var issueModel = new IssueModel();
            issueModel.id = gitHubIssue.number;
            issueModel.title = gitHubIssue.title;
            issueModel.state = gitHubIssue.state;
            issueModel.openedBy = gitHubIssue.user.login;
            issueModel.openedDate = gitHubIssue.created_at;
            issueModel.webUrl = gitHubIssue.html_url;
            issueModel.alreadyLinked = false; // Need to check this...

            return issueModel;
        };

        // Create an IssueModel object from a GitLab issue object
        this.CreateFromGitLabIssue = function (gitLabIssue) {
            var issueModel = new IssueModel();
            issueModel.id = gitLabIssue.iid;
            issueModel.title = gitLabIssue.title;
            issueModel.state = gitLabIssue.state;
            issueModel.openedBy = gitLabIssue.author.name;
            issueModel.openedDate = gitLabIssue.created_at;
            issueModel.webUrl = gitLabIssue.web_url;
            issueModel.alreadyLinked = false; // Need to check this...

            return issueModel;
        };
    };
});