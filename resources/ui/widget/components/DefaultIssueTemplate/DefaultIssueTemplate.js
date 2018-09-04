define([
    "dojo/_base/declare",
    "dojo/text!./DefaultIssueTemplate.handlebars"
], function (declare, template) {
    return declare(null, {
        templateString: template,

        getTemplateString: function () {
            return this.templateString;
        }
    });
});