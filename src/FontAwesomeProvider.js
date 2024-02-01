define(function () {
    // Return an instance so that the functions can be used as if they were static
    return new (function () {
        this.FontAwesome = require("@fortawesome/fontawesome");

        const FaCheck = require("@fortawesome/fontawesome-free-solid/faCheck");
        const FaExclamationTriangle = require("@fortawesome/fontawesome-free-solid/faExclamationTriangle");
        const FaLink = require("@fortawesome/fontawesome-free-solid/faLink");
        const FaMinus = require("@fortawesome/fontawesome-free-solid/faMinus");
        const FaPlus = require("@fortawesome/fontawesome-free-solid/faPlus");
        const FaSpinner = require("@fortawesome/fontawesome-free-solid/faSpinner");
        const FaTimes = require("@fortawesome/fontawesome-free-solid/faTimes");
        const FaTrash = require("@fortawesome/fontawesome-free-solid/faTrash");

        this.FontAwesome.library.add(FaCheck);
        this.FontAwesome.library.add(FaExclamationTriangle);
        this.FontAwesome.library.add(FaLink);
        this.FontAwesome.library.add(FaMinus);
        this.FontAwesome.library.add(FaPlus);
        this.FontAwesome.library.add(FaSpinner);
        this.FontAwesome.library.add(FaTimes);
        this.FontAwesome.library.add(FaTrash);
    })();
});
