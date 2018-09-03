define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-style",
    "../../services/MainDataStore",
    "../../js/ViewHelper",
    "../ListItem/ListItem",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./ViewCommitsToLink.html"
], function (declare, array, lang, domConstruct, domStyle,
    MainDataStore, ViewHelper, ListItem,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.viewCommitsToLink",
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
    {
        templateString: template,
        mainDataStore: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
        },

        startup: function () {
            this.watchDataStore();
        },

        watchDataStore: function () {
            var self = this;

            // React when commits are added or removed from the commits to link list
            this.mainDataStore.selectedRepositoryData.commitsToLink.watchElements(function () {
                if (self.mainDataStore.selectedRepositoryData.commitsToLink.length > 0) {
                    // show commits to link list
                    domStyle.set("viewCommitsToLinkContainer", "display", "block");
                    domStyle.set("rtcGitConnectorCommitsListToLink", "width", "100%");
                    domStyle.set("rtcGitConnectorCommitsListToLink", "margin-right", "10px");
                } else {
                    // hide commits to link list
                    domStyle.set("rtcGitConnectorCommitsListToLink", "width", "0");
                    domStyle.set("rtcGitConnectorCommitsListToLink", "margin-right", "0");
                    domStyle.set("viewCommitsToLinkContainer", "display", "none");
                }

                self.drawCommitsToLink(self.mainDataStore.selectedRepositoryData.commitsToLink);
            });
        },

        // Draw the commits to link list in the view
        drawCommitsToLink: function (commitsToLink) {
            var self = this;
            domConstruct.empty(this.listItemsContainer);

            array.forEach(commitsToLink, function (commit) {
                var listItem = new ListItem(commit.sha);
                listItem.set("title", commit.message.split(/\r?\n/g)[0]);
                listItem.set("details", ViewHelper.GetCommitDateString(commit));
                listItem.set("buttonType", "trash");
                listItem.set("notClickable", true);

                listItem.onButtonClick = lang.hitch(self, self.listItemButtonClick);

                commit.listItem = listItem;
                domConstruct.place(listItem.domNode, self.listItemsContainer);
            });

            // Get the mainDialog and resize to fit the new content
            ViewHelper.ResizeMainDialog();
        },

        // Remove the commit with the specified sha from the commits to link list in store and add to the commits list
        listItemButtonClick: function (itemId) {
            var selectedCommit = null;

            for (var i = this.mainDataStore.selectedRepositoryData.commitsToLink.length - 1; i >= 0; i--) {
                if (this.mainDataStore.selectedRepositoryData.commitsToLink[i].sha === itemId) {
                    selectedCommit = this.mainDataStore.selectedRepositoryData.commitsToLink.splice(i, 1)[0];
                    break;
                }
            }

            if (selectedCommit && !this.mainDataStore.selectedRepositoryData.commits.find(function (commit) {
                return commit.sha === selectedCommit.sha;
            })) {
                this.mainDataStore.selectedRepositoryData.commits.push(selectedCommit);
            }
        }
    });
});