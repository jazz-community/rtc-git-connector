define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/dom-construct",
    "dojo/on",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/registry",
    "dojo/text!./NewWorkItemList.html",
    "jazz/css!./NewWorkItemList.css",
    "com.ibm.team.workitem.web.cache.internal.Cache",
    "com.ibm.team.workitem.web.cache.internal.QueryProxy",
    "com.ibm.team.workitem.web.client.internal.query.AttributeExpression",
    "com.ibm.team.workitem.web.client.internal.query.Operator",
    "com.ibm.team.workitem.web.client.internal.query.QueryDescriptor",
    "com.ibm.team.workitem.web.client.internal.query.Term",
    "com.ibm.team.workitem.web.client.internal.query.UIItem",
    "com.ibm.team.workitem.web.client.internal.query.Variable",
    "com.ibm.team.workitem.web.client.util"
], function (declare, array, domConstruct, on,
    _WidgetBase, _TemplatedMixin, registry,
    template) {
    var Cache = com.ibm.team.workitem.web.cache.internal.Cache;
    var QueryProxy = com.ibm.team.workitem.web.cache.internal.QueryProxy;
    var AttributeExpression = com.ibm.team.workitem.web.client.internal.query.AttributeExpression;
    var Operator = com.ibm.team.workitem.web.client.internal.query.Operator;
    var QueryDescriptor = com.ibm.team.workitem.web.client.internal.query.QueryDescriptor;
    var Term = com.ibm.team.workitem.web.client.internal.query.Term;
    var UIItem = com.ibm.team.workitem.web.client.internal.query.UIItem;
    var Variable = com.ibm.team.workitem.web.client.internal.query.Variable;
    var util = com.ibm.team.workitem.web.client.util;

    var NewWorkItemList = declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.newWorkItemList",
        [_WidgetBase, _TemplatedMixin,],
    {
        templateString: template,
        id: "rtcGitConnectorNewWorkItemListWidget",
        newWorkItems: [],
        subscriptionHandles: [],

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
        // If there are no more items in the list the specified handles
        // are unsubscribed and the widget is destroyed.
        updateContent: function (subscriptionHandles) {
            this._updateSubscriptions(subscriptionHandles);
            this._getNewWorkItems();

            if (this.newWorkItems.length) {
                // Set the updated list in the view
                this._clearContent();
                this._addNewWorkItemsToView();
            } else {
                // Unsubscribe from all handles before destroying
                this._updateSubscriptions();

                // Add success message with query for new work items created from git issues
                this._createSuccessMessage();

                // Destroy the widget when when the list is empty
                this.destroyRecursive(false);
            }
        },

        // Get all new work items from the work item cache
        _getNewWorkItems: function () {
            this.newWorkItems = Cache.getAllItems({
                filterSelectors: [ "isNew" ],
                filterAttributes: [ "isWorkItem"]
            });
        },

        // Only keep the current subscriptions. Unsubscribe any old ones.
        // Unsubscribes all handles if the new list of handles is empty or not present.
        _updateSubscriptions: function (newSubscriptionHandles) {
            if (!newSubscriptionHandles) {
                newSubscriptionHandles = [];
            }

            if (this.subscriptionHandles.length) {
                this.subscriptionHandles.forEach(function (oldSubscriptionHandle) {
                    if (!newSubscriptionHandles.some(function (newSubscriptionHandle) {
                        return newSubscriptionHandle === oldSubscriptionHandle;
                    })) {
                        dojo.unsubscribe(oldSubscriptionHandle);
                    }
                });
            }

            this.subscriptionHandles = newSubscriptionHandles;
        },

        // Empty the links container so that in can be recreated
        _clearContent: function () {
            domConstruct.empty(this.linksContainer);
        },

        // Add all new work items to the view in the form of links
        _addNewWorkItemsToView: function () {
            var self = this;

            if (this.newWorkItems && this.newWorkItems.length) {
                array.forEach(this.newWorkItems, function (newWorkItem) {
                    self._addNewWorkItemToView(newWorkItem);
                });
            }
        },

        // Add a link to a single work item to the view
        _addNewWorkItemToView: function (workItem) {
            var workItemUrl = workItem.getUrl(true);
            var workItemSummary = workItem.object.attributes.summary;

            if (typeof workItemSummary.content === "string") {
                workItemSummary = workItemSummary.content;
            }

            var newWorkItemRow = domConstruct.create("a", {
                "class": "rtcGitConnectorNewWorkItemListRow",
                href: workItemUrl
            }, this.linksContainer);

            if (window.location.href === workItemUrl) {
                var bulletSpan = domConstruct.create("span", {
                    "class": "rtcGitConnectorNewWorkItemListRowBullet"
                }, newWorkItemRow);
                domConstruct.create("span", {
                    innerHTML: "•"
                }, bulletSpan);
            }

            domConstruct.create("img", {
                "src": workItem.getTypeIconUrl(),
                "alt": workItem.object.attributes.workItemType.label
            }, newWorkItemRow);
            domConstruct.create("span", {
                innerHTML: " * [New " + workItem.object.attributes.workItemType.label + "] "
                    + workItemSummary
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
                "class": "rtcGitConnectorNewWorkItemQueryIcon",
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
            return window.location.pathname + util.getRunNewQueryUri(query);
        },

        // Get the url of the query icon
        _getQueryIconUrl: function (query) {
            var queryProxy = new QueryProxy({
                query: query
            });

            return queryProxy.getMenuIconUri();
        },

        // Create a query for all work items with the tag "from-git-issue" and
        // created today and created by the current user.
        _createNewWorkItemsQuery: function () {
            // Create a query term with the "AND" operator
            var term = new Term(Operator.AND);

            // Create an attribute expression that matches the tag "from-git-issue"
            var tagsExpression = new AttributeExpression("internalTags", new Operator("is", null), [new UIItem("from-git-issue")]);
            term.addAttributeExpression(tagsExpression);

            // Create an attribute expression that matches the creationDate and the value of "today"
            var creationExpression = new AttributeExpression("creationDate", new Operator("is", null));
            var creationVariable = new Variable("now", "0d");
            creationExpression.setVariables([creationVariable]);
            term.addAttributeExpression(creationExpression);

            // Create an attribute expression that matches the creator and the value "currentUser"
            var creatorExpression = new AttributeExpression("creator", new Operator("is", null));
            var creatorVariable = new Variable("currentUser", "");
            creatorExpression.setVariables([creatorVariable]);
            term.addAttributeExpression(creatorExpression);

            // Create a query object with a title for the UI and the created query terms
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
        // Also unsubscribes from the specified handles when destroying the widget.
        this.UpdateNewWorkItemList = function (subscriptionHandles) {
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

            // Create the list of new work items and add it to the view
            newWorkItemListWidget.updateContent(subscriptionHandles);
        };
    };
});