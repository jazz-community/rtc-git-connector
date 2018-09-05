define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./NewWorkItemList.html",
    "jazz/css!./NewWorkItemList.css"
], function (declare,
    _WidgetBase, _TemplatedMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.newWorkItemList",
        [_WidgetBase, _TemplatedMixin,],
    {
        templateString: template,

        // Add the widget above the work item editor on the work item editor page.
        addToPage: function () {
            try {
                jazz.app.currentApplication.workbench._pageWidgetCache["com.ibm.team.workitem"]
                    .domNode.lastChild.insertAdjacentElement('beforebegin', this.domNode);
            } catch (e) {
                console.log("Error placing NewWorkItemList on the page.");
            }
        }
    });
});