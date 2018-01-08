define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/query",
    "./DataStores/MainDataStore",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!../templates/ViewAndSelectCommits.html"
], function (declare, array, lang, domConstruct, query,
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
                disabled: true
            }];

            // Draw the commits list in the view
            this.drawViewCommits();
        },

        setViewCommitsListFromStore: function () {
            // Clone the store array
            this.viewCommits = lang.clone(this.mainDataStore.selectedRepositoryData.commits);

            if (this.viewCommits.length < 1) {
                this.viewCommits = [{
                    message: "No commits found",
                    disabled: true
                }];
            } else {
                array.forEach(this.viewCommits, function (commit) {
                    commit.selected = false;
                    commit.disabled = commit.alreadyLinked;
                });
            }

            // Draw the commits list in the view
            this.drawViewCommits();
        },

        drawViewCommits: function () {
            var commitsListNode = query("#viewAndSelectCommitsWrapper .rtcGitConnectorViewAndSelectList")[0];
            domConstruct.empty(commitsListNode);

            array.forEach(this.viewCommits, function (commit) {
                var commitListItem = domConstruct.create("div", {
                    "class": "rtcGitConnectorViewAndSelectListItem"
                }, commitsListNode);
                domConstruct.create("span", {
                    "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListFirstLine",
                    innerHTML: commit.message.split(/\r?\n/g)[0]
                }, commitListItem);

                if (commit.authoredDate) {
                    var commitDate = new Date(commit.authoredDate);
                    domConstruct.create("span", {
                        "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListSecondLine",
                        innerHTML: commit.authorName + " committed on " + commitDate.toDateString() + " at " + commitDate.getHours() + ":" + commitDate.getMinutes()
                    }, commitListItem);
                } else {
                    domConstruct.create("span", {
                        "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListSecondLine",
                        innerHTML: "&nbsp;"
                    }, commitListItem);
                }
            });
        }
    });
});