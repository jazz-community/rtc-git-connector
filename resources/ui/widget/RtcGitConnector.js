define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./templates/RtcGitConnector.html",
    "dijit/Dialog"
], function(declare, _WidgetBase, _TemplateMixin, template) {
    return declare([_WidgetBase, _TemplateMixin], {
        templateString: template,

        constructor: function(params) {
            this.workItem = params;
            mainDialog.show();
            console.log("templateString: ", this.templateString);
        }
    });
});