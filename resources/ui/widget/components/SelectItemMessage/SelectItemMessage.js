define([
    "dojo/_base/declare",
    "dojo/dom-style",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./SelectItemMessage.html",
    "jazz/css!./SelectItemMessage.css"
], function (declare, domStyle, _WidgetBase, _TemplatedMixin, template) {
    return declare(
        "com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.selectItemMessage",
        [_WidgetBase, _TemplatedMixin],
        {
            templateString: template,

            // Hide the message by default
            // Set to false to show the message
            hidden: true,
            _setHiddenAttr: function (hidden) {
                domStyle.set(this.messageNode, "display", hidden ? "none" : "block");
                this._set("hidden", hidden);
            },

            // Define the default message to show
            // Set to a different string to change the message
            message: "Click the colorful icon on the left to select an item to be saved.",
            _setMessageAttr: { node: "messageNode", type: "innerHTML" }
        }
    );
});
