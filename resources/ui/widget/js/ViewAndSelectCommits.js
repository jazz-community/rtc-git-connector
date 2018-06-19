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
    "./ViewHelper",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!../templates/ViewAndSelectCommits.html"
], function (declare, array, lang, dom, domClass, domConstruct, on, query,
    MainDataStore, JazzRestService, GitRestService, ViewHelper,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.viewAndSelectCommits",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,
        jazzRestService: null,
        gitRestService: null,
        viewCommits: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
            this.jazzRestService = JazzRestService.getInstance();
            this.gitRestService = GitRestService.getInstance();
        },

        startup: function () {
            this.initializeViewCommitsList();
            this.watchDataStore();
            this.setEventHandlers();
        },

        setEventHandlers: function () {
            var self = this;
            var commitsLoadedFunc = function (commits) {
                self.mainDataStore.selectedRepositoryData.commits
                    .splice(0, self.mainDataStore.selectedRepositoryData.commits.length);
                self.mainDataStore.selectedRepositoryData.commits
                    .push.apply(self.mainDataStore.selectedRepositoryData.commits, commits);
                self.mainDataStore.selectedRepositorySettings.set("commitsLoaded", true);
                self.mainDataStore.selectedRepositorySettings.set("commitsLoading", false);

                // Enable the search and clear buttons after loading
                dom.byId("viewAndSelectCommitsSearchButton").removeAttribute("disabled");
                dom.byId("viewAndSelectCommitsSearchClearButton").removeAttribute("disabled");
            };
            var commitsLoadErrorFunc = function (error) {
                self.mainDataStore.selectedRepositorySettings.set("commitsLoadError", error || "Unknown Error");

                // Enable the search and clear buttons after loading
                dom.byId("viewAndSelectCommitsSearchButton").removeAttribute("disabled");
                dom.byId("viewAndSelectCommitsSearchClearButton").removeAttribute("disabled");
            };
            var searchButtonClickFunc = function (event) {
                // Don't do anything if commits are already being loaded
                if (!self.mainDataStore.selectedRepositorySettings.get("commitsLoading")) {
                    var selectedRepository = self.mainDataStore.selectedRepositorySettings.get("repository");
                    var gitHost = self.mainDataStore.selectedRepositorySettings.get("gitHost");
                    var accessToken = self.mainDataStore.selectedRepositorySettings.get("accessToken");
                    var commitSha = self.commitsSearchInput.value;
                    var alreadyLinkedUrls = self.jazzRestService.getGitCommitLinksFromWorkItem(self.mainDataStore.workItem);

                    // Disable the search and clear buttons while loading
                    dom.byId("viewAndSelectCommitsSearchButton").setAttribute("disabled", "disabled");
                    dom.byId("viewAndSelectCommitsSearchClearButton").setAttribute("disabled", "disabled");

                    // Set the commitsLoading to true to prevent multiple requests
                    self.mainDataStore.selectedRepositorySettings.set("commitsLoading", true);
                    self.mainDataStore.selectedRepositorySettings.set("commitsLoaded", false);

                    if (commitSha) {
                        // Try to get the commit with the specified SHA
                        self.gitRestService.getCommitById(selectedRepository, gitHost, accessToken, commitSha, alreadyLinkedUrls)
                            .then(commitsLoadedFunc, commitsLoadErrorFunc);
                    } else {
                        // Get all commits if there is no SHA
                        self.gitRestService.getRecentCommits(selectedRepository, gitHost, accessToken, alreadyLinkedUrls)
                            .then(commitsLoadedFunc, commitsLoadErrorFunc);
                    }
                }
            };

            on(this.commitsFilterInput, "change", function (value) {
                self.setViewCommitsListFromStore(value);
            });

            on(dom.byId("viewAndSelectCommitsFilterClearButton"), "click", function (event) {
                self.commitsFilterInput.setValue("");
            });

            on(dom.byId("viewAndSelectCommitsSearchButton"), "click", searchButtonClickFunc);

            on(dom.byId("viewAndSelectCommitsSearchClearButton"), "click", function (event) {
                self.commitsSearchInput.setValue("");
                searchButtonClickFunc();
            });
        },

        watchDataStore: function () {
            var self = this;

            // Watch the store to know when the commits finished loading
            this.mainDataStore.selectedRepositorySettings.watch("commitsLoaded", function (name, oldValue, value) {
                if (value) {
                    // Commits finished loading, update the view
                    self.setViewCommitsListFromStore();
                } else {
                    // Commits are not loaded, reinitialize the view (loading...)
                    self.initializeViewCommitsList();
                }
            });

            // Watch the store to react when the list of commits changes (add / remove from commits to link list)
            this.mainDataStore.selectedRepositoryData.commits.watchElements(function () {
                // Only react if the commits have finished loading
                if (self.mainDataStore.selectedRepositorySettings.get("commitsLoaded")) {
                    // Update the local list of commits (and the view)
                    self.setViewCommitsListFromStore();
                }
            });
        },

        initializeViewCommitsList: function () {
            this.viewCommits = [{
                message: "Loading...",
                alreadyLinked: true
            }];

            // Clear the filter input
            this.commitsFilterInput.setValue("");

            // Draw the commits list in the view
            this.drawViewCommits();
            this.drawDetailsView();
        },

        setViewCommitsListFromStore: function (filterValue) {
            // Clone the store array
            this.viewCommits = lang.clone(this.mainDataStore.selectedRepositoryData.commits);

            array.forEach(this.viewCommits, function (commit) {
                commit.originalSha = commit.sha;
            });

            if (this.viewCommits.length < 1) {
                this.viewCommits = [{
                    message: "No commits found",
                    alreadyLinked: true
                }];
            } else {
                // Need to sort the viewCommits here (by date created -> newest on top)
                this.sortViewCommitsByDate();

                if (!filterValue) {
                    // Take the filter from the input if it wasn't passed in
                    filterValue = this.commitsFilterInput.value;
                }

                // Filter the view commits using the filter input text
                if (filterValue) {
                    this.filterViewCommitsByText(filterValue);
                }
            }

            // Draw the commits list in the view
            this.drawViewCommits();
            this.drawDetailsView();
        },

        // Draw the commits list from the view commits
        drawViewCommits: function () {
            var self = this;
            var commitsListNode = query("#viewAndSelectCommitsWrapper .rtcGitConnectorViewAndSelectList")[0];
            domConstruct.empty(commitsListNode);

            array.forEach(this.viewCommits, function (commit) {
                var commitListItem = domConstruct.create("div", {
                    "class": "rtcGitConnectorViewAndSelectListItem",
                    "data-commit-sha": commit.originalSha
                }, commitsListNode);

                on(commitListItem, "click", function (event) {
                    var commitSha = this.getAttribute("data-commit-sha");

                    if (!commit.alreadyLinked && ViewHelper.IsNodeInClass(event.target, "rtcGitConnectorViewAndSelectListItemButton")) {
                        // Remove the commit with the specified sha from the commits list in store and add to the selected list
                        if (commitSha) {
                            var selectedCommit = null;

                            for (var i = self.mainDataStore.selectedRepositoryData.commits.length - 1; i >= 0; i--) {
                                if (self.mainDataStore.selectedRepositoryData.commits[i].sha === commitSha) {
                                    selectedCommit = self.mainDataStore.selectedRepositoryData.commits.splice(i, 1)[0];
                                    break;
                                }
                            }

                            if (selectedCommit && !self.mainDataStore.selectedRepositoryData.commitsToLink.find(function (commit) {
                                return commit.sha === selectedCommit.sha;
                            })) {
                                self.mainDataStore.selectedRepositoryData.commitsToLink.push(selectedCommit);
                            }
                        }
                    } else {
                        // Select commit
                        self.setSelectedCommitBySha(commitSha);
                    }
                });

                var firstLine = commit.message.split(/\r?\n/g)[0];
                var secondLine = ViewHelper.GetCommitDateString(commit);
                var buttonName = "";
                var iconName;

                if (commit.alreadyLinked) {
                    domClass.add(commitListItem, "rtcGitConnectorViewAndSelectListItemAlreadyLinked");
                    buttonName = "emptyButton";
                    iconName = "check";
                } else {
                    iconName = "link";
                }

                ViewHelper.DrawListItem(commitListItem, firstLine, secondLine, buttonName, iconName);
            });
        },

        // Set the selected commit in the view using the commit sha
        setSelectedCommitBySha: function (commitSha) {
            var self = this;

            query("#viewAndSelectCommitsWrapper .rtcGitConnectorViewAndSelectList .rtcGitConnectorViewAndSelectListItem").forEach(function (node) {
                if (node.getAttribute("data-commit-sha") === commitSha) {
                    domClass.add(node, "selected");
                } else {
                    domClass.remove(node, "selected");
                }
            });

            array.forEach(this.viewCommits, function (commit) {
                if (commit.originalSha === commitSha) {
                    self.drawDetailsView(commit);
                }
            });
        },

        // Draw the details view for the selected commit
        drawDetailsView: function (commit) {
            var commitDetailsNode = query("#viewAndSelectCommitsWrapper .rtcGitConnectorViewAndSelectDetails")[0];
            domConstruct.empty(commitDetailsNode);

            domConstruct.create("span", {
                "class": "rtcGitConnectorViewAndSelectDetailsSpan rtcGitConnectorViewAndSelectDetailsLabel",
                innerHTML: "Commit Details"
            }, commitDetailsNode);

            if (!commit) {
                domConstruct.create("span", {
                    "class": "rtcGitConnectorViewAndSelectDetailsSpan",
                    innerHTML: "Select a commit to view more details"
                }, commitDetailsNode);
            } else {
                ViewHelper.AddToDetailsViewNode(commitDetailsNode, "Message: ", commit.message.replace(/(\r\n|\n|\r)/gm, "<br />"));
                ViewHelper.AddToDetailsViewNode(commitDetailsNode, "Author: ", commit.authorName + " (" + commit.authorEmail + ")");
                ViewHelper.AddToDetailsViewNode(commitDetailsNode, "Date: ", new Date(commit.authoredDate).toString());
                ViewHelper.AddToDetailsViewNode(commitDetailsNode, "SHA: ", commit.sha);
                var linkNode = domConstruct.create("a", {
                    innerHTML: "Open this commit in a new tab",
                    href: commit.webUrl,
                    target: "_blank"
                });
                ViewHelper.AddLinkToDetailsViewNode(commitDetailsNode, "Web Link: ", linkNode);
            }
        },

        // Sort the view commits by the authoredDate
        sortViewCommitsByDate: function () {
            this.viewCommits = ViewHelper.SortListDataByDate("authoredDate", this.viewCommits);
        },

        // Filter the view commits using the filter text.
        // Only keep commits that contain the filter text either
        // in the commit message or commit author name or sha or email
        filterViewCommitsByText: function (filterText) {
            this.viewCommits = ViewHelper.FilterListDataByText(filterText,
                ["sha", "message", "authorName", "authorEmail"],
                this.viewCommits);
        }
    });
});