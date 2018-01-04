define([
    "dojo/_base/declare"
], function (declare) {
    var IssueModel = declare(null, {
        id: null,           // The issue id in the web UI
        title: null,        // The title of the issue
        state: null,        // The state of the issue
        openedBy: null,     // The user that opened the issue (user name or real name)
        openedDate: null,   // The date & time when the issue was opened
        webUrl: null        // The web URL to view the issue
    });

    // Return an instance so that the functions can be used as if they were static
    return new function () {
        // Create an IssueModel object from a GitHub issue object
        this.CreateFromGitHubIssue = function (gitHubIssue) {
            console.log("create from git hub issue: ", gitHubIssue);
            var issueModel = new IssueModel();
            issueModel.id = gitHubIssue.number;
            issueModel.title = gitHubIssue.title;
            issueModel.state = gitHubIssue.state;
            issueModel.openedBy = gitHubIssue.user.login;
            issueModel.openedDate = gitHubIssue.created_at;
            issueModel.webUrl = gitHubIssue.html_url;

            console.log("created model: ", issueModel);
            return issueModel;
        };

        // Create an IssueModel object from a GitLab issue object
        this.CreateFromGitLabIssue = function (gitLabIssue) {
            console.log("create from git lab issue: ", gitLabIssue);
            var issueModel = new IssueModel();


            console.log("created model: ", issueModel);
            return issueModel;
        };
    };
});