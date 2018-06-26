define([
    "dojo/_base/declare",
    "dojo/text!../../templates/HandlebarsTemplates/DefaultIssueTemplate.handlebars"
], function (declare, template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.defaultIssueTemplate", null, {
        templateString: template,

        constructor: function () {
            console.log("test from default issue template");
        },

        outputTemplateString: function () {
            console.log("templateString: ", this.templateString);
        }
    });
});