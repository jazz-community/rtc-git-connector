define([
    "dojo/_base/declare",
    "dojo/request/xhr",
    "dojo/json"
], function (declare, xhr, json) {
    var _instance = null;
    var JazzRestService = declare(null, {
        commitLinkEncoder: null,
        ajaxContextRoot: null,
        allRegisteredGitRepositoriesUrl: null,
        currentUserUrl: null,

        constructor: function () {
            // Prevent errors in Internet Explorer (dojo parse error because undefined)
            if (typeof com_siemens_bt_jazz_rtcgitconnector_modules !== 'undefined') {
                this.commitLinkEncoder = new com_siemens_bt_jazz_rtcgitconnector_modules.encoder();
            }

            this.ajaxContextRoot = net.jazz.ajax._contextRoot;
            this.allRegisteredGitRepositoriesUrl =
                    this.ajaxContextRoot +
                    "/service/com.ibm.team.git.common.internal.IGitRepositoryRegistrationRestService/allRegisteredGitRepositories";
            this.currentUserUrl = this.ajaxContextRoot + "/authenticated/identity";
        },

        // Gets the Jazz user id. This is usually the email address.
        // Returns null if not found or on error.
        getCurrentUserId: function () {
            return xhr.get(this.currentUserUrl, {
                handleAs: "json",
                headers: {
                    "Accept" : "application/json"
                }
            }).then(function (response) {
                return response.userId ? response.userId : null;
            }, function (error) {
                return null;
            });
        },

        // Gets the registered git repositories from the service. Returns a promise
        // with the first parameter of the function passed to "then" being the list
        // of registered git repositories from the specified project area. The list
        // will be empty if there was an error.
        getAllRegisteredGitRepositoriesForProjectArea: function (projectAreaId) {
            var self = this;

            return xhr.get(this.allRegisteredGitRepositoriesUrl, {
                query: {
                    findRecursively: "true",
                    ownerItemIds: projectAreaId,
                    populateProcessOwner: "false"
                },
                handleAs: "json",
                headers: {
                    "Accept": "text/json"
                }
            }).then(function (response) {
                return self._parseGitRepositories(response);
            }, function (error) {
                console.log("getAllRegisteredGitRepositoriesForProjectArea error: ", error.message || error);
                // Consider changing this in the future so that the error can be properly handled.
                // Currently the caller cannot tell the difference when there was an error or when
                // there actually were no repositories found.
                return [];
            });
        },

        // Get an array of git repository objects from the document provided by the service
        _parseGitRepositories: function (responseDocument) {
            var gitRepositories = responseDocument["soapenv:Body"].response.returnValue.values;

            if (typeof gitRepositories === "undefined") {
                // Set to an empty array when there aren't any values
                gitRepositories = [];
            } else {
                // Parse the configurationData because it contains a stringified json object
                for (var i = 0; i < gitRepositories.length; i++) {
                    gitRepositories[i].configurationData = json.parse(gitRepositories[i].configurationData);
                }
            }

            return gitRepositories;
        }
    });

    // Returns an instance so that you don't need to instantiate this class.
    // It's functions can be called directly after importing. Example:
    //      JazzRestService.getInstance();
    //      JazzRestService.destroyInstance();
    //
    // This is basically a singleton that can be asked to use a new instance when needed
    return new function () {
        // Gets the existing instance or creates one if none exists (singleton)
        this.getInstance = function () {
            if (!_instance) {
                _instance = new JazzRestService();
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