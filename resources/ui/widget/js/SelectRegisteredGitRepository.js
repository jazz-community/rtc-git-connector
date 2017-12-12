define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/form/Select",
    "dojo/text!../templates/SelectRegisteredGitRepository.html"
], function (declare, _WidgetBase, _TemplateMixin, _WidgetsInTemplateMixin, Select, template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.selectRegisteredGitRepository",
        [_WidgetBase, _TemplateMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,

        constructor: function () {
        },

        postCreate: function () {
            this.initializeSelectList();
        },

        initializeSelectList: function () {
            this.selectRegisteredGitRepository.maxHeight = -1;
            this.selectRegisteredGitRepository.onChange = function (value) {
                if (this.options[0].value === "") {
                    this.removeOption(this.options[0]);
                }
            }
        }
    });
});