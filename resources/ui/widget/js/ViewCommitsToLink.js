define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/on",
    "dojo/query",
    "../services/MainDataStore",
    "./ViewHelper",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!../templates/ViewCommitsToLink.html"
], function (declare, array, domConstruct, domStyle, on, query,
    MainDataStore, ViewHelper,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.viewCommitsToLink",
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

            // React when commits are added or removed from the commits to link list
            this.mainDataStore.selectedRepositoryData.commitsToLink.watchElements(function () {
                if (self.mainDataStore.selectedRepositoryData.commitsToLink.length > 0) {
                    // show commits to link list
                    domStyle.set("viewCommitsToLinkContainer", "display", "block");
                    domStyle.set("rtcGitConnectorCommitsListToLink", "width", "100%");
                    domStyle.set("rtcGitConnectorCommitsListToLink", "margin-right", "10px");
                } else {
                    // hide commits to link list
                    domStyle.set("rtcGitConnectorCommitsListToLink", "width", "0");
                    domStyle.set("rtcGitConnectorCommitsListToLink", "margin-right", "0");
                    domStyle.set("viewCommitsToLinkContainer", "display", "none");
                }

                self.drawCommitsToLink(self.mainDataStore.selectedRepositoryData.commitsToLink);
            });
        },

        // Draw the commits to link list in the view
        drawCommitsToLink: function (commitsToLink) {
            var self = this;
            var commitsListNode = query("#viewCommitsToLinkContainer .rtcGitConnectorViewItemsToLinkList")[0];
            domConstruct.empty(commitsListNode);

            array.forEach(commitsToLink, function (commit) {
                var commitListItem = domConstruct.create("div", {
                    "class": "rtcGitConnectorViewAndSelectListItem itemToLink",
                    "data-commit-sha": commit.sha
                }, commitsListNode);

                on(commitListItem, "click", function (event) {
                    var commitSha = this.getAttribute("data-commit-sha");

                    if (ViewHelper.IsNodeInClass(event.target, "rtcGitConnectorViewAndSelectListItemButton")) {
                        // Remove the commit with the specified sha from the commits to link list in store and add to the commits list
                        if (commitSha) {
                            var selectedCommit = null;

                            for (var i = self.mainDataStore.selectedRepositoryData.commitsToLink.length - 1; i >= 0; i--) {
                                if (self.mainDataStore.selectedRepositoryData.commitsToLink[i].sha === commitSha) {
                                    selectedCommit = self.mainDataStore.selectedRepositoryData.commitsToLink.splice(i, 1)[0];
                                    break;
                                }
                            }

                            if (selectedCommit && !self.mainDataStore.selectedRepositoryData.commits.find(function (commit) {
                                return commit.sha === selectedCommit.sha;
                            })) {
                                self.mainDataStore.selectedRepositoryData.commits.push(selectedCommit);
                            }
                        }
                    }
                });

                var firstLine = commit.message.split(/\r?\n/g)[0];
                var secondLine = ViewHelper.GetCommitDateString(commit);
                ViewHelper.DrawListItem(commitListItem, firstLine, secondLine, "removeButton", "trash");
            });

            // Get the mainDialog and resize to fit the new content
            ViewHelper.ResizeMainDialog();
        }
    });
});