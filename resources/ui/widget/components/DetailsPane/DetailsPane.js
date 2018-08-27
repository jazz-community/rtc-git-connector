define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./DetailsPane.html"
], function (declare,
    _WidgetBase, _TemplatedMixin,
    template) {
    return declare(null,
        [_WidgetBase, _TemplatedMixin,],
    {
        templateString: template,

        constructor: function () {
        },

        startup: function () {
        }
    });
});