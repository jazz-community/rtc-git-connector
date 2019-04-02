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
    "com.ibm.team.rtc.foundation.web.ui.views.controller.ArtifactMultiList",
    "com.ibm.team.workitem.web.model.links.WorkItemEndpoints",
    "com.ibm.team.workitem.web.ui.internal.view.editor.presentations.nonattribute.links.LinksDialogLauncher"
], function (declare, lang, domConstruct, domStyle, string,
    MainDataStore,
    MenuItem,
    _WidgetBase, _TemplatedMixin,
    template) {
    var ArrayList = com.ibm.jdojox.util.ArrayList;
    var JDojoX = com.ibm.jdojox.util.JDojoX;
    var Bindable = com.ibm.team.rtc.foundation.web.model.Bindable;
    var BindableList = com.ibm.team.rtc.foundation.web.model.BindableList;
    var Label = com.ibm.team.rtc.foundation.web.model.Label;
    var ListBindings = com.ibm.team.rtc.foundation.web.model.ListBindings;
    var Sprites = com.ibm.team.rtc.foundation.web.ui.util.Sprites;
    var ActionDropdown = com.ibm.team.rtc.foundation.web.ui.views.controller.ActionDropdown;
    var ArtifactMultiList = com.ibm.team.rtc.foundation.web.ui.views.controller.ArtifactMultiList;
    var WorkItemEndpoints = com.ibm.team.workitem.web.model.links.WorkItemEndpoints;
    var LinksDialogLauncher = com.ibm.team.workitem.web.ui.internal.view.editor.presentations.nonattribute.links.LinksDialogLauncher;

    return declare("com.siemens.bt.jazz.workitemeditor.rtcGitConnector.ui.widget.setNewWorkItemLinks",
        [_WidgetBase, _TemplatedMixin,],
    {
        templateString: template,
        mainDataStore: null,
        hasPresentation: false,
        enabledEndpoints: null,
        enabledEndpointsWithValues: null,

        constructor: function () {
            this.mainDataStore = MainDataStore.getInstance();

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
                this.createPresentation();
            }
        },

        createPresentation: function () {
            var self = this;
            var workingCopy = this.mainDataStore.workItem.getWorkingCopy();
            var workItemReferences = workingCopy.getWorkItemReferences();
            var endpointList = new BindableList();
            var defaultEndpoint = new Bindable();

            endpointList.add(this.enabledEndpoints);
            defaultEndpoint.setValue(this.enabledEndpoints.at(0));

            var actionsMenuDiv = domConstruct.create("div", null, this.linksContainer);
            var actionsMenu = ActionDropdown.create({}, actionsMenuDiv);

            actionsMenu.renderer(lang.hitch(this, function (endpoint) {
                return new MenuItem({
                    label: this._getEndpointLabel(endpoint),
                    iconClass: Sprites.cssClassName(endpoint.getIcon())
                });
            })).values(endpointList).defaultValue(defaultEndpoint).bind();

            actionsMenu.valueChosen.addListener(lang.hitch(this, function (chosenDescriptor) {
                this._launchLinksDialog(workingCopy, workItemReferences, chosenDescriptor);
            }));

            if (this.enabledEndpoints.size() === 1) {
                this._hideDropdown(actionsMenu._view);
            }

            // Links pres
            var listViewDiv = domConstruct.create("div", null, this.linksContainer);
            var listView = ArtifactMultiList.create(listViewDiv);
            var headers= new BindableList();
            var readOnly= new BindableList();
            var typesMap= new BindableList();

            ListBindings.bindWithAdapter(this.enabledEndpointsWithValues, headers, function (endpoint) {
                return new Label(endpoint.getDisplayName()).iconUrl(endpoint.getIcon().toUri());
            });

            ListBindings.bindWithAdapter(this.enabledEndpointsWithValues, readOnly, function (endpoint) {
                return new Bindable(!endpoint.isUserDeleteable());
            });

            ListBindings.bindWithAdapter(this.enabledEndpointsWithValues, typesMap, function (endpoint) {
                var result = new BindableList();
                var references = workItemReferences.getReferences(endpoint);

                ListBindings.bind(references, result);

                result.onListChanged().addListener(function (callbackArg) {
                    if (!JDojoX.isEqual(result, references) && callbackArg.type === 'remove') {
                        workItemReferences.remove(endpoint, callbackArg.elements[0]);

                        if (!workItemReferences.hasReferences(endpoint)) {
                            self.enabledEndpointsWithValues.remove(endpoint);
                        }
                    }
                });

                return result;
            });

            listView.renderer(function (itemReference) {
                return new Label(itemReference.getComment()).iconUrl(itemReference.getIconUrl()).url(itemReference.getUrl());
            }).headers(headers).sections(typesMap).readOnly(readOnly).compact(new Bindable(false)).bind();
        },

        // Get the label for the specified endpoint
        _getEndpointLabel: function (endpoint) {
            return string.substitute(endpoint.isSingleValued() ? "Set ${0}" : "Add ${0}", [endpoint.getDisplayName()]);
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
    });
});