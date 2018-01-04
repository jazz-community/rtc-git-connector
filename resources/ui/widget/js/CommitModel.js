define([
    "dojo/_base/declare"
], function (declare) {
    var CommitModel = declare(null, {
        sha: null,              // The full sha of the commit
        message: null,          // The full commit message
        authorName: null,       // The full name of the author
        authorEmail: null,      // The email of the author
        authoredDate: null      // The date & time when the commit was made
    });

    return new function () {
        this.CreateFromGitHubCommit = function (gitHubCommit) {
            console.log("create from git hub commit: ", gitHubCommit);
            var commitModel = new CommitModel();
            commitModel.sha = gitHubCommit.sha;
            commitModel.message = gitHubCommit.commit.message;
            commitModel.authorName = gitHubCommit.commit.author.name;
            commitModel.authorEmail = gitHubCommit.commit.author.email;
            commitModel.authoredDate = gitHubCommit.commit.author.date;

            console.log("created model: ", commitModel);
            return commitModel;
        };

        this.CreateFromGitLabCommit = function (gitLabCommit) {
            console.log("create from git lab commit: ", gitLabCommit);
            var commitModel = new CommitModel();


            console.log("created model: ", commitModel);
            return commitModel;
        };
    };
});