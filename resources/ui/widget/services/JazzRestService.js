define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/json",
    "dojo/request/xhr",
    "dojo/Deferred",
    "../components/NewWorkItemList/NewWorkItemList"
], function (declare, array, json, xhr, Deferred, NewWorkItemList) {
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
        issueLinkTypeId: "org.jazzcommunity.git.link.git_issue",
        requestLinkTypeId: "org.jazzcommunity.git.link.git_mergerequest",
        workItemStoredEventName: "workitem/stored",
        workItemViewChangedEventName: "workitem/view/changed",
        menuRefreshEventName: "rtc/workitems/page/menu/refresh",
        attributesToShow: ["category", "owner", "target", "foundIn", "internalTags"],
        _newWorkItemIdSuffix: 0,

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
                "/service/org.jazzcommunity.GitConnectorService.IGitConnectorService";

            this._createLinkTypeContainerGetters();
        },

        // Create and fill work items from the git issues.
        createNewWorkItems: function (currentWorkItem, gitIssues, finishedLoadingFunction, addBackLinksFunction) {
            var self = this;
            var currentWorkItemValues = null;
            var progressOptions = {
                remainingWorkItemsToCreate: (gitIssues && gitIssues.length) ? gitIssues.length : 0,
                finishedLoadingFunction: finishedLoadingFunction
            };
            var updateNewWorkItemListSubscriptions = [];

            // Update the list of new work items to save using the menu refresh event.
            // This event is called both when the save and when the cancel button is clicked.
            updateNewWorkItemListSubscriptions.push(dojo.subscribe(this.menuRefreshEventName, this, function () {
                NewWorkItemList.UpdateNewWorkItemList(updateNewWorkItemListSubscriptions);
            }));

            // Also update the new work item list when the view is changed. This is for the current work item marker.
            updateNewWorkItemListSubscriptions.push(dojo.subscribe(this.workItemViewChangedEventName, this, function () {
                NewWorkItemList.UpdateNewWorkItemList(updateNewWorkItemListSubscriptions);
            }));

            if (gitIssues && gitIssues.length) {
                // Copy some values from the work item before it's saved and they are no longer available.
                // These values will be needed for setting up the other new work items.
                currentWorkItemValues = this.getWorkItemValuesFromOriginalWorkItem(currentWorkItem);

                // Setup the new work item
                this.setupNewWorkItem(currentWorkItem, gitIssues[0], progressOptions, addBackLinksFunction);
            }

            if (gitIssues && gitIssues.length > 1) {
                // A function for creating a work item and setting the values when it's ready
                var createWorkItemAndSetValue = function (currentGitIssue) {
                    self.createNewEmptyWorkItem(currentWorkItem).then(function (newWorkItem) {
                        // Only set the values after the work item has been initialized
                        var interval = setInterval(function () {
                            if (newWorkItem.isInitialized) {
                                clearInterval(interval);

                                // Wait a bit more because it's still not ready for some reason...
                                setTimeout(function () {
                                    self.setWorkItemValuesFromOriginalWorkItemValues(newWorkItem, currentWorkItemValues);
                                    self.setupNewWorkItem(newWorkItem, currentGitIssue, progressOptions, addBackLinksFunction);
                                }, 100);
                            }
                        }, 100);
                    }, function (error) {
                        console.log("Error creating a new work item object: ", error);

                        // Run the finished loading function to hide the widget
                        finishedLoadingFunction();
                    });
                };

                // Create work items and set values for any additional git issues
                for (var i = 1; i < gitIssues.length; i++) {
                    (function (currentGitIssue) {
                        createWorkItemAndSetValue(currentGitIssue);
                    })(gitIssues[i]);
                }
            }
        },

        // Create a new empty work item with the same type as the original work item.
        // This only creates the work item object and not the editor presentation for
        // performance reasons. The editor presentation will be created automatically
        // when navigating to the work item's corresponding url.
        // Returns a promise that can be acted upon.
        createNewEmptyWorkItem: function (originalWorkItem) {
            var deferred = new Deferred();

            var workItemProxy = com.ibm.team.workitem.web.cache.internal.WorkItemProxyFactory.getWorkItemProxy({
                // Create a unique id from the timestamp + a counter
                id: -1 * new Date().getTime() + (this._newWorkItemIdSuffix++).toString(),
                createIfNeeded: true
            });

            var initArgs = {
                newWorkItem: true,
                type: originalWorkItem.object.attributes.workItemType.id,
                projectAreaItemId: originalWorkItem.object.attributes.projectArea.id
            };

            initArgs.onSuccess = function (result) {
                deferred.resolve(result.workingCopy);
            };

            initArgs.onError = function (error) {
                deferred.reject(error);
            };

            workItemProxy.initialize(initArgs);

            return deferred.promise;
        },

        // Creates an object with properties for each attribute id containing the attribute value
        getWorkItemValuesFromOriginalWorkItem: function (originalWorkItem) {
            var attributeValues = {};

            this.attributesToShow.forEach(function (attributeId) {
                attributeValues[attributeId] = originalWorkItem.getValue({ path: ["attributes", attributeId] });
            });

            return attributeValues;
        },

        // Copy the values of the attributes shown in the view from the first work item
        setWorkItemValuesFromOriginalWorkItemValues: function (newWorkItem, originalWorkItemValues) {
            var self = this;

            this.attributesToShow.forEach(function (attributeId) {
                self.copyWorkItemAttributeValue(attributeId, originalWorkItemValues[attributeId], newWorkItem);
            });
        },

        // Copy the value of the specified attribute value to the specified work item
        copyWorkItemAttributeValue: function (attributeId, attributeValue, copyToWorkItem) {
            /**
            * Only copy the attribute value if the current value has a different id. This prevents
            * copying unchanged values.
            *
            * Fixes the case where the value is "Unassigned". The object loaded from the server will
            * not have an id attribute in this case. Setting the value to what it already is
            * ("Unassigned" without an id) will cause the work item editor to mark the attribute as
            * changed (even though it hasn't) and attempt to include it in the payload that's sent
            * to the server. This causes an error because the original value without an id property
            * is considered to be an invalid value for a work item attribute.
            *
            * In other words, the values that are given to you by the server are not necessarily in
            * a format that is considered to be valid by the server. Go figure.
            *
            * To work around this the work item editor adds an id attribute with an empty string
            * when setting the value to "Unassigned".
            *
            * We prevent it from being marked as changed by not calling setValue.
            *
            * If the id is undefined, check if the attribute has content.
            * If the content is different, set the value. This is used for tags.
            **/
            var attributeValueFromWorkItem = copyToWorkItem.getValue({ path: ["attributes", attributeId] });
            if (attributeValueFromWorkItem.id !== attributeValue.id ||
                (typeof attributeValue.id === "undefined" &&
                typeof attributeValue.content !== "undefined" &&
                attributeValueFromWorkItem.content !== attributeValue.content)) {
                copyToWorkItem.setValue({
                    path: ["attributes", attributeId],
                    attributeId: attributeId,
                    value: attributeValue
                });
            }
        },

        // Run some setup for the newly created work item
        setupNewWorkItem: function (newWorkItem, gitIssue, progressOptions, addBackLinksFunction) {
            var self = this;

            // Set the values from the git issue to the current work item
            this.setWorkItemValuesFromGitIssue(newWorkItem, gitIssue);

            // Set the handler to run when the work item has been saved
            this.setEventHandlerForWorkItem(newWorkItem, this.workItemStoredEventName, function (workItemFromEvent) {
                self.handleWorkItemSavedEvent(workItemFromEvent, gitIssue, addBackLinksFunction);
            });

            // Do some things after calling the work item save function.
            var afterSaveFunction = function () {

                // Check if this was the last work item to create
                if (--progressOptions.remainingWorkItemsToCreate <= 0) {
                    // Publish the refresh event manually
                    dojo.publish(self.menuRefreshEventName);

                    // Call the finished loading callback function
                    progressOptions.finishedLoadingFunction();
                }
            };

            // Save all new work items using the storeWorkItem function.
            // This is to prevent the work item editor view from being reconstructed
            // after the save event for hidden work items and greatly improves performance.
            newWorkItem.storeWorkItem({
                operationMsg: 'Saving new work item',
                applyDelta: true,
                skipErrorMessage: true,
                onSuccess: function (result) {
                    afterSaveFunction();
                },
                onError: function (error) {
                    afterSaveFunction();

                    // The work item editor widget may already be available (first work item)
                    var workItemEditorWidget = self._getWorkItemEditorWidget(newWorkItem);

                    if (workItemEditorWidget) {
                        workItemEditorWidget._saveErrorCallback(error);
                    } else {
                        // Subscribe to the work item view changed event to and try to get the the work item
                        // editor widget for the current work item. If we got an instance then use it to show
                        // the save error message in the work item editor.
                        var subscription = dojo.subscribe(self.workItemViewChangedEventName, self, function () {
                            var workItemEditorWidget = this._getWorkItemEditorWidget(newWorkItem);

                            if (workItemEditorWidget) {
                                dojo.unsubscribe(subscription);
                                workItemEditorWidget._saveErrorCallback(error);
                            }
                        });
                    }
                }
            });
        },

        // Set values in the work item from the git issue. Also add a link to the git issue.
        setWorkItemValuesFromGitIssue: function (workItem, gitIssue) {
            if (gitIssue.title) {
                // Set the work item summary
                workItem.setValue({
                    path: ["attributes", "summary", "content"],
                    attributeId: "summary",
                    value: gitIssue.title
                });
            }

            if (gitIssue.description) {
                // Set the work item description. Use <br /> instead of end line characters.
                workItem.setValue({
                    path: ["attributes", "description", "content"],
                    attributeId: "description",
                    value: gitIssue.description.replace(/(\r\n|\n|\r)/gm, "<br />")
                });
            }

            // Get the tags value. It might have been set by the user.
            var tagsValue = workItem.getValue({
                path: ["attributes", "internalTags", "content"]
            });
            var fromGitIssueTag = "from-git-issue";

            // Add a custom tag to the new work item
            if (tagsValue) {
                tagsValue += ", " + fromGitIssueTag;
            } else {
                tagsValue = fromGitIssueTag;
            }

            // Add any git issue labels as tags
            if (gitIssue.labels) {
                tagsValue += ", " + gitIssue.labels;
            }

            // Set the git issue labels as tags
            workItem.setValue({
                path: ["attributes", "internalTags", "content"],
                attributeId: "internalTags",
                value: tagsValue
            });

            // Add the git issue as a link
            this.addIssueLinksToWorkItemObject(workItem, [gitIssue]);

            workItem.setValue({
                path: ["linkTypes"],
                value: workItem.object.linkTypes
            });
        },

        // Set a handler from this object to run when the specified event is published.
        // Only run the handler if the event is being run for the specified work item.
        // The handler will only run once.
        setEventHandlerForWorkItem: function (workItem, event, handler) {
            var subscription = dojo.subscribe(event, this, function (workItemFromEvent) {
                if (workItemFromEvent && workItemFromEvent._priorFetchEditablePropertiesWorkItemItemId
                    && workItemFromEvent._priorFetchEditablePropertiesWorkItemItemId === workItem._priorFetchEditablePropertiesWorkItemItemId) {
                        dojo.unsubscribe(subscription);
                        handler.call(this, workItemFromEvent);
                }
            });
        },

        // Handle the event run after a work item has been saved
        handleWorkItemSavedEvent: function (workItemFromEvent, gitIssue, addBackLinksFunction) {
            dojo.require("com.ibm.team.workitem.web.ui.internal.module.WindowContext");

            var windowContext = com.ibm.team.workitem.web.ui.internal.module.WindowContext;
            var workItemData = {
                object: {
                    id: workItemFromEvent._cacheId,
                    locationUri: windowContext.getFrontsideURL() + "/" + windowContext.NAME_PART + "/" + workItemFromEvent._cacheId
                }
            };

            // Add the back links in git
            addBackLinksFunction(workItemData, gitIssue);
        },

        // Save the changes in the specified work item.
        // Calls the respective callback functions on success or error.
        saveWorkItem: function (workItem, successCallbackFunction, failureCallbackFunction) {
            workItem.storeWorkItem({
                operationMsg: 'Saving',
                applyDelta: true,
                onSuccess: function(params) {
                    console.log("Save Success");
                    successCallbackFunction(params);
                },
                onError: function(error, params) {
                    console.log("Save Error: ", error);
                    console.log("Save Error params: ", params);
                    failureCallbackFunction(error, params);
                }
            });
        },

        // Trigger the work item save for the link types that have been changed
        saveLinksInWorkItem: function (workItem, successCallbackFunction, failureCallbackFunction) {
            var self = this;

            var onChangeFunc = {
                // Create a function to run after the linkType change
                changeFunc: function (event) {
                    // Remove the event listener so that this function is only called once
                    workItem.removeListener(listener);

                    // Save the changes
                    self.saveWorkItem(workItem, successCallbackFunction, failureCallbackFunction);
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

            // Set the linkTypes value on the work item.
            // This will also trigger the save
            workItem.setValue({
                path: ["linkTypes"],
                value: workItem.object.linkTypes
            });

            // Remove the listener again just incase it wasn't removed before (the event wasn't fired?)
            workItem.removeListener(listener);
        },

        // Adds links to the workItem object and saves them
        // The addBackLinksFunction is run on success without any parameters
        addLinksToWorkItem: function (workItem, registeredGitRepository, commitsToLink, issuesToLink, requestsToLink, addBackLinksFunction, failureCallbackFunction) {
            this.addCommitLinksToWorkItemObject(workItem, commitsToLink, registeredGitRepository);
            this.addIssueLinksToWorkItemObject(workItem, issuesToLink);
            this.addRequestLinksToWorkItemObject(workItem, requestsToLink);

            this.saveLinksInWorkItem(workItem, addBackLinksFunction, failureCallbackFunction);
        },

        // Save the specified commits to link as links in the passed work item object
        addCommitLinksToWorkItemObject: function (workItem, commitsToLink, registeredGitRepository) {
            var self = this;

            // Add links to commits
            if (commitsToLink && commitsToLink.length > 0) {
                // Get the commit link type container
                var commitLinkTypeContainer = this._getCommitLinkTypeContainer(workItem);

                // Add all commits to link to the link type container
                array.forEach(commitsToLink, function (commit) {
                    commitLinkTypeContainer.linkDTOs.push({
                        _isNew: true,
                        comment: commit.message.split(/\r?\n/g)[0] + " [@" + commit.sha + "]",
                        url: self._createCommitLinkUrl(commit, registeredGitRepository)
                    });
                });
            }
        },

        // Save the specified issues to link as links in the passed work item object
        addIssueLinksToWorkItemObject: function (workItem, issuesToLink) {
            // Add links to issues
            if (issuesToLink && issuesToLink.length > 0) {
                // Get the issue link type container
                var issueLinkTypeContainer = this._getIssueLinkTypeContainer(workItem);

                // Add all issues to link to the link type container
                array.forEach(issuesToLink, function (issue) {
                    var url = new URL(issue.webUrl);
                    var linkUrl = issue.webUrl;
                    if (url.hostname.indexOf('github') === -1) {
                        // Only use the link to the service for GitLab
                        linkUrl = issue.linkUrl;
                    }
                    issueLinkTypeContainer.linkDTOs.push({
                        _isNew: true,
                        comment: issue.title,
                        url: linkUrl
                    });
                });
            }
        },

        // Save the specified requests to link as links in the passed work item object
        addRequestLinksToWorkItemObject: function (workItem, requestsToLink) {
            // Add links to requests
            if (requestsToLink && requestsToLink.length > 0) {
                // Get the request link type container
                var requestLinkTypeContainer = this._getRequestLinkTypeContainer(workItem);

                // Add all requests to link to the link type container
                array.forEach(requestsToLink, function (request) {
                    var url = new URL(request.webUrl);
                    var linkUrl = request.webUrl;
                    if (url.hostname.indexOf('github') === -1) {
                        // Only use the link to the service for GitLab
                        linkUrl = request.linkUrl;
                    }
                    requestLinkTypeContainer.linkDTOs.push({
                        _isNew: true,
                        comment: request.title,
                        url: linkUrl
                    });
                });
            }
        },

        // Move issue and request links that were created as related artifacts to their own custom link types
        // Returns true if any changes where made; otherwise false
        moveOldLinksToNewLinkTypes: function (workItem) {
            var issueLinksRegex = /\/org\.jazzcommunity\.gitconnectorservice\.igitconnectorservice\/gitlab\/[^\/]+\/project\/[^\/]+\/issue\/[^\/]+\/link/gmi;
            var requestLinksRegex = /\/org\.jazzcommunity\.gitconnectorservice\.igitconnectorservice\/gitlab\/[^\/]+\/project\/[^\/]+\/merge-request\/[^\/]+\/link/gmi;
            var artifactLinkTypeContainer = this._getRelatedArtifactLinkTypeContainer(workItem);

            if (artifactLinkTypeContainer.linkDTOs.length) {
                var issueLinkObjects = [];
                var requestLinkObjects = [];

                for (var i = artifactLinkTypeContainer.linkDTOs.length - 1; i >= 0; i--) {
                    issueLinksRegex.lastIndex = 0;
                    requestLinksRegex.lastIndex = 0;

                    if (issueLinksRegex.test(artifactLinkTypeContainer.linkDTOs[i].url)) {
                        issueLinkObjects.push({
                            _isNew: true,
                            comment: artifactLinkTypeContainer.linkDTOs[i].comment,
                            url: artifactLinkTypeContainer.linkDTOs[i].url
                        });
                        artifactLinkTypeContainer.linkDTOs.splice(i, 1);
                    } else if (requestLinksRegex.test(artifactLinkTypeContainer.linkDTOs[i].url)) {
                        requestLinkObjects.push({
                            _isNew: true,
                            comment: artifactLinkTypeContainer.linkDTOs[i].comment,
                            url: artifactLinkTypeContainer.linkDTOs[i].url
                        });
                        artifactLinkTypeContainer.linkDTOs.splice(i, 1);
                    }
                }

                if (issueLinkObjects.length) {
                    var issueLinkTypeContainer = this._getIssueLinkTypeContainer(workItem);

                    array.forEach(issueLinkObjects, function (issueLinkObject) {
                        issueLinkTypeContainer.linkDTOs.push(issueLinkObject);
                    });
                }

                if (requestLinkObjects.length) {
                    var requestLinkTypeContainer = this._getRequestLinkTypeContainer(workItem);

                    array.forEach(requestLinkObjects, function (requestLinkObject) {
                        requestLinkTypeContainer.linkDTOs.push(requestLinkObject);
                    });
                }

                if (issueLinkObjects.length || requestLinkObjects.length) {
                    return true;
                }
            }

            return false;
        },

        getGitCommitLinksFromWorkItem: function (workItem) {
            var self = this;
            var linkedCommitUrls = [];
            var commitLinkTypeContainer = this._getCommitLinkTypeContainer(workItem);

            array.forEach(commitLinkTypeContainer.linkDTOs, function (commitLink) {
                var searchTerm = "/commit?value=";
                var lastIndex = commitLink.url.lastIndexOf(searchTerm);

                if (lastIndex != -1) {
                    var encodedCommit = commitLink.url.slice(lastIndex + searchTerm.length);
                    var linkCommit = json.parse(self.commitLinkEncoder.decode(encodedCommit));
                    linkedCommitUrls.push(linkCommit.u.toLowerCase());
                }
            });

            return linkedCommitUrls;
        },

        getRelatedArtifactLinksFromWorkItem: function (workItem) {
            var linkedUrls = [];
            var artifactLinkTypeContainer = this._getRelatedArtifactLinkTypeContainer(workItem);

            array.forEach(artifactLinkTypeContainer.linkDTOs, function (artifactLink) {
                linkedUrls.push(artifactLink.url.toLowerCase());
            });

            return linkedUrls;
        },

        getIssueLinksFromWorkItem: function (workItem) {
            var linkedIssueUrls = [];
            var issueLinkTypeContainer = this._getIssueLinkTypeContainer(workItem);

            array.forEach(issueLinkTypeContainer.linkDTOs, function (issueLink) {
                linkedIssueUrls.push(issueLink.url.toLowerCase());
            });

            return linkedIssueUrls;
        },

        getRequestLinksFromWorkItem: function (workItem) {
            var linkedRequestUrls = [];
            var requestLinkTypeContainer = this._getRequestLinkTypeContainer(workItem);

            array.forEach(requestLinkTypeContainer.linkDTOs, function (requestLink) {
                linkedRequestUrls.push(requestLink.url.toLowerCase());
            });

            return linkedRequestUrls;
        },

        // Get the access token for the user and host
        getAccessTokenByHost: function (hostUrl) {
            var deferred = new Deferred();

            xhr.get(this.personalTokenServiceUrl, {
                query: {
                    key: hostUrl
                },
                handleAs: "json",
                headers: {
                    "Accept": "application/json"
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
            return xhr.post(this.personalTokenServiceUrl, {
                data: json.stringify({
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
            return xhr.get(this.currentUserUrl, {
                handleAs: "json",
                headers: {
                    "Accept": "application/json"
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
        },

        // Creates a function that gets the specified link type container from the work item
        // If the container doesn't already exist, it's created and added to the work item
        _makeLinkTypeContainerGetter: function (linkTypeId, displayName, endpointId) {
            var self = this;
            return function (workItem) {
                var linkTypeContainer = workItem.object.linkTypes.find(function (linkType) {
                    return linkType.id === linkTypeId;
                });

                if (!linkTypeContainer) {
                    linkTypeContainer = self._getEmptyLinkTypeContainer(displayName, endpointId, linkTypeId);
                    workItem.object.linkTypes.push(linkTypeContainer);
                }

                return linkTypeContainer;
            };
        },

        // Creates a link type container with the specified values
        _getEmptyLinkTypeContainer: function (displayName, endpointId, id) {
            return {
                displayName: displayName,
                endpointId: endpointId,
                id: id,
                isSource: false,
                linkDTOs: []
            };
        },

        _createLinkTypeContainerGetters: function () {
            this._getCommitLinkTypeContainer = this._makeLinkTypeContainerGetter(
                this.gitCommitLinkTypeId,
                "Git Commits",
                "gitcommit"
            );

            this._getRelatedArtifactLinkTypeContainer = this._makeLinkTypeContainerGetter(
                this.relatedArtifactLinkTypeId,
                "Related Artifacts",
                "relatedArtifact"
            );

            this._getIssueLinkTypeContainer = this._makeLinkTypeContainerGetter(
                this.issueLinkTypeId,
                "Git Issues",
                "issue_target"
            );

            this._getRequestLinkTypeContainer = this._makeLinkTypeContainerGetter(
                this.requestLinkTypeId,
                "Git Merge / Pull Requests",
                "request_target"
            );
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
        // Keeping this even though it's no longer used. Might still be useful in the future.
        _createRichHoverUrl: function(artifact) {
            return this.richHoverServiceUrl + "/" + artifact.service +
                "/" + new URL(artifact.webUrl).hostname +
                "/project/" + artifact.projectId +
                "/" + artifact.type + "/" + artifact.iid +
                "/link";
        },

        // Get the work item editor widget instance from the work item page instance
        // taken from the cache
        _getWorkItemEditorWidget: function (workItem) {
            var workItemEditorWidget;

            try {
                workItemEditorWidget = jazz.app.currentApplication.workbench
                    ._pageWidgetCache["com.ibm.team.workitem"]
                    ._multipaneContentWidget
                    .getCachedWidget("__jazzWorkItemEditor", workItem.getId());
            } catch (e) {
                workItemEditorWidget = null;
            }

            return workItemEditorWidget;
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