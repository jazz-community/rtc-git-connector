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
            this.watchDataStore();

            // Just for testing...
            this.setOnClickHandlers();
        },

        watchDataStore: function () {
            var self = this;

            this.mainDataStore.registeredGitRepositories.watchElements(function () {
                console.log("watch registeredGitRepositories event");
                console.log("registeredGitRepositories: ", self.mainDataStore.registeredGitRepositories);
                // update view data
            });
        },

        setOnClickHandlers: function () {
            var self = this;

            var repositoriesFromSomewhere = [{
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
            }];

            this.buttonWidget.onClick = function (event) {
                self.mainDataStore.registeredGitRepositories.push.apply(self.mainDataStore.registeredGitRepositories, repositoriesFromSomewhere);

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