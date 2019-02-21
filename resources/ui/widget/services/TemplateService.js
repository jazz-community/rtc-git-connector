define([
    "dojo/_base/declare"
], function (declare) {
    return declare(null, {
        handlebars: null,
        turndownService: null,

        constructor: function () {
            this.handlebars = com_siemens_bt_jazz_rtcgitconnector_modules.Handlebars;
            this.handlebarsHelpers = com_siemens_bt_jazz_rtcgitconnector_modules.HandlebarsHelpers;
            this.turndownService = new com_siemens_bt_jazz_rtcgitconnector_modules.TurndownService();

            this._doNotEscapeMarkdown();
            this._registerHtmlToMarkdownHelper();
            this._registerHandlebarsHelpers();
        },

        renderTemplateWithWorkItem: function (templateString, workItem) {
            var template = this.handlebars.compile(templateString);
            return template(workItem.object);
        },

        _doNotEscapeMarkdown: function () {
            // Override the escape method so that markdown is not escaped
            // when converting HTML to Markdown
            this.turndownService.escape = function (input) {
                return input;
            };
        },

        _registerHtmlToMarkdownHelper: function () {
            var self = this;

            this.handlebars.registerHelper('turndown', function (inputString) {
                // Convert HTML to Markdown. First replace non-breaking spaces with normal ones.
                // The HTML editor in Jazz creates non-breaking spaces when there are multiple spaces in a row.
                // For the Markdown formatting to work correctly, these need to be normal spaces.
                return inputString ? self.turndownService.turndown(inputString.replace(/&nbsp;/g, ' ')) : '';
            });
        },

        _registerHandlebarsHelpers: function () {
            // Register all helpers imported from the handlebars-helpers package
            this.handlebars.registerHelper(this.handlebarsHelpers());
        }
    });
});