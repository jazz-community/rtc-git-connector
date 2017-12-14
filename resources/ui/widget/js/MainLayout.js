define([
    "dojo/_base/declare",
    "dojo/dom",
    "dojo/dom-style",
    "./MainDataStore",
    "./JazzRestService",
    "./SelectRegisteredGitRepository",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/Dialog",
    "dijit/form/TextBox",
    "dijit/form/Button",
    "dojo/text!../templates/MainLayout.html"
], function (declare, dom, domStyle,
    MainDataStore, JazzRestService, SelectRegisteredGitRepository,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    Dialog, TextBox, Button, template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.mainLayout",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,
        jazzRestService: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
            this.jazzRestService = JazzRestService.getInstance();
        },

        startup: function () {
            this.watchDataStore();
            this.getInitialData();
        },

        getInitialData: function () {
            var self = this;

            this.jazzRestService.getAllRegisteredGitRepositoriesForProjectArea(this.mainDataStore.projectArea.id)
                .then(function (registeredGitRepositories) {
                    self._sortArrayByNameProperty(registeredGitRepositories);
                    self.mainDataStore.registeredGitRepositories.push.apply(self.mainDataStore.registeredGitRepositories, registeredGitRepositories);

                    domStyle.set("noRegisteredGitRepositoriesContainer", "display", !registeredGitRepositories.length ? "block" : "none");
            });
        },

        watchDataStore: function () {
            var self = this;

            this.mainDataStore.selectedRepositorySettings.watch("repository", function (name, oldValue, value) {
                domStyle.set("noGitRepositorySelectedContainer", "display", value === null ? "block" : "none");

                // Reset the selected repository settings because it has changed
                self.resetSelectedRepositorySettings();

                // Determine the git host, then get / set the access token
                self.determineSelectedRepositoryGitHost();
            });
        },

        // Reset all settings except for the "repository" itself
        resetSelectedRepositorySettings: function () {
            this.mainDataStore.selectedRepositorySettings.gitHost = null;
            this.mainDataStore.selectedRepositorySettings.accessToken = null;
        },

        // Find out if the selected git repository is hosted on GitHub, GitLab, or neither of the two
        determineSelectedRepositoryGitHost: function () {
            // todo
            // Set the git host in the data store once it has been determined.
            // That should trigger the getting of the access token...
        },

        _sortArrayByNameProperty: function (objectsWithNames) {
            objectsWithNames.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
        }
    });
});