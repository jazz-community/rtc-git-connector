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
        templateString: template
    });
});