define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/dom-construct",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./DetailsPane.html",
    "jazz/css!./DetailsPane.css"
], function (declare, array, domConstruct, _WidgetBase, _TemplatedMixin, template) {
    return declare(
        "com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.detailsPane",
        [_WidgetBase, _TemplatedMixin],
        {
            templateString: template,

            /**
             * Clear the pane and set it to new content.
             * @param {String} title The title of the details pane.
             * @param {Object[]} items The list of items to be displayed as rows.
             * @param {String} items[].label An optional label for the row.
             * @param {String} items[].text The text to display in the row.
             * @param {String} items[].link An optional link to attach to the text.
             * @param {Object} items[].node An optional dom node. Used instead of text when present.
             */
            setContent: function (title, items) {
                this._clearContent();
                this._addTitleNode(title);
                this._addDetailsRows(items);
            },

            _clearContent: function () {
                domConstruct.empty(this.domNode);
            },

            _addTitleNode: function (title) {
                domConstruct.create(
                    "span",
                    {
                        "class": "rtcGitConnectorViewAndSelectDetailsSpan rtcGitConnectorViewAndSelectDetailsLabel",
                        innerHTML: title
                    },
                    this.domNode
                );
            },

            _addDetailsRows: function (items) {
                var self = this;

                if (items && items.length) {
                    array.forEach(items, function (item) {
                        if (item && (item.text || item.node)) {
                            self._addItemAsRow(item);
                        }
                    });
                }
            },

            _addItemAsRow: function (item) {
                var detailsRowSpan = domConstruct.create(
                    "span",
                    {
                        "class": "rtcGitConnectorViewAndSelectDetailsSpan"
                    },
                    this.domNode
                );

                if (item.label) {
                    domConstruct.create(
                        "span",
                        {
                            "class": "rtcGitConnectorViewAndSelectDetailsLabel",
                            innerHTML: item.label
                        },
                        detailsRowSpan
                    );
                }

                if (item.node) {
                    // Add the node
                    domConstruct.place(item.node, detailsRowSpan);
                } else if (item.link) {
                    // Create a link
                    domConstruct.create(
                        "a",
                        {
                            innerHTML: item.text,
                            href: item.link,
                            target: "_blank"
                        },
                        detailsRowSpan
                    );
                } else {
                    // Just text
                    domConstruct.create(
                        "span",
                        {
                            innerHTML: item.text
                        },
                        detailsRowSpan
                    );
                }
            }
        }
    );
});
