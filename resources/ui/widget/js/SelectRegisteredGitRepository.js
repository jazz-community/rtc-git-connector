define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "./MainDataStore",
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
            this.selectListOptions = [{
                value: "",
                label: this.createLabelString("&nbsp;", "Loading..."),
                selected: true,
                disabled: true
            }];
        },

        postCreate: function () {
            this.initializeSelectList();
            this.setEventHandlers();
            this.watchDataStore();
        },

        initializeSelectList: function () {
            this.setOptionsList();
            this.selectRegisteredGitRepository.maxHeight = -1;
        },

        watchDataStore: function () {
            var self = this;

            this.mainDataStore.registeredGitRepositories.watchElements(function () {
                self.setRegisteredGitRepositoriesAsListOptions(self.mainDataStore.registeredGitRepositories);
            });
        },

        setEventHandlers: function () {
            var self = this;

            this.selectRegisteredGitRepository.onChange = function (value) {
                if (this.options[0].value === "") {
                    this.removeOption(this.options[0]);
                }

                self.mainDataStore.selectedRepositorySettings.set("repository", self.mainDataStore.registeredGitRepositories.find(function (element) {
                    return element.key === value;
                }));
            }
        },

        setOptionsList: function () {
            this.selectRegisteredGitRepository.set("options", this.selectListOptions);
            this.selectRegisteredGitRepository.startup();
        },

        createLabelString: function (firstLine, secondLine) {
            return '<span class="rtcGitConnectorSelectListSpan rtcGitConnectorSelectListFirstLine">' + firstLine + '</span>' +
                    '<span class="rtcGitConnectorSelectListSpan rtcGitConnectorSelectListSecondLine">' + secondLine + '</span>';
        },

        setRegisteredGitRepositoriesAsListOptions: function (registeredGitRepositories) {
            if (!registeredGitRepositories.length) {
                this.selectListOptions = [{
                    value: "",
                    label: this.createLabelString("&nbsp;", "No git repositories registered..."),
                    selected: true,
                    disabled: true
                }];
            } else {
                this.selectListOptions = [{
                    value: "",
                    label: this.createLabelString("&nbsp;", "Select a Git Repository..."),
                    selected: true,
                    disabled: true
                }];
                array.forEach(registeredGitRepositories, function (registeredGitRepository) {
                    this.selectListOptions.push({
                        value: registeredGitRepository.key,
                        label: this.createLabelString(registeredGitRepository.name, registeredGitRepository.url)
                    });
                }, this);
            }

            this.mainDataStore.selectedRepositorySettings.set("repository", null);
            this.setOptionsList();
        }
    });
});