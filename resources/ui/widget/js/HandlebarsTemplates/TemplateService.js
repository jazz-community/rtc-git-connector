define([
    "dojo/_base/declare"
], function (declare) {
    return declare(null, {
        handlebars: null,
        turndownService: null,

        constructor: function () {
            this.handlebars = com_siemens_bt_jazz_rtcgitconnector_modules.Handlebars;
            this.turndownService = new com_siemens_bt_jazz_rtcgitconnector_modules.TurndownService();

            this.registerHtmlToMarkdownHelper();
        },

        renderTemplateWithWorkItem: function (templateString, workItem) {
            var template = this.handlebars.compile(templateString);
            return template(workItem.object.attributes);
        },

        registerHtmlToMarkdownHelper: function () {
            var self = this;

            this.handlebars.registerHelper('turndown', function (inputString) {
                console.log("inputString: ", inputString);
                var output = inputString ? self.turndownService.turndown(inputString) : "";
                console.log("output: ", output);
                return output;
            });
        }
    });
});