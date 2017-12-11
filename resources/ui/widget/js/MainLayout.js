define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/form/Button",
    "dojo/text!../templates/MainLayout.html"
], function (declare, _AbstractActionWidget, _TemplateMixin, _WidgetsInTemplateMixin, Dialog, template) {
    return declare([_AbstractActionWidget, _TemplateMixin, _WidgetsInTemplateMixin], {
        templateString: template,

        constructor: function () {
        },

        startup: function () {
            this.buttonWidget.setDisabled(true);
            console.log("buttonWidget: ", this.buttonWidget);
        }
    });
});