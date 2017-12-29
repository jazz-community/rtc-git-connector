define([
    "dojo/_base/declare",
    "dojo/dom-class",
    "dojo/on",
    "dojo/query",
    "./MainDataStore",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!../templates/SelectLinkType.html"
], function (declare, domClass, on, query,
    MainDataStore,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.selectLinkType",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
        },

        startup: function () {
            this.setEventHandlers();
        },

        setEventHandlers: function () {
            var self = this;

            query(".rtcGitConnectorSelectLinkType").on(".linkTypeItem:click", function (event) {
                self.setSelectedLinkType(event.target.getAttribute("data-link-type"));
            });
        },

        setSelectedLinkType: function (linkType) {
            query(".rtcGitConnectorSelectLinkType .linkTypeItem").forEach(function (node) {
                if (node.getAttribute("data-link-type") === linkType) {
                    domClass.add(node, "selected");
                } else {
                    domClass.remove(node, "selected");
                }
            });
        }
    });
});