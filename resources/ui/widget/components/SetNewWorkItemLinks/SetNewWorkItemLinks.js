define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "../../services/MainDataStore",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./SetNewWorkItemLinks.html",
    "jazz/css!./SetNewWorkItemLinks.css"
], function (declare, lang,
    MainDataStore,
    _WidgetBase, _TemplatedMixin,
    template) {
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
            // create the presentation and add it to the view
            this.linksContainer.innerHTML = "Links Presentation";
        }
    });
});