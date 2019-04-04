define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "../../services/MainDataStore",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./SetNewWorkItemAttributes.html",
    "jazz/css!./SetNewWorkItemAttributes.css"
], function (declare, lang,
    MainDataStore,
    _WidgetBase, _TemplatedMixin,
    template) {
    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.setNewWorkItemAttributes",
        [_WidgetBase, _TemplatedMixin,],
    {
        templateString: template,
        mainDataStore: null,
        hasOverview: false,
        attributesToShow: ["category", "owner", "target", "foundIn", "internalTags"],

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();
        },

        // Only create the overview once the show method is called
        show: function () {
            if (!this.hasOverview) {
                this.hasOverview = true;
                this.createOverview();
            }
        },

        // Create a work item editor with only the specified attributes.
        // ["category", "owner", "target", "foundIn", "internalTags"]
        // If the attribute is not available for the current work item presentation
        // it will just be left out.
        createOverview: function () {
            dojo.require("com.ibm.team.workitem.web.ui.internal.view.editor.WorkItemOverview");

            var workItem = this.mainDataStore.workItem;
            var workItemEditorWidget = this._getWorkItemEditorWidget(workItem);
            var page = this._getOverviewPage(workItem);

            if (!workItemEditorWidget || !page) {
                return;
            }

            // Work on a copy of the page so that the real presentation properties are not affected.
            page = lang.clone(page);

            var section = this._getDetailsSection(page);

            if (!section) {
                return;
            }

            this._filterSectionPresentationsByAttributes(section, this.attributesToShow);
            this._setSectionTitle(section, "Some values for the new work items");

            // Remove all other sections from the page
            page.sections = [section];

            // Arguments used to create a WorkItemOverview object
            var createArgs = {
                workItem: workItemEditorWidget._workItem,
                parentController: workItemEditorWidget,
                editorUtil: workItemEditorWidget.editorUtil,
                pageProps: page,
                retainedState: false,
                isCustomAttributeLayout: {}
            };

            var workItemOverView = new com.ibm.team.workitem.web.ui.internal.view.editor.WorkItemOverview(createArgs);

            // Place the work item overview in the dom
            this.attributesContainer.insertAdjacentElement("afterBegin", workItemOverView.domNode);
        },

        // Get the work item editor widget instance from the work item page instance
        // taken from the cache
        _getWorkItemEditorWidget: function (workItem) {
            var workItemEditorWidget;

            try {
                workItemEditorWidget = jazz.app.currentApplication.workbench
                    ._pageWidgetCache["com.ibm.team.workitem"]
                    ._multipaneContentWidget
                    .getCachedWidget("__jazzWorkItemEditor", workItem.getId());
            } catch (e) {
                workItemEditorWidget = null;
            }

            return workItemEditorWidget;
        },

        // Get the presentation properties for the overview part of the work item editor page
        _getOverviewPage: function (workItem) {
            var page;

            try {
                page = workItem.workItemSpec.presentationProps.pages.find(function (page) {
                    return page.layout === "builtInOverviewLayout";
                });
            } catch (e) {
                page = null;
            }

            return page;
        },

        // Get the details section from the specified page
        _getDetailsSection: function (page) {
            var section;

            try {
                section = page.sections.find(function (section) {
                    return section.slot === "details";
                });
            } catch (e) {
                section = null;
            }

            return section;
        },

        // Only keep the section presentations for the specified attributes
        _filterSectionPresentationsByAttributes: function (section, attributes) {
            section.presentations = section.presentations.filter(function (presentation) {
                return attributes.some(function (attribute) {
                    return attribute === presentation.attributeId;
                });
            });
        },

        // Set the specified title for the specified section
        _setSectionTitle: function (section, title) {
            var prop = section.properties.find(function (property) {
                return property.key === "title";
            });

            if (prop) {
                prop.value = title;
            }
        }
    });
});