define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/on",
    "dojo/query",
    "./DataStores/MainDataStore",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!../templates/ViewAndSelectCommits.html"
], function (declare, array, lang, domClass, domConstruct, on, query,
    MainDataStore,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.viewAndSelectCommits",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,
        viewCommits: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
        },

        startup: function () {
            this.initializeViewCommitsList();
            this.watchDataStore();
        },

        watchDataStore: function () {
            var self = this;

            // Watch the store to know when the commits finished loading
            this.mainDataStore.selectedRepositorySettings.watch("commitsLoaded", function (name, oldValue, value) {
                if (value) {
                    // Commits finished loading, update the view
                    self.setViewCommitsListFromStore();
                } else {
                    // Commits are not loaded, reinitialize the view (loading...)
                    self.initializeViewCommitsList();
                }
            });

            // Watch the store to react when the list of commits changes (add / remove from commits to link list)
            this.mainDataStore.selectedRepositoryData.commits.watchElements(function () {
                // Only react if the commits have finished loading
                if (self.mainDataStore.selectedRepositorySettings.get("commitsLoaded")) {
                    // Update the local list of commits (and the view)
                    self.setViewCommitsListFromStore();
                }
            });
        },

        initializeViewCommitsList: function () {
            this.viewCommits = [{
                message: "Loading...",
                alreadyLinked: true
            }];

            // Draw the commits list in the view
            this.drawViewCommits();
            this.drawDetailsView();
        },

        setViewCommitsListFromStore: function () {
            // Clone the store array
            this.viewCommits = lang.clone(this.mainDataStore.selectedRepositoryData.commits);

            if (this.viewCommits.length < 1) {
                this.viewCommits = [{
                    message: "No commits found",
                    alreadyLinked: true
                }];
            }

            // Draw the commits list in the view
            this.drawViewCommits();
            this.drawDetailsView();
        },

        // Draw the commits list from the view commits
        drawViewCommits: function () {
            var self = this;
            var commitsListNode = query("#viewAndSelectCommitsWrapper .rtcGitConnectorViewAndSelectList")[0];
            domConstruct.empty(commitsListNode);

            array.forEach(this.viewCommits, function (commit) {
                var commitListItem = domConstruct.create("div", {
                    "class": "rtcGitConnectorViewAndSelectListItem",
                    "data-commit-sha": commit.sha
                }, commitsListNode);

                on(commitListItem, "click", function (event) {
                    self.setSelectedCommitBySha(this.getAttribute("data-commit-sha"));
                });

                domConstruct.create("div", {
                    "class": "rtcGitConnectorViewAndSelectListItemButton",
                    innerHTML: "+"
                }, commitListItem);

                var commitListItemContent = domConstruct.create("div", {
                    "class": "rtcGitConnectorViewAndSelectListItemContent"
                }, commitListItem);

                domConstruct.create("span", {
                    "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListFirstLine",
                    innerHTML: commit.message.split(/\r?\n/g)[0]
                }, commitListItemContent);

                if (commit.authoredDate) {
                    var commitDate = new Date(commit.authoredDate);
                    domConstruct.create("span", {
                        "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListSecondLine",
                        innerHTML: commit.authorName + " committed on " + commitDate.toDateString() + " at " + commitDate.getHours() + ":" + commitDate.getMinutes()
                    }, commitListItemContent);
                } else {
                    domConstruct.create("span", {
                        "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListSecondLine",
                        innerHTML: "&nbsp;"
                    }, commitListItemContent);
                }
            });
        },

        // Set the selected commit in the view using the commit sha
        setSelectedCommitBySha: function (commitSha) {
            var self = this;

            query("#viewAndSelectCommitsWrapper .rtcGitConnectorViewAndSelectList .rtcGitConnectorViewAndSelectListItem").forEach(function (node) {
                if (node.getAttribute("data-commit-sha") === commitSha) {
                    domClass.add(node, "selected");
                } else {
                    domClass.remove(node, "selected");
                }
            });

            array.forEach(this.viewCommits, function (commit) {
                if (commit.sha === commitSha) {
                    self.drawDetailsView(commit);
                }
            });
        },

        // Draw the details view for the selected commit
        drawDetailsView: function (commit) {
            var commitDetailsNode = query("#viewAndSelectCommitsWrapper .rtcGitConnectorViewAndSelectDetails")[0];
            domConstruct.empty(commitDetailsNode);

            domConstruct.create("span", {
                "class": "rtcGitConnectorViewAndSelectDetailsSpan rtcGitConnectorViewAndSelectDetailsLabel",
                innerHTML: "Commit Details"
            }, commitDetailsNode);

            if (!commit) {
                domConstruct.create("span", {
                    "class": "rtcGitConnectorViewAndSelectDetailsSpan",
                    innerHTML: "Select a commit to view more details"
                }, commitDetailsNode);
            } else {
                this.addToDetailsViewNode(commitDetailsNode, "Message: ", commit.message.replace(/(\r\n|\n|\r)/gm, "<br />"));
                this.addToDetailsViewNode(commitDetailsNode, "Author: ", commit.authorName + " (" + commit.authorEmail + ")");
                this.addToDetailsViewNode(commitDetailsNode, "Date: ", new Date(commit.authoredDate).toString());
                this.addToDetailsViewNode(commitDetailsNode, "SHA: ", commit.sha);
                var linkNode = domConstruct.create("a", {
                    innerHTML: "Open this commit in a new tab",
                    href: commit.webUrl,
                    target: "_blank"
                });
                this.addLinkToDetailsViewNode(commitDetailsNode, "Web Link: ", linkNode);
            }
        },

        addToDetailsViewNode: function (detailsViewNode, label, value) {
            var commitMessageNode = this.createDetailsViewSpan(detailsViewNode, label);
            domConstruct.create("span", {
                innerHTML: value
            }, commitMessageNode);
        },

        addLinkToDetailsViewNode: function (detailsViewNode, label, linkNode) {
            var commitMessageNode = this.createDetailsViewSpan(detailsViewNode, label);
            domConstruct.place(linkNode, commitMessageNode);
        },

        createDetailsViewSpan: function (detailsViewNode, label) {
            var commitMessageNode = domConstruct.create("span", {
                "class": "rtcGitConnectorViewAndSelectDetailsSpan"
            }, detailsViewNode);
            domConstruct.create("span", {
                "class": "rtcGitConnectorViewAndSelectDetailsLabel",
                innerHTML: label
            }, commitMessageNode);

            return commitMessageNode;
        }
    });
});