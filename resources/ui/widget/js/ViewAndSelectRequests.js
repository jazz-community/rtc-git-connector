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
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!../templates/ViewAndSelectRequests.html"
], function (declare, array, lang, dom, domClass, domConstruct, on, query,
    MainDataStore,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.viewAndSelectRequests",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,
        viewRequests: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
        },

        startup: function () {
            this.initializeViewRequestsList();
            this.watchDataStore();
            this.setEventHandlers();
        },

        setEventHandlers: function () {
            var self = this;

            on(this.requestsFilterInput, "change", function (value) {
                self.setViewRequestsListFromStore(value);
            });

            on(dom.byId("viewAndSelectRequestsFilterClearButton"), "click", function (event) {
                self.requestsFilterInput.setValue("");
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

                    if (event.target.classList.contains("rtcGitConnectorViewAndSelectListItemButton")) {
                        // Remove the request with the specified id from the requests list in store and add to the selected list
                        if (requestId) {
                            var selectedRequest = null;

                            for (var i = self.mainDataStore.selectedRepositoryData.requests.length - 1; i >= 0; i--) {
                                if (self.mainDataStore.selectedRepositoryData.requests[i].id == requestId) {
                                    selectedRequest = self.mainDataStore.selectedRepositoryData.requests.splice(i, 1)[0];
                                    break;
                                }
                            }

                            if (selectedRequest) {
                                self.mainDataStore.selectedRepositoryData.requestsToLink.push(selectedRequest);
                            }
                        }
                    } else {
                        // Select request
                        self.setSelectedRequestById(requestId);
                    }
                });

                if (request.alreadyLinked) {
                    domConstruct.create("div", {
                        "class": "rtcGitConnectorViewAndSelectListItemEmptyButton",
                        innerHTML: "&nbsp;"
                    }, requestListItem);
                } else {
                    domConstruct.create("div", {
                        "class": "rtcGitConnectorViewAndSelectListItemButton",
                        innerHTML: "+"
                    }, requestListItem);
                }

                var requestListItemContent = domConstruct.create("div", {
                    "class": "rtcGitConnectorViewAndSelectListItemContent"
                }, requestListItem);

                domConstruct.create("span", {
                    "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListFirstLine",
                    innerHTML: request.title
                }, requestListItemContent);

                if (request.openedDate) {
                    var requestDate = new Date(request.openedDate);
                    domConstruct.create("span", {
                        "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListSecondLine",
                        innerHTML: "#" + request.id + " opened by " + request.openedBy + " on " + requestDate.toDateString() + " at " + ("00" + requestDate.getHours()).slice(-2) + ":" + ("00" + requestDate.getMinutes()).slice(-2)
                    }, requestListItemContent);
                } else {
                    domConstruct.create("span", {
                        "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListSecondLine",
                        innerHTML: "&nbsp;"
                    }, requestListItemContent);
                }
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
                this.addToDetailsViewNode(requestDetailsNode, "Title: ", request.title);
                this.addToDetailsViewNode(requestDetailsNode, "State: ", request.state);
                this.addToDetailsViewNode(requestDetailsNode, "Opened by: ", request.openedBy);
                this.addToDetailsViewNode(requestDetailsNode, "Date opened: ", new Date(request.openedDate).toString());
                this.addToDetailsViewNode(requestDetailsNode, "Request id: ", "#" + request.id);
                var linkNode = domConstruct.create("a", {
                    innerHTML: "Open this request in a new tab",
                    href: request.webUrl,
                    target: "_blank"
                });
                this.addLinkToDetailsViewNode(requestDetailsNode, "Web Link: ", linkNode);
            }
        },

        addToDetailsViewNode: function (detailsViewNode, label, value) {
            var requestTitleNode = this.createDetailsViewSpan(detailsViewNode, label);
            domConstruct.create("span", {
                innerHTML: value
            }, requestTitleNode);
        },

        addLinkToDetailsViewNode: function (detailsViewNode, label, linkNode) {
            var requestTitleNode = this.createDetailsViewSpan(detailsViewNode, label);
            domConstruct.place(linkNode, requestTitleNode);
        },

        createDetailsViewSpan: function (detailsViewNode, label) {
            var requestTitleNode = domConstruct.create("span", {
                "class": "rtcGitConnectorViewAndSelectDetailsSpan"
            }, detailsViewNode);
            domConstruct.create("span", {
                "class": "rtcGitConnectorViewAndSelectDetailsLabel",
                innerHTML: label
            }, requestTitleNode);

            return requestTitleNode;
        },

        // Sort the view requests by the openedDate
        sortViewRequestsByDate: function () {
            var self = this;

            // Create a temp array so that the date objects are only created once
            var tempArray = this.viewRequests.map(function (el, i) {
                return {
                    index: i,
                    value: new Date(el.openedDate).getTime()
                };
            });

            // Sort the temp array
            tempArray.sort(function (a, b) {
                return b.value - a.value;
            });

            // Get a sorted version of the original array
            var sortedArray = tempArray.map(function (el) {
                return self.viewRequests[el.index];
            });

            // Use the sorted array
            this.viewRequests = sortedArray;
        },

        // Filter the view requests using the filter text.
        // Only keep requests that contain the filter text either
        // in the request title or request author name or id or email
        filterViewRequestsByText: function (filterText) {
            filterText = filterText.toLowerCase();
            this.viewRequests = this.viewRequests.filter(function (request) {
                request.id = request.id.toString();
                return request.id.toLowerCase().indexOf(filterText) > -1 ||
                    request.title.toLowerCase().indexOf(filterText) > -1 ||
                    request.state.toLowerCase().indexOf(filterText) > -1 ||
                    request.openedBy.toLowerCase().indexOf(filterText) > -1;
            });
            this._highlightFilterText(filterText, ["id", "title", "state", "openedBy"], this.viewRequests);
        },

        _highlightFilterText: function(filterText, filterBy, filterResult){
            for(var i=0; i < filterResult.length; i++){
                for(var j=0; j < filterBy.length; j++){
                    filterResult[i][filterBy[j]] = this._highlightTextInString(filterText, filterResult[i][filterBy[j]]);
                }
            }
        },

        _highlightTextInString: function(searchText, fullText){
            var startIndex;
            if (searchText.toLowerCase() && (startIndex = fullText.toLowerCase().indexOf(searchText)) > -1){
                var beforeFound = fullText.slice(0, startIndex);
                var found = fullText.slice(startIndex, startIndex + searchText.length);
                var afterFound = this._highlightTextInString(searchText, fullText.slice(startIndex + searchText.length));
                fullText = beforeFound + "<b class='rtcGitConnectorHighlightText'>" + found + "</b>" + afterFound;
            }
            return fullText;
        }
    });
});