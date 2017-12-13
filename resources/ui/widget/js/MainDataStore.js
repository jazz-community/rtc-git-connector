define([
    "dojo/_base/declare",
    "dojo/Stateful",
    "dojox/mvc/StatefulArray"
], function (declare, Stateful, StatefulArray) {
    var _instance = null;
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
    return new function() {
        this.getInstance = function () {
            if (!_instance) {
                _instance = new MainDataStore();
            }

            return _instance;
        };

        this.destroyInstance = function () {
            _instance = null;
        }
    };
});