define([
    "dojo/_base/declare",
    "./_AbstractActionWidget",
    "dijit/_TemplatedMixin",
    "dijit/Dialog",
    "dojo/text!./templates/RtcGitConnector.html"
], function (declare, _AbstractActionWidget, _TemplateMixin, Dialog, template) {
    return declare([_AbstractActionWidget, _TemplateMixin], {
        templateString: template,

        constructor: function () {
            console.log("constructor templateString: ", this.templateString);
        },

        startup: function () {
            this.showDialog();
        },

        showDialog: function () {
            console.log("show templateString: ", this.templateString);

            this.mainDialog = new Dialog({
                title: "Test Dialog",
                content: this.templateString,
                onCancel: function() {
                    this.destroyRecursive(false);
                }
            });
            this.mainDialog.startup();
            this.mainDialog.show();
        }
    });
});