define([
    "dojo/_base/declare",
    "dojo/text!../../templates/HandlebarsTemplates/DefaultIssueTemplate.handlebars"
], function (declare, template) {
    return declare(null, {
        templateString: template,

        getTemplateString: function () {
            return this.templateString;
        }
    });
});