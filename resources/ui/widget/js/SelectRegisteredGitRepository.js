define([
    "dojo/_base/declare",
    "dojo/store/Memory",
    "dojo/store/Observable",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/form/Select",
    "dojo/text!../templates/SelectRegisteredGitRepository.html"
], function (declare, Memory, Observable, _WidgetBase, _TemplateMixin, _WidgetsInTemplateMixin, Select, template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.selectRegisteredGitRepository",
        [_WidgetBase, _TemplateMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        viewDataStore: null,

        constructor: function () {
            this.viewDataStore = new Observable(new Memory({ idProperty: "value" }));
        },

        postCreate: function () {
            this.initializeSelectList();
            this.observeViewDataStore();
        },

        initializeSelectList: function () {
            this.selectRegisteredGitRepository.maxHeight = -1;
            this.selectRegisteredGitRepository.onChange = function (value) {
                if (this.options[0].value === "") {
                    this.removeOption(this.options[0]);
                }
            }
        },

        observeViewDataStore: function () {
            var self = this;

            this.viewDataStore.query({}).observe(function () {
                console.log("viewDataStore observe: ", self.viewDataStore);
                // set select list from view store (or this could happen automatically?)
            });
        }
    });
});