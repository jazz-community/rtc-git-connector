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
    "dojo/text!../templates/ViewIssuesToLink.html"
], function (declare, array, domConstruct, domStyle, on, query,
    MainDataStore, ViewHelper,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.viewIssuesToLink",
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

            // React when issues are added or removed from the issues to link list
            this.mainDataStore.selectedRepositoryData.issuesToLink.watchElements(function () {
                if (self.mainDataStore.selectedRepositoryData.issuesToLink.length > 0) {
                    // show issues to link list
                    domStyle.set("viewIssuesToLinkContainer", "display", "block");
                    domStyle.set("rtcGitConnectorIssuesListToLink", "width", "100%");
                    domStyle.set("rtcGitConnectorIssuesListToLink", "margin-right", "10px");
                } else {
                    // hide issues to link list
                    domStyle.set("rtcGitConnectorIssuesListToLink", "width", "0");
                    domStyle.set("rtcGitConnectorIssuesListToLink", "margin-right", "0");
                    domStyle.set("viewIssuesToLinkContainer", "display", "none");
                }

                self.drawIssuesToLink(self.mainDataStore.selectedRepositoryData.issuesToLink);
            });
        },

        // Draw the issues to link list in the view
        drawIssuesToLink: function (issuesToLink) {
            var self = this;
            var gitHost = self.mainDataStore.selectedRepositorySettings.get("gitHost");
            var issuesListNode = query("#viewIssuesToLinkContainer .rtcGitConnectorViewItemsToLinkList")[0];
            domConstruct.empty(issuesListNode);

            array.forEach(issuesToLink, function (issue) {
                var issueListItem = domConstruct.create("div", {
                    "class": "rtcGitConnectorViewAndSelectListItem itemToLink",
                    "data-issue-id": issue.id
                }, issuesListNode);

                on(issueListItem, "click", function (event) {
                    var issueId = this.getAttribute("data-issue-id");

                    if (ViewHelper.IsNodeInClass(event.target, "rtcGitConnectorViewAndSelectListItemButton")) {
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

                var firstLine = issue.title;
                var secondLine;
                var buttonName;
                var iconName;

                if (issue.id < 0) {
                    secondLine = "This will create a new issue in " + gitHost.displayName + " using the information from the current work item";
                    buttonName = "deleteButton";
                    iconName = "times";
                } else {
                    secondLine = ViewHelper.GetIssueOrRequestDateString(issue);
                    buttonName = "removeButton";
                    iconName = "trash";
                }

                ViewHelper.DrawListItem(issueListItem, firstLine, secondLine, buttonName, iconName);
            });

            // Get the mainDialog and resize to fit the new content
            ViewHelper.ResizeMainDialog();
        }
    });
});