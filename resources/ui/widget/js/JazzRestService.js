define([
    "dojo/_base/declare"
], function (declare) {
    return declare(null, {
        allRegisteredGitRepositoriesUrl: null,

        constructor: function () {
            this.allRegisteredGitRepositoriesUrl =
                    net.jazz.ajax._contextRoot +
                    "/service/com.ibm.team.git.common.internal.IGitRepositoryRegistrationRestService/allRegisteredGitRepositories";
        },

        getAllRegisteredGitRepositoriesForProjectArea: function (projectAreaId) {
            // HTTP GET: this.allRegisteredGitRepositoriesUrl + "?findRecursively=true&ownerItemIds=" + projectAreaId
        }
    });
});