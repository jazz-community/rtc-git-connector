define([
    "dojo/_base/declare",
    "dojo/Stateful",
    "dojox/mvc/StatefulArray"
], function (declare, Stateful, StatefulArray) {
    return declare(null, {
        registeredGitRepositories: null,
        selectedGitRepository: null,

        constructor: function () {
            this.registeredGitRepositories = new StatefulArray([]);
            this.selectedGitRepository = new Stateful();
        }
    });
});