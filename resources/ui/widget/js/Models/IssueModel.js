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
        apiUrl: null,       // The api URL to view the issue
        alreadyLinked: null,// True if already linked to the current work item
        service: null,       // Required for building the work item link urls TODO: find a nicer way to solve this...
        // TODO: Add type to other models where necessary for making correct links
        type: "issue",
        // TODO: Add these to request
        projectId: null,
        iid: null,
    });

    // Return an instance so that the functions can be used as if they were static
    return new function () {
        // Create an IssueModel object from a GitHub issue object
        this.CreateFromGitHubIssue = function (gitHubIssue, alreadyLinkedUrls) {
            var issueModel = new IssueModel();
            issueModel.id = gitHubIssue.number;
            issueModel.title = gitHubIssue.title;
            issueModel.state = gitHubIssue.state;
            issueModel.openedBy = gitHubIssue.user.login;
            issueModel.openedDate = gitHubIssue.created_at;
            issueModel.webUrl = gitHubIssue.html_url;
            issueModel.apiUrl = gitHubIssue.url;
            // TODO: this needs to be adjusted here and everywhere else to properly find the duplicates
            issueModel.alreadyLinked = alreadyLinkedUrls.indexOf(issueModel.webUrl.toLowerCase()) > -1;
            issueModel.service = 'github';

            return issueModel;
        };

        // Create an IssueModel object from a GitLab issue object
        this.CreateFromGitLabIssue = function (gitLabIssue, alreadyLinkedUrls) {
            var issueModel = new IssueModel();
            issueModel.id = gitLabIssue.iid;
            issueModel.title = gitLabIssue.title;
            issueModel.state = gitLabIssue.state;
            issueModel.openedBy = gitLabIssue.author.name;
            issueModel.openedDate = gitLabIssue.created_at;
            issueModel.webUrl = gitLabIssue.web_url;
            issueModel.alreadyLinked = alreadyLinkedUrls.indexOf(issueModel.webUrl.toLowerCase()) > -1;
            // TODO: add api url here as well
            issueModel.service = 'gitlab';
            issueModel.projectId = gitLabIssue.project_id;
            issueModel.iid = gitLabIssue.iid;

            return issueModel;
        };
    };
});