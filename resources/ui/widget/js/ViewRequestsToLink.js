define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/on",
    "dojo/query",
    "./DataStores/MainDataStore",
    "./ViewHelper",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!../templates/ViewRequestsToLink.html"
], function (declare, array, domConstruct, domStyle, on, query,
    MainDataStore, ViewHelper,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.viewRequestsToLink",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
        },

        startup: function () {
            this.watchDataStore();
        },

        watchDataStore: function () {
            var self = this;

            // React when requests are added or removed from the requests to link list
            this.mainDataStore.selectedRepositoryData.requestsToLink.watchElements(function () {
                if (self.mainDataStore.selectedRepositoryData.requestsToLink.length > 0) {
                    // show requests to link list
                    domStyle.set("viewRequestsToLinkContainer", "display", "block");
                } else {
                    // hide requests to link list
                    domStyle.set("viewRequestsToLinkContainer", "display", "none");
                }

                self.drawRequestsToLink(self.mainDataStore.selectedRepositoryData.requestsToLink);
            });
        },

        // Draw the requests to link list in the view
        drawRequestsToLink: function (requestsToLink) {
            var self = this;
            var requestsListNode = query("#viewRequestsToLinkContainer .rtcGitConnectorViewItemsToLinkList")[0];
            domConstruct.empty(requestsListNode);

            array.forEach(requestsToLink, function (request) {
                var requestListItem = domConstruct.create("div", {
                    "class": "rtcGitConnectorViewAndSelectListItem itemToLink",
                    "data-request-id": request.id
                }, requestsListNode);

                on(requestListItem, "click", function (event) {
                    var requestId = this.getAttribute("data-request-id");

                    if (ViewHelper.IsNodeInClass(event.target, "rtcGitConnectorViewAndSelectListItemButton")) {
                        // Remove the request with the specified id from the requests to link list in store and add to the requests list
                        if (requestId) {
                            var selectedRequest = null;

                            for (var i = self.mainDataStore.selectedRepositoryData.requestsToLink.length - 1; i >= 0; i--) {
                                if (self.mainDataStore.selectedRepositoryData.requestsToLink[i].id == requestId) {
                                    selectedRequest = self.mainDataStore.selectedRepositoryData.requestsToLink.splice(i, 1)[0];
                                    break;
                                }
                            }

                            if (selectedRequest && !self.mainDataStore.selectedRepositoryData.requests.find(function (request) {
                                return request.id == selectedRequest.id;
                            })) {
                                self.mainDataStore.selectedRepositoryData.requests.push(selectedRequest);
                            }
                        }
                    }
                });

                var requestDate = new Date(request.openedDate);
                var secondLine = "#" + request.id + " opened by " + request.openedBy + " on "
                    + requestDate.toDateString() + " at " + ("00" + requestDate.getHours()).slice(-2)
                    + ":" + ("00" + requestDate.getMinutes()).slice(-2);
                ViewHelper.DrawListItem(requestListItem, request.title, secondLine, "removeButton", "trash");
            });

            // Get the mainDialog and resize to fit the new content
            ViewHelper.ResizeMainDialog();
        }
    });
});