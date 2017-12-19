define([
    "dojo/_base/declare"
], function (declare) {
    var _instance = null;
    var GitRestService = declare(null, {
        gitHubApi: null, // use with new
        gitLabApi: null, // use without new

        constructor: function () {
            if (typeof com_siemens_bt_jazz_rtcgitconnector_modules != 'undefined') {
                this.gitHubApi = com_siemens_bt_jazz_rtcgitconnector_modules.GitHubApi;
                this.gitLabApi = com_siemens_bt_jazz_rtcgitconnector_modules.GitLabApi;
            }
        }
    });

    // Returns an instance so that you don't need to instantiate this class.
    // It's functions can be called directly after importing. Example:
    //      GitRestService.getInstance();
    //      GitRestService.destroyInstance();
    //
    // This is basically a singleton that can be asked to use a new instance when needed
    return new function () {
        // Gets the existing instance or creates one if none exists (singleton)
        this.getInstance = function () {
            if (!_instance) {
                _instance = new GitRestService();
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