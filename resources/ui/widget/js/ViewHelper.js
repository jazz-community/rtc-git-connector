define([
    "dojo/_base/declare"
], function (declare) {
    // Return an instance so that the functions can be used as if they were static
    return new function () {
        var self = this;

        this.HighlightFilterText = function (filterText, filterBy, filterResult) {
            for (var i=0; i < filterResult.length; i++) {
                for (var j=0; j < filterBy.length; j++) {
                    filterResult[i][filterBy[j]] = self.HighlightTextInString(filterText, filterResult[i][filterBy[j]]);
                }
            }
        };

        this.HighlightTextInString = function (searchText, fullText) {
            var startIndex;
            if (searchText.toLowerCase() && (startIndex = fullText.toLowerCase().indexOf(searchText)) > -1) {
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