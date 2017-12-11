define([
    "dojo/_base/declare",
    "dojo/dom",
    "dojo/dom-style",
    "./js/MainLayout",
    "./_AbstractActionWidget",
    "dijit/_TemplatedMixin",
    "dijit/Dialog",
    "dojo/text!./templates/RtcGitConnector.html"
], function (declare, dom, domStyle, MainLayout, _AbstractActionWidget, _TemplateMixin, Dialog, template) {
    return declare([_AbstractActionWidget, _TemplateMixin], {
        templateString: template,

        constructor: function () {
        },

        startup: function () {
            this.showDialog();
        },

        showDialog: function () {
            this.mainDialog = new Dialog({
                title: "Connect with Git",
                content: this.templateString,
                style: "background-color: white;"
            });
            this.mainDialog.startup();

            var rtcGitConnectorDialog = dom.byId("rtcGitConnectorDialog");
            var mainLayout = new MainLayout().placeAt(rtcGitConnectorDialog);
            domStyle.set(rtcGitConnectorDialog, "display", "");

            this.mainDialog.show();
        }
    });
});