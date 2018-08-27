define([
    "dojo/_base/declare",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/on",
    "dojo/query",
    "../../services/MainDataStore",
    "../../services/JazzRestService",
    "../../services/GitRestService",
    "../ViewAndSelectCommits/ViewAndSelectCommits",
    "../ViewAndSelectIssues/ViewAndSelectIssues",
    "../../js/ViewAndSelectRequests",
    "../../js/ViewCommitsToLink",
    "../../js/ViewIssuesToLink",
    "../../js/ViewRequestsToLink",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./SelectLinkType.html"
], function (declare, dom, domClass, domStyle, on, query,
    MainDataStore, JazzRestService, GitRestService,
    ViewAndSelectCommits, ViewAndSelectIssues, ViewAndSelectRequests,
    ViewCommitsToLink, ViewIssuesToLink, ViewRequestsToLink,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.selectLinkType",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,
        jazzRestService: null,
        gitRestService: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
            this.jazzRestService = JazzRestService.getInstance();
            this.gitRestService = GitRestService.getInstance();
        },

        startup: function () {
            // Manually call the startup method of custom widgets used in the template
            this.viewAndSelectCommits.startup();
            this.viewAndSelectIssues.startup();
            this.viewAndSelectRequests.startup();
            this.viewCommitsToLink.startup();
            this.viewIssuesToLink.startup();
            this.viewRequestsToLink.startup();

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
                var loadingError = null;

                // Hide the error (if any)
                self.hideLoadingDataError();

                if (value === null) {
                    domStyle.set("rtcGitConnectorSelectLinkTypeContainer", "display", "none");
                    self.showViewAndSelectWidget("");
                    return;
                }

                // Hide the hole widget if the linkType is null
                domStyle.set("rtcGitConnectorSelectLinkTypeContainer", "display", "block");

                loadingError = self.mainDataStore.selectedRepositorySettings.get(value.toLowerCase() + "sLoadError");

                // Set the selected type in the view
                self.setSelectedLinkType(value);
                self.setRequestsText(gitHost);

                if (loadingError) {
                    self.showLoadingDataError(loadingError);
                } else {
                    // Only show the widget for the selected link type
                    self.showViewAndSelectWidget(value);
                }

                if (!self.mainDataStore.selectedRepositorySettings.get("issuesLoaded") &&
                        !self.mainDataStore.selectedRepositorySettings.get("issuesLoading")) {
                    // Set the issuesLoading to true to prevent multiple requests
                    self.mainDataStore.selectedRepositorySettings.set("issuesLoading", true);

                    // Get issues from host if not already loaded
                    self.gitRestService.getRecentIssues(selectedRepository, gitHost, accessToken,
                        self.jazzRestService.getIssueLinksFromWorkItem(self.mainDataStore.workItem)).then(function (issues) {
                        // Set the list in the store and set issuesLoaded to true.
                        // Clear the list first just incase the function is run multiple times due to slow loading
                        self.mainDataStore.selectedRepositoryData.issues
                            .splice(0, self.mainDataStore.selectedRepositoryData.issues.length);
                        self.mainDataStore.selectedRepositoryData.issues
                            .push.apply(self.mainDataStore.selectedRepositoryData.issues, issues);
                        self.mainDataStore.selectedRepositorySettings.set("issuesLoaded", true);
                        self.mainDataStore.selectedRepositorySettings.set("issuesLoading", false);
                    }, function (error) {
                        self.mainDataStore.selectedRepositorySettings.set("issuesLoadError", error || "Unknown Error");
                        self.showLoadingDataError(error);
                    });
                }

                if (!self.mainDataStore.selectedRepositorySettings.get("requestsLoaded") &&
                        !self.mainDataStore.selectedRepositorySettings.get("requestsLoading")) {
                    // Set the requestsLoading to true to prevent multiple requests
                    self.mainDataStore.selectedRepositorySettings.set("requestsLoading", true);

                    // Get requests from host if not already loaded
                    self.gitRestService.getRecentRequests(selectedRepository, gitHost, accessToken,
                        self.jazzRestService.getRequestLinksFromWorkItem(self.mainDataStore.workItem)).then(function (requests) {
                        // Set the list in the store and set the requestsLoaded to true.
                        // Clear the list first just incase the function is run multiple times due to slow loading
                        self.mainDataStore.selectedRepositoryData.requests
                            .splice(0, self.mainDataStore.selectedRepositoryData.requests.length);
                        self.mainDataStore.selectedRepositoryData.requests
                            .push.apply(self.mainDataStore.selectedRepositoryData.requests, requests);
                        self.mainDataStore.selectedRepositorySettings.set("requestsLoaded", true);
                        self.mainDataStore.selectedRepositorySettings.set("requestsLoading", false);
                    }, function (error) {
                        self.mainDataStore.selectedRepositorySettings.set("requestsLoadError", error || "Unknown Error");
                        self.showLoadingDataError(error);
                    });
                }

                if (!self.mainDataStore.selectedRepositorySettings.get("commitsLoaded") &&
                        !self.mainDataStore.selectedRepositorySettings.get("commitsLoading")) {
                    // Set the commitsLoading to true to prevent multiple requests
                    self.mainDataStore.selectedRepositorySettings.set("commitsLoading", true);

                    // Get commits from host if not already loaded
                    self.gitRestService.getRecentCommits(selectedRepository, gitHost, accessToken,
                        self.jazzRestService.getGitCommitLinksFromWorkItem(self.mainDataStore.workItem)).then(function (commits) {
                        // Set the list in the store and set commitsLoaded to true.
                        // Clear the list first just incase the function is run multiple times due to slow loading
                        self.mainDataStore.selectedRepositoryData.commits
                            .splice(0, self.mainDataStore.selectedRepositoryData.commits.length);
                        self.mainDataStore.selectedRepositoryData.commits
                            .push.apply(self.mainDataStore.selectedRepositoryData.commits, commits);
                        self.mainDataStore.selectedRepositorySettings.set("commitsLoaded", true);
                        self.mainDataStore.selectedRepositorySettings.set("commitsLoading", false);
                    }, function (error) {
                        self.mainDataStore.selectedRepositorySettings.set("commitsLoadError", error || "Unknown Error");
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
            var requestsText = gitHost.requestPrefix + "Requests";

            // Find the element using the data attribute
            query(".rtcGitConnectorSelectLinkType .linkTypeItem[data-link-type='REQUEST']")[0].innerHTML = requestsText;
            query(".rtcGitConnectorViewAndSelectContainer[data-link-type='REQUEST'] .rtcGitConnectorLabelText")[0].innerHTML = "Recent " + requestsText;
            query("#viewRequestsToLinkContainer .rtcGitConnectorLabelText")[0].innerHTML = requestsText + " to link";
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