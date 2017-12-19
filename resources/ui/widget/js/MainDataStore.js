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
            repository: null, // Object from registeredGitRepositories
            gitHost: null, // Uppercase "GITHUB", "GITLAB", "OTHER"
            accessToken: null // For github or gitlab
        },

        constructor: function () {
            this.registeredGitRepositories = new StatefulArray([]);
            this.selectedRepositorySettings = new Stateful(this.selectedRepositorySettings);
        }
    });

    // Returns an instance so that you don't need to instantiate this class.
    // It's functions can be called directly after importing. Example:
    //      MainDataStore.getInstance();
    //      MainDataStore.destroyInstance();
    //
    // This is basically a singleton that can be asked to use a new instance when needed
    return new function () {
        // Gets the existing instance or creates one if none exists (singleton)
        this.getInstance = function () {
            if (!_instance) {
                _instance = new MainDataStore();
            }

            return _instance;
        };

        // Destroys the existing instance. It doesn't matter if none exists.
        // This causes the next call to getInstance to create a new instance
        this.destroyInstance = function () {
            _instance = null;
        };
    };
});