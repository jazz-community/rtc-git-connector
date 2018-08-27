define([
    "dojo/_base/declare",
    "dojo/request/script",
    "dijit/focus",
    "./widget/components/RtcGitConnector/RtcGitConnector",
    "../library/ActionNode",
    "../library/HoverViewWrapper"
], function(declare, script, focus, RtcGitConnector, ActionNode, HoverViewWrapper) {
    var cssSelector = "img.button-img";
    script.get(net.jazz.ajax._contextRoot + net.jazz.ajax._webuiPrefix + "com.siemens.bt.jazz.workitemeditor.rtcGitConnector/dist/modules-bundle.js");
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.RunConnector",
        com.ibm.team.workitem.web.ui2.internal.action.AbstractAction,
    {
        // summary:
        //  Default constructor called when the WorkItemEditor is instantiated.
        //  For in-depth information on the creation procedure, see
        //  WorkItemEditorHeader.js, where all actions are created.
        //
        // params: {actionSpec, workingCopy}
        //  actionSpec corresponds to the action values defined in plugin.xml.
        //  workingCopy is a reference to the current work item being edited:
        //  {
        //      actionSpec: {
        //          action,
        //          iconContext,
        //          iconUri,
        //          id,
        //          label,
        //          parameter
        //      },
        //      workingCopy: {}
        //  }
        constructor: function (params) {
            var nodeLabel = params.actionSpec.label;
            this._buttonNode = new ActionNode(cssSelector, nodeLabel);
        },

        // Disable the widget button if the work item is new or has unsaved changes
        isEnabled: function (params) {
            var workingCopy = params.workingCopy || params;
            return !workingCopy.isChanged() && !workingCopy.isNewWorkItem();
        },

        //  summary:
        //      Is run when the action button in the WorkItemEditor view is clicked.
        //  params: {actionSpec, workingCopy}
        //      Same as the params passed to the constructor.
        run: function (params) {
            var widget = this.makeWidget(params);
            var hoverViewWrapper = new HoverViewWrapper(this._buttonNode.getPosition(), widget);
            focus.focus(hoverViewWrapper.getDomNode());
        },

        makeWidget: function (params) {
            var minWidth = this._buttonNode.calculateMinWidth();
            var workingCopy = params.workingCopy || params;
            return new RtcGitConnector(minWidth, workingCopy);
        }
    });
});