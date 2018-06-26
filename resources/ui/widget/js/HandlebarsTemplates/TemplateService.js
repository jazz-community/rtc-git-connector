define([
    "dojo/_base/declare"
], function (declare) {
    return declare(null, {
        constructor: function () {
            console.log("test from the template service");
        },

        renderTemplateFromString: function (templateString) {
            return templateString;
        }
    });
});