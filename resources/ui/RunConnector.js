define([
    "dojo/_base/declare",
    "dojo/request/script",
    "./widget/components/RtcGitConnector/RtcGitConnector"
], function(declare, script, RtcGitConnector) {
    window.autoOpenRtcGitConnector = function () {
        console.log("window.autoOpenRtcGitConnector is not set");
    };
    script.get(net.jazz.ajax._contextRoot + net.jazz.ajax._webuiPrefix +
        "com.siemens.bt.jazz.workitemeditor.rtcGitConnector/dist/modules-bundle.js")
    .then(function () {
        window.autoOpenRtcGitConnector();
    });
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
            var self = this;
            window.autoOpenRtcGitConnector = function () {
                self.autoOpen();
            };
            this.autoOpen();
        },

        // Disable the widget button if the work item has unsaved changes
        isEnabled: function (params) {
            var workingCopy = params.workingCopy || params;
            return !workingCopy.isChanged();
        },

        //  summary:
        //      Is run when the action button in the WorkItemEditor view is clicked.
        //  params: {actionSpec, workingCopy}
        //      Same as the params passed to the constructor.
        run: function () {
            var rtcGitConnector = new RtcGitConnector({ workItem: this.workingCopy });
            rtcGitConnector.startup();
        },

        // Open the widget if the auto open parameter is set and the modules bundle is loaded.
        autoOpen: function () {
            if (typeof com_siemens_bt_jazz_rtcgitconnector_modules !== 'undefined' &&
                window.location.hash.indexOf("&autoOpenRtcGitConnector=true") > -1) {
                window.history.replaceState(
                    undefined,
                    undefined,
                    window.location.hash.replace('&autoOpenRtcGitConnector=true', '')
                );
                this.run();
            }
        }
    });
});