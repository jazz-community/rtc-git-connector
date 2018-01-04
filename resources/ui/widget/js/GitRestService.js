define([
    "dojo/_base/declare",
    "dojo/_base/url",
    "dojo/json",
    "dojo/Deferred",
    "dojo/request/xhr"
], function (declare, url, json, Deferred, xhr) {
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

        // Get the last 100 commits from the specified repository on GitHub or GitLab
        getRecentCommits: function (selectedGitRepository, gitHost, accessToken) {
            // Depending on how the returned objects look like, they may need to be converted
            // first so that the same property names are always used.
            if (gitHost === this.gitHubString) {
                return this.getRecentGitHubCommits(selectedGitRepository, accessToken);
            } else if (gitHost === this.gitLabString) {
                return this.getRecentGitLabCommits(selectedGitRepository, accessToken);
            } else {
                var deferred = new Deferred();
                deferred.reject("Invalid git host.");
                return deferred.promise;
            }
        },

        // Get the last 100 commits from the specified repository on GitHub
        getRecentGitHubCommits: function (selectedGitRepository, accessToken) {
            var deferred = new Deferred();
            var repositoryUrl = new url(selectedGitRepository.url);
            var urlParts = this._getUrlPartsFromPath(repositoryUrl.path);
            var github = new this.gitHubApi({});

            if (urlParts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                urlParts[1] = this._removeDotGitEnding(urlParts[1]);

                github.authenticate({
                    type: 'token',
                    token: accessToken
                });
                github.repos.getCommits({
                    owner: urlParts[0],
                    repo: urlParts[1],
                    per_page: 100
                }, function (error, response) {
                    if (error) {
                        var errorObj = json.parse(error.message || error);
                        deferred.reject("Couldn't get commits from GitHub repo. Error: " + ((errorObj && errorObj.message) || error.message || error));
                    } else {
                        deferred.resolve(response.data);
                    }
                });
            }

            return deferred.promise;
        },

        // Get the last 100 commits from the specified repository on GitLab
        getRecentGitLabCommits: function (selectedGitRepository, accessToken) {
            var deferred = new Deferred();
            var repositoryUrl = new url(selectedGitRepository.url);
            var urlParts = this._getUrlPartsFromPath(repositoryUrl.path);
            var gitlab = this.gitLabApi({
                url: this._getOriginFromUrlObject(repositoryUrl),
                token: accessToken
            });

            if (urlParts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                urlParts[1] = this._removeDotGitEnding(urlParts[1]);

                gitlab.projects.repository.commits.all(urlParts[0] + "/" + urlParts[1], {
                    max_pages: 1,
                    per_page: 100
                }).then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject("Couldn't get commits from GitLab repo. Error: " + (error.error.message || error.error));
                });
            }

            return deferred.promise;
        },

        // Get the last 100 issues form the specified repository on GitHub or GitLab
        getRecentIssues: function (selectedGitRepository, gitHost, accessToken) {
            if (gitHost === this.gitHubString) {
                return this.getRecentGitHubIssues(selectedGitRepository, accessToken);
            } else if (gitHost === this.gitLabString) {
                return this.getRecentGitLabIssues(selectedGitRepository, accessToken);
            } else {
                var deferred = new Deferred();
                deferred.reject("Invalid git host.");
                return deferred.promise;
            }
        },

        // Get the last 100 issues from the specified repository on GitHub
        getRecentGitHubIssues: function (selectedGitRepository, accessToken) {
            var self = this;
            var deferred = new Deferred();
            var repositoryUrl = new url(selectedGitRepository.url);
            var urlParts = this._getUrlPartsFromPath(repositoryUrl.path);
            var github = new this.gitHubApi({});

            if (urlParts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                urlParts[1] = this._removeDotGitEnding(urlParts[1]);

                github.authenticate({
                    type: 'token',
                    token: accessToken
                });
                github.issues.getForRepo({
                    owner: urlParts[0],
                    repo: urlParts[1],
                    per_page: 100
                }, function (error, response) {
                    if (error) {
                        var errorObj = json.parse(error.message || error);
                        deferred.reject("Couldn't get issues from GitHub repo. Error: " + ((errorObj && errorObj.message) || error.message || error));
                    } else {
                        deferred.resolve(self._removePullRequestsFromIssuesList(response.data));
                    }
                });
            }

            return deferred.promise;
        },

        // Get the last 100 issues from the specified repository on GitLab
        getRecentGitLabIssues: function (selectedGitRepository, accessToken) {
            var deferred = new Deferred();
            var repositoryUrl = new url(selectedGitRepository.url);
            var urlParts = this._getUrlPartsFromPath(repositoryUrl.path);
            var gitlab = this.gitLabApi({
                url: this._getOriginFromUrlObject(repositoryUrl),
                token: accessToken
            });

            if (urlParts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                urlParts[1] = this._removeDotGitEnding(urlParts[1]);

                gitlab.projects.issues.all(urlParts[0] + "/" + urlParts[1], {
                    max_pages: 1,
                    per_page: 100
                }).then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject("Couldn't get issues from GitLab repo. Error: " + (error.error.message || error.error));
                });
            }

            return deferred.promise;
        },

        // Get the last 100 requests (pull/merge) from the selected repository on GitHub or GitLab
        getRecentRequests: function (selectedGitRepository, gitHost, accessToken) {
            if (gitHost === this.gitHubString) {
                return this.getRecentGitHubRequests(selectedGitRepository, accessToken);
            } else if (gitHost === this.gitLabString) {
                return this.getRecentGitLabRequests(selectedGitRepository, accessToken);
            } else {
                var deferred = new Deferred();
                deferred.reject("Invalid git host.");
                return deferred.promise;
            }
        },

        // Get the last 100 pull requests from the selected repository on GitHub
        getRecentGitHubRequests: function (selectedGitRepository, accessToken) {
            var deferred = new Deferred();
            deferred.reject("Not Implemented");
            return deferred.promise;
        },

        // Get the last 100 merge requests from the selected repository on GitLab
        getRecentGitLabRequests: function (selectedGitRepository, accessToken) {
            var deferred = new Deferred();
            deferred.reject("Not Implemented");
            return deferred.promise;
        },

        determineRepositoryGitHost: function (selectedGitRepository) {
            var self = this;
            var deferred = new Deferred();
            var repositoryUrl = new url(selectedGitRepository.url);
            var lowerCaseHost = repositoryUrl.host.toLowerCase();

            // Check if the host is github (the github url doesn't vary)
            if (lowerCaseHost === "github.com") {
                deferred.resolve(this.gitHubString);
            } else if (lowerCaseHost === "gitlab.com") {
                // Check for gitlab.com directly. This is for two reasons:
                // 1. It also is a static url
                // 2. Requesting a repository from gitlab.com is quite slow.
                //    Other gitlab instances are generally faster and there is
                //    no way to statically check for them.
                deferred.resolve(this.gitLabString);
            } else {
                // Make a request to a gitlab api endpoint. If the request is
                // successful, assume that the repository is hosted on a gitlab instance
                this.isGitLabRepository(repositoryUrl).then(function (statusOk) {
                    if (statusOk) {
                        deferred.resolve(self.gitLabString);
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
            return xhr.get(this._getOriginFromUrlObject(gitRepositoryUrl) + "/api/v4/projects", {
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
        },

        // Check if the access token works for the specified host type
        checkAccessToken: function (gitRepositoryUrl, gitHost, accessToken) {
            var deferred = new Deferred();

            if (gitHost === this.gitHubString) {
                // Check access token with GitHub
                var github = new this.gitHubApi({});
                github.authenticate({
                    type: 'token',
                    token: accessToken
                });
                github.users.get({}, function (error, response) {
                    if (error) {
                        deferred.resolve(false);
                    } else {
                        deferred.resolve(true);
                    }
                });
            } else if (gitHost === this.gitLabString) {
                // Check access token with GitLab
                var gitlab = this.gitLabApi({
                    url: this._getOriginFromUrlObject(gitRepositoryUrl),
                    token: accessToken
                });
                gitlab.users.current().then(function (response) {
                    deferred.resolve(true);
                }, function (error) {
                    deferred.resolve(false);
                });
            } else {
                deferred.reject("Invalid git host.");
            }

            return deferred.promise;
        },

        _getOriginFromUrlObject: function (url) {
            return url.scheme + "://" + url.host + (url.port ? ":" + url.port : "");
        },

        // Remove the ".git" suffix from the repository name if present
        _removeDotGitEnding: function (repositoryName) {
            var gitEnding = ".git";
            var gitEndingIndex = repositoryName.indexOf(gitEnding, repositoryName.length - gitEnding.length);

            if (gitEndingIndex !== -1) {
                return repositoryName.slice(0, gitEndingIndex);
            } else {
                return repositoryName;
            }
        },

        // Returns an array of non empty url parts taken from the specified url path
        _getUrlPartsFromPath: function (urlPath) {
            return urlPath.split('/').filter(function (part) {
                return part; // Remove empty parts (initial slash).
            });
        },

        // Remove pull requests from the list of issues provided by the GitHub API.
        // The GitHub API counts pull requests as issues. This also means that when
        // requesting 100 issues we actually get less because some of them are pull
        // requests. This shouldn't be a problem most of the time but may need to be
        // addressed in the future if there are repositories with a too high pull
        // requests to issues ratio.
        _removePullRequestsFromIssuesList: function (issues) {
            return issues.filter(function (issue) {
                return !issue.pull_request;
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