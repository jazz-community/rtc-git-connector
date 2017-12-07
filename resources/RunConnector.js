define([
    "dojo/_base/declare",
    "./library/ActionNode"
], function(declare, ActionNode) {
    var cssSelector = "img.button-img";
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.RunConnector",
        com.ibm.team.workitem.web.ui2.internal.action.AbstractAction, {
            constructor: function(params) {
                var nodeLabel = params.actionSpec.label;
                this._buttonNode = new ActionNode(cssSelector, nodeLabel);
            },

            isEnabled: function(params) {
                var workingCopy = params.workingCopy || params;
                return !workingCopy.isChanged() && !workingCopy.isNewWorkItem();
            },

            run: function(params) {
                // create the widget
            }
    });
});