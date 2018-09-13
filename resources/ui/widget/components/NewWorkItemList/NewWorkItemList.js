define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/dom-construct",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/registry",
    "dojo/text!./NewWorkItemList.html",
    "jazz/css!./NewWorkItemList.css"
], function (declare, array, domConstruct,
    _WidgetBase, _TemplatedMixin, registry,
    template) {
    var NewWorkItemList = declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.newWorkItemList",
        [_WidgetBase, _TemplatedMixin,],
    {
        templateString: template,
        id: "rtcGitConnectorNewWorkItemListWidget",
        newWorkItems: [],

        // Add the widget above the work item editor on the work item editor page.
        addToPage: function () {
            try {
                jazz.app.currentApplication.workbench._pageWidgetCache["com.ibm.team.workitem"]
                    .domNode.lastElementChild.insertAdjacentElement('beforebegin', this.domNode);
            } catch (e) {
                console.log("Error placing NewWorkItemList on the page.");
            }
        },

        // Update from the current list of new work items.
        // If there are no more items in the list the specified handle
        // is unsubscribed and the widget is destroyed.
        updateContent: function (subscribeHandle) {
            this._getNewWorkItems();

            if (this.newWorkItems.length) {
                // Set the updated list in the view
                this._clearContent();
                this._addNewWorkItemsToView();
            } else {
                // Unsubscribe from the passed in handle before destroying
                dojo.unsubscribe(subscribeHandle);

                // Destroy the widget when when the list is empty
                this.destroyRecursive(false);
            }
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
                    self._addNewWorkItemToView(newWorkItem);
                });
            }
        },

        _addNewWorkItemToView: function (workItem) {
            var workItemSummary = workItem.object.attributes.summary;
            var newWorkItemRow = domConstruct.create("a", {
                "class": "rtcGitConnectorNewWorkItemListRow",
                href: workItem.url
            }, this.linksContainer);
            domConstruct.create("img", {
                "src": workItem.getTypeIconUrl(),
                "alt": workItem.object.attributes.workItemType.label
            }, newWorkItemRow);
            domConstruct.create("span", {
                innerHTML: " * [New " + workItem.object.attributes.workItemType.label + "] "
                    + (workItemSummary.content || workItemSummary)
            }, newWorkItemRow);
        }
    });

    // Don't expose the class directly but rather just the update function.
    return new function () {
        // Updates the list of new work items. Creates and places the widget in the dom
        // if it doesn't exist. Removes and destroys the widget if the list is empty.
        // Also unsubscribes the specified handle when destroying the widget.
        this.UpdateNewWorkItemList = function (subscribeHandle) {
            // Get the existing widget by id
            var newWorkItemListWidget = registry.byId('rtcGitConnectorNewWorkItemListWidget');

            if (!newWorkItemListWidget) {
                // Create a new instance if the widget wasn't found
                newWorkItemListWidget = new NewWorkItemList();
                newWorkItemListWidget.addToPage();
            }

            newWorkItemListWidget.updateContent(subscribeHandle);
        };
    };
});