define([
    "dojo/_base/declare",
    "dojo/Stateful",
    "dojox/mvc/StatefulArray"
], function (declare, Stateful, StatefulArray) {
    return declare(null, {
        projectArea: null,
        registeredGitRepositories: null,
        selectedRepositorySettings: {
            repository: null,
            gitHost: null,
            accessToken: null
        },

        constructor: function (projectArea) {
            this.projectArea = projectArea;
            this.registeredGitRepositories = new StatefulArray([]);
            this.selectedRepositorySettings = new Stateful(this.selectedRepositorySettings);
        }
    });
});