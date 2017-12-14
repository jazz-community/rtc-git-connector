define([
    "dojo/_base/declare",
    "dojo/dom",
    "dojo/dom-style",
    "./js/MainLayout",
    "./js/MainDataStore",
    "./js/JazzRestService",
    "./_AbstractActionWidget",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/registry",
    "dijit/Dialog",
    "dojo/text!./templates/RtcGitConnector.html"
], function (declare, dom, domStyle,
    MainLayout, MainDataStore, JazzRestService,
    _AbstractActionWidget, _TemplatedMixin, _WidgetsInTemplateMixin,
    registry, Dialog, template) {
    return declare([_AbstractActionWidget, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        mainDataStore: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
            this.mainDataStore.workItem = this.workItem;
            this.mainDataStore.projectArea = this.workItem.object.attributes.projectArea;
        },

        startup: function () {
            this.setEventHandlers();
            this.mainDialog.startup();
            this.mainDialog.show();
        },

        setEventHandlers: function () {
            var self = this;

            this.mainDialog.onHide = function () {
                this.destroyWidgetInstance();
            };
        },

        destroyWidgetInstance: function () {
            // Destroy all dialogs and remove them from the dom
            self.destroyWidgetById("mainLayoutMyDialog");
            this.destroyRecursive(false);

            // Destroy the data store and services
            MainDataStore.destroyInstance();
            JazzRestService.destroyInstance();
        },

        destroyWidgetById: function (domId) {
            var widgetToDestroy = registry.byId(domId);

            if (widgetToDestroy) {
                widgetToDestroy.destroyRecursive(false);
            }
        }
    });
});