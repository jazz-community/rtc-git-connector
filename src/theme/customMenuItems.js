import CustomMenuItemsConfig from "./customMenuItemsConfig";

// This method only works for the work item menu for now.
// Other menus use the _currentMenu._menu property instead of the _currentMenu._wrappedInstance (and not in the same way).
// This could easily be extended to support such menus as well.

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

function addNewGroupToMenu(menuPopupConfig) {
	menuPopupConfig.addGroups.forEach(function (groupToAdd) {
		if (jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu._wrappedInstance._groups.findIndex(function (group) {
			return group.id === groupToAdd.id;
		}) > -1) {
			jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu._wrappedInstance.clearGroup(groupToAdd.id);
		} else {
			var addAfterGroupIndex = jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu._wrappedInstance._groups.findIndex(function (group) {
				return group.id === groupToAdd.addAfterGroupId;
			});

			if (addAfterGroupIndex) {
				customAddGroup.call(
					jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu._wrappedInstance,
					groupToAdd.id,
					groupToAdd.title,
					addAfterGroupIndex + 1
				);
			} else {
				jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu._wrappedInstance.addGroup(
					groupToAdd.id,
					groupToAdd.title
				);
			}
		}

		groupToAdd.createMenuItems().forEach(function (newItem) {
			jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu._wrappedInstance.addItemToGroup(groupToAdd.id, {
				label: newItem.label,
				iconClass: newItem.iconClass,
				href: newItem.href
			});
		});
	});
};

dojo.connect(dijit.popup, "open", function (arg) {
	var config = CustomMenuItemsConfig.getCustomMenuItemsConfig();

	if (typeof config === 'undefined') {
		return;
	}

	config.menuPopups.forEach(function (menuPopupConfig) {
		var typeofCurrentMenu;

		try {
			typeofCurrentMenu = typeof jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu;
		} catch (e) {
			typeofCurrentMenu = 'undefined';
		}

		if (typeofCurrentMenu !== 'undefined' &&
			arg.popup === jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu) {
			if (jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu._wrappedInstance) {
				addNewGroupToMenu(menuPopupConfig);
			} else {
				jazz.app.currentApplication.ui.navbar._pageList._menuPopupsById[menuPopupConfig.id]._currentMenu._loaded.then(function () {
					addNewGroupToMenu(menuPopupConfig);
				});
			}
		}
	});
});