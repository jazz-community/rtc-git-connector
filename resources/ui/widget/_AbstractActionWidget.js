// summary:
// Abstract widget for custom action widgets inside HoverViews.
//
// Don't instantiate this class.
//
// minWidth: Double
// Pixel width of widget.
//
// Description:
//  Needs a minimum width so that it gets positioned correctly.
//  This is for random reasons: widgets that aren't wide enough aren't
//  placed properly in the flow of the dom. All the standard jazz widgets
//  are wide enough for this quirky behavior to not surface. The minimum
//  distance a widget needs to cover is
//  [rightViewPortEdge] - [horizontalButtonPosition] so that the widget is
//  pushed into the right flow position

define([
        "dojo/_base/declare",
        "dijit/_WidgetBase"
], function (declare, _WidgetBase) {
    return declare([_WidgetBase], {

        // Set the work item property for inheriting classes
        constructor: function (minWidth, params) {
            this.style = {
                minWidth: minWidth + "px",
                maxWidth: (minWidth * 2.5) + "px"
            };

            this.workItem = params;
            this.workingCopy = params.workingCopy;
        }
    });
});