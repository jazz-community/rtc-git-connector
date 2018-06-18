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
        fontAwesome: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
            this.jazzRestService = JazzRestService.getInstance();
            this.gitRestService = GitRestService.getInstance();

            if (typeof com_siemens_bt_jazz_rtcgitconnector_modules !== 'undefined') {
                this.fontAwesome = com_siemens_bt_jazz_rtcgitconnector_modules.FontAwesome;
            }
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

                if (commit.alreadyLinked) {
                    var check = self.fontAwesome.icon({prefix: 'fas', iconName: 'check'});
                    domClass.add(commitListItem, "rtcGitConnectorViewAndSelectListItemAlreadyLinked");
                    domConstruct.create("div", {
                        "class": "rtcGitConnectorViewAndSelectListItemButton emptyButton",
                        innerHTML: check.html[0]
                    }, commitListItem);
                } else {
                    var link = self.fontAwesome.icon({prefix: 'fas', iconName: 'link'});
                    domConstruct.create("div", {
                        "class": "rtcGitConnectorViewAndSelectListItemButton",
                        innerHTML: link.html[0]
                    }, commitListItem);
                }

                var commitListItemContent = domConstruct.create("div", {
                    "class": "rtcGitConnectorViewAndSelectListItemContent"
                }, commitListItem);

                domConstruct.create("span", {
                    "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListFirstLine",
                    innerHTML: commit.message.split(/\r?\n/g)[0]
                }, commitListItemContent);

                if (commit.authoredDate) {
                    var commitDate = new Date(commit.authoredDate);
                    domConstruct.create("span", {
                        "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListSecondLine",
                        innerHTML: commit.authorName + " committed on " + commitDate.toDateString() + " at " + ("00" + commitDate.getHours()).slice(-2) + ":" + ("00" + commitDate.getMinutes()).slice(-2)
                    }, commitListItemContent);
                } else {
                    domConstruct.create("span", {
                        "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListSecondLine",
                        innerHTML: "&nbsp;"
                    }, commitListItemContent);
                }
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
                this.addToDetailsViewNode(commitDetailsNode, "Message: ", commit.message.replace(/(\r\n|\n|\r)/gm, "<br />"));
                this.addToDetailsViewNode(commitDetailsNode, "Author: ", commit.authorName + " (" + commit.authorEmail + ")");
                this.addToDetailsViewNode(commitDetailsNode, "Date: ", new Date(commit.authoredDate).toString());
                this.addToDetailsViewNode(commitDetailsNode, "SHA: ", commit.sha);
                var linkNode = domConstruct.create("a", {
                    innerHTML: "Open this commit in a new tab",
                    href: commit.webUrl,
                    target: "_blank"
                });
                this.addLinkToDetailsViewNode(commitDetailsNode, "Web Link: ", linkNode);
            }
        },

        addToDetailsViewNode: function (detailsViewNode, label, value) {
            var commitMessageNode = this.createDetailsViewSpan(detailsViewNode, label);
            domConstruct.create("span", {
                innerHTML: value
            }, commitMessageNode);
        },

        addLinkToDetailsViewNode: function (detailsViewNode, label, linkNode) {
            var commitMessageNode = this.createDetailsViewSpan(detailsViewNode, label);
            domConstruct.place(linkNode, commitMessageNode);
        },

        createDetailsViewSpan: function (detailsViewNode, label) {
            var commitMessageNode = domConstruct.create("span", {
                "class": "rtcGitConnectorViewAndSelectDetailsSpan"
            }, detailsViewNode);
            domConstruct.create("span", {
                "class": "rtcGitConnectorViewAndSelectDetailsLabel",
                innerHTML: label
            }, commitMessageNode);

            return commitMessageNode;
        },

        // Sort the view commits by the authoredDate
        sortViewCommitsByDate: function () {
            var self = this;

            // Create a temp array so that the date objects are only created once
            var tempArray = this.viewCommits.map(function (el, i) {
                return {
                    index: i,
                    value: new Date(el.authoredDate).getTime()
                };
            });

            // Sort the temp array
            tempArray.sort(function (a, b) {
                return b.value - a.value;
            });

            // Get a sorted version of the original array
            var sortedArray = tempArray.map(function (el) {
                return self.viewCommits[el.index];
            });

            // Use the sorted array
            this.viewCommits = sortedArray;
        },

        // Filter the view commits using the filter text.
        // Only keep commits that contain the filter text either
        // in the commit message or commit author name or sha or email
        filterViewCommitsByText: function (filterText) {
            filterText = filterText.toLowerCase();
            this.viewCommits = this.viewCommits.filter(function (commit) {
                return commit.sha.toLowerCase().indexOf(filterText) > -1 ||
                    commit.message.toLowerCase().indexOf(filterText) > -1 ||
                    commit.authorName.toLowerCase().indexOf(filterText) > -1 ||
                    commit.authorEmail.toLowerCase().indexOf(filterText) > -1;
            });
            ViewHelper.HighlightFilterText(filterText, ["sha", "message", "authorName", "authorEmail"], this.viewCommits);
        }
    });
});