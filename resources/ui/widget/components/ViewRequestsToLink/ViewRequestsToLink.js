define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-style",
    "../../services/MainDataStore",
    "../../js/ViewHelper",
    "../ListItem/ListItem",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./ViewRequestsToLink.html"
], function (
    declare,
    array,
    lang,
    domConstruct,
    domStyle,
    MainDataStore,
    ViewHelper,
    ListItem,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    template
) {
    return declare(
        "com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.viewRequestsToLink",
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
                        domStyle.set("rtcGitConnectorRequestsListToLink", "width", "100%");
                        domStyle.set("rtcGitConnectorRequestsListToLink", "margin-right", "10px");
                    } else {
                        // hide requests to link list
                        domStyle.set("rtcGitConnectorRequestsListToLink", "width", "0");
                        domStyle.set("rtcGitConnectorRequestsListToLink", "margin-right", "0");
                        domStyle.set("viewRequestsToLinkContainer", "display", "none");
                    }

                    self.drawRequestsToLink(self.mainDataStore.selectedRepositoryData.requestsToLink);
                });
            },

            // Draw the requests to link list in the view
            drawRequestsToLink: function (requestsToLink) {
                var self = this;
                domConstruct.empty(this.listItemsContainer);

                array.forEach(requestsToLink, function (request) {
                    var listItem = new ListItem(request.id);
                    listItem.set("title", request.title);
                    listItem.set("details", ViewHelper.GetIssueOrRequestDateString(request));
                    listItem.set("buttonType", "trash");
                    listItem.set("notClickable", true);
                    listItem.set("duplicate", false);
                    listItem.set("buttonTitle", "Remove");

                    listItem.onButtonClick = lang.hitch(self, self.listItemButtonClick);

                    request.listItem = listItem;
                    domConstruct.place(listItem.domNode, self.listItemsContainer);
                });
            },

            // Remove the request with the specified id from the requests to link list in store and add to the requests list
            listItemButtonClick: function (itemId) {
                var selectedRequest = null;

                for (var i = this.mainDataStore.selectedRepositoryData.requestsToLink.length - 1; i >= 0; i--) {
                    if (this.mainDataStore.selectedRepositoryData.requestsToLink[i].id == itemId) {
                        selectedRequest = this.mainDataStore.selectedRepositoryData.requestsToLink.splice(i, 1)[0];
                        break;
                    }
                }

                if (
                    selectedRequest &&
                    !this.mainDataStore.selectedRepositoryData.requests.find(function (request) {
                        return request.id == selectedRequest.id;
                    })
                ) {
                    this.mainDataStore.selectedRepositoryData.requests.push(selectedRequest);
                }
            }
        }
    );
});
