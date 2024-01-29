const pako = require("pako");
const base64js = require("base64-js");
const Buffer = require("buffer/").Buffer;

// Replace some characters in the input string (needed due to the strange implementation)
function base64UrlEncode(string) {
    string = string.replace(/\+/g, "-");
    string = string.replace(/\//g, "_");
    string = string.replace(/=/g, ".");
    return string;
}

// Replace some characters in the input string (needed due to the strange implementation)
function base64UrlDecode(string) {
    string = string.replace(/-/g, "+");
    string = string.replace(/_/g, "/");
    string = string.replace(/\./g, "=");
    return string;
}

// Export the functions needed for encoding and decoding data in git commit links
export function encoder() {
    // Creates an encoded string from a stringified json object
    this.encode = function encode(value) {
        const compressed = pako.gzip(Buffer.from(value));
        const encoded = base64js.fromByteArray(compressed);
        const urlEncoded = base64UrlEncode(encoded);
        return urlEncoded;
    };

    // Creates a stringified json object from the encoded string
    this.decode = function decode(value) {
        const urlDecoded = base64UrlDecode(value);
        const compressed = base64js.toByteArray(urlDecoded);
        const deflated = pako.ungzip(compressed);
        const buffer = Buffer.from(deflated);
        return buffer.toString();
    };
}

// Handlebars for the browser (templating)
export const Handlebars = require("handlebars");

// Helpers for using in Handlebars templates
export const JustHandlebarsHelpers = require("just-handlebars-helpers");

// Turndown service for the browser (html to markdown)
export const TurndownService = require("turndown/lib/turndown.browser.umd.js");

// Clipboard.js for copying directly to the clipboard with wide browser support
export const ClipboardJS = require("clipboard/dist/clipboard.min.js");

// GitHub API client library
export const GitHubApi = require("@octokit/rest");

// GitLab API client library
export const GitLabApi = require("@gitbeaker/rest");

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

// Build version
export const buildVersion = "__BUILD_VERSION__";

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
