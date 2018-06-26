define([
    "dojo/_base/declare"
], function (declare) {
    return declare(null, {
        handlebars: null,

        constructor: function () {
            this.handlebars = com_siemens_bt_jazz_rtcgitconnector_modules.Handlebars;
        },

        renderTemplateWithWorkItem: function (templateString, workItem) {
            var template = this.handlebars.compile(templateString);
            return template(workItem.object.attributes);
        }
    });
});