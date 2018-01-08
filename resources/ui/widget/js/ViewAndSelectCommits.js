define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "./DataStores/MainDataStore",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!../templates/ViewAndSelectCommits.html"
], function (declare, array, lang,
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
                    // Commits finished loading, update the view...
                    console.log("commits finished loading");
                    self.setViewCommitsListFromStore();
                } else {
                    // Commits are not loaded, reinitialize the view (loading...)
                    console.log("commits not loaded");
                    self.initializeViewCommitsList();
                }
            });

            // Watch the store to react when the list of commits changes (add / remove from commits to link list)
            this.mainDataStore.selectedRepositoryData.commits.watchElements(function () {
                // Only react if the commits have finished loading
                if (self.mainDataStore.selectedRepositorySettings.get("commitsLoaded")) {
                    // Update the local list of commits...
                    console.log("commits list changed");
                    self.setViewCommitsListFromStore();
                }
            });
        },

        initializeViewCommitsList: function () {
            this.viewCommits = [{
                message: "Loading...",
                disabled: true
            }];

            // Draw view...
            console.log("draw view commits ", this.viewCommits);
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

            // Draw view...
            console.log("draw view commits ", this.viewCommits);
        }
    });
});