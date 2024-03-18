define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/on",
    "../../services/MainDataStore",
    "../../services/JazzRestService",
    "../../services/GitRestService",
    "../../utils/ViewHelper",
    "../DetailsPane/DetailsPane",
    "../ListItem/ListItem",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./ViewAndSelectRequests.html"
], function (
    declare,
    array,
    lang,
    dom,
    domConstruct,
    on,
    MainDataStore,
    JazzRestService,
    GitRestService,
    ViewHelper,
    DetailsPane,
    ListItem,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    template
) {
    return declare(
        "com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.viewAndSelectRequests",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
        {
            templateString: template,
            mainDataStore: null,
            jazzRestService: null,
            gitRestService: null,
            viewRequests: null,

            constructor: function () {
                this.mainDataStore = MainDataStore.getInstance();
                this.jazzRestService = JazzRestService.getInstance();
                this.gitRestService = GitRestService.getInstance();
            },

            startup: function () {
                this.initializeViewRequestsList();
                this.watchDataStore();
                this.setEventHandlers();
            },

            setEventHandlers: function () {
                var self = this;
                var requestsLoadedFunc = function (requests) {
                    self.mainDataStore.selectedRepositoryData.requests.splice(
                        0,
                        self.mainDataStore.selectedRepositoryData.requests.length
                    );
                    self.mainDataStore.selectedRepositoryData.requests.push.apply(
                        self.mainDataStore.selectedRepositoryData.requests,
                        requests
                    );
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
                        var alreadyLinkedUrls = self.jazzRestService.getRequestLinksFromWorkItem(
                            self.mainDataStore.workItem
                        );

                        // Disable the search and clear buttons while loading
                        dom.byId("viewAndSelectRequestsSearchButton").setAttribute("disabled", "disabled");
                        dom.byId("viewAndSelectRequestsSearchClearButton").setAttribute("disabled", "disabled");

                        // Set the requestsLoading to true to prevent multiple requests
                        self.mainDataStore.selectedRepositorySettings.set("requestsLoading", true);
                        self.mainDataStore.selectedRepositorySettings.set("requestsLoaded", false);

                        if (requestId) {
                            // Try to get the request with the specified id
                            self.gitRestService
                                .getRequestById(selectedRepository, gitHost, accessToken, requestId, alreadyLinkedUrls)
                                .then(requestsLoadedFunc, requestsLoadErrorFunc);
                        } else {
                            // Get all requests if there is no id
                            self.gitRestService
                                .getRecentRequests(selectedRepository, gitHost, accessToken, alreadyLinkedUrls)
                                .then(requestsLoadedFunc, requestsLoadErrorFunc);
                        }
                    }
                };

                on(this.requestsFilterInput, "change", function (value) {
                    self.setViewRequestsListFromStore(value);
                });

                on(dom.byId("viewAndSelectRequestsFilterClearButton"), "click", function (event) {
                    self.requestsFilterInput.set("value", "");
                });

                on(dom.byId("viewAndSelectRequestsSearchButton"), "click", searchButtonClickFunc);

                on(dom.byId("viewAndSelectRequestsSearchClearButton"), "click", function (event) {
                    self.requestsSearchInput.set("value", "");
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
                this.viewRequests = [
                    {
                        title: "Loading...",
                        alreadyLinked: true
                    }
                ];

                // Clear the filter input
                this.requestsFilterInput.set("value", "");

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
                    this.viewRequests = [
                        {
                            title: "No requests found",
                            alreadyLinked: true
                        }
                    ];
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
                domConstruct.empty(this.listItemsContainer);

                array.forEach(this.viewRequests, function (request) {
                    var listItem = new ListItem(request.originalId);
                    listItem.set("title", request.title);
                    listItem.set("details", ViewHelper.GetIssueOrRequestDateString(request));
                    listItem.set("buttonType", request.alreadyLinked ? "check" : "link");
                    listItem.set("duplicate", false);
                    listItem.set(
                        "buttonTitle",
                        !request.alreadyLinked ? "Add Link" : request.originalId ? "Already Linked" : ""
                    );

                    listItem.onButtonClick = lang.hitch(self, self.listItemButtonClick);
                    listItem.onContentClick = lang.hitch(self, self.setSelectedItemById);

                    request.listItem = listItem;
                    domConstruct.place(listItem.domNode, self.listItemsContainer);
                });
            },

            // Remove the request with the specified id from the requests list in store and add to the selected list
            listItemButtonClick: function (itemId) {
                var selectedRequest = null;

                for (var i = this.mainDataStore.selectedRepositoryData.requests.length - 1; i >= 0; i--) {
                    if (
                        this.mainDataStore.selectedRepositoryData.requests[i].id == itemId &&
                        !this.mainDataStore.selectedRepositoryData.requests[i].alreadyLinked
                    ) {
                        selectedRequest = this.mainDataStore.selectedRepositoryData.requests.splice(i, 1)[0];
                        break;
                    }
                }

                if (
                    selectedRequest &&
                    !this.mainDataStore.selectedRepositoryData.requestsToLink.find(function (request) {
                        return request.id == selectedRequest.id;
                    })
                ) {
                    this.mainDataStore.selectedRepositoryData.requestsToLink.push(selectedRequest);
                }
            },

            // Set the selected list item in the view using the item id
            setSelectedItemById: function (itemId) {
                var self = this;

                array.forEach(this.viewRequests, function (request) {
                    if (request.originalId && request.originalId === itemId) {
                        request.listItem.set("selected", true);
                        self.drawDetailsView(request);
                    } else {
                        request.listItem.set("selected", false);
                    }
                });
            },

            // Draw the details view for the selected request
            drawDetailsView: function (request) {
                var gitHost = this.mainDataStore.selectedRepositorySettings.get("gitHost");
                var items = [];

                if (!request) {
                    items.push({
                        text: "Select a " + gitHost.requestPrefix.toLowerCase() + "request to view more details"
                    });
                } else {
                    items.push(
                        {
                            label: "Title: ",
                            text: request.title
                        },
                        {
                            label: "State: ",
                            text: request.state
                        },
                        {
                            label: "Labels: ",
                            text: request.labels || "-"
                        },
                        {
                            label: "Milestone: ",
                            text: request.milestone || "-"
                        },
                        {
                            label: "Opened by: ",
                            text: request.openedBy
                        },
                        {
                            label: "Date opened: ",
                            text: ViewHelper.GetFormattedDateFromString(request.openedDate)
                        },
                        {
                            label: "Request id: ",
                            text: "#" + request.id
                        },
                        {
                            label: "Web Link: ",
                            text: "Open this " + gitHost.requestPrefix.toLowerCase() + "request in a new tab",
                            link: request.webUrl
                        }
                    );
                }

                this.detailsPane.setContent(gitHost.requestPrefix + "Request Details", items);
            },

            // Sort the view requests by the openedDate
            sortViewRequestsByDate: function () {
                this.viewRequests = ViewHelper.SortListDataByDate("openedDate", this.viewRequests);
            },

            // Filter the view requests using the filter text.
            // Only keep requests that contain the filter text either
            // in the request title or request author name or id or state
            filterViewRequestsByText: function (filterText) {
                this.viewRequests = ViewHelper.FilterListDataByText(
                    filterText,
                    ["id", "title", "state", "openedBy", "labels", "milestone"],
                    this.viewRequests
                );
            }
        }
    );
});
