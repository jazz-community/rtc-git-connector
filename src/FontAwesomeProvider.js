// Fontawesome fonts
export const FontAwesome = require("@fortawesome/fontawesome");
const FaCheck = require("@fortawesome/fontawesome-free-solid/faCheck");
const FaExclamationTriangle = require("@fortawesome/fontawesome-free-solid/faExclamationTriangle");
const FaLink = require("@fortawesome/fontawesome-free-solid/faLink");
const FaMinus = require("@fortawesome/fontawesome-free-solid/faMinus");
const FaPlus = require("@fortawesome/fontawesome-free-solid/faPlus");
const FaSpinner = require("@fortawesome/fontawesome-free-solid/faSpinner");
const FaTimes = require("@fortawesome/fontawesome-free-solid/faTimes");
const FaTrash = require("@fortawesome/fontawesome-free-solid/faTrash");

// Adding the entire solid library doesn't seem to work in the frontend.
// So we have no other choice than adding them one by one.
FontAwesome.library.add(FaCheck);
FontAwesome.library.add(FaExclamationTriangle);
FontAwesome.library.add(FaLink);
FontAwesome.library.add(FaMinus);
FontAwesome.library.add(FaPlus);
FontAwesome.library.add(FaSpinner);
FontAwesome.library.add(FaTimes);
FontAwesome.library.add(FaTrash);
