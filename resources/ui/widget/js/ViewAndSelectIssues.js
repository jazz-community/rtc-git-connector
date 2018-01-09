define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/on",
    "dojo/query",
    "./DataStores/MainDataStore",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!../templates/ViewAndSelectIssues.html"
], function (declare, array, lang, domClass, domConstruct, on, query,
    MainDataStore,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.viewAndSelectIssues",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,
        viewIssues: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
        },

        startup: function () {
            this.initializeViewIssuesList();
            this.watchDataStore();
        },

        watchDataStore: function () {
            var self = this;

            // Watch the store to know when the issues finished loading
            this.mainDataStore.selectedRepositorySettings.watch("issuesLoaded", function (name, oldValue, value) {
                if (value) {
                    // Issues finished loading, update the view
                    self.setViewIssuesListFromStore();
                } else {
                    // Issues are not loaded, reinitialize the view (loading...)
                    self.initializeViewIssuesList();
                }
            });

            // Watch the store to react when the list of issues changes (add / remove from issues to link list)
            this.mainDataStore.selectedRepositoryData.issues.watchElements(function () {
                // Only react if the issues have finished loading
                if (self.mainDataStore.selectedRepositorySettings.get("issuesLoaded")) {
                    // Update the local list of issues (and the view)
                    self.setViewIssuesListFromStore();
                }
            });
        },

        initializeViewIssuesList: function () {
            this.viewIssues = [{
                title: "Loading...",
                alreadyLinked: true
            }];

            // Draw the issues list in the view
            this.drawViewIssues();
            this.drawDetailsView();
        },

        setViewIssuesListFromStore: function () {
            // Clone the store array
            this.viewIssues = lang.clone(this.mainDataStore.selectedRepositoryData.issues);

            if (this.viewIssues.length < 1) {
                this.viewIssues = [{
                    title: "No issues found",
                    alreadyLinked: true
                }];
            } else {
                // Need to sort the viewIssues here (by date created -> newest on top)
                this.sortViewIssuesByDate();

                // Later also filter here
            }

            // Draw the issues list in the view
            this.drawViewIssues();
            this.drawDetailsView();
        },

        // Draw the issues list from the view issues
        drawViewIssues: function () {
            var self = this;
            var issuesListNode = query("#viewAndSelectIssuesWrapper .rtcGitConnectorViewAndSelectList")[0];
            domConstruct.empty(issuesListNode);

            array.forEach(this.viewIssues, function (issue) {
                var issueListItem = domConstruct.create("div", {
                    "class": "rtcGitConnectorViewAndSelectListItem",
                    "data-issue-id": issue.id
                }, issuesListNode);

                on(issueListItem, "click", function (event) {
                    var issueId = this.getAttribute("data-issue-id");

                    if (event.target.classList.contains("rtcGitConnectorViewAndSelectListItemButton")) {
                        // Remove the issue with the specified id from the issues list in store and add to the selected list
                        if (issueId) {
                            var selectedIssue = null;

                            for (var i = self.mainDataStore.selectedRepositoryData.issues.length - 1; i >= 0; i--) {
                                if (self.mainDataStore.selectedRepositoryData.issues[i].id == issueId) {
                                    selectedIssue = self.mainDataStore.selectedRepositoryData.issues.splice(i, 1)[0];
                                    break;
                                }
                            }

                            if (selectedIssue) {
                                self.mainDataStore.selectedRepositoryData.issuesToLink.push(selectedIssue);
                            }
                        }
                    } else {
                        // Select issue
                        self.setSelectedIssueById(issueId);
                    }
                });

                if (issue.alreadyLinked) {
                    domConstruct.create("div", {
                        "class": "rtcGitConnectorViewAndSelectListItemEmptyButton",
                        innerHTML: "&nbsp;"
                    }, issueListItem);
                } else {
                    domConstruct.create("div", {
                        "class": "rtcGitConnectorViewAndSelectListItemButton",
                        innerHTML: "+"
                    }, issueListItem);
                }

                var issueListItemContent = domConstruct.create("div", {
                    "class": "rtcGitConnectorViewAndSelectListItemContent"
                }, issueListItem);

                domConstruct.create("span", {
                    "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListFirstLine",
                    innerHTML: issue.title
                }, issueListItemContent);

                if (issue.openedDate) {
                    var issueDate = new Date(issue.openedDate);
                    domConstruct.create("span", {
                        "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListSecondLine",
                        innerHTML: "#" + issue.id + " opened by " + issue.openedBy + " on " + issueDate.toDateString() + " at " + ("00" + issueDate.getHours()).slice(-2) + ":" + ("00" + issueDate.getMinutes()).slice(-2)
                    }, issueListItemContent);
                } else {
                    domConstruct.create("span", {
                        "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListSecondLine",
                        innerHTML: "&nbsp;"
                    }, issueListItemContent);
                }
            });
        },

        // Set the selected issue in the view using the issue id
        setSelectedIssueById: function (issueId) {
            var self = this;

            query("#viewAndSelectIssuesWrapper .rtcGitConnectorViewAndSelectList .rtcGitConnectorViewAndSelectListItem").forEach(function (node) {
                if (node.getAttribute("data-issue-id") == issueId) {
                    domClass.add(node, "selected");
                } else {
                    domClass.remove(node, "selected");
                }
            });

            array.forEach(this.viewIssues, function (issue) {
                if (issue.id == issueId) {
                    self.drawDetailsView(issue);
                }
            });
        },

        // Draw the details view for the selected issue
        drawDetailsView: function (issue) {
            var issueDetailsNode = query("#viewAndSelectIssuesWrapper .rtcGitConnectorViewAndSelectDetails")[0];
            domConstruct.empty(issueDetailsNode);

            domConstruct.create("span", {
                "class": "rtcGitConnectorViewAndSelectDetailsSpan rtcGitConnectorViewAndSelectDetailsLabel",
                innerHTML: "Issue Details"
            }, issueDetailsNode);

            if (!issue) {
                domConstruct.create("span", {
                    "class": "rtcGitConnectorViewAndSelectDetailsSpan",
                    innerHTML: "Select an issue to view more details"
                }, issueDetailsNode);
            } else {
                this.addToDetailsViewNode(issueDetailsNode, "Title: ", issue.title);
                this.addToDetailsViewNode(issueDetailsNode, "State: ", issue.state);
                this.addToDetailsViewNode(issueDetailsNode, "Opened by: ", issue.openedBy);
                this.addToDetailsViewNode(issueDetailsNode, "Date opened: ", new Date(issue.openedDate).toString());
                this.addToDetailsViewNode(issueDetailsNode, "Issue id: ", "#" + issue.id);
                var linkNode = domConstruct.create("a", {
                    innerHTML: "Open this issue in a new tab",
                    href: issue.webUrl,
                    target: "_blank"
                });
                this.addLinkToDetailsViewNode(issueDetailsNode, "Web Link: ", linkNode);
            }
        },

        addToDetailsViewNode: function (detailsViewNode, label, value) {
            var issueTitleNode = this.createDetailsViewSpan(detailsViewNode, label);
            domConstruct.create("span", {
                innerHTML: value
            }, issueTitleNode);
        },

        addLinkToDetailsViewNode: function (detailsViewNode, label, linkNode) {
            var issueTitleNode = this.createDetailsViewSpan(detailsViewNode, label);
            domConstruct.place(linkNode, issueTitleNode);
        },

        createDetailsViewSpan: function (detailsViewNode, label) {
            var issueTitleNode = domConstruct.create("span", {
                "class": "rtcGitConnectorViewAndSelectDetailsSpan"
            }, detailsViewNode);
            domConstruct.create("span", {
                "class": "rtcGitConnectorViewAndSelectDetailsLabel",
                innerHTML: label
            }, issueTitleNode);

            return issueTitleNode;
        },

        // Sort the view issues by the openedDate
        sortViewIssuesByDate: function () {
            var self = this;

            // Create a temp array so that the date objects are only created once
            var tempArray = this.viewIssues.map(function (el, i) {
                return {
                    index: i,
                    value: new Date(el.openedDate).getTime()
                };
            });

            // Sort the temp array
            tempArray.sort(function (a, b) {
                return b.value - a.value;
            });

            // Get a sorted version of the original array
            var sortedArray = tempArray.map(function (el) {
                return self.viewIssues[el.index];
            });

            // Use the sorted array
            this.viewIssues = sortedArray;
        }
    });
});