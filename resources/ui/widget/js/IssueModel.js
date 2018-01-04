define([
    "dojo/_base/declare"
], function (declare) {
    var IssueModel = declare(null, {


    });

    // Return an instance so that the functions can be used as if they were static
    return new function () {
        // Create an IssueModel object from a GitHub issue object
        this.CreateFromGitHubIssue = function (gitHubIssue) {
            console.log("create from git hub issue: ", gitHubIssue);
            var issueModel = new IssueModel();


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