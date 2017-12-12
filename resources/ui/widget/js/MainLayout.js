define([
    "dojo/_base/declare",
    "./MainDataStore",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/Dialog",
    "dijit/form/TextBox",
    "dijit/form/Button",
    "dijit/form/Select",
    "dojo/text!../templates/MainLayout.html"
], function (declare, MainDataStore, _WidgetBase, _TemplateMixin, _WidgetsInTemplateMixin,
    Dialog, TextBox, Button, Select, template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.mainLayout",
        [_WidgetBase, _TemplateMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,

        constructor: function () {
            this.mainDataStore = new MainDataStore();
        },

        startup: function () {
            var self = this;

            this.selectRegisteredGitRepository.maxHeight = -1;
            this.selectRegisteredGitRepository.onChange = function (value) {
                if (this.options[0].value === "") {
                    this.removeOption(this.options[0]);
                }

                self.mainDataStore.registeredGitRepositoryStore.put({ key: value });

                console.log("onChange value: ", value);
                console.log("onChange this: ", this);
                console.log("registeredGitRepositoryStore: ", self.mainDataStore.registeredGitRepositoryStore);
            }

            this.observeDataStore();

            // Just for testing...
            this.buttonWidget.setDisabled(true);
            this.setOnClickHandlers();
        },

        observeDataStore: function () {
            var self = this;

            this.mainDataStore.registeredGitRepositoryStore.query({}).observe(function () {
                console.log("registeredGitRepositoryStore observe: ", self.mainDataStore.registeredGitRepositoryStore);
                // set view store from main data store
            });
        },

        setOnClickHandlers: function () {
            var self = this;

            this.showDialogButton.onClick = function (event) {
                self.myDialog.show();
            };

            this.submitDialogButton.onClick = function (event) {
                self.myDialog.hide();
            };

            this.cancelDialogButton.onClick = function (event) {
                self.myDialog.hide();
            };
        }
    });
});