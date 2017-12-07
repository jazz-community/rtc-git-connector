define([
        "dojo/_base/declare"
], function(declare) {
    return declare(null, {

        // These aren't really discovery functions, but parsing a whole lot of xml every
        // time seems even more ridiculous, especially in javascript.
        base: function() {
            return window.location.protocol + "//" + window.location.host;
        },

        contexts: function() {
            return this.oslc() + 'contexts/'
        },

        currentContext: function() {
            return this.contexts() + jazz.app.context.get().itemId;
        },

        drafts: function() {
            return this.currentContext() + '/drafts/workitems/';
        },

        oslc: function() {
            return this.base() + net.jazz.ajax._contextRoot + '/oslc/';
        },

        workitems: function() {
            return this.oslc() + 'workitems/';
        },

        types: function() {
            return this.oslc() + 'types/' + jazz.app.context.get().itemId;
        },

        projectArea: function() {
            return this.oslc() + 'projectareas/' + jazz.app.context.get().itemId;
        },

        shapes: function() {
            return this.currentContext() + '/shapes/workitems/';
        }

    });
});
