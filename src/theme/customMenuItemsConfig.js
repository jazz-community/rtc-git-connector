import VisibleWorkItemTypeIds from "./visibleWorkItemTypeIds";

export default {
	getCustomMenuItemsConfig() {
		return {
			menuPopups: [{
				id: "com.ibm.team.workitem",
				addGroups: [{
					id: "create-workitem-from-git-group",
					title: "Create Work Item from Git Issue",
					addAfterGroupId: "create-workitem-group",
					createMenuItems: function () {
						return createMenuItems(VisibleWorkItemTypeIds.getVisibleWorkItemTypeIds());
					}
				}]
			}]
		};
	}
};

function createMenuItems(visibleWorkItemTypeIds) {
	var workItemTypesFromCache = getItemTypes();

	if (!workItemTypesFromCache) {
		workItemTypesFromCache = [];
	}

	var visibleWorkItemTypes = workItemTypesFromCache.filter(function (workItemType) {
		return visibleWorkItemTypeIds.some(function (workItemTypeId) {
			return workItemTypeId === workItemType.id;
		});
	});

	return visibleWorkItemTypes.map(function (workItemType) {
		return {
			label: "Create " + workItemType.label + " from Git Issue",
			iconClass: getIconClass(workItemType.iconUrl),
			href: jazz.app.currentApplication.ui.navbar._pageList
				._menuPopupsById["com.ibm.team.workitem"]._currentMenu._wrappedInstance
				._getNewWorkItemUri(workItemType.id) + "&autoOpenRtcGitConnector=true"
		};
	});
};

function getItemTypes() {
	var itemTypes;

	try {
		itemTypes = com.ibm.team.workitem.web.cache.internal.Cache.getItem('workitems/itemTypes');
	} catch (e) {
		itemTypes = null;
	}

	return itemTypes;
};

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