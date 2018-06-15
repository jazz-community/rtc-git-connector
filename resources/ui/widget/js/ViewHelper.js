define([
    "dojo/_base/declare"
], function (declare) {
    // Return an instance so that the functions can be used as if they were static
    return new function () {
        this.TestFunction = function (testString) {
            console.log(testString);
        };
    };
});