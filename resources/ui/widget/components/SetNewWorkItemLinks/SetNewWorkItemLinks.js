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

            this.enabledEndpoints = new ArrayList();
            this.enabledEndpoints.add(WorkItemEndpoints.PARENT_WORK_ITEM);

            this.enabledEndpoints.add(WorkItemEndpoints.DEPENDS_ON_WORK_ITEM);

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
                this._launchDialog(workingCopy, workItemReferences, chosenDescriptor);
            }));

            // domStyle.set(actionsMenu._view._dropdownElement, "float", "none");
            // domStyle.set(actionsMenu._view._dropdownElement, "border-right", "none");
            // domStyle.set(actionsMenu._view._dropdownArrow, "display", "none");

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

        _getEndpointLabel: function (endpoint) {
            return string.substitute(endpoint.isSingleValued() ? "Set ${0}" : "Add ${0}", [endpoint.getDisplayName()]);
        },

        _launchDialog: function (workItem, workItemReferences, chosenDescriptor) {
            var self = this;

            LinksDialogLauncher.launchDialog(workItem, chosenDescriptor, function (endpoint) {
                var references = Array.prototype.slice.call(arguments, 1);

                if (endpoint.isSingleValued() && workItemReferences.hasReferences(endpoint)) {
                    workItemReferences.remove(endpoint, workItemReferences.getReferences(endpoint).at(0));
                }

                workItemReferences.add.apply(workItemReferences, [endpoint].concat(references));

                if (!self.enabledEndpointsWithValues.contains(endpoint)) {
                    self.enabledEndpointsWithValues.add(endpoint);
                }
            });
        }
    });
});