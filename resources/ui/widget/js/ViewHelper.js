define(["dojo/_base/declare", "dojo/dom-construct", "dojo/query", "dijit/registry"], function (
    declare,
    domConstruct,
    query,
    registry
) {
    // Return an instance so that the functions can be used as if they were static
    return new (function () {
        var self = this;

        // Sort a list of items by the date contained in the specified property
        this.SortListDataByDate = function (dateProperty, listData) {
            // Create a temp array so that the date objects are only created once
            var tempArray = listData.map(function (el, i) {
                return {
                    index: i,
                    value: new Date(el[dateProperty]).getTime()
                };
            });

            // Sort the temp array
            tempArray.sort(function (a, b) {
                return b.value - a.value;
            });

            // Get a sorted version of the original array
            var sortedArray = tempArray.map(function (el) {
                return listData[el.index];
            });

            // Return the sorted array
            return sortedArray;
        };

        // Filter a list of items by the specified properties and
        // highlight the text where found
        this.FilterListDataByText = function (filterText, filterBy, filterResult) {
            filterText = filterText.toLowerCase();
            return filterResult.filter(function (item) {
                var keepItem = false;
                for (var i = 0; i < filterBy.length; i++) {
                    if (item[filterBy[i]].toString().toLowerCase().indexOf(filterText) > -1) {
                        item[filterBy[i]] = self.HighlightTextInString(filterText, item[filterBy[i]].toString());
                        keepItem = true;
                    }
                }
                return keepItem;
            });
        };

        this.HighlightTextInString = function (searchText, fullText) {
            var startIndex;
            if (searchText && (startIndex = fullText.toLowerCase().indexOf(searchText)) > -1) {
                var beforeFound = fullText.slice(0, startIndex);
                var found = fullText.slice(startIndex, startIndex + searchText.length);
                var afterFound = self.HighlightTextInString(searchText, fullText.slice(startIndex + searchText.length));
                fullText = beforeFound + "<b class='rtcGitConnectorHighlightText'>" + found + "</b>" + afterFound;
            }
            return fullText;
        };

        // Resize the main dialog to fit the content. Reset the scroll
        // height to the previous value afterwards (otherwise the
        // scroll is reset to the top every time the dialog is resized).
        this.ResizeMainDialog = function () {
            // Use a timeout to wait for the css transitions to finish before resizing
            setTimeout(function () {
                var mainDialog = registry.byId("connectWithGitMainDialog");
                var paneContentNode = query(".dijitDialogPaneContent", mainDialog.domNode)[0];
                var originalScrollTop = paneContentNode.scrollTop;
                mainDialog.resize();
                mainDialog.resize(); // The second time it fixes the positioning
                paneContentNode.scrollTo(0, originalScrollTop);
            }, 400);
        };

        // Create a string with information about who created the commit and when
        this.GetCommitDateString = function (commit) {
            var commitDateString;

            if (commit.authoredDate) {
                commitDateString =
                    commit.authorName + " committed on " + self.GetFormattedDateFromString(commit.authoredDate);
            } else {
                commitDateString = "&nbsp;";
            }

            return commitDateString;
        };

        // Create a string with information about who created the issue or request and when
        this.GetIssueOrRequestDateString = function (issueOrRequest) {
            var issueOrRequestDateString;

            if (issueOrRequest.openedDate) {
                issueOrRequestDateString =
                    "#" +
                    issueOrRequest.id +
                    " opened by " +
                    issueOrRequest.openedBy +
                    " on " +
                    self.GetFormattedDateFromString(issueOrRequest.openedDate);
            } else {
                issueOrRequestDateString = "&nbsp;";
            }

            return issueOrRequestDateString;
        };

        // Create and format a date from a string
        this.GetFormattedDateFromString = function (dateString) {
            var dateObject = new Date(dateString);
            return (
                dateObject.toDateString() +
                " at " +
                self.FrontPadWithZeros(dateObject.getHours()) +
                ":" +
                self.FrontPadWithZeros(dateObject.getMinutes())
            );
        };

        // Add zeros to the front if the passed in time has less than two digits
        this.FrontPadWithZeros = function (hoursOrMinutes) {
            return ("00" + hoursOrMinutes).slice(-2);
        };
    })();
});
