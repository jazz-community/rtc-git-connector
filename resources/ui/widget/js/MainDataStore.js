define([
    "dojo/_base/declare",
    "dojox/mvc/StatefulArray"
], function (declare, StatefulArray) {
    return declare(null, {
        registeredGitRepositories: null,

        constructor: function () {
            this.registeredGitRepositories = new StatefulArray([]);
        }
    });
});