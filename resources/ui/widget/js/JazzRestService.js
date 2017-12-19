define([
    "dojo/_base/declare",
    "dojo/request/xhr",
    "dojo/json"
], function (declare, xhr, json) {
    var _instance = null;
    var JazzRestService = declare(null, {
        commitLinkEncoder: null,
        allRegisteredGitRepositoriesUrl: null,

        constructor: function () {
            this.commitLinkEncoder = new com_siemens_bt_jazz_rtcgitconnector_modules.encoder();
            this.allRegisteredGitRepositoriesUrl =
                    net.jazz.ajax._contextRoot +
                    "/service/com.ibm.team.git.common.internal.IGitRepositoryRegistrationRestService/allRegisteredGitRepositories";
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
                    ownerItemIds: projectAreaId
                },
                handleAs: "xml"
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
            var gitRepositories = [];
            var repositoryNodes = responseDocument.getElementsByTagName("response")[0]
                                    .getElementsByTagName("returnValue")[0]
                                    .getElementsByTagName("values");

            for (var i = 0; i < repositoryNodes.length; i++) {
                gitRepositories.push(this._createGitRepositoryObjectFromNode(repositoryNodes[i]));
            }

            return gitRepositories;
        },

        // Map the values from the node to a new git repository object.
        // The configurationData is additionally parsed because it contains json data.
        _createGitRepositoryObjectFromNode: function (repositoryNode) {
            return {
                name: repositoryNode.getElementsByTagName("name")[0].innerHTML,
                description: repositoryNode.getElementsByTagName("description")[0].innerHTML,
                url: repositoryNode.getElementsByTagName("url")[0].innerHTML,
                key: repositoryNode.getElementsByTagName("key")[0].innerHTML,
                configurationData: json.parse(repositoryNode.getElementsByTagName("configurationData")[0].innerHTML),
                message: repositoryNode.getElementsByTagName("message")[0].innerHTML,
                secretKey: repositoryNode.getElementsByTagName("secretKey")[0].innerHTML,
                ownerPresent: repositoryNode.getElementsByTagName("ownerPresent")[0].innerHTML,
                ownerName: repositoryNode.getElementsByTagName("ownerName")[0].innerHTML,
                ownerItemId: repositoryNode.getElementsByTagName("ownerItemId")[0].innerHTML,
                isOwnerPa: repositoryNode.getElementsByTagName("isOwnerPa")[0].innerHTML
            };
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