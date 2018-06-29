define([
    "dojo/_base/declare"
], function (declare) {
    return declare(null, {
        handlebars: null,
        turndownService: null,

        constructor: function () {
            this.handlebars = com_siemens_bt_jazz_rtcgitconnector_modules.Handlebars;
            this.turndownService = new com_siemens_bt_jazz_rtcgitconnector_modules.TurndownService();

            // Get rid of this and use the option {escapeMarkdown: false}
            // as soon as it's available in a turndown release
            this.turndownService.escape = function (input) {
                return input;
            };

            this.registerHtmlToMarkdownHelper();
        },

        renderTemplateWithWorkItem: function (templateString, workItem) {
            var template = this.handlebars.compile(templateString);
            return template(workItem.object);
        },

        registerHtmlToMarkdownHelper: function () {
            var self = this;

            this.handlebars.registerHelper('turndown', function (inputString) {
                return inputString ? self.turndownService.turndown(inputString.replace(/&nbsp;/g, ' ')) : '';
            });
        }
    });
});