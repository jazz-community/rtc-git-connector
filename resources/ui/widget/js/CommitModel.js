define([
    "dojo/_base/declare"
], function (declare) {
    return declare(null, {
        sha: null,              // The full sha of the commit
        message: null,          // The full commit message
        committerName: null,    // The full name of the committer
        committerEmail: null,   // The email of the committer
        committedDate: null     // The date & time when the commit was made
    });
});