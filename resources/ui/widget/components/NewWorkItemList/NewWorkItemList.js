define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/dom-construct",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./NewWorkItemList.html",
    "jazz/css!./NewWorkItemList.css"
], function (declare, array, domConstruct,
    _WidgetBase, _TemplatedMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.newWorkItemList",
        [_WidgetBase, _TemplatedMixin,],
    {
        templateString: template,
        newWorkItems: [],

        // Add the widget above the work item editor on the work item editor page.
        addToPage: function () {
            try {
                jazz.app.currentApplication.workbench._pageWidgetCache["com.ibm.team.workitem"]
                    .domNode.lastChild.insertAdjacentElement('beforebegin', this.domNode);
            } catch (e) {
                console.log("Error placing NewWorkItemList on the page.");
            }
        },

        // Update from the current list of new work items.
        updateContent: function () {
            this._getNewWorkItems();
            this._clearContent();
            this._addNewWorkItemsToView();
        },

        _getNewWorkItems: function () {
            this.newWorkItems = com.ibm.team.workitem.web.cache.internal.Cache.getAllItems({
                filterSelectors: [ "isNew" ],
                filterAttributes: [ "isWorkItem"]
            });
        },

        _clearContent: function () {
            domConstruct.empty(this.linksContainer);
        },

        _addNewWorkItemsToView: function () {
            var self = this;

            if (this.newWorkItems && this.newWorkItems.length) {
                array.forEach(this.newWorkItems, function (newWorkItem) {
                    console.log("newWorkItem", newWorkItem);
                    self._addNewWorkItemToView(newWorkItem);
                });
            }
        },

        _addNewWorkItemToView: function (workItem) {
            var newWorkItemRow = domConstruct.create("a", {
                "class": "rtcGitConnectorNewWorkItemListRow",
                href: workItem.url
            }, this.linksContainer);
            domConstruct.create("img", {
                "src": workItem.getTypeIconUrl(),
                "alt": workItem.object.attributes.workItemType.label
            }, newWorkItemRow);
            domConstruct.create("span", {
                innerHTML: " * [New " + workItem.object.attributes.workItemType.label + "] " + workItem.object.attributes.summary
            }, newWorkItemRow);
        }
    });
});