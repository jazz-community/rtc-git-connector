const gzip = require('gzip-js');
const base64js = require('base64-js');
const Buffer = require('buffer/').Buffer;

// Replace some characters in the input string (needed due to the strange implementation)
function base64UrlEncode(string) {
    string = string.replace(/\+/g, '-');
    string = string.replace(/\//g, '_');
    string = string.replace(/=/g, '.');
    return string;
}

// Replace some characters in the input string (needed due to the strange implementation)
function base64UrlDecode(string) {
    string = string.replace(/-/g, '+');
    string = string.replace(/_/g, '/');
    string = string.replace(/\./g, '=');
    return string;
}

// Export the functions needed for encoding and decoding data in git commit links
export function encoder () {
    // Creates an encoded string from a stringified json object
    this.encode = function encode(value) {
        const compressed = gzip.zip(value);
        const buffer = Buffer.from(compressed);
        const encoded = base64js.fromByteArray(buffer);
        const urlEncoded = base64UrlEncode(encoded);
        return urlEncoded;
    };

    // Creates a stringified json object from the encoded string
    this.decode = function decode(value) {
        const urlDecoded = base64UrlDecode(value);
        const compressed = base64js.toByteArray(urlDecoded);
        const deflated = gzip.unzip(compressed);
        const buffer = Buffer.from(deflated);
        return buffer.toString();
    };
}

// GitHub API client library
export const GitHubApi = require('@octokit/rest');

// GitLab API client library
export const GitLabApi = require('node-gitlab-api');

// Fontawesome fonts
export const FontAwesome = require('@fortawesome/fontawesome');
const FaCheck = require('@fortawesome/fontawesome-free-solid/faCheck');
const FaPlus = require('@fortawesome/fontawesome-free-solid/faPlus');

// Adding the entire solid library doesn't seem to work in the frontend.
// So we have no other choice than adding them one by one.
FontAwesome.library.add(FaCheck);
FontAwesome.library.add(FaPlus);