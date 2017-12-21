define([
    "dojo/_base/declare",
    "dojo/_base/url",
    "dojo/Deferred",
    "dojo/request/xhr"
], function (declare, url, Deferred, xhr) {
    var _instance = null;
    var GitRestService = declare(null, {
        gitHubString: "GITHUB",
        gitLabString: "GITLAB",
        gitHubApi: null, // use with new
        gitLabApi: null, // use without new

        constructor: function () {
            // Prevent errors in Internet Explorer (dojo parse error because undefined)
            if (typeof com_siemens_bt_jazz_rtcgitconnector_modules !== 'undefined') {
                this.gitHubApi = com_siemens_bt_jazz_rtcgitconnector_modules.GitHubApi;
                this.gitLabApi = com_siemens_bt_jazz_rtcgitconnector_modules.GitLabApi;
            }
        },

        determineRepositoryGitHost: function (selectedGitRepository) {
            var self = this;
            var deferred = new Deferred();
            var repositoryUrl = new url(selectedGitRepository.url);

            // Check if the host is github (the github url doesn't vary)
            if (repositoryUrl.host.toLowerCase() === "github.com") {
                deferred.resolve(this.gitHubString);
            } else {
                // Make a request to a gitlab api endpoint. If the request is
                // successful, assume that the repository is hosted on a gitlab instance
                this.isGitLabRepository(repositoryUrl).then(function (statusOk) {
                    if (statusOk) {
                        deferred.resolve(this.gitLabString);
                    } else {
                        deferred.resolve("OTHER");
                    }
                });
            }

            return deferred.promise;
        },

        // Make a request for a single public project from the gitlab api.
        // Return true if the request was successful, otherwise false.
        isGitLabRepository: function (gitRepositoryUrl) {
            var origin = gitRepositoryUrl.scheme + "://" + gitRepositoryUrl.host + (gitRepositoryUrl.port ? ":" + gitRepositoryUrl.port : "");

            return xhr.get(origin + "/api/v4/projects", {
                query: {
                    per_page: "1"
                },
                handleAs: "json",
                headers: {
                    "Accept": "application/json"
                }
            }).then(function (response) {
                return true;
            }, function (error) {
                return false;
            });
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