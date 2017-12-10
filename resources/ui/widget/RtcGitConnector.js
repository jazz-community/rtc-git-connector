define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin"
], function(declare, _WidgetBase, _TemplateMixin) {
    return declare([_WidgetBase, _TemplateMixin], {
        constructor: function(params) {
            this.workItem = params;

            console.log("constructor params: ", params);
            alert("Test from constructor");
        }
    });
});