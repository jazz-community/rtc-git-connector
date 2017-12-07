define([
    "dojo/_base/declare"
], function(declare) {
    return declare(null, {
        constructor: function(label, url) {
            this._label = label;
            this._url = url;
        },

        attach: function() {
            // Check IE compatibility. For some reason, IBM sets the X-UA-Compatible header to
            // IE-10, which makes ie use ancient standards. Chrome, FF etc. just ignore this 
            // header and are then fine with rendering new css rules and using new js features.
            // IE11 actually supports MutationObserver, so it's a shame we have to do this.
            // (https://msdn.microsoft.com/en-us/library/dn254985%28v=vs.85%29.aspx)
            if (!window.MutationObserver) {
                // Now, we just use the fall back icon defined in the // plugin.xml. 
                // Another possible workaround would be using the deprecated mutation
                // events API. However, those functions have a huge performance penalty and 
                // severely slow down dynamic pages.
                return;
            }

            var self = this;
            var backgroundStyle = 'rgba(0, 0, 0, 0) url("' 
                + net.jazz.ajax._contextRoot 
                + self._url 
                + '") no-repeat scroll -96px -96px';

            var observer = new MutationObserver(function(mutations) {
                mutations.filter(function(mutation) {
                    return mutation.target.title === self._label;
                }).reduce(function(acc, buttonParent) {
                    return acc.concat(Array.from(buttonParent.target.childNodes));
                }, []).filter(function(child) {
                    return child.nodeName.toUpperCase() === "IMG";
                }).map(function(backgroundNode) {
                    backgroundNode.style.background = backgroundStyle;
                });
            });

            var config = { attributes: true, childList: true, characterData: true, subtree: true };
            observer.observe(document.body, config);
        }
    });
});