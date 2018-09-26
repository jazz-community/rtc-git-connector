import VisibleWorkItemTypeIds from "./visibleWorkItemTypeIds";

export default {
	// Gets the configuration that specifies which menu popup to customize and
	// which new groups should be added to the specified menu.
	// Also provides a method for creating the menu items.
	getCustomMenuItemsConfig() {
		return {
			menuPopups: [{
				id: "com.ibm.team.workitem", // The id of the menu popup to customize.
				addGroups: [{
					id: "create-workitem-from-git-group", // The id of the new group to add to the menu.
					title: "Create Work Item from Git Issue", // The display title for the new group.
					addAfterGroupId: "create-workitem-group", // The group after which the new group should be placed.
					createMenuItems: function () { // A function that returns an array of menu items to add.
						// Create the menu items from the configured work item type ids.
						return createGitIssueMenuItems(VisibleWorkItemTypeIds.getVisibleWorkItemTypeIds());
					}
				}]
			}]
		};
	}
};

// Create menu items for the specified work item type ids.
function createGitIssueMenuItems(visibleWorkItemTypeIds) {
	// Get the available work item types from the cache.
	var workItemTypesFromCache = getItemTypes();

	// Return an empty array if there are no work item types in the cache.
	if (!workItemTypesFromCache) {
		return [];
	}

	// Filter for the work item types that are specified with the work item type ids.
	// Keep the results in the order used in the visibleWorkItemTypeIds file.
	var visibleWorkItemTypes = visibleWorkItemTypeIds.reduce(function (output, workItemTypeId) {
		var workItemType = workItemTypesFromCache.find(function (workItemType) {
			return workItemType.id === workItemTypeId;
		});

		if (workItemType) {
			output.push(workItemType);
		}

		return output;
	}, []);

	// Return the items with a label, iconClass, and link.
	// The link contains the parameter "autoOpenRtcGitConnector" which will cause the
	// plugin to automatically open when clicking the link.
	return visibleWorkItemTypes.map(function (workItemType) {
		return {
			label: workItemType.label + " From Git Issue",
			iconClass: getIconClass(workItemType.iconUrl),
			href: jazz.app.currentApplication.ui.navbar._pageList
				._menuPopupsById["com.ibm.team.workitem"]._currentMenu._wrappedInstance
				._getNewWorkItemUri(workItemType.id) + "&autoOpenRtcGitConnector=true"
		};
	});
};

// Get the work item types from the cache. Will return null if there was an error getting them.
function getItemTypes() {
	var itemTypes;

	try {
		itemTypes = com.ibm.team.workitem.web.cache.internal.Cache.getItem('workitems/itemTypes');
	} catch (e) {
		itemTypes = null;
	}

	return itemTypes;
};

// Get the icon class using the icon url. Will return an empty string if it fails.
function getIconClass(iconUrl) {
	var iconClass;

	try {
		iconClass = com.ibm.team.rtc.foundation.web.ui.util.Sprites.cssClassName(
				com.ibm.team.rtc.foundation.web.ui.util.sprite.ImageSource.fromIconUri(iconUrl)
			);
	} catch (e) {
		iconClass = "";
	}

	return iconClass;
};