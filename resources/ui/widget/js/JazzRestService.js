define([
    "dojo/_base/declare",
    "dojo/request/xhr",
    "dojo/json"
], function (declare, xhr, json) {
    var _instance = null;
    var JazzRestService = declare(null, {
        allRegisteredGitRepositoriesUrl: null,

        constructor: function () {
            this.allRegisteredGitRepositoriesUrl =
                    net.jazz.ajax._contextRoot +
                    "/service/com.ibm.team.git.common.internal.IGitRepositoryRegistrationRestService/allRegisteredGitRepositories";
        },

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
                return [];
            });
        },

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
    return new function () {
        this.getInstance = function () {
            if (!_instance) {
                _instance = new JazzRestService();
            }

            return _instance;
        };

        this.destroyInstance = function () {
            _instance = null;
        };
    };
});