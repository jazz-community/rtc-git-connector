define([
    "dojo/_base/declare",
    "dojo/dom-style",
    "../../services/MainDataStore",
    "../SetNewWorkItemAttributes/SetNewWorkItemAttributes",
    "../SetNewWorkItemLinks/SetNewWorkItemLinks",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./SetNewWorkItemValues.html",
    "jazz/css!./SetNewWorkItemValues.css"
], function (declare, domStyle,
    MainDataStore,
    SetNewWorkItemAttributes, SetNewWorkItemLinks,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.setNewWorkItemValues",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,

        visible: false,
        _setVisibleAttr: function (visible) {
            domStyle.set(this.domNode, "display", visible ? "block" : "none");
            this._set("visible", visible);
        },

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
        },

        startup: function () {
            if (this.mainDataStore.newWorkItemMode) {
                this.watchDataStore();
            }
        },

        watchDataStore: function () {
            var self = this;

            // Only show the attributes when the list of selected issues isn't empty
            this.mainDataStore.selectedRepositoryData.issuesToLink.watchElements(function () {
                var hasItems = self.mainDataStore.selectedRepositoryData.issuesToLink.length > 0;
                self.set("visible", hasItems);

                if (hasItems) {
                    self.setNewWorkItemAttributes.show();
                    self.setNewWorkItemLinks.show();
                }
            });
        }
    });
});