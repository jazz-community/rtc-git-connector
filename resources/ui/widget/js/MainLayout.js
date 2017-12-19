define([
    "dojo/_base/declare",
    "dojo/dom",
    "dojo/dom-style",
    "./MainDataStore",
    "./JazzRestService",
    "./GitRestService",
    "./SelectRegisteredGitRepository",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/Dialog",
    "dijit/form/TextBox",
    "dijit/form/Button",
    "dojo/text!../templates/MainLayout.html"
], function (declare, dom, domStyle,
    MainDataStore, JazzRestService, GitRestService, SelectRegisteredGitRepository,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    Dialog, TextBox, Button, template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.mainLayout",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,
        jazzRestService: null,
        gitRestService: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
            this.jazzRestService = JazzRestService.getInstance();
            this.gitRestService = GitRestService.getInstance();
        },

        startup: function () {
            this.watchDataStore();
            this.getInitialData();
        },

        getInitialData: function () {
            var self = this;

            // Get registered git repositories from Jazz
            this.jazzRestService.getAllRegisteredGitRepositoriesForProjectArea(this.mainDataStore.projectArea.id)
                .then(function (registeredGitRepositories) {
                    // Sort the repositories before adding to the store to prevent an extra change event
                    self._sortArrayByNameProperty(registeredGitRepositories);

                    // Use push.apply to add multiple elements at once so that only one change event is caused
                    self.mainDataStore.registeredGitRepositories.push.apply(self.mainDataStore.registeredGitRepositories, registeredGitRepositories);

                    // Show an element if no repositories where found
                    domStyle.set("noRegisteredGitRepositoriesContainer", "display", !registeredGitRepositories.length ? "block" : "none");
            });
        },

        watchDataStore: function () {
            var self = this;

            // React when the selected repository changes
            this.mainDataStore.selectedRepositorySettings.watch("repository", function (name, oldValue, value) {
                domStyle.set("noGitRepositorySelectedContainer", "display", value === null ? "block" : "none");

                // Reset the selected repository settings because it has changed
                self.resetSelectedRepositorySettings();

                // Don't continue if the repository was set to null
                if (value !== null) {
                    // Determine the git host, then get / set the access token
                    self.determineSelectedRepositoryGitHost();
                }
            });

            // React when the selected repository host type changes
            this.mainDataStore.selectedRepositorySettings.watch("gitHost", function (name, oldValue, value) {
                domStyle.set("invalidGitRepositoryTypeContainer", "display", (value === "GITHUB" || value === "GITLAB" || value === null) ? "none" : "block");
                dom.byId("selectedRegisteredGitRepositoryContainer").innerHTML = value;
                // get access token...
            });
        },

        // Reset all settings except for the "repository" itself
        resetSelectedRepositorySettings: function () {
            this.mainDataStore.selectedRepositorySettings.set("gitHost", null);
            this.mainDataStore.selectedRepositorySettings.set("accessToken", null);
        },

        // Find out if the selected git repository is hosted on GitHub, GitLab, or neither of the two
        determineSelectedRepositoryGitHost: function () {
            var self = this;

            // Set the git host in the data store once it has been determined.
            if (typeof this.mainDataStore.selectedRepositorySettings.repository.configurationData.git_hosted_server === "string") {
                // Set from the config
                this.mainDataStore.selectedRepositorySettings
                    .set("gitHost", this.mainDataStore.selectedRepositorySettings.repository.configurationData.git_hosted_server.toUpperCase());
            } else {
                // Make requests to find the type and then set it
                this.gitRestService.determineRepositoryGitHost(this.mainDataStore.selectedRepositorySettings.get("repository"))
                    .then(function (hostType) {
                        self.mainDataStore.selectedRepositorySettings.set("gitHost", hostType.toUpperCase());
                });
            }
        },

        // Sorts an array of objects alphabetically by their name property
        _sortArrayByNameProperty: function (objectsWithNames) {
            objectsWithNames.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
        }
    });
});