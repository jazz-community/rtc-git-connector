define([
    "dojo/_base/declare",
    "dojo/text!../../templates/HandlebarsTemplates/DefaultIssueTemplate.handlebars"
], function (declare, template) {
    return declare(null, {
        templateString: template,

        constructor: function () {
            console.log("test from default issue template");
        },

        getTemplateString: function () {
            return this.templateString;
        }
    });
});