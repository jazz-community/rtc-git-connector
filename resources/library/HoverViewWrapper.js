// summary:
//		Creates a new HoverView at 'position' containing 'widget'. Internally
//		just creates a HoverView with some custom behaviour for creating
//		HoverViews for custom actions that aren't created by the 
//		WorkItemEditorHeader class.
//
//		This class is necessary because creating HoverViews is not intended
//		by custom actions. It's pretty much a reverse-engineered hack for
//		creating custom HoverViews.
//
//	WARNING:
//		In order for this to work as intended, the HoverView must be focused
//		from the custom action using "dojo/focus".
//		Example: focus.focus(hoverViewWrapper.getDomNode());
//
//	position: {x, y}
//		Left-upper coordinate of where the HoverView arrow is going to be placed
//		in the dom.
//
//	widget: Dijit instance
//		Widget that is displayed within the HoverView. In order to have the,
//		most likely desired, effect of proper placement within the dom, the
//		widget's width must be greater than the distance between 'position' and
//		the right edge of the current ViewPort.
//
//		I'm sorry, but I have no idea why that happens. My best guess: it's a
//		bug that's never surfaced because the standard widgets displayed in
//		hoverViews are wide enough by default. I imagine this will lash back
//		on displays with huge resolutions / high DPI. This is only speculation 
//		on my part, but as a user of this class, make sure your widgets are wide
//		enough and you should be fine.

define([
        "dojo/_base/declare"
], function(declare) {

	var HoverView = com.ibm.team.rtc.foundation.web.ui.views.HoverView;

	return declare(null, {

		constructor: function(position, widget) {
			var hoverViewConfig = {
					x: position.x,
					y: position.y,
					content: widget
			};

			this._hoverView = new HoverView(hoverViewConfig, null);
						
//			destroy the hoverView when focus is lost. This is done to mimic
//			the behaviour of the other hoverViews in the WorkItemEditor.
//			(Potential Duplicates and Work Item Copy).
			this._hoverView.onBlur = function(e) {
				this.destroyRecursive();
			};
		},
		
// summary:
//		Returns the DomNode of the HoverView. This is necessary for
//		focusing the node in the view, which in turn must be done for
//		the intended behaviour of dijit._FocusMixin to work, which
//		HoverView probably implements (I can't verify this, no code). 
		getDomNode: function() {
			return this._hoverView.domNode;
		}
	});
});