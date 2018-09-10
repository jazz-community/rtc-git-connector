define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom-style",
    "../../services/MainDataStore",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./SetNewWorkItemAttributes.html",
    "jazz/css!./SetNewWorkItemAttributes.css"
], function (declare, lang, domStyle,
    MainDataStore,
    _WidgetBase, _TemplatedMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.setNewWorkItemAttributes",
        [_WidgetBase, _TemplatedMixin,],
    {
        templateString: template,
        mainDataStore: null,
        hasOverview: false,

        visible: false,
        _setVisibleAttr: function (visible) {
            domStyle.set(this.domNode, "display", visible ? "block" : "none");
            this._set("visible", visible);
        },

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
        },

        startup: function () {
            if (this.mainDataStore.newWorkItemMode) {
                this.watchDataStore();
            }
        },

        watchDataStore: function () {
            var self = this;

            // Only show the attributes when the list of selected issues isn't empty
            this.mainDataStore.selectedRepositoryData.issuesToLink.watchElements(function () {
                var hasItems = self.mainDataStore.selectedRepositoryData.issuesToLink.length > 0;
                self.set("visible", hasItems);

                if (hasItems && !self.hasOverview) {
                    self.hasOverview = true;
                    self.createOverview();
                }
            });
        },

        createOverview: function () {
            var attributesToKeep = ["category", "owner", "target", "foundIn"];
            var workItem = this.mainDataStore.workItem;
            var workItemEditorWidget = jazz.app.currentApplication.workbench
                ._pageWidgetCache["com.ibm.team.workitem"]
                ._multipaneContentWidget
                .getCachedWidget("__jazzWorkItemEditor", workItem.getId());

            var page = workItem.workItemSpec.presentationProps.pages.find(function (page) {
                return page.layout === "builtInOverviewLayout";
            });

            page = lang.clone(page);

            var section = page.sections.find(function (section) {
                return section.slot === "details";
            });

            section.presentations = section.presentations.filter(function (presentation) {
                return attributesToKeep.some(function (attributeToKeep) {
                    return attributeToKeep === presentation.attributeId;
                });
            });

            var prop = section.properties.find(function (property) {
                return property.key === "title";
            });

            prop.value = "Some values for the new work items";

            page.sections = [section];

            var createArgs = {
                workItem: workItemEditorWidget._workItem,
                parentController: workItemEditorWidget,
                editorUtil: workItemEditorWidget.editorUtil,
                pageProps: page,
                retainedState: false,
                isCustomAttributeLayout: {}
            };

            var workItemOverView = new com.ibm.team.workitem.web.ui.internal.view.editor.WorkItemOverview(createArgs);
            this.attributesContainer.insertAdjacentElement("afterBegin", workItemOverView.domNode);
            console.log("workItemOverView", workItemOverView);
        }
    });
});