define(function () {
    // Return an instance so that the functions can be used as if they were static
    return new (function () {
        this.GitLabApi = require("@gitbeaker/rest");
    })();
});
