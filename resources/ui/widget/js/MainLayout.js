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
            this.checkEnvironment();
        },

        checkEnvironment: function () {
            if (this.isInternetExplorer()) {
                domStyle.set("broserIsInternetExplorerContainer", "display", "block");
            }
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

        // Sorts an array of objects alphabetically by their name property
        _sortArrayByNameProperty: function (objectsWithNames) {
            objectsWithNames.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
        },

        isInternetExplorer: function () {
            var ms_ie = false;
            var ua = window.navigator.userAgent;
            var old_ie = ua.indexOf('MSIE ');
            var new_ie = ua.indexOf('Trident/');

            if ((old_ie > -1) || (new_ie > -1)) {
                ms_ie = true;
            }

            return ms_ie;
        }
    });
});