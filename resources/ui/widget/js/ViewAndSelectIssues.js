define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/on",
    "dojo/query",
    "./DataStores/MainDataStore",
    "./RestServices/JazzRestService",
    "./RestServices/GitRestService",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!../templates/ViewAndSelectIssues.html"
], function (declare, array, lang, dom, domClass, domConstruct, on, query,
    MainDataStore, JazzRestService, GitRestService,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.viewAndSelectIssues",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,
        jazzRestService: null,
        gitRestService: null,
        viewIssues: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
            this.jazzRestService = JazzRestService.getInstance();
            this.gitRestService = GitRestService.getInstance();
        },

        startup: function () {
            this.initializeViewIssuesList();
            this.watchDataStore();
            this.setEventHandlers();
        },

        setEventHandlers: function () {
            var self = this;
            var issuesLoadedFunc = function (issues) {
                self.mainDataStore.selectedRepositoryData.issues
                    .splice(0, self.mainDataStore.selectedRepositoryData.issues.length);
                self.mainDataStore.selectedRepositoryData.issues
                    .push.apply(self.mainDataStore.selectedRepositoryData.issues, issues);
                self.mainDataStore.selectedRepositorySettings.set("issuesLoaded", true);
                self.mainDataStore.selectedRepositorySettings.set("issuesLoading", false);

                // Enable the search and clear buttons after loading
                dom.byId("viewAndSelectIssuesSearchButton").removeAttribute("disabled");
                dom.byId("viewAndSelectIssuesSearchClearButton").removeAttribute("disabled");
            };
            var issuesLoadErrorFunc = function (error) {
                self.mainDataStore.selectedRepositorySettings.set("issuesLoadError", error || "Unknown Error");

                // Enable the search and clear buttons after loading
                dom.byId("viewAndSelectIssuesSearchButton").removeAttribute("disabled");
                dom.byId("viewAndSelectIssuesSearchClearButton").removeAttribute("disabled");
            };
            var searchButtonClickFunc = function (event) {
                // Don't do anything if issues are already being loaded
                if (!self.mainDataStore.selectedRepositorySettings.get("issuesLoading")) {
                    var selectedRepository = self.mainDataStore.selectedRepositorySettings.get("repository");
                    var gitHost = self.mainDataStore.selectedRepositorySettings.get("gitHost");
                    var accessToken = self.mainDataStore.selectedRepositorySettings.get("accessToken");
                    var issueId = self.issuesSearchInput.value;
                    var alreadyLinkedUrls = self.jazzRestService.getRelatedArtifactLinksFromWorkItem(self.mainDataStore.workItem);

                    // Disable the search and clear buttons while loading
                    dom.byId("viewAndSelectIssuesSearchButton").setAttribute("disabled", "disabled");
                    dom.byId("viewAndSelectIssuesSearchClearButton").setAttribute("disabled", "disabled");

                    // Set the issuesLoading to true to prevent multiple requests
                    self.mainDataStore.selectedRepositorySettings.set("issuesLoading", true);
                    self.mainDataStore.selectedRepositorySettings.set("issuesLoaded", false);

                    if (issueId) {
                        // Try to get the issue with the specified id
                        self.gitRestService.getIssueById(selectedRepository, gitHost, accessToken, issueId, alreadyLinkedUrls)
                            .then(issuesLoadedFunc, issuesLoadErrorFunc);
                    } else {
                        // Get all issues if there is no id
                        self.gitRestService.getRecentIssues(selectedRepository, gitHost, accessToken, alreadyLinkedUrls)
                            .then(issuesLoadedFunc, issuesLoadErrorFunc);
                    }
                }
            };

            on(this.issuesFilterInput, "change", function (value) {
                self.setViewIssuesListFromStore(value);
            });

            on(dom.byId("viewAndSelectIssuesFilterClearButton"), "click", function (event) {
                self.issuesFilterInput.setValue("");
            });

            on(dom.byId("viewAndSelectIssuesSearchButton"), "click", searchButtonClickFunc);

            on(dom.byId("viewAndSelectIssuesSearchClearButton"), "click", function (event) {
                self.issuesSearchInput.setValue("");
                searchButtonClickFunc();
            });
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

            // Clear the filter input
            this.issuesFilterInput.setValue("");

            // Draw the issues list in the view
            this.drawViewIssues();
            this.drawDetailsView();
        },

        setViewIssuesListFromStore: function (filterValue) {
            // Clone the store array
            this.viewIssues = lang.clone(this.mainDataStore.selectedRepositoryData.issues);

            array.forEach(this.viewIssues, function (issue) {
                issue.originalId = issue.id;
            });

            if (this.viewIssues.length < 1) {
                this.viewIssues = [{
                    title: "No issues found",
                    alreadyLinked: true
                }];
            } else {
                // Need to sort the viewIssues here (by date created -> newest on top)
                this.sortViewIssuesByDate();

                if (!filterValue) {
                    // Take the filter from the input if it wasn't passed in
                    filterValue = this.issuesFilterInput.value;
                }

                // Filter the view issues using the filter input text
                if (filterValue) {
                    this.filterViewIssuesByText(filterValue);
                }
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
                    "data-issue-id": issue.originalId
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

                            if (selectedIssue && !self.mainDataStore.selectedRepositoryData.issuesToLink.find(function (issue) {
                                return issue.id == selectedIssue.id;
                            })) {
                                self.mainDataStore.selectedRepositoryData.issuesToLink.push(selectedIssue);
                            }
                        }
                    } else {
                        // Select issue
                        self.setSelectedIssueById(issueId);
                    }
                });

                // okay, this works...
                var fontAwesome = com_siemens_bt_jazz_rtcgitconnector_modules.FontAwesome;
                var faFlag = com_siemens_bt_jazz_rtcgitconnector_modules.FaFlag;
                var flag = fontAwesome.icon({prefix: "fas", iconName: "flag"});
                console.log(flag);

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
                if (issue.originalId == issueId) {
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
        },

        // Filter the view issues using the filter text.
        // Only keep issues that contain the filter text either
        // in the issue title or issue author name or id or email
        filterViewIssuesByText: function (filterText) {
            filterText = filterText.toLowerCase();
            this.viewIssues = this.viewIssues.filter(function (issue) {
                issue.id = issue.id.toString();
                return issue.id.toLowerCase().indexOf(filterText) > -1 ||
                    issue.title.toLowerCase().indexOf(filterText) > -1 ||
                    issue.state.toLowerCase().indexOf(filterText) > -1 ||
                    issue.openedBy.toLowerCase().indexOf(filterText) > -1;
            });
            this._highlightFilterText(filterText, ["id", "title", "state", "openedBy"], this.viewIssues);
        },

        _highlightFilterText: function(filterText, filterBy, filterResult){
            for(var i=0; i < filterResult.length; i++){
                for(var j=0; j < filterBy.length; j++){
                    filterResult[i][filterBy[j]] = this._highlightTextInString(filterText, filterResult[i][filterBy[j]]);
                }
            }
        },

        _highlightTextInString: function(searchText, fullText){
            var startIndex;
            if (searchText.toLowerCase() && (startIndex = fullText.toLowerCase().indexOf(searchText)) > -1){
                var beforeFound = fullText.slice(0, startIndex);
                var found = fullText.slice(startIndex, startIndex + searchText.length);
                var afterFound = this._highlightTextInString(searchText, fullText.slice(startIndex + searchText.length));
                fullText = beforeFound + "<b class='rtcGitConnectorHighlightText'>" + found + "</b>" + afterFound;
            }
            return fullText;
        }
    });
});