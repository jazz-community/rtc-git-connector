define(["dojo/_base/declare", "../../../dist/Handlebars"], function (declare, Handlebars) {
    return declare(null, {
        turndownService: null,

        constructor: function () {
            this.justHandlebarsHelpers = com_siemens_bt_jazz_rtcgitconnector_modules.JustHandlebarsHelpers;
            this.turndownService = new com_siemens_bt_jazz_rtcgitconnector_modules.TurndownService();

            this._doNotEscapeMarkdown();
            this._registerHtmlToMarkdownHelper();
            this._registerJustHandlebarsHelpers();
        },

        renderTemplateWithWorkItem: function (templateString, workItem) {
            var template = Handlebars.compile(templateString);
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

            Handlebars.registerHelper("turndown", function (inputString) {
                // Convert HTML to Markdown. First replace non-breaking spaces with normal ones.
                // The HTML editor in Jazz creates non-breaking spaces when there are multiple spaces in a row.
                // For the Markdown formatting to work correctly, these need to be normal spaces.
                return inputString ? self.turndownService.turndown(inputString.replace(/&nbsp;/g, " ")) : "";
            });
        },

        _registerJustHandlebarsHelpers: function () {
            // Register all the helpers in the just-handlebars-helpers package
            this.justHandlebarsHelpers.registerHelpers(Handlebars);
        }
    });
});
