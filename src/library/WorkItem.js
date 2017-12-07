define([
        "dojo/_base/declare",
        "dojo/json",
        "../library/Discovery"
], function(declare, json, Discovery) {

	return declare(null, {

        constructor: function() {
            this.discovery = new Discovery();
        },

        createQuick: function(parentItem) {
            var itemType = 'task',
                linkType = 'com.ibm.team.workitem.linktype.parentworkitem.parent';

            this.createChildWorkItem(parentItem, itemType, linkType);
        },

        createChildWorkItem: function(parentItem, itemType, linkType) {
            // TODO: get link type properly as well
            // TODO: Maybe test with xml for a change as well?
            // TODO: Maybe set the right type depending on what's in the work item spec? If it's correct there?
            // find out what this should look like by just querying items,
            // that's probably the easiest way to get the proper attributes.
            var data = {};
            data['rtc_cm:type'] = {
                "rdf:type": [
                    {
                        "rdf:resource": "http://jazz.net/xmlns/prod/jazz/rtc/cm/1.0/Type"
                    }
                ],
                "rdf:resource": this.discovery.types() + "/" + itemType
            };
            // parent will actually have to be handled seperately. Need to have
            // a closer look at this.
            // actually, determining the link type is probably what the real problem here is
            data['rtc_cm:' + linkType] = {
                "rdf:resource": this.discovery.workitems() + parentItem.idLabel
            };
            data['dcterms:title'] = "Testy McTestFace";
            data['rtc_cm:projectArea'] = {
                "rdf:resource": this.discovery.projectArea()
            };
            data['oslc:creation'] = {
                "rdf:resource": this.discovery.drafts()
            };
            data['oslc:usage'] = {
                "rdf:resource": "http://jazz.net/xmlns/prod/jazz/rtc/cm/1.0/drafts"
            };
            // use the resource shape in here somehow to make a proper draft maybe?
            data['oslc:resourceType'] = {
                "rdf:resource": "http://open-services.net/ns/cm#ChangeRequest"
            };
            data['oslc:resourceShape'] = {
                "rdf:type": {
                    "rdf:resource": "http://open-services.net/ns/core#ResourceShape"
                },
                "rdf:resource": this.discovery.shapes() + itemType
            };

            console.log(this.discovery.drafts(), data);

            var dataString = json.stringify(data);

            console.log(jazz.client);
            jazz.client.xhrPost({
                url: this.discovery.drafts(),
                postData: dataString,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "OSLC-Core-Version": "2.0",
                    "Name": "Value"
                }
            }).then(function(result) {
                var resultData = json.parse(result);
                console.log(resultData);
                // url is now in the location header according to documentation
                // window.location = resultData["rdf:resource"];
            });
        }
	});
});
