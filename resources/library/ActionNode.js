// summary:
//		Class for methods related to custom actions. These are helper methods
//		that should facilitate working with custom view actions.
//
//	cssSelector: String
//		A basic css selector for selecting nodes in the dom.
//		Example: "img.button-img"
//
//	nodeLabel: String
//		Alt text to search for. This is necessary for being able to select the
//		dom node created by a custom action. As we are limited to the node
//		information that we can declare in plugin.xml, we sadly have to select
//		a node based on the alt-text. 
//		<b>Make sure this is unique in the dom!</b>

define([
        "dojo/_base/declare",
        "dojo/query",
        "dojo/window"
], function(declare, query, window) {

	var ViewUtils = com.ibm.team.rtc.foundation.web.ui.views.ViewUtils;

	return declare(null, {

		constructor: function(cssSelector, nodeLabel) {
			this._queryString = cssSelector + "[alt=" + nodeLabel + "]";
		},
		
//	summary:
//		Returns the current position of the ActionNode in the dom. Uses the
//		getDomNodePosition function provided by Jazz ViewUtils instead of the
//		native dojo/dom-geometry::position() function because of the included
//		vertical offset. Will throw warnings because of deprecated function
//		usage in ViewUtils :-/
//		
//	returns: Position {x, y}
//		Current dom coordinates.
//
// exception:
//		TypeError: Node is null
//		Combination of selector + label cannot be found.
//		On nodeList.pop();
//
//	description:
//		this is fairly hacky because it uses the label text passed to the
//		toolbar action for finding the correct dom-node. However, for 
//		custom web-ui actions, there seems to be no other way to imitate 
//		the behaviour of other widgets shown in hoverviews, such as 
//		CreateWorkItemCopyAction. It will only work on the last item
//		added to the dom, as this is the required functionality for our
//		use case. This is because, when using the browser history 
//		functions, the dom is conserved and not rebuilt. Therefore, we
//		need to work with the most recently added node with the selector
//		+ label combination.
		getPosition: function() {
			var nodeList = query(this._queryString);
			var node = nodeList.pop();
			return ViewUtils.getDomNodePosition(node);
		},
		
		calculateMinWidth: function() {
			var currentPosition = this.getPosition();
			var viewPort = window.getBox();
			return viewPort.w - currentPosition.x;
		}
	});
});