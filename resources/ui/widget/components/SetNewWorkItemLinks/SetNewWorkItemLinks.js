define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "../../services/MainDataStore",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./SetNewWorkItemLinks.html",
    "jazz/css!./SetNewWorkItemLinks.css",
    "com.ibm.team.rtc.foundation.web.ui.views.controller.ActionDropdown"
], function (declare, domConstruct,
    MainDataStore,
    _WidgetBase, _TemplatedMixin,
    template) {
    var ActionDropdown = com.ibm.team.rtc.foundation.web.ui.views.controller.ActionDropdown;

    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.setNewWorkItemLinks",
        [_WidgetBase, _TemplatedMixin,],
    {
        templateString: template,
        mainDataStore: null,
        hasPresentation: false,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
        },

        // Only create the presentation once the show method is called
        show: function () {
            if (!this.hasPresentation) {
                this.hasPresentation = true;
                this.createPresentation();
            }
        },

        createPresentation: function () {
            var actionsMenuDiv = domConstruct.create("div", null, this.linksContainer);
            var actionsMenu = ActionDropdown.create({}, actionsMenuDiv);
        }
    });
});