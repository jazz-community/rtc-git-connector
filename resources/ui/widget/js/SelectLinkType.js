define([
    "dojo/_base/declare",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/on",
    "dojo/query",
    "./DataStores/MainDataStore",
    "./RestServices/GitRestService",
    "./ViewAndSelectCommits",
    "./ViewAndSelectIssues",
    "./ViewAndSelectRequests",
    "./ViewCommitsToLink",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!../templates/SelectLinkType.html"
], function (declare, dom, domClass, domStyle, on, query,
    MainDataStore, GitRestService,
    ViewAndSelectCommits, ViewAndSelectIssues, ViewAndSelectRequests,
    ViewCommitsToLink,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.selectLinkType",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,
        gitRestService: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
            this.gitRestService = GitRestService.getInstance();
        },

        startup: function () {
            // Manually call the startup method of custom widgets used in the template
            this.viewAndSelectCommits.startup();
            this.viewAndSelectIssues.startup();
            this.viewAndSelectRequests.startup();
            this.viewCommitsToLink.startup();

            this.watchDataStore();
            this.setEventHandlers();
        },

        watchDataStore: function () {
            var self = this;

            // React when the selected repository link type changes in the store
            this.mainDataStore.selectedRepositorySettings.watch("linkType", function (name, oldValue, value) {
                var selectedRepository = self.mainDataStore.selectedRepositorySettings.get("repository");
                var gitHost = self.mainDataStore.selectedRepositorySettings.get("gitHost");
                var accessToken = self.mainDataStore.selectedRepositorySettings.get("accessToken");

                // Hide the hole widget if the linkType is null
                domStyle.set("rtcGitConnectorSelectLinkTypeContainer", "display", value === null ? "none" : "block");

                // Hide the error (if any)
                self.hideLoadingDataError();

                // Set the selected type in the view
                if (value !== null) {
                    self.setSelectedLinkType(value);
                    self.setRequestsText(gitHost);
                }

                // Only show the widget for the selected link type
                self.showViewAndSelectWidget(value);

                if (value === "COMMIT" && !self.mainDataStore.selectedRepositorySettings.get("commitsLoaded")) {
                    // Get commits from host if not already loaded
                    self.gitRestService.getRecentCommits(selectedRepository, gitHost, accessToken).then(function (commits) {
                        // Set the list in the store and set commitsLoaded to true.
                        console.log("got commits: ", commits);
                        self.mainDataStore.selectedRepositoryData.commits
                            .push.apply(self.mainDataStore.selectedRepositoryData.commits, commits);
                        self.mainDataStore.selectedRepositorySettings.set("commitsLoaded", true);
                    }, function (error) {
                        self.showLoadingDataError(error);
                    });

                } else if (value === "ISSUE" && !self.mainDataStore.selectedRepositorySettings.get("issuesLoaded")) {
                    // Get issues from host if not already loaded
                    self.gitRestService.getRecentIssues(selectedRepository, gitHost, accessToken).then(function (issues) {
                        // Set the list in the store and set issuesLoaded to true.
                        console.log("got issues: ", issues);
                        self.mainDataStore.selectedRepositoryData.issues
                            .push.apply(self.mainDataStore.selectedRepositoryData.issues, issues);
                        self.mainDataStore.selectedRepositorySettings.set("issuesLoaded", true);
                    }, function (error) {
                        self.showLoadingDataError(error);
                    });

                } else if (value === "REQUEST" && !self.mainDataStore.selectedRepositorySettings.get("requestsLoaded")) {
                    // Get requests from host if not already loaded
                    self.gitRestService.getRecentRequests(selectedRepository, gitHost, accessToken).then(function (requests) {
                        // Set the list in the store and set the requestsLoaded to true.
                        console.log("got requests: ", requests);
                        self.mainDataStore.selectedRepositoryData.requests
                            .push.apply(self.mainDataStore.selectedRepositoryData.requests, requests);
                        self.mainDataStore.selectedRepositorySettings.set("requestsLoaded", true);
                    }, function (error) {
                        self.showLoadingDataError(error);
                    });
                }
            });
        },

        setEventHandlers: function () {
            var self = this;

            // Set the clicked link type in the data store
            query(".rtcGitConnectorSelectLinkType").on(".linkTypeItem:click", function (event) {
                self.mainDataStore.selectedRepositorySettings.set("linkType", event.target.getAttribute("data-link-type"));
            });
        },

        // Add the selected class to the specified type. Remove it from the other types
        setSelectedLinkType: function (linkType) {
            query(".rtcGitConnectorSelectLinkType .linkTypeItem").forEach(function (node) {
                if (node.getAttribute("data-link-type") === linkType) {
                    domClass.add(node, "selected");
                } else {
                    domClass.remove(node, "selected");
                }
            });
        },

        // Set the requests text to Pull Requests for GitHub or Merge Requests for GitLab
        setRequestsText: function (gitHost) {
            var requestsText = "Requests";

            if (gitHost === "GITHUB") {
                requestsText = "Pull " + requestsText;
            } else if (gitHost === "GITLAB") {
                requestsText = "Merge " + requestsText;
            }

            // Find the element using the data attribute
            query(".rtcGitConnectorSelectLinkType .linkTypeItem[data-link-type='REQUEST']")[0].innerHTML = requestsText;
        },

        // Probably an incorrect repository configuration. Show an error and hide the list view (all three?).
        showLoadingDataError: function (message) {
            var errorStart = "There was a problem and the data could not be loaded.<br/>" +
                    "This is likely due to an incorrect configuration of the repository in Jazz.<br/>" +
                    "Please check that the host is available and that the repository URL is correct." +
                    "<br/><br/>";
            dom.byId("errorLoadingDataFromHostContainer").innerHTML = errorStart + message;
            domStyle.set("errorLoadingDataFromHostContainer", "display", "block");
            this.showViewAndSelectWidget("");
        },

        hideLoadingDataError: function () {
            domStyle.set("errorLoadingDataFromHostContainer", "display", "none");
            dom.byId("errorLoadingDataFromHostContainer").innerHTML = "";
        },

        showViewAndSelectWidget: function (linkType) {
            query(".rtcGitConnectorViewAndSelectContainer").forEach(function (node) {
                var displayValue = (node.getAttribute("data-link-type") === linkType)
                    ? "block"
                    : "none";

                domStyle.set(node, "display", displayValue);
            });
        }
    });
});