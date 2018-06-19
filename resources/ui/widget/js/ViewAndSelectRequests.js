define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/on",
    "dojo/query",
    "./DataStores/MainDataStore",
    "./RestServices/JazzRestService",
    "./RestServices/GitRestService",
    "./ViewHelper",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!../templates/ViewAndSelectRequests.html"
], function (declare, array, lang, dom, domClass, domConstruct, on, query,
    MainDataStore, JazzRestService, GitRestService, ViewHelper,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.viewAndSelectRequests",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,
        jazzRestService: null,
        gitRestService: null,
        viewRequests: null,
        fontAwesome: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
            this.jazzRestService = JazzRestService.getInstance();
            this.gitRestService = GitRestService.getInstance();

            if (typeof com_siemens_bt_jazz_rtcgitconnector_modules !== 'undefined') {
                this.fontAwesome = com_siemens_bt_jazz_rtcgitconnector_modules.FontAwesome;
            }
        },

        startup: function () {
            this.initializeViewRequestsList();
            this.watchDataStore();
            this.setEventHandlers();
        },

        setEventHandlers: function () {
            var self = this;
            var requestsLoadedFunc = function (requests) {
                self.mainDataStore.selectedRepositoryData.requests
                    .splice(0, self.mainDataStore.selectedRepositoryData.requests.length);
                self.mainDataStore.selectedRepositoryData.requests
                    .push.apply(self.mainDataStore.selectedRepositoryData.requests, requests);
                self.mainDataStore.selectedRepositorySettings.set("requestsLoaded", true);
                self.mainDataStore.selectedRepositorySettings.set("requestsLoading", false);

                // Enable the search and clear buttons after loading
                dom.byId("viewAndSelectRequestsSearchButton").removeAttribute("disabled");
                dom.byId("viewAndSelectRequestsSearchClearButton").removeAttribute("disabled");
            };
            var requestsLoadErrorFunc = function (error) {
                self.mainDataStore.selectedRepositorySettings.set("requestsLoadError", error || "Unknown Error");

                // Enable the search and clear buttons after loading
                dom.byId("viewAndSelectRequestsSearchButton").removeAttribute("disabled");
                dom.byId("viewAndSelectRequestsSearchClearButton").removeAttribute("disabled");
            };
            var searchButtonClickFunc = function (event) {
                // Don't do anything if requests are already being loaded
                if (!self.mainDataStore.selectedRepositorySettings.get("requestsLoading")) {
                    var selectedRepository = self.mainDataStore.selectedRepositorySettings.get("repository");
                    var gitHost = self.mainDataStore.selectedRepositorySettings.get("gitHost");
                    var accessToken = self.mainDataStore.selectedRepositorySettings.get("accessToken");
                    var requestId = self.requestsSearchInput.value;
                    var alreadyLinkedUrls = self.jazzRestService.getRelatedArtifactLinksFromWorkItem(self.mainDataStore.workItem);

                    // Disable the search and clear buttons while loading
                    dom.byId("viewAndSelectRequestsSearchButton").setAttribute("disabled", "disabled");
                    dom.byId("viewAndSelectRequestsSearchClearButton").setAttribute("disabled", "disabled");

                    // Set the requestsLoading to true to prevent multiple requests
                    self.mainDataStore.selectedRepositorySettings.set("requestsLoading", true);
                    self.mainDataStore.selectedRepositorySettings.set("requestsLoaded", false);

                    if (requestId) {
                        // Try to get the request with the specified id
                        self.gitRestService.getRequestById(selectedRepository, gitHost, accessToken, requestId, alreadyLinkedUrls)
                            .then(requestsLoadedFunc, requestsLoadErrorFunc);
                    } else {
                        // Get all requests if there is no id
                        self.gitRestService.getRecentRequests(selectedRepository, gitHost, accessToken, alreadyLinkedUrls)
                            .then(requestsLoadedFunc, requestsLoadErrorFunc);
                    }
                }
            };

            on(this.requestsFilterInput, "change", function (value) {
                self.setViewRequestsListFromStore(value);
            });

            on(dom.byId("viewAndSelectRequestsFilterClearButton"), "click", function (event) {
                self.requestsFilterInput.setValue("");
            });

            on(dom.byId("viewAndSelectRequestsSearchButton"), "click", searchButtonClickFunc);

            on(dom.byId("viewAndSelectRequestsSearchClearButton"), "click", function (event) {
                self.requestsSearchInput.setValue("");
                searchButtonClickFunc();
            });
        },

        watchDataStore: function () {
            var self = this;

            // Watch the store to know when the requests finished loading
            this.mainDataStore.selectedRepositorySettings.watch("requestsLoaded", function (name, oldValue, value) {
                if (value) {
                    // Requests finished loading, update the view
                    self.setViewRequestsListFromStore();
                } else {
                    // Requests are not loaded, reinitialize the view (loading...)
                    self.initializeViewRequestsList();
                }
            });

            // Watch the store to react when the list of requests changes (add / remove from requests to link list)
            this.mainDataStore.selectedRepositoryData.requests.watchElements(function () {
                // Only react if the requests have finished loading
                if (self.mainDataStore.selectedRepositorySettings.get("requestsLoaded")) {
                    // Update the local list of requests (and the view)
                    self.setViewRequestsListFromStore();
                }
            });
        },

        initializeViewRequestsList: function () {
            this.viewRequests = [{
                title: "Loading...",
                alreadyLinked: true
            }];

            // Clear the filter input
            this.requestsFilterInput.setValue("");

            // Draw the requests list in the view
            this.drawViewRequests();
            this.drawDetailsView();
        },

        setViewRequestsListFromStore: function (filterValue) {
            // Clone the store array
            this.viewRequests = lang.clone(this.mainDataStore.selectedRepositoryData.requests);

            array.forEach(this.viewRequests, function (request) {
                request.originalId = request.id;
            });

            if (this.viewRequests.length < 1) {
                this.viewRequests = [{
                    title: "No requests found",
                    alreadyLinked: true
                }];
            } else {
                // Need to sort the viewRequests here (by date created -> newest on top)
                this.sortViewRequestsByDate();

                if (!filterValue) {
                    // Take the filter from the input if it wasn't passed in
                    filterValue = this.requestsFilterInput.value;
                }

                // Filter the view requests using the filter input text
                if (filterValue) {
                    this.filterViewRequestsByText(filterValue);
                }
            }

            // Draw the requests list in the view
            this.drawViewRequests();
            this.drawDetailsView();
        },

        // Draw the requests list from the view requests
        drawViewRequests: function () {
            var self = this;
            var requestsListNode = query("#viewAndSelectRequestsWrapper .rtcGitConnectorViewAndSelectList")[0];
            domConstruct.empty(requestsListNode);

            array.forEach(this.viewRequests, function (request) {
                var requestListItem = domConstruct.create("div", {
                    "class": "rtcGitConnectorViewAndSelectListItem",
                    "data-request-id": request.originalId
                }, requestsListNode);

                on(requestListItem, "click", function (event) {
                    var requestId = this.getAttribute("data-request-id");

                    if (!request.alreadyLinked && ViewHelper.IsNodeInClass(event.target, "rtcGitConnectorViewAndSelectListItemButton")) {
                        // Remove the request with the specified id from the requests list in store and add to the selected list
                        if (requestId) {
                            var selectedRequest = null;

                            for (var i = self.mainDataStore.selectedRepositoryData.requests.length - 1; i >= 0; i--) {
                                if (self.mainDataStore.selectedRepositoryData.requests[i].id == requestId) {
                                    selectedRequest = self.mainDataStore.selectedRepositoryData.requests.splice(i, 1)[0];
                                    break;
                                }
                            }

                            if (selectedRequest && !self.mainDataStore.selectedRepositoryData.requestsToLink.find(function (request) {
                                return request.id == selectedRequest.id;
                            })) {
                                self.mainDataStore.selectedRepositoryData.requestsToLink.push(selectedRequest);
                            }
                        }
                    } else {
                        // Select request
                        self.setSelectedRequestById(requestId);
                    }
                });

                var firstLine = request.title;
                var secondLine = ViewHelper.GetIssueOrRequestDateString(request);
                var buttonName = "";
                var iconName;

                if (request.alreadyLinked) {
                    domClass.add(requestListItem, "rtcGitConnectorViewAndSelectListItemAlreadyLinked");
                    buttonName = "emptyButton";
                    iconName = "check";
                } else {
                    iconName = "link";
                }

                ViewHelper.DrawListItem(requestListItem, firstLine, secondLine, buttonName, iconName);
            });
        },

        // Set the selected request in the view using the request id
        setSelectedRequestById: function (requestId) {
            var self = this;

            query("#viewAndSelectRequestsWrapper .rtcGitConnectorViewAndSelectList .rtcGitConnectorViewAndSelectListItem").forEach(function (node) {
                if (node.getAttribute("data-request-id") == requestId) {
                    domClass.add(node, "selected");
                } else {
                    domClass.remove(node, "selected");
                }
            });

            array.forEach(this.viewRequests, function (request) {
                if (request.originalId == requestId) {
                    self.drawDetailsView(request);
                }
            });
        },

        // Draw the details view for the selected request
        drawDetailsView: function (request) {
            var requestDetailsNode = query("#viewAndSelectRequestsWrapper .rtcGitConnectorViewAndSelectDetails")[0];
            domConstruct.empty(requestDetailsNode);

            domConstruct.create("span", {
                "class": "rtcGitConnectorViewAndSelectDetailsSpan rtcGitConnectorViewAndSelectDetailsLabel",
                innerHTML: "Request Details"
            }, requestDetailsNode);

            if (!request) {
                domConstruct.create("span", {
                    "class": "rtcGitConnectorViewAndSelectDetailsSpan",
                    innerHTML: "Select a request to view more details"
                }, requestDetailsNode);
            } else {
                ViewHelper.AddToDetailsViewNode(requestDetailsNode, "Title: ", request.title);
                ViewHelper.AddToDetailsViewNode(requestDetailsNode, "State: ", request.state);
                ViewHelper.AddToDetailsViewNode(requestDetailsNode, "Opened by: ", request.openedBy);
                ViewHelper.AddToDetailsViewNode(requestDetailsNode, "Date opened: ", new Date(request.openedDate).toString());
                ViewHelper.AddToDetailsViewNode(requestDetailsNode, "Request id: ", "#" + request.id);
                var linkNode = domConstruct.create("a", {
                    innerHTML: "Open this request in a new tab",
                    href: request.webUrl,
                    target: "_blank"
                });
                ViewHelper.AddLinkToDetailsViewNode(requestDetailsNode, "Web Link: ", linkNode);
            }
        },

        // Sort the view requests by the openedDate
        sortViewRequestsByDate: function () {
            this.viewRequests = ViewHelper.SortListDataByDate("openedDate", this.viewRequests);
        },

        // Filter the view requests using the filter text.
        // Only keep requests that contain the filter text either
        // in the request title or request author name or id or state
        filterViewRequestsByText: function (filterText) {
            this.viewRequests = ViewHelper.FilterListDataByText(filterText,
                ["id", "title", "state", "openedBy"],
                this.viewRequests);
        }
    });
});