define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/on",
    "dojo/json",
    "../../../../dist/ClipboardJS",
    "../../services/MainDataStore",
    "../../services/JazzRestService",
    "../../services/GitRestService",
    "../../js/ViewHelper",
    "../DetailsPane/DetailsPane",
    "../ListItem/ListItem",
    "dijit/Tooltip",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./ViewAndSelectIssues.html"
], function (
    declare,
    array,
    lang,
    dom,
    domConstruct,
    on,
    json,
    ClipboardJS,
    MainDataStore,
    JazzRestService,
    GitRestService,
    ViewHelper,
    DetailsPane,
    ListItem,
    Tooltip,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    template
) {
    return declare(
        "com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.viewAndSelectIssues",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
        {
            templateString: template,
            mainDataStore: null,
            jazzRestService: null,
            gitRestService: null,
            viewIssues: null,
            tooltip: null,

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
                    self.mainDataStore.selectedRepositoryData.issues.splice(
                        0,
                        self.mainDataStore.selectedRepositoryData.issues.length
                    );
                    self.mainDataStore.selectedRepositoryData.issues.push.apply(
                        self.mainDataStore.selectedRepositoryData.issues,
                        issues
                    );
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
                        var alreadyLinkedUrls = self.jazzRestService.getIssueLinksFromWorkItem(
                            self.mainDataStore.workItem
                        );

                        // Disable the search and clear buttons while loading
                        dom.byId("viewAndSelectIssuesSearchButton").setAttribute("disabled", "disabled");
                        dom.byId("viewAndSelectIssuesSearchClearButton").setAttribute("disabled", "disabled");

                        // Set the issuesLoading to true to prevent multiple requests
                        self.mainDataStore.selectedRepositorySettings.set("issuesLoading", true);
                        self.mainDataStore.selectedRepositorySettings.set("issuesLoaded", false);

                        if (issueId) {
                            // Try to get the issue with the specified id
                            self.gitRestService
                                .getIssueById(selectedRepository, gitHost, accessToken, issueId, alreadyLinkedUrls)
                                .then(issuesLoadedFunc, issuesLoadErrorFunc);
                        } else {
                            // Get all issues if there is no id
                            self.gitRestService
                                .getRecentIssues(selectedRepository, gitHost, accessToken, alreadyLinkedUrls)
                                .then(issuesLoadedFunc, issuesLoadErrorFunc);
                        }
                    }
                };

                on(this.issuesFilterInput, "change", function (value) {
                    self.setViewIssuesListFromStore(value);
                });

                on(dom.byId("viewAndSelectIssuesFilterClearButton"), "click", function (event) {
                    self.issuesFilterInput.set("value", "");
                });

                on(dom.byId("viewAndSelectIssuesSearchButton"), "click", searchButtonClickFunc);

                on(dom.byId("viewAndSelectIssuesSearchClearButton"), "click", function (event) {
                    self.issuesSearchInput.set("value", "");
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
                this.viewIssues = [
                    {
                        title: "Loading...",
                        alreadyLinked: true
                    }
                ];

                // Clear the filter input
                this.issuesFilterInput.set("value", "");

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
                    this.viewIssues = [
                        {
                            title: "No issues found",
                            alreadyLinked: true
                        }
                    ];
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
                var gitHost = self.mainDataStore.selectedRepositorySettings.get("gitHost");
                domConstruct.empty(this.listItemsContainer);

                if (self.tooltip) {
                    self.tooltip.destroy();
                    self.tooltip = null;
                }

                self.tooltip = new Tooltip({
                    position: ["above", "below"],
                    showDelay: 0
                });

                array.forEach(this.viewIssues, function (issue) {
                    // Don't add the create a new issue row when in new work item mode
                    if (issue.originalId < 0 && self.mainDataStore.newWorkItemMode) {
                        return;
                    }

                    var details;
                    var buttonType;
                    var buttonTitle;
                    var duplicate = false;

                    if (issue.originalId < 0) {
                        var workItemTags = self.mainDataStore.workItem.getValue({
                            path: ["attributes", "internalTags", "content"]
                        });

                        if (workItemTags.length && workItemTags.indexOf("created-as-git-issue") !== -1) {
                            duplicate = true;
                            self.tooltip.set("label", "This work item has already been created as a git issue.");
                        }

                        details =
                            "This will create a new issue in " +
                            gitHost.displayName +
                            " using the information from the current work item";
                        buttonType = "plus";
                        buttonTitle = "Create Issue";
                    } else {
                        if (
                            self.mainDataStore.newWorkItemMode &&
                            issue.labels &&
                            issue.labels.indexOf("created-as-rtc-work-item") !== -1
                        ) {
                            duplicate = true;
                            self.tooltip.set("label", "This git issue has already been created as a work item.");
                        }

                        details = ViewHelper.GetIssueOrRequestDateString(issue);

                        if (issue.alreadyLinked) {
                            buttonType = "check";
                            buttonTitle = issue.originalId ? "Already Linked" : "";
                        } else {
                            buttonType = "link";
                            buttonTitle = "Add Link";
                        }
                    }

                    var listItem = new ListItem(issue.originalId);
                    listItem.set("title", issue.title);
                    listItem.set("details", details);
                    listItem.set("buttonType", buttonType);
                    listItem.set("duplicate", duplicate);
                    listItem.set("buttonTitle", buttonTitle);

                    listItem.onButtonClick = lang.hitch(self, self.listItemButtonClick);
                    listItem.onContentClick = lang.hitch(self, self.setSelectedItemById);

                    issue.listItem = listItem;
                    domConstruct.place(listItem.domNode, self.listItemsContainer);

                    if (duplicate) {
                        self.tooltip.addTarget(listItem.itemRightButton);
                    }
                });
            },

            // Remove the issue with the specified id from the issues list in store and add to the selected list
            listItemButtonClick: function (itemId) {
                var selectedIssue = null;

                for (var i = this.mainDataStore.selectedRepositoryData.issues.length - 1; i >= 0; i--) {
                    if (
                        this.mainDataStore.selectedRepositoryData.issues[i].id == itemId &&
                        !this.mainDataStore.selectedRepositoryData.issues[i].alreadyLinked
                    ) {
                        selectedIssue = this.mainDataStore.selectedRepositoryData.issues.splice(i, 1)[0];
                        break;
                    }
                }

                if (
                    selectedIssue &&
                    !this.mainDataStore.selectedRepositoryData.issuesToLink.find(function (issue) {
                        return issue.id == selectedIssue.id;
                    })
                ) {
                    this.mainDataStore.selectedRepositoryData.issuesToLink.push(selectedIssue);
                }
            },

            // Set the selected list item in the view using the item id
            setSelectedItemById: function (itemId) {
                var self = this;

                array.forEach(this.viewIssues, function (issue) {
                    if (issue.originalId && issue.originalId === itemId) {
                        issue.listItem.set("selected", true);
                        self.drawDetailsView(issue);
                    } else if (issue.listItem) {
                        issue.listItem.set("selected", false);
                    }
                });
            },

            // Draw the details view for the selected issue
            drawDetailsView: function (issue) {
                var gitHost = this.mainDataStore.selectedRepositorySettings.get("gitHost");
                var items = [];

                if (!issue) {
                    items.push({
                        text: "Select an issue to view more details"
                    });
                } else if (issue.originalId < 0) {
                    items.push(
                        {
                            text:
                                "This will create a new issue in the selected " +
                                gitHost.displayName +
                                " repository and fill it with the information from this work item. " +
                                "The new issue will also be added as a link."
                        },
                        {
                            label: "More info: ",
                            text: "Open the wiki page for more info on creating issues",
                            link: "https://github.com/jazz-community/rtc-git-connector/wiki/2.5-Creating-an-Issue"
                        },
                        {
                            label: "Developer info: ",
                            node: domConstruct.create("button", {
                                id: "viewAndSelectIssuesCopyWorkItemDetails",
                                "class": "j-button-secondary",
                                type: "button",
                                innerHTML: "Copy work item details to clipboard"
                            })
                        }
                    );
                    this.copyJsonWorkItemToClipboard();
                } else {
                    items.push(
                        {
                            label: "Title: ",
                            text: issue.title
                        },
                        {
                            label: "State: ",
                            text: issue.state
                        },
                        {
                            label: "Opened by: ",
                            text: issue.openedBy
                        },
                        {
                            label: "Date opened: ",
                            text: ViewHelper.GetFormattedDateFromString(issue.openedDate)
                        },
                        {
                            label: "Issue id: ",
                            text: "#" + issue.id
                        },
                        {
                            label: "Web Link: ",
                            text: "Open this issue in a new tab",
                            link: issue.webUrl
                        }
                    );
                }

                this.detailsPane.setContent("Issue Details", items);
            },

            // Sort the view issues by the openedDate
            sortViewIssuesByDate: function () {
                this.viewIssues = ViewHelper.SortListDataByDate("openedDate", this.viewIssues);
            },

            // Filter the view issues using the filter text.
            // Only keep issues that contain the filter text either
            // in the issue title or issue author name or id or state
            filterViewIssuesByText: function (filterText) {
                this.viewIssues = ViewHelper.FilterListDataByText(
                    filterText,
                    ["id", "title", "state", "openedBy"],
                    this.viewIssues
                );
            },

            copyJsonWorkItemToClipboard: function () {
                var self = this;

                if (this.clipboard) {
                    this.clipboard.destroy();
                }

                this.clipboard = new ClipboardJS("#viewAndSelectIssuesCopyWorkItemDetails", {
                    text: function () {
                        return json.stringify(self.mainDataStore.workItem.object, null, 2);
                    }
                });
                this.clipboard.on("success", function (e) {
                    alert("Successfully copied the work item details. Paste into a text editor to view them.");
                });
                this.clipboard.on("error", function (e) {
                    alert(
                        "Failed to copy the work item details. Try refreshing the page and make sure that you are using a modern browser."
                    );
                });
            }
        }
    );
});
