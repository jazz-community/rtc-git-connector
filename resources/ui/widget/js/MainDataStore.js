define([
    "dojo/_base/declare",
    "dojo/Stateful",
    "dojox/mvc/StatefulArray"
], function (declare, Stateful, StatefulArray) {
    var MainDataStore = declare(null, {
        workItem: null,
        projectArea: null,
        registeredGitRepositories: null,
        selectedRepositorySettings: {
            repository: null,
            gitHost: null,
            accessToken: null
        },

        constructor: function () {
            this.registeredGitRepositories = new StatefulArray([]);
            this.selectedRepositorySettings = new Stateful(this.selectedRepositorySettings);
        }
    });
    return new MainDataStore();
});