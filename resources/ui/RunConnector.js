define([
    "dojo/_base/declare",
    "./widget/RtcGitConnector"
], function(declare, RtcGitConnector) {
    var cssSelector = "img.button-img";
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.RunConnector",
        com.ibm.team.workitem.web.ui2.internal.action.AbstractAction, {
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
            constructor: function(params) {
            },

            isEnabled: function(params) {
                var workingCopy = params.workingCopy || params;
                return !workingCopy.isChanged() && !workingCopy.isNewWorkItem();
            },

            //  summary:
            //      Is run when the action button in the WorkItemEditor view is clicked.
            //  params: {actionSpec, workingCopy}
            //      Same as the params passed to the constructor.
            run: function(params) {
                var workingCopy = params.workingCopy || params;
                new RtcGitConnector(workingCopy);
            }
    });
});