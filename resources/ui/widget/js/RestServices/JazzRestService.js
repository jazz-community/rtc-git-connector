define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/request/xhr",
    "dojo/json",
    "dojo/Deferred"
], function (declare, array, xhr, json, Deferred) {
    var _instance = null;
    var JazzRestService = declare(null, {
        commitLinkEncoder: null,
        ajaxContextRoot: null,
        allRegisteredGitRepositoriesUrl: null,
        currentUserUrl: null,
        personalTokenServiceUrl: null,
        gitCommitServiceUrl: null,
        richHoverServiceUrl: null,
        gitCommitLinkTypeId: "com.ibm.team.git.workitem.linktype.gitCommit",
        relatedArtifactLinkTypeId: "com.ibm.team.workitem.linktype.relatedartifact",

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
            this.personalTokenServiceUrl =
                this.ajaxContextRoot +
                "/service/com.siemens.bt.jazz.services.PersonalTokenService.IPersonalTokenService/tokenStore";
            this.gitCommitServiceUrl =
                this.ajaxContextRoot +
                "/com.ibm.team.git.internal.resources.IGitResourceRestService/commit";
            this.richHoverServiceUrl = 
                this.ajaxContextRoot + 
                "/service/org.jazzcommunity.GitConnectorService.IGitConnectorService"
        },

        // Adds links to the workItem object and saves them
        // The addBackLinksFunction is run on success without any parameters
        addLinksToWorkItem: function (workItem, registeredGitRepository, commitsToLink, issuesToLink, requestsToLink, addBackLinksFunction) {
            var self = this;
            var onChangeFunc = {
                // Create a function to run after the linkType change
                changeFunc: function (event) {
                    // Remove the event listener so that this function is only called once
                    workItem.removeListener(listener);

                    // Save the changes
                    workItem.storeWorkItem({
                        operationMsg: 'Saving',
                        applyDelta: true,
                        onSuccess: function(params) {
                            console.log("Save Success");
                            addBackLinksFunction();
                        },
                        onError: function(error) {
                            console.log("Save Error: ", error);
                        }
                    });
                }
            };

            // Create a listener for changes to the linkTypes
            var listener = {
                path: ["linkTypes"],
                event: "onchange",
                listener: onChangeFunc,
                functionName: "changeFunc"
            };

            // Add the listener to the work item
            workItem.addListener(listener);

            // Add links to commits
            if (commitsToLink && commitsToLink.length > 0) {
                // Get the commit link type container from the work item
                var commitLinkTypeContainer = workItem.object.linkTypes.find(function (linkType) {
                    return linkType.id === self.gitCommitLinkTypeId;
                });

                // Create and add an empty commit link type container if the work item doesn't already have one
                if (!commitLinkTypeContainer) {
                    commitLinkTypeContainer = this._getEmptyCommitLinkTypeContainer();
                    workItem.object.linkTypes.push(commitLinkTypeContainer);
                }

                // Add all commits to link to the link type container
                array.forEach(commitsToLink, function (commit) {
                    commitLinkTypeContainer.linkDTOs.push({
                        _isNew: true,
                        comment: commit.message.split(/\r?\n/g)[0] + " [@" + commit.sha + "]",
                        url: self._createCommitLinkUrl(commit, registeredGitRepository)
                    });
                });
            }

            // Add links to issues and requests
            if ((issuesToLink && issuesToLink.length > 0) || (requestsToLink && requestsToLink.length > 0)) {
                // Get the artifact link type container from the work item
                var artifactLinkTypeContainer = workItem.object.linkTypes.find(function (linkType) {
                    return linkType.id === self.relatedArtifactLinkTypeId;
                });

                // Create and add an empty artifact link type container if the work item doesn't already have one
                if (!artifactLinkTypeContainer) {
                    artifactLinkTypeContainer = this._getEmptyRelatedArtifactLinkTypeContainer();
                    workItem.object.linkTypes.push(artifactLinkTypeContainer);
                }

                // Add all issues to link to the link type container
                if (issuesToLink && issuesToLink.length > 0) {
                    array.forEach(issuesToLink, function (issue) {
                        // TODO: Remove diff again
                        var url = new URL(issue.webUrl);
                        if (url.hostname.indexOf('github') === -1) {
                            // has to be a gitlab request
                            artifactLinkTypeContainer.linkDTOs.push({
                                _isNew: true,
                                comment: issue.title,
                                url: issue.linkUrl
                            });
                        } else {
                            artifactLinkTypeContainer.linkDTOs.push({
                                _isNew: true,
                                comment: issue.title,
                                url: issue.webUrl
                            });
                        }

                    });
                }

                // Add all requests to link to the link type container
                if (requestsToLink && requestsToLink.length > 0) {
                    array.forEach(requestsToLink, function (request) {
                        // TODO: Remove diff again
                        var url = new URL(request.webUrl);
                        if (url.hostname.indexOf('github') === -1) {
                            // has to be a gitlab request
                            artifactLinkTypeContainer.linkDTOs.push({
                                _isNew: true,
                                comment: request.title,
                                url: self._createRichHoverUrl(request)
                            });
                        } else {
                            artifactLinkTypeContainer.linkDTOs.push({
                                _isNew: true,
                                comment: request.title,
                                url: request.webUrl
                            });
                        }
                    });
                }
            }

            // Set the linkTypes value on the work item.
            // This will also trigger the save
            workItem.setValue({
                path: ["linkTypes"],
                value: workItem.object.linkTypes
            });

            // Remove the listener again just incase it wasn't removed before (the event wasn't fired?)
            workItem.removeListener(listener);
        },

        getGitCommitLinksFromWorkItem: function (workItem) {
            var self = this;
            var linkedCommitUrls = [];
            var commitLinkTypeContainer = workItem.object.linkTypes.find(function (linkType) {
                return linkType.id === self.gitCommitLinkTypeId;
            });

            if (commitLinkTypeContainer) {
                array.forEach(commitLinkTypeContainer.linkDTOs, function (commitLink) {
                    var searchTerm = "/commit?value=";
                    var lastIndex = commitLink.url.lastIndexOf(searchTerm);

                    if (lastIndex != -1) {
                        var encodedCommit = commitLink.url.slice(lastIndex + searchTerm.length);
                        var linkCommit = json.parse(self.commitLinkEncoder.decode(encodedCommit));
                        linkedCommitUrls.push(linkCommit.u.toLowerCase());
                    }
                });
            }

            return linkedCommitUrls;
        },

        getRelatedArtifactLinksFromWorkItem: function (workItem) {
            var self = this;
            var linkedUrls = [];
            var artifactLinkTypeContainer = workItem.object.linkTypes.find(function (linkType) {
                return linkType.id === self.relatedArtifactLinkTypeId;
            });

            if (artifactLinkTypeContainer) {
                array.forEach(artifactLinkTypeContainer.linkDTOs, function (artifactLink) {
                    linkedUrls.push(artifactLink.url.toLowerCase());
                });
            }

            return linkedUrls;
        },

        // Get the access token for the user and host
        getAccessTokenByHost: function (hostUrl) {
            var deferred = new Deferred();

            jazz.client.xhrGet({
                url: this.personalTokenServiceUrl + "?key=" + hostUrl,
                handleAs: "json",
                headers: {
                    "accept": "application/json"
                }
            }).then(function (response) {
                deferred.resolve(response.token ? response.token : null);
            }, function (error) {
                // return null if the service didn't find a token
                // change this when the service is fixed (it should only need to check for 404)
                if (error.response.status >= 400 && error.response.status < 500) {
                    deferred.resolve(null);
                }

                deferred.reject(error);
            });

            return deferred.promise;
        },

        // Saves the specified access token using the specified host
        saveAccessTokenByHost: function (hostUrl, accessToken) {
            return jazz.client.xhrPost({
                url: this.personalTokenServiceUrl,
                postData: json.stringify({
                    key: hostUrl,
                    token: accessToken
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
        },

        // Gets the Jazz user id. This is usually the email address.
        // Returns null if not found or on error.
        getCurrentUserId: function () {
            return jazz.client.xhrGet({
                url: this.currentUserUrl,
                handleAs: "json",
                headers: {
                    "Accept": "application/json"
                }
            }).then(function (response) {
                return response.userId ? response.userId : null;
            }, function (error){
                return null;
            });
        },

        // Gets the registered git repositories from the service. Returns a promise
        // with the first parameter of the function passed to "then" being the list
        // of registered git repositories from the specified project area. The list
        // will be empty if there was an error.
        getAllRegisteredGitRepositoriesForProjectArea: function (projectAreaId) {
            var self = this;

            var url = this.allRegisteredGitRepositoriesUrl
                + "?=findRecursively=true"
                + "&ownerItemIds=" + projectAreaId
                + "&populateProcessOwner=false";

            return jazz.client.xhrGet({
                url: url,
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
        },

        // Creates a new empty commit link type container object
        _getEmptyCommitLinkTypeContainer: function () {
            return {
                displayName: "Git Commits",
                endpointId: "gitcommit",
                id: this.gitCommitLinkTypeId,
                isSource: false,
                linkDTOs: []
            };
        },

        // Creates a new empty related artifact link type container object
        _getEmptyRelatedArtifactLinkTypeContainer: function () {
            return {
                displayName: "Related Artifacts",
                endpointId: "relatedArtifact",
                id: this.relatedArtifactLinkTypeId,
                isSource: false,
                linkDTOs: []
            };
        },

        // Creates the url to the internal git service including the commit as a encoded value.
        // This is needed for the rich hover to work
        _createCommitLinkUrl: function (commit, registeredGitRepository) {
            var jsonString = json.stringify({
                c: commit.message,
                d: commit.authoredDate,
                e: commit.authorEmail,
                k: registeredGitRepository.key,
                n: commit.authorName,
                s: commit.sha,
                u: commit.webUrl
            });
            return this.gitCommitServiceUrl + "?value=" + this.commitLinkEncoder.encode(jsonString);
        },

        // TODO: Keep this despite being unused. If we decide to use custom commit links
        // this will remain handy.
        _createGitLabCommitLinkUrl: function(commit) {
            return this.richHoverServiceUrl + "/" + commit.service +
                "/" + new URL(commit.webUrl).hostname +
                "/project/" + commit.projectId +
                "/" + commit.type + "/" + commit.sha + "/link";
        },

        // TODO: This needs some cleaning up...
        _createRichHoverUrl: function(artifact) {
            return this.richHoverServiceUrl + "/" + artifact.service +
                "/" + new URL(artifact.webUrl).hostname +
                "/project/" + artifact.projectId +
                "/" + artifact.type + "/" + artifact.iid +
                "/link";
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