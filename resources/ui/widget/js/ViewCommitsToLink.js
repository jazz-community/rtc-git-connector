define([
    "dojo/_base/declare",
    "dojo/dom-style",
    "./DataStores/MainDataStore",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!../templates/ViewCommitsToLink.html"
], function (declare, domStyle,
    MainDataStore,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.viewCommitsToLink",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
        },

        startup: function () {
            this.watchDataStore();
        },

        watchDataStore: function () {
            var self = this;

            // React when commits are added or removed from the commits to link list
            this.mainDataStore.selectedRepositoryData.commitsToLink.watchElements(function () {
                if (self.mainDataStore.selectedRepositoryData.commitsToLink.length > 0) {
                    // show commits to link list
                    domStyle.set("viewCommitsToLinkContainer", "display", "block");
                } else {
                    // hide commits to link list
                    domStyle.set("viewCommitsToLinkContainer", "display", "none");
                }
            });
        }
    });
});