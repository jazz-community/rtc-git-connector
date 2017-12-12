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
    "dojo/text!../templates/MainLayout.html"
], function (declare, MainDataStore, SelectRegisteredGitRepository, _WidgetBase, _TemplateMixin, _WidgetsInTemplateMixin,
    Dialog, TextBox, Button, template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.mainLayout",
        [_WidgetBase, _TemplateMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,

        constructor: function () {
            this.mainDataStore = new MainDataStore();
        },

        startup: function () {
            // Just for testing...
            this.setOnClickHandlers();
        },

        createDataStore: function (registeredGitRepositories) {
            this.mainDataStore.createRegisteredGitRepositoryStore(registeredGitRepositories);
            this.observeDataStore();
            console.log("create store done");
            console.log("registeredGitRepositoryStore.data", this.mainDataStore.registeredGitRepositoryStore.data);
        },

        observeDataStore: function () {
            var self = this;

            this.mainDataStore.registeredGitRepositoryStore.query().observe(function () {
                console.log("registeredGitRepositoryStore observe: ", self.mainDataStore.registeredGitRepositoryStore);
                console.log("registeredGitRepositoryStore.data", self.mainDataStore.registeredGitRepositoryStore.data);
                // set view store from main data store
            });
        },

        setOnClickHandlers: function () {
            var self = this;

            this.buttonWidget.onClick = function (event) {
                self.createDataStore([{
                    key: "123",
                    name: "Git Commit Picker",
                    url: "https://github.com/jazz-community/rtc-git-commit-picker"
                },
                {
                    key: "456",
                    name: "rtc-secure-user-property-store",
                    url: "https://github.com/jazz-community/rtc-secure-user-property-store"
                },
                {
                    key: "789",
                    name: "rtc-create-child-item-plugin",
                    url: "https://github.com/jazz-community/rtc-create-child-item-plugin"
                }]);

                this.setDisabled(true);
            };

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