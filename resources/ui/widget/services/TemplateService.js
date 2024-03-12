define([
    "dojo/_base/declare",
    "com.siemens.bt.jazz.workitemeditor.rtcGitConnector|dist|Handlebars.js",
    "com.siemens.bt.jazz.workitemeditor.rtcGitConnector|dist|JustHandlebarsHelpers.js",
    "com.siemens.bt.jazz.workitemeditor.rtcGitConnector|dist|TurndownService.js"
], function (declare, Handlebars, JustHandlebarsHelpers, TurndownService) {
    // This syntax is used to get around the Jazz JavaScript parser
    var TurndownService = TurndownService["default"];
    return declare(null, {
        constructor: function () {
            var turndownService = new TurndownService();

            this._doNotEscapeMarkdown(turndownService);
            this._registerHtmlToMarkdownHelper(turndownService);
            this._registerJustHandlebarsHelpers();
        },

        renderTemplateWithWorkItem: function (templateString, workItem) {
            var template = Handlebars.compile(templateString);
            return template(workItem.object);
        },

        _doNotEscapeMarkdown: function (turndownService) {
            // Override the escape method so that markdown is not escaped
            // when converting HTML to Markdown
            turndownService.escape = function (input) {
                return input;
            };
        },

        _registerHtmlToMarkdownHelper: function (turndownService) {
            Handlebars.registerHelper("turndown", function (inputString) {
                // Convert HTML to Markdown. First replace non-breaking spaces with normal ones.
                // The HTML editor in Jazz creates non-breaking spaces when there are multiple spaces in a row.
                // For the Markdown formatting to work correctly, these need to be normal spaces.
                return inputString ? turndownService.turndown(inputString.replace(/&nbsp;/g, " ")) : "";
            });
        },

        _registerJustHandlebarsHelpers: function () {
            // Register all the helpers in the just-handlebars-helpers package
            JustHandlebarsHelpers.registerHelpers(Handlebars);
        }
    });
});
