define([
    "dojo/_base/declare",
    "dojo/dom",
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
], function (declare, dom,
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
            this.setEventHandlers();
            this.watchDataStore();
        },

        watchDataStore: function () {
            this.mainDataStore.selectedRepositorySettings.watch("repository", function (name, oldValue, value) {
                dom.byId("selectedRegisteredGitRepositoryContainer").innerHTML = value
                    ? value.name || value
                    : "No git repository selected";
            });
        },

        setEventHandlers: function () {
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

            repositoriesFromSomewhere.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });

            this.buttonWidget.onClick = (function (event) {
                var toggle = true;

                return function (event) {

                    if (toggle) {
                        self.mainDataStore.registeredGitRepositories.push.apply(self.mainDataStore.registeredGitRepositories, repositoriesFromSomewhere);
                    } else {
                        self.mainDataStore.registeredGitRepositories.splice(0, self.mainDataStore.registeredGitRepositories.length);
                    }

                    toggle = !toggle;
                };
            })();

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