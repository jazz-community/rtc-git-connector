define([
    "dojo/_base/declare",
    "dojo/store/Memory",
    "dojo/store/Observable"
], function (declare, Memory, Observable) {
    return declare(null, {
        registeredGitRepositoryStore: null,

        constructor: function () {
            this.registeredGitRepositoryStore = new Observable(new Memory({ idProperty: "key" }));
        }
    });
});