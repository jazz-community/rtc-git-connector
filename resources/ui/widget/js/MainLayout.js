define([
    "dojo/_base/declare",
    "./MainDataStore",
    "./SelectRegisteredGitRepository",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/Dialog",
    "dijit/form/TextBox",
    "dijit/form/Button",
    "dijit/form/Select",
    "dojo/text!../templates/MainLayout.html"
], function (declare, MainDataStore, SelectRegisteredGitRepository, _WidgetBase, _TemplateMixin, _WidgetsInTemplateMixin,
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