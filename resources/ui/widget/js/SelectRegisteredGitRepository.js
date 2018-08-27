define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "../services/MainDataStore",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/form/Select",
    "dojo/text!../templates/SelectRegisteredGitRepository.html"
], function (declare, array,
    MainDataStore,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    Select, template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.selectRegisteredGitRepository",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,
        selectListOptions: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();

            // Set the initial select list option
            this.selectListOptions = [{
                value: "",
                label: this.createLabelString("&nbsp;", "Loading..."),
                selected: true,
                disabled: true
            }];
        },

        startup: function () {
            this.initializeSelectList();
            this.setEventHandlers();
            this.watchDataStore();
        },

        initializeSelectList: function () {
            this.setOptionsList();
            this.selectRegisteredGitRepository.maxHeight = -1; // Automatically adjust the height to fit the viewport
        },

        watchDataStore: function () {
            var self = this;

            // React when the list of git repositories changes
            this.mainDataStore.registeredGitRepositories.watchElements(function () {
                // Update the view list to reflect the new list of git repositories
                self.setRegisteredGitRepositoriesAsListOptions(self.mainDataStore.registeredGitRepositories);
            });
        },

        setEventHandlers: function () {
            var self = this;

            // React when the selected list option changes
            this.selectRegisteredGitRepository.onChange = function (value) {
                // Remove the first item in the list if it doesn't have a value.
                // This removes the placeholder option that is initially selected (Select a Git Repository...)
                if (this.options[0].value === "") {
                    this.removeOption(this.options[0]);
                }

                var selectedRepository = self.mainDataStore.selectedRepositorySettings.get("repository");

                // Do nothing if the correct repository is already set in the store
                if (!selectedRepository || selectedRepository.key !== value) {
                    // Check if there are changes
                    if (self.mainDataStore.selectedRepositoryData.commitsToLink.length > 0 ||
                            self.mainDataStore.selectedRepositoryData.issuesToLink.length > 0 ||
                            self.mainDataStore.selectedRepositoryData.requestsToLink.length > 0) {
                        // Ask the user if they want to lose their changes
                        if (confirm("Changing the repository will result in losing your unsaved changes. Are you sure you want to discard your changes?")) {
                            // Change the repository if the user wants to lose their changes
                            self._setSelectedRepositoryByKey(value);
                        } else {
                            // Set the selected repository back to it's previous value if the user doesn't want to lose their changes
                            self.selectRegisteredGitRepository.set("value", selectedRepository.key);
                        }
                    } else {
                        // Change the repository if there are no changes
                        self._setSelectedRepositoryByKey(value);
                    }
                }
            };
        },

        // Need to run the startup method on the select list after setting a new options list.
        // This is a "bug" in dijit/form/Select (or feature?)
        setOptionsList: function () {
            this.selectRegisteredGitRepository.set("options", this.selectListOptions);
            this.selectRegisteredGitRepository.startup();
        },

        // Add spans and classes to the label for custom formatting
        createLabelString: function (firstLine, secondLine) {
            return '<span class="rtcGitConnectorSelectListSpan rtcGitConnectorSelectListFirstLine">' + firstLine + '</span>' +
                    '<span class="rtcGitConnectorSelectListSpan rtcGitConnectorSelectListSecondLine">' + secondLine + '</span>';
        },

        // Set the view options from the list of git repositories
        setRegisteredGitRepositoriesAsListOptions: function (registeredGitRepositories) {
            if (!registeredGitRepositories.length) {
                // Just add a placeholder if the list doesn't contain any items
                this.selectListOptions = [{
                    value: "",
                    label: this.createLabelString("&nbsp;", "No git repositories registered..."),
                    selected: true,
                    disabled: true
                }];
            } else {
                // Add a placeholder option (no repository should be selected by default)
                this.selectListOptions = [{
                    value: "",
                    label: this.createLabelString("&nbsp;", "Select a Git Repository..."),
                    selected: true,
                    disabled: true
                }];

                // Format all items and add to the view list
                array.forEach(registeredGitRepositories, function (registeredGitRepository) {
                    this.selectListOptions.push({
                        value: registeredGitRepository.key,
                        label: this.createLabelString(registeredGitRepository.name, registeredGitRepository.url)
                    });
                }, this);
            }

            // No repository should be selected right after the list has changed
            this.mainDataStore.selectedRepositorySettings.set("repository", null);
            this.setOptionsList();
        },

        // Update the data store. If the selected option is not found in the data store,
        // the selected repository in the data store will be set to null
        _setSelectedRepositoryByKey: function (key) {
            this.mainDataStore.selectedRepositorySettings.set("repository", this.mainDataStore.registeredGitRepositories.find(function (element) {
                return element.key === key;
            }));
        }
    });
});