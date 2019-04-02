define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/string",
    "../../services/MainDataStore",
    "dijit/MenuItem",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./SetNewWorkItemLinks.html",
    "jazz/css!./SetNewWorkItemLinks.css",
    "com.ibm.jdojox.util.ArrayList",
    "com.ibm.team.rtc.foundation.web.model.Bindable",
    "com.ibm.team.rtc.foundation.web.model.BindableList",
    "com.ibm.team.rtc.foundation.web.ui.util.Sprites",
    "com.ibm.team.rtc.foundation.web.ui.views.controller.ActionDropdown",
    "com.ibm.team.workitem.web.model.links.WorkItemEndpoints",
    "com.ibm.team.workitem.web.ui.internal.view.editor.presentations.nonattribute.links.LinksDialogLauncher"
], function (declare, lang, domConstruct, string,
    MainDataStore,
    MenuItem,
    _WidgetBase, _TemplatedMixin,
    template) {
    var ArrayList = com.ibm.jdojox.util.ArrayList;
    var Bindable = com.ibm.team.rtc.foundation.web.model.Bindable;
    var BindableList = com.ibm.team.rtc.foundation.web.model.BindableList;
    var Sprites = com.ibm.team.rtc.foundation.web.ui.util.Sprites;
    var ActionDropdown = com.ibm.team.rtc.foundation.web.ui.views.controller.ActionDropdown;
    var WorkItemEndpoints = com.ibm.team.workitem.web.model.links.WorkItemEndpoints;
    var LinksDialogLauncher = com.ibm.team.workitem.web.ui.internal.view.editor.presentations.nonattribute.links.LinksDialogLauncher;

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
            var workingCopy = this.mainDataStore.workItem.getWorkingCopy();
            var workItemReferences = workingCopy.getWorkItemReferences();
            var parentEndpoint = WorkItemEndpoints.PARENT_WORK_ITEM;
            var endpointList = new BindableList();
            var defaultEndpoint = new Bindable();
            var endpointArrayList = new ArrayList();

            endpointArrayList.add(parentEndpoint);
            endpointList.add(endpointArrayList);
            defaultEndpoint.setValue(parentEndpoint);

            var actionsMenuDiv = domConstruct.create("div", null, this.linksContainer);
            var actionsMenu = ActionDropdown.create({}, actionsMenuDiv);

            actionsMenu.renderer(lang.hitch(this, function(endPoint) {
                return new MenuItem({
                    label: this._getEndpointLabel(endPoint),
                    iconClass: Sprites.cssClassName(endPoint.getIcon())
                });
            })).values(endpointList).defaultValue(defaultEndpoint).bind();

            actionsMenu.valueChosen.addListener(lang.hitch(this, function(chosenDescriptor) {
                this._launchDialog(workingCopy, workItemReferences, chosenDescriptor);
            }));
        },

        _getEndpointLabel: function(endPoint) {
            return string.substitute(endPoint.isSingleValued() ? "Set ${0}" : "Add ${0}", [endPoint.getDisplayName()]);
        },

        _launchDialog: function(workItem, workItemReferences, chosenDescriptor) {
            LinksDialogLauncher.launchDialog(workItem, chosenDescriptor, function(endPoint) {
                var references = Array.prototype.slice.call(arguments, 1);

                if (endPoint.isSingleValued() && workItemReferences.hasReferences(endPoint)) {
                    workItemReferences.remove(endPoint, workItemReferences.getReferences(endPoint).at(0));
                }

                workItemReferences.add.apply(workItemReferences, [endPoint].concat(references));
            });
        }
    });
});