define([
    "dojo/_base/declare"
], function (declare) {
    // Return an instance so that the functions can be used as if they were static
    return new function () {
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
                for (var i = 0; i < filterBy.length; i++) {
                    var lowerCaseString = item[filterBy[i]].toString().toLowerCase();
                    if (lowerCaseString.indexOf(filterText) > -1) {
                        item[filterBy[i]] = self.HighlightTextInString(filterText, lowerCaseString);
                        return true;
                    }
                }
                return false;
            });
        };

        this.HighlightTextInString = function (searchText, fullText) {
            var startIndex;
            if (searchText && (startIndex = fullText.indexOf(searchText)) > -1) {
                var beforeFound = fullText.slice(0, startIndex);
                var found = fullText.slice(startIndex, startIndex + searchText.length);
                var afterFound = self.HighlightTextInString(searchText, fullText.slice(startIndex + searchText.length));
                fullText = beforeFound + "<b class='rtcGitConnectorHighlightText'>" + found + "</b>" + afterFound;
            }
            return fullText;
        };

        // Checks if the node or any of it's parents have the class name
        this.IsNodeInClass = function (node, className) {
            if (node.classList && node.classList.contains(className)) {
                return true;
            }

            if (node.parentNode) {
                return self.IsNodeInClass(node.parentNode, className);
            }

            return false;
        };
    };
});