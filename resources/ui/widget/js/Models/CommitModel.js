define([
    "dojo/_base/declare"
], function (declare) {
    var CommitModel = declare(null, {
        sha: null,              // The full sha of the commit
        message: null,          // The full commit message
        authorName: null,       // The full name of the author
        authorEmail: null,      // The email of the author
        authoredDate: null,     // The date & time when the commit was made
        webUrl: null            // The web URL to view the commit
    });

    // Return an instance so that the functions can be used as if they were static
    return new function () {
        // Create a CommitModel object from a GitHub commit object
        this.CreateFromGitHubCommit = function (gitHubCommit) {
            var commitModel = new CommitModel();
            commitModel.sha = gitHubCommit.sha;
            commitModel.message = gitHubCommit.commit.message;
            commitModel.authorName = gitHubCommit.commit.author.name;
            commitModel.authorEmail = gitHubCommit.commit.author.email;
            commitModel.authoredDate = gitHubCommit.commit.author.date;
            commitModel.webUrl = gitHubCommit.html_url;

            return commitModel;
        };

        // Create a CommitModel object from a GitLab commit object
        this.CreateFromGitLabCommit = function (gitLabCommit, commitUrlPath) {
            var commitModel = new CommitModel();
            commitModel.sha = gitLabCommit.id;
            commitModel.message = gitLabCommit.message;
            commitModel.authorName = gitLabCommit.author_name;
            commitModel.authorEmail = gitLabCommit.author_email;
            commitModel.authoredDate = gitLabCommit.authored_date;
            commitModel.webUrl = commitUrlPath + commitModel.sha;

            return commitModel;
        };
    };
});