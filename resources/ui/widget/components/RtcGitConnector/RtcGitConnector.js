define([
    "dojo/_base/declare",
    "dojo/dom",
    "dojo/dom-style",
    "../MainLayout/MainLayout",
    "../../services/MainDataStore",
    "../../services/JazzRestService",
    "../../services/GitRestService",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/registry",
    "dijit/Dialog",
    "dojo/text!./RtcGitConnector.html",
    "dojo/domReady!",
    "jazz.ui.Dialog"
], function (
    declare,
    dom,
    domStyle,
    MainLayout,
    MainDataStore,
    JazzRestService,
    GitRestService,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    registry,
    Dialog,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        mainDataStore: null,
        jazzRestService: null,
        mainDialog: null,

        // Set the work item and project area properties in the
        // data store so that other classes can access them.
        // Important: wrap all constructor parameters in an object
        // to prevent the creation of the widget from failing at the
        // lifecycle event that mixes the parameters into the widget instance.
        constructor: function (params) {
            this.mainDataStore = MainDataStore.getInstance();
            this.jazzRestService = JazzRestService.getInstance();
            this.mainDataStore.newWorkItemMode = params.workItem.isNewWorkItem();
            this.mainDataStore.workItem = params.workItem;
            this.mainDataStore.projectArea = params.workItem.object.attributes.projectArea;
        },

        startup: function () {
            this.mainDataStore.hasHiddenChanges = this.jazzRestService.moveOldLinksToNewLinkTypes(
                this.mainDataStore.workItem
            );

            // Show the error dialog in Internet Explorer (better than nothing happening)
            if (this.isInternetExplorer()) {
                this.mainErrorDialog.startup();
                this.mainErrorDialog.show();
            } else {
                // Change the popup title in new work item mode
                var title = this.mainDataStore.newWorkItemMode
                    ? "Create Work Items from Git Issues"
                    : "Connect with Git";
                var mainLayout = new MainLayout();
                this.mainDialog = new jazz.ui.Dialog({
                    heading: title,
                    contentNode: mainLayout.domNode,
                    id: "connectWithGitMainDialog"
                });
            }

            this.setEventHandlers();
        },

        setEventHandlers: function () {
            var self = this;

            // Clean up the dom and custom class instances when the widget is closed.
            // This is especially important for making the widget work when opened
            // and closed multiple times.
            this.mainDialog.onClose = function () {
                // Destroy all dialogs and remove them from the dom
                self.destroyWidgetById("getAndSaveAccessTokenDialog");
                self.destroyWidgetById("browserIsInternetExplorerContainer");
                this.destroyRecursive(false);

                // Destroy data store and services
                self.destroyWidgetInstance();
            };

            // Clean up for the error dialog
            this.mainErrorDialog.onHide = function () {
                self.destroyWidgetById("getAndSaveAccessTokenDialog");
                self.destroyWidgetById("connectWithGitMainDialog");
                this.destroyRecursive(false);

                self.destroyWidgetInstance();
            };
        },

        // These custom singleton instances need to be manually destroyed.
        // If the widget is opened again it will then get new instances,
        // which is the intended behavior.
        destroyWidgetInstance: function () {
            MainDataStore.destroyInstance();
            JazzRestService.destroyInstance();
            GitRestService.destroyInstance();
        },

        // Finds a widget by it's HTML id and destroys it,
        // also removing it from the dom.
        destroyWidgetById: function (domId) {
            var widgetToDestroy = registry.byId(domId);

            if (widgetToDestroy) {
                widgetToDestroy.destroyRecursive(false);
            }
        },

        // Check if the current browser is Internet Explorer
        isInternetExplorer: function () {
            var ms_ie = false;
            var ua = window.navigator.userAgent;
            var old_ie = ua.indexOf("MSIE ");
            var new_ie = ua.indexOf("Trident/");

            if (old_ie > -1 || new_ie > -1) {
                ms_ie = true;
            }

            return ms_ie;
        }
    });
});
