define([
    "dojo/_base/declare",
    "dojo/dom",
    "dojo/dom-style",
    "./js/MainLayout",
    "./_AbstractActionWidget",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/Dialog",
    "dojo/text!./templates/RtcGitConnector.html"
], function (declare, dom, domStyle, MainLayout, _AbstractActionWidget, _TemplateMixin, _WidgetsInTemplateMixin, Dialog, template) {
    return declare([_AbstractActionWidget, _TemplateMixin, _WidgetsInTemplateMixin], {
        templateString: template,

        constructor: function () {
        },

        startup: function () {
            this.mainDialog.startup();
            this.mainDialog.show();
        }
    });
});