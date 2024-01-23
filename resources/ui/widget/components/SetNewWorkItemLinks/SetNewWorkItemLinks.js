define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/string",
    "../../services/MainDataStore",
    "dijit/MenuItem",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./SetNewWorkItemLinks.html",
    "jazz/css!./SetNewWorkItemLinks.css",
    "com.ibm.jdojox.util.ArrayList",
    "com.ibm.jdojox.util.JDojoX",
    "com.ibm.team.rtc.foundation.web.model.Bindable",
    "com.ibm.team.rtc.foundation.web.model.BindableList",
    "com.ibm.team.rtc.foundation.web.model.Label",
    "com.ibm.team.rtc.foundation.web.model.ListBindings",
    "com.ibm.team.rtc.foundation.web.ui.util.Sprites",
    "com.ibm.team.rtc.foundation.web.ui.views.controller.ActionDropdown",
    "com.ibm.team.rtc.foundation.web.ui.views.controller.ArtifactList",
    "com.ibm.team.rtc.foundation.web.ui.views.controller.ArtifactMultiList",
    "com.ibm.team.workitem.web.model.links.WorkItemEndpoints",
    "com.ibm.team.workitem.web.ui.internal.view.editor.presentations.nonattribute.links.LinksDialogLauncher"
], function (
    declare,
    lang,
    domConstruct,
    domStyle,
    string,
    MainDataStore,
    MenuItem,
    _WidgetBase,
    _TemplatedMixin,
    template
) {
    var ArrayList = com.ibm.jdojox.util.ArrayList;
    var JDojoX = com.ibm.jdojox.util.JDojoX;
    var Bindable = com.ibm.team.rtc.foundation.web.model.Bindable;
    var BindableList = com.ibm.team.rtc.foundation.web.model.BindableList;
    var Label = com.ibm.team.rtc.foundation.web.model.Label;
    var ListBindings = com.ibm.team.rtc.foundation.web.model.ListBindings;
    var Sprites = com.ibm.team.rtc.foundation.web.ui.util.Sprites;
    var ActionDropdown = com.ibm.team.rtc.foundation.web.ui.views.controller.ActionDropdown;
    var ArtifactList = com.ibm.team.rtc.foundation.web.ui.views.controller.ArtifactList;
    var ArtifactMultiList = com.ibm.team.rtc.foundation.web.ui.views.controller.ArtifactMultiList;
    var WorkItemEndpoints = com.ibm.team.workitem.web.model.links.WorkItemEndpoints;
    var LinksDialogLauncher =
        com.ibm.team.workitem.web.ui.internal.view.editor.presentations.nonattribute.links.LinksDialogLauncher;

    return declare(
        "com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.setNewWorkItemLinks",
        [_WidgetBase, _TemplatedMixin],
        {
            templateString: template,
            mainDataStore: null,
            hasPresentation: false,
            enabledEndpoints: null,
            enabledEndpointsWithValues: null,
            workingCopy: null,

            constructor: function () {
                this.mainDataStore = MainDataStore.getInstance();
                this.workingCopy = this.mainDataStore.workItem.getWorkingCopy();

                // Create the list of link types to show
                this.enabledEndpoints = new ArrayList();
                this.enabledEndpoints.add(WorkItemEndpoints.PARENT_WORK_ITEM);

                // Create a list to keep track of what link types have links set
                // This is used for the view to dynamically show/hide when links
                // are added or removed
                this.enabledEndpointsWithValues = new BindableList();
            },

            // Only create the presentation once the show method is called
            show: function () {
                if (!this.hasPresentation) {
                    this.hasPresentation = true;
                    this.createLinksDropdown();
                    this.createLinksList();
                }
            },

            // Create the dropdown for selecting work items to link. Will be
            // styled as a single button if there is only one item
            createLinksDropdown: function () {
                var self = this;
                var workItemReferences = this.workingCopy.getWorkItemReferences();

                // Create a list of endpoints to show in the dropdown
                var endpointList = new BindableList();
                endpointList.add(this.enabledEndpoints);

                // Set the first endpoint in the list to be the default
                var defaultEndpoint = new Bindable();
                defaultEndpoint.setValue(this.enabledEndpoints.at(0));

                // Create a div for placing the dropdown in
                var actionsMenuDiv = domConstruct.create("div", null, this.linksContainer);

                // Create the ActionDropdown and place it
                var actionsMenu = ActionDropdown.create({}, actionsMenuDiv);

                // Setup the ActionDropdown
                actionsMenu
                    .renderer(
                        lang.hitch(this, function (endpoint) {
                            return new MenuItem({
                                label: this._getEndpointLabel(endpoint),
                                iconClass: Sprites.cssClassName(endpoint.getIcon())
                            });
                        })
                    )
                    .values(endpointList)
                    .defaultValue(defaultEndpoint)
                    .bind();

                // Open the links chooser dialog when a menu item is clicked
                actionsMenu.valueChosen.addListener(
                    lang.hitch(this, function (chosenDescriptor) {
                        this._launchLinksDialog(self.workingCopy, workItemReferences, chosenDescriptor);
                    })
                );

                // Hide the menu dropdown part when there is only a single item
                if (this.enabledEndpoints.size() === 1) {
                    this._hideDropdown(actionsMenu._view);
                }
            },

            // Create the presentation of the set links. Can be used to remove the links
            createLinksList: function () {
                var self = this;
                var workItemReferences = this.workingCopy.getWorkItemReferences();

                // Create a div for placing the list view in
                var listViewDiv = domConstruct.create("div", null, this.linksContainer);

                // Create the ArtifactMultiList and place it
                var listView = new ArtifactMultiList(listViewDiv).listFactory(function () {
                    return ArtifactList.create();
                });

                // Initialize empty BindableLists to bind with the enabledEndpointsWithValues later
                var headers = new BindableList();
                var readOnly = new BindableList();
                var typesMap = new BindableList();

                // Bind the headers to the endpoint display names and icons
                ListBindings.bindWithAdapter(this.enabledEndpointsWithValues, headers, function (endpoint) {
                    return new Label(endpoint.getDisplayName()).iconUrl(endpoint.getIcon().toUri());
                });

                // Bind the readOnly attribute to reflect whether links from this endpoint can be deleted or not
                ListBindings.bindWithAdapter(this.enabledEndpointsWithValues, readOnly, function (endpoint) {
                    return new Bindable(!endpoint.isUserDeleteable());
                });

                // Bind the typesMap to the work item references for each endpoint
                ListBindings.bindWithAdapter(this.enabledEndpointsWithValues, typesMap, function (endpoint) {
                    var result = new BindableList();
                    var references = workItemReferences.getReferences(endpoint);

                    // Bind result to the work item references for this endpoint
                    ListBindings.bind(references, result);

                    // Listen for changes in the result list
                    result.onListChanged().addListener(function (callbackArg) {
                        // Check if a reference has been removed from the result list
                        if (!JDojoX.isEqual(result, references) && callbackArg.type === "remove") {
                            // Remove the reference from the work item references
                            workItemReferences.remove(endpoint, callbackArg.elements[0]);

                            // Remove the endpoint from the list of endpoints with values
                            // if the endpoint doesn't have any more references
                            if (!workItemReferences.hasReferences(endpoint)) {
                                self.enabledEndpointsWithValues.remove(endpoint);
                            }
                        }
                    });

                    return result;
                });

                // Setup the ArtifactMultiList
                listView
                    .renderer(function (itemReference) {
                        return new Label(itemReference.getComment())
                            .iconUrl(itemReference.getIconUrl())
                            .url(itemReference.getUrl());
                    })
                    .headers(headers)
                    .sections(typesMap)
                    .readOnly(readOnly)
                    .compact(new Bindable(false))
                    .bind();
            },

            // Get the label for the specified endpoint
            _getEndpointLabel: function (endpoint) {
                return string.substitute(endpoint.isSingleValued() ? "Set ${0}" : "Add ${0}", [
                    endpoint.getDisplayName()
                ]);
            },

            // Launch a dialog for selecting links of a specific type for the specified work item
            _launchLinksDialog: function (workItem, workItemReferences, chosenDescriptor) {
                var self = this;

                LinksDialogLauncher.launchDialog(workItem, chosenDescriptor, function (endpoint) {
                    // Get an array of all the endpoint references (passed as multiple arguments after endpoint)
                    var references = Array.prototype.slice.call(arguments, 1);

                    // Remove the existing reference if this is a single valued endpoint
                    // and the work item already has a reference
                    if (endpoint.isSingleValued() && workItemReferences.hasReferences(endpoint)) {
                        workItemReferences.remove(endpoint, workItemReferences.getReferences(endpoint).at(0));
                    }

                    // Add the new references to the endpoint
                    workItemReferences.add.apply(workItemReferences, [endpoint].concat(references));

                    // Add the endpoint to the custom list so that it will be shown in the view
                    // Only add each endpoint to the list once. The individual references will be added to the endpoint
                    if (!self.enabledEndpointsWithValues.contains(endpoint)) {
                        self.enabledEndpointsWithValues.add(endpoint);
                    }
                });
            },

            // Hide the arrow drop down from the actions menu. This is useful when the menu only contains a single item
            _hideDropdown: function (actionsMenuView) {
                domStyle.set(actionsMenuView._dropdownElement, "float", "none");
                domStyle.set(actionsMenuView._dropdownElement, "border-right", "none");
                domStyle.set(actionsMenuView._dropdownArrow, "display", "none");
            }
        }
    );
});
