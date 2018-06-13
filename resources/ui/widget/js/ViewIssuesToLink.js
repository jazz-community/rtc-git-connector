define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/on",
    "dojo/query",
    "./DataStores/MainDataStore",
    "dijit/registry",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!../templates/ViewIssuesToLink.html"
], function (declare, array, domConstruct, domStyle, on, query,
    MainDataStore,
    registry, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.viewIssuesToLink",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,
        fontAwesome: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();

            if (typeof com_siemens_bt_jazz_rtcgitconnector_modules !== 'undefined') {
                this.fontAwesome = com_siemens_bt_jazz_rtcgitconnector_modules.FontAwesome;
            }
        },

        startup: function () {
            this.watchDataStore();
        },

        watchDataStore: function () {
            var self = this;

            // React when issues are added or removed from the issues to link list
            this.mainDataStore.selectedRepositoryData.issuesToLink.watchElements(function () {
                if (self.mainDataStore.selectedRepositoryData.issuesToLink.length > 0) {
                    // show issues to link list
                    domStyle.set("viewIssuesToLinkContainer", "display", "block");
                } else {
                    // hide issues to link list
                    domStyle.set("viewIssuesToLinkContainer", "display", "none");
                }

                self.drawIssuesToLink(self.mainDataStore.selectedRepositoryData.issuesToLink);
            });
        },

        // Draw the issues to link list in the view
        drawIssuesToLink: function (issuesToLink) {
            var self = this;
            var issuesListNode = query("#viewIssuesToLinkContainer .rtcGitConnectorViewItemsToLinkList")[0];
            domConstruct.empty(issuesListNode);

            array.forEach(issuesToLink, function (issue) {
                var issueListItem = domConstruct.create("div", {
                    "class": "rtcGitConnectorViewAndSelectListItem itemToLink",
                    "data-issue-id": issue.id
                }, issuesListNode);

                on(issueListItem, "click", function (event) {
                    var issueId = this.getAttribute("data-issue-id");

                    if (self.isNodeInClass(event.target, "rtcGitConnectorViewAndSelectListItemButton")) {
                        // Remove the issue with the specified id from the issues to link list in store and add to the issues list
                        if (issueId) {
                            var selectedIssue = null;

                            for (var i = self.mainDataStore.selectedRepositoryData.issuesToLink.length - 1; i >= 0; i--) {
                                if (self.mainDataStore.selectedRepositoryData.issuesToLink[i].id == issueId) {
                                    selectedIssue = self.mainDataStore.selectedRepositoryData.issuesToLink.splice(i, 1)[0];
                                    break;
                                }
                            }

                            if (selectedIssue && !self.mainDataStore.selectedRepositoryData.issues.find(function (issue) {
                                return issue.id == selectedIssue.id;
                            })) {
                                self.mainDataStore.selectedRepositoryData.issues.push(selectedIssue);
                            }
                        }
                    }
                });

                var trash = self.fontAwesome.icon({prefix: 'fas', iconName: 'trash'});
                domConstruct.create("div", {
                    "class": "rtcGitConnectorViewAndSelectListItemButton removeButton",
                    innerHTML: trash.html[0]
                }, issueListItem);

                var issueListItemContent = domConstruct.create("div", {
                    "class": "rtcGitConnectorViewAndSelectListItemContent"
                }, issueListItem);

                domConstruct.create("span", {
                    "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListFirstLine",
                    innerHTML: issue.title
                }, issueListItemContent);

                var issueDate = new Date(issue.openedDate);
                domConstruct.create("span", {
                    "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListSecondLine",
                    innerHTML: "#" + issue.id + " opened by " + issue.openedBy + " on " + issueDate.toDateString() + " at " + ("00" + issueDate.getHours()).slice(-2) + ":" + ("00" + issueDate.getMinutes()).slice(-2)
                }, issueListItemContent);
            });

            // Get the mainDialog and resize to fit the new content
            var mainDialog = registry.byId("connectWithGitMainDialog");
            mainDialog.resize();
            mainDialog.resize();
        },

        // Checks if the node or any of it's parents have the class name
        isNodeInClass: function (node, className) {
            if (node.classList && node.classList.contains(className)) {
                return true;
            }

            if (node.parentNode) {
                return this.isNodeInClass(node.parentNode, className);
            }

            return false;
        }
    });
});