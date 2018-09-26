// This file contains the ids of all work item types to list in the menu under the
// group "Create Work Item from Git Issue".

// Adjust the list to contain the work item types that should be available in the list.
// Make sure to use the ids that are configured in your setup.
// Ids that are listed here but not available in the web ui will simply be left out of
// the list and will not cause an error.

// The menu items will be displayed in the same order as the ids in the list below.
export default {
    getVisibleWorkItemTypeIds() {
        return [
            "defect",
            "com.ibm.team.workitem.workItemType.defect",
            "com.ibm.team.apt.workItemType.story"
        ];
    }
};