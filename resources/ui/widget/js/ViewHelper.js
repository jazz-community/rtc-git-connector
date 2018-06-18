define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/query",
    "dijit/registry"
], function (declare, domConstruct, query, registry) {
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

        // Resize the main dialog to fit the content. Reset the scroll
        // height to the previous value afterwards (otherwise the
        // scroll is reset to the top every time the dialog is resized).
        this.ResizeMainDialog = function () {
            var mainDialog = registry.byId("connectWithGitMainDialog");
            var paneContentNode = query(".dijitDialogPaneContent", mainDialog.domNode)[0];
            var originalScrollTop = paneContentNode.scrollTop;
            mainDialog.resize();
            mainDialog.resize(); // The second time it fixes the positioning
            paneContentNode.scrollTo(0, originalScrollTop);
        };

        // Details view node creators
        this.AddToDetailsViewNode = function (detailsViewNode, label, value) {
            var messageNode = self.CreateDetailsViewSpan(detailsViewNode, label);
            domConstruct.create("span", {
                innerHTML: value
            }, messageNode);
        };

        this.AddLinkToDetailsViewNode = function (detailsViewNode, label, linkNode) {
            var messageNode = self.CreateDetailsViewSpan(detailsViewNode, label);
            domConstruct.place(linkNode, messageNode);
        };

        this.CreateDetailsViewSpan = function (detailsViewNode, label) {
            var messageNode = domConstruct.create("span", {
                "class": "rtcGitConnectorViewAndSelectDetailsSpan"
            }, detailsViewNode);
            domConstruct.create("span", {
                "class": "rtcGitConnectorViewAndSelectDetailsLabel",
                innerHTML: label
            }, messageNode);

            return messageNode;
        };

        // List item view node creators
        this.DrawListItem = function (listItem, firstLine, secondLine, buttonName, iconName) {
            var fontAwesome = com_siemens_bt_jazz_rtcgitconnector_modules.FontAwesome;
            var icon = fontAwesome.icon({ prefix: 'fas', iconName: iconName });
            domConstruct.create("div", {
                "class": "rtcGitConnectorViewAndSelectListItemButton " + buttonName,
                innerHTML: icon.html[0]
            }, listItem);

            var listItemContent = domConstruct.create("div", {
                "class": "rtcGitConnectorViewAndSelectListItemContent"
            }, listItem);

            domConstruct.create("span", {
                "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListFirstLine",
                innerHTML: firstLine
            }, listItemContent);

            domConstruct.create("span", {
                "class": "rtcGitConnectorSelectListSpan rtcGitConnectorSelectListSecondLine",
                innerHTML: secondLine
            }, listItemContent);
        };
    };
});