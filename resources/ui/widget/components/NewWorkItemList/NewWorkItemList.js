define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/dom-construct",
    "dojo/on",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/registry",
    "dojo/text!./NewWorkItemList.html",
    "jazz/css!./NewWorkItemList.css"
], function (declare, array, domConstruct, on,
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
                    .domNode.lastElementChild.insertAdjacentElement("beforebegin", this.domNode);
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

                // Add success message with query for new work items created from git issues
                this._createSuccessMessage();

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
        },

        // Add success message with query for new work items created from git issues
        _createSuccessMessage: function () {
            var newWorkItemsQuery = this._createNewWorkItemsQuery();
            var successMessageDiv = domConstruct.create("div", {
                "id": "rtcGitConnectorNewWorkItemListSuccessMessageDiv",
                "class": "rtcGitConnectorNewWorkItemList"
            });
            domConstruct.create("div", {
                "class": "rtcGitConnectorNewWorkItemListTitle",
                innerHTML: "Finished creating work items from git issues"
            }, successMessageDiv);
            var flexContainer = domConstruct.create("div", {
                "class": "rtcGitConnectorNewWorkItemListFlex"
            }, successMessageDiv);
            var queryRow = domConstruct.create("a", {
                "class": "rtcGitConnectorNewWorkItemListRow",
                href: this._getQueryNewWorkItemsUrl(newWorkItemsQuery)
            }, flexContainer);
            domConstruct.create("img", {
                "src": this._getQueryIconUrl(newWorkItemsQuery),
                "alt": "Query for all new work items created from git issues"
            }, queryRow);
            domConstruct.create("span", {
                innerHTML: "Click here to view all new work items created from git issues"
            }, queryRow);
            var removeButton = domConstruct.create("button", {
                "class": "rtcGitConnectorNewWorkItemListButton",
                type: "button",
                innerHTML: "Hide"
            }, flexContainer);

            on(queryRow, "click", this._removeSuccessMessageFromPage);
            on(removeButton, "click", this._removeSuccessMessageFromPage);

            this.domNode.insertAdjacentElement("beforebegin", successMessageDiv);
        },

        // Remove the success message div from the page
        _removeSuccessMessageFromPage: function () {
            domConstruct.destroy("rtcGitConnectorNewWorkItemListSuccessMessageDiv");
        },

        // Get the url of the query for all new work items created from git issues
        _getQueryNewWorkItemsUrl: function (query) {
            return window.location.pathname +
                com.ibm.team.workitem.web.client.util.getRunNewQueryUri(query);
        },

        // Get the url of the query icon
        _getQueryIconUrl: function (query) {
            var QueryProxy = com.ibm.team.workitem.web.cache.internal.QueryProxy;

            var queryProxy = new QueryProxy({
                query: query
            });

            return queryProxy.getMenuIconUri();
        },

        // Create a query for all work items with the tag "from-git-issue" and
        // created today and created by the current user.
        _createNewWorkItemsQuery: function () {
            var Term = com.ibm.team.workitem.web.client.internal.query.Term;
            var UIItem= com.ibm.team.workitem.web.client.internal.query.UIItem;
            var Operator= com.ibm.team.workitem.web.client.internal.query.Operator;
            var Variable= com.ibm.team.workitem.web.client.internal.query.Variable;
            var AttributeExpression= com.ibm.team.workitem.web.client.internal.query.AttributeExpression;
            var QueryDescriptor = com.ibm.team.workitem.web.client.internal.query.QueryDescriptor;

            var term = new Term(Operator.AND);
            var tagsExpression = new AttributeExpression("internalTags", new Operator("is", null), [new UIItem("from-git-issue")]);
            term.addAttributeExpression(tagsExpression);

            var creationExpression = new AttributeExpression("creationDate", new Operator("is", null));
            var creationVariable = new Variable("now", "0d");
            creationExpression.setVariables([creationVariable]);
            term.addAttributeExpression(creationExpression);

            var creatorExpression = new AttributeExpression("creator", new Operator("is", null));
            var creatorVariable = new Variable("currentUser", "");
            creatorExpression.setVariables([creatorVariable]);
            term.addAttributeExpression(creatorExpression);

            var queryDto = {
                name: "My new work items from git issues (created today)",
                itemId: "",
                expression: term.createDTO()
            };
            var query = QueryDescriptor.createFromEditableQueryDTO(queryDto);

            return query;
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

                // Remove the success message if it exists before adding the new widget to the page
                newWorkItemListWidget._removeSuccessMessageFromPage();

                // Add the new widget to the page
                newWorkItemListWidget.addToPage();
            }

            newWorkItemListWidget.updateContent(subscribeHandle);
        };
    };
});