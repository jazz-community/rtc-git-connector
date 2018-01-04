define([
    "dojo/_base/declare"
], function (declare) {
    var CommitModel = declare(null, {
        sha: null,              // The full sha of the commit
        message: null,          // The full commit message
        committerName: null,    // The full name of the committer
        committerEmail: null,   // The email of the committer
        committedDate: null     // The date & time when the commit was made
    });

    return new function () {
        this.CreateFromGitHubCommit = function (gitHubCommit) {
            console.log("create from git hub commit: ", gitHubCommit);
            return new CommitModel();
        };

        this.CreateFromGitLabCommit = function (gitLabCommit) {
            console.log("create from git lab commit: ", gitLabCommit);
            return new CommitModel();
        };
    };
});