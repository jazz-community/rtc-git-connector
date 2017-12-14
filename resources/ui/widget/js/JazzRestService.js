define([
    "dojo/_base/declare",
    "dojo/request/xhr"
], function (declare, xhr) {
    var _instance = null;
    var JazzRestService = declare(null, {
        allRegisteredGitRepositoriesUrl: null,

        constructor: function () {
            this.allRegisteredGitRepositoriesUrl =
                    net.jazz.ajax._contextRoot +
                    "/service/com.ibm.team.git.common.internal.IGitRepositoryRegistrationRestService/allRegisteredGitRepositories";
        },

        getAllRegisteredGitRepositoriesForProjectArea: function (projectAreaId) {
            return xhr.get(this.allRegisteredGitRepositoriesUrl, {
                query: {
                    findRecursively: "true",
                    ownerItemIds: projectAreaId
                },
                handleAs: "xml"
            });
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