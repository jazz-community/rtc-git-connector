import ArrayFindPolyfill from "./arrayFindPolyfill";
import ArrayFindIndexPolyfill from "./arrayFindIndexPolyfill";
import CustomMenuItemsConfig from "./customMenuItemsConfig";

// This method only works for the work item menu for now.
// Other menus use the _currentMenu._menu property instead of the _currentMenu._wrappedInstance (and not in the same way).
// This could easily be extended to support such menus as well.

// Add some lightweight polyfills to support IE11.
// The polyfills are only added if the browser doesn't already implement the JavaScript functionality natively.
ArrayFindPolyfill.addArrayFindPolyfill();
ArrayFindIndexPolyfill.addArrayFindIndexPolyfill();

// Copies the functionality in the addGroup method additionally allowing for
// a groupIndex to be specified. The new group will be added at the specified groupIndex.
function customAddGroup(id, title, groupIndex) {
	var titleFunc = title == null ? null : function () {
		return title;
	};
	var group = {
		id: id,
		title: titleFunc,
		children: [],
		dynamic: false,
		hideIfEmpty: false
	};
	this._groups.splice(groupIndex, 0, group);
	this._updateGroup(group);
};

// Add a new custom group from the config to the menu.
// An example of a menu group is the light gray "Create Work Item" text in the "Work Items" menu.
function addNewGroupToMenu(menuPopupConfig) {
	menuPopupConfig.addGroups.forEach(function (groupToAdd) {
		// Get the menu items for the group. Depending on the configuration there may not be any.
		var menuItems = groupToAdd.createMenuItems();

		// Don't add the group if there are no menu items to put in it.
		// This will happen if there are no configured types or if the configured types are not
		// supported in the current context (project area).
		if (!menuItems || !menuItems.length) {
			return;
		}

		// Check if the custom group is already in the menu.
		if (jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu._wrappedInstance._groups.findIndex(function (group) {
			return group.id === groupToAdd.id;
		}) > -1) {
			// Clear the group if it already exists (removes all items).
			jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu._wrappedInstance.clearGroup(groupToAdd.id);
		} else {
			// Create a new group and add it if it's not in the menu yet.

			// Look for the index of the group below which the new group will be placed.
			var addAfterGroupIndex = jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu._wrappedInstance._groups.findIndex(function (group) {
				return group.id === groupToAdd.addAfterGroupId;
			});

			// Check if the group that should precede the new group is in the menu.
			if (addAfterGroupIndex) {
				// Add the new group right after the preceding group.
				customAddGroup.call(
					jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu._wrappedInstance,
					groupToAdd.id,
					groupToAdd.title,
					addAfterGroupIndex + 1
				);
			} else {
				// If the configured preceding group wasn't found in the menu the new group will be added as the last group.
				// This should only happen if something is configured incorrectly.
				jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu._wrappedInstance.addGroup(
					groupToAdd.id,
					groupToAdd.title
				);
			}
		}

		// Add the custom menu items to the new group.
		menuItems.forEach(function (newItem) {
			jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu._wrappedInstance.addItemToGroup(groupToAdd.id, {
				label: newItem.label,
				iconClass: newItem.iconClass,
				href: newItem.href
			});
		});
	});
};

// Add the groups from the menu popup config once the work item types are loaded.
// The work item types are added to the cache when the menu first loads and remain
// there across browser refreshes.
function addGroupWhenTypesAreLoaded(menuPopupConfig) {
	(function tryToAdd (menuPopupConfig) {
		// Add the group to the menu if the types are loaded.
		if (jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu._wrappedInstance.isTypesLoaded) {
			addNewGroupToMenu(menuPopupConfig);
		} else {
			// Otherwise wait 100ms and run again.
			setTimeout(function () {
				tryToAdd(menuPopupConfig);
			}, 100);
		}
	})(menuPopupConfig);
};

// Connect to the dijit popup open event as soon as this script is loaded.
dojo.connect(dijit.popup, "open", function (arg) {
	var config = CustomMenuItemsConfig.getCustomMenuItemsConfig();

	if (typeof config === 'undefined') {
		return;
	}

	// Run the setup for each configured menu popup.
	// This allows for multiple menus to be configured using this method.
	config.menuPopups.forEach(function (menuPopupConfig) {
		var typeofCurrentMenu;

		try {
			typeofCurrentMenu = typeof jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu;
		} catch (e) {
			typeofCurrentMenu = 'undefined';
		}

		// Make sure that the menu that we're trying to extend actually exists and that it's the popup that caused this event to fire.
		if (typeofCurrentMenu !== 'undefined' &&
			arg.popup === jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu) {

			// If the menu already has an instance we can try to add right away.
			if (jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu._wrappedInstance) {
				addGroupWhenTypesAreLoaded(menuPopupConfig);
			} else {
				// If the menu hasn't loaded yet (first time it's clicked), wait for it to load and then try to add.
				jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu._loaded.then(function () {
					addGroupWhenTypesAreLoaded(menuPopupConfig);
				});
			}
		}
	});
});