const gzip = require('gzip-js');
const base64js = require('base64-js');
const Buffer = require('buffer/').Buffer;

// Replace some characters in the input string
function base64UrlEncode(string) {
    string = string.replace(/\+/g, '-');
    string = string.replace(/\//g, '_');
    string = string.replace(/=/g, '.');
    return string;
}

// Replace some characters in the input string
function base64UrlDecode(string) {
    string = string.replace(/-/g, '+');
    string = string.replace(/_/g, '/');
    string = string.replace(/\./g, '=');
    return string;
}

// Creates a stringified json object from the encoded value.
export function decode(value) {
    const urlDecoded = base64UrlDecode(value);
    const compressed = base64js.toByteArray(urlDecoded);
    const deflated = gzip.unzip(compressed);
    const buffer = Buffer.from(deflated);
    return buffer.toString();
}

// Creates an encoded value from a stringified json object.
export function encode(value) {
    const compressed = gzip.zip(value);
    const buffer = Buffer.from(compressed);
    const encoded = base64js.fromByteArray(buffer);
    const urlEncoded = base64UrlEncode(encoded);
    return urlEncoded;
}