define([
    "dojo/_base/declare",
    "dojo/request/xhr"
], function (declare, xhr) {
    return declare(null, {
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
});