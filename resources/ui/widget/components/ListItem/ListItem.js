define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./ListItem.html",
    "jazz/css!./ListItem.css"
], function (declare,
    _WidgetBase, _TemplatedMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.listItem",
        [_WidgetBase, _TemplatedMixin,],
    {
        templateString: template
    });
});