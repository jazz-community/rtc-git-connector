define([
    "dojo/_base/declare",
    "dojo/dom-class",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./ListItem.html",
    "jazz/css!./ListItem.css"
], function (declare, domClass,
    _WidgetBase, _TemplatedMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.listItem",
        [_WidgetBase, _TemplatedMixin,],
    {
        templateString: template,

        selected: false,
        _setSelectedAttr: function (selected) {
            if (selected) {
                domClass.add(this.listItem, "selected");
            } else {
                domClass.remove(this.listItem, "selected");
            }

            this._set("selected", selected);
        },

        itemId: "",
        _setItemIdAttr: { node: "listItem", type: "attribute", attribute: "data-item-id" },

        title: "",
        _setTitleAttr: { node: "firstLine", type: "innerHTML" },

        details: "",
        _setDetailsAttr: { node: "secondLine", type: "innerHTML" },

        constructor: function (itemId) {
            this.itemId = itemId;

            console.log("listItem this: ", this);
        }
    });
});