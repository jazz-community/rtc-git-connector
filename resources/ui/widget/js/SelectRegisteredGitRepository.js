define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/form/Select",
    "dojo/text!../templates/SelectRegisteredGitRepository.html"
], function (declare, array, _WidgetBase, _TemplateMixin, _WidgetsInTemplateMixin, Select, template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.selectRegisteredGitRepository",
        [_WidgetBase, _TemplateMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        selectListOptions: null,

        constructor: function () {
            this.selectListOptions = [{
                value: "",
                label: this.createLabelString("&nbsp;", "Loading..."),
                selected: true,
                disabled: true
            }];
        },

        postCreate: function () {
            this.initializeSelectList();
        },

        initializeSelectList: function () {
            this.setOptionsList();
            this.selectRegisteredGitRepository.maxHeight = -1;
            this.selectRegisteredGitRepository.onChange = function (value) {
                if (this.options[0].value === "") {
                    this.removeOption(this.options[0]);
                }
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
            this.setOptionsList();
        }
    });
});