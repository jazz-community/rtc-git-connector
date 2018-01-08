define([
    "dojo/_base/declare",
    "./DataStores/MainDataStore",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!../templates/ViewAndSelectCommits.html"
], function (declare,
    MainDataStore,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.viewAndSelectCommits",
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

            // Watch the store to know when the commits finished loading
            this.mainDataStore.selectedRepositorySettings.watch("commitsLoaded", function (name, oldValue, value) {
                if (value) {
                    // Commits finished loading, update the view...
                    console.log("commits finished loading");
                } else {
                    // Commits are not loaded, reinitialize the view (loading...)
                    console.log("commits not loaded");
                }
            });

            // Watch the store to react when the list of commits changes (add / remove from commits to link list)
            this.mainDataStore.selectedRepositoryData.commits.watchElements(function () {
                // Only react if the commits have finished loading
                if (self.mainDataStore.selectedRepositorySettings.get("commitsLoaded")) {
                    // Update the local list of commits...
                    console.log("commits list changed");
                }
            });
        }
    });
});