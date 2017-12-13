define([
    "dojo/_base/declare",
    "dojo/dom",
    "dojo/dom-style",
    "dojo/topic",
    "./js/MainLayout",
    "./_AbstractActionWidget",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/registry",
    "dijit/Dialog",
    "dojo/text!./templates/RtcGitConnector.html"
], function (declare, dom, domStyle, topic,
    MainLayout,
    _AbstractActionWidget, _TemplatedMixin, _WidgetsInTemplateMixin,
    registry, Dialog, template) {
    return declare([_AbstractActionWidget, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,

        constructor: function () {
        },

        startup: function () {
            this.setEventHandlers();
            this.mainDialog.startup();
            this.mainDialog.show();
            topic.publish("rtcGitConnector/workItem", this.workItem);
        },

        setEventHandlers: function () {
            var self = this;

            this.mainDialog.onHide = function () {
                // Destroy all dialogs and remove them from the dom
                self.destroyWidgetById("mainLayoutMyDialog");
                this.destroyRecursive(false);
            };
        },

        destroyWidgetById: function (domId) {
            var widgetToDestroy = registry.byId(domId);

            if (widgetToDestroy) {
                widgetToDestroy.destroyRecursive(false);
            }
        }
    });
});