new (function () {
    const base64js = require("base64-js");
    const Buffer = require("buffer/").Buffer;
    const pako = require("pako");

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

    // Creates an encoded string from a stringified json object
    this.encode = function (value) {
        const compressed = pako.gzip(Buffer.from(value));
        const encoded = base64js.fromByteArray(compressed);
        const urlEncoded = base64UrlEncode(encoded);
        return urlEncoded;
    };

    // Creates a stringified json object from the encoded string
    this.decode = function (value) {
        const urlDecoded = base64UrlDecode(value);
        const compressed = base64js.toByteArray(urlDecoded);
        const deflated = pako.ungzip(compressed);
        const buffer = Buffer.from(deflated);
        return buffer.toString();
    };
})();
