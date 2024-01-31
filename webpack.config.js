const RemovePlugin = require("remove-files-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const ZipPlugin = require("zip-webpack-plugin");
const moment = require("moment");
const packageJson = require("./package.json");

module.exports = (env) => {
    const timestamp = moment().format("[_]YYYYMMDD[-]HHmm");
    const version =
        (typeof env !== "undefined" &&
            typeof env.buildUUID !== "undefined" &&
            packageJson.version + "_" + env.buildUUID) ||
        packageJson.version + timestamp;
    const config = {
        target: ["web", "es5"],
        resolve: {
            extensions: [".ts", "..."],
            fallback: {
                "https": false
            }
        },
        externals: {
            "currencyformatter.js": "currencyformatter.js",
            "moment/min/moment-with-locales": "moment",
            "sprintf-js": "sprintf-js"
        },
        entry: "./src/RtcGitConnectorModules.js",
        output: {
            libraryTarget: "var",
            library: "com_siemens_bt_jazz_rtcgitconnector_modules",
            filename: "modules-bundle.js",
            path: __dirname + "/resources/dist"
        },
        optimization: {
            minimizer: [new TerserPlugin()]
        },
        module: {
            rules: [
                {
                    test: /RtcGitConnectorModules\.js$/,
                    loader: "string-replace-loader",
                    options: {
                        search: "__BUILD_VERSION__",
                        replace: version,
                        flags: "i",
                        strict: true
                    }
                },
                {
                    test: /\.js$/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env"]
                        }
                    }
                }
            ]
        },
        plugins: [
            new RemovePlugin({
                before: {
                    root: __dirname,
                    test: [
                        {
                            folder: "./",
                            method: (filePath) => {
                                return new RegExp(
                                    /com\.siemens\.bt\.jazz\.workitemeditor\.rtcGitConnector.*\.zip$/,
                                    "i"
                                ).test(filePath);
                            }
                        }
                    ]
                },
                after: {
                    root: __dirname,
                    include: ["dist"]
                }
            })
        ]
    };

    const themeConfig = {
        target: ["web", "es5"],
        entry: "./src/theme/customMenuItems.js",
        output: {
            path: __dirname + "/dist",
            filename: "com.siemens.bt.jazz.workitemeditor.rtcGitConnector_theme_" + version + ".js"
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env"]
                        }
                    }
                }
            ]
        },
        plugins: [
            new ZipPlugin({
                path: __dirname,
                filename: "com.siemens.bt.jazz.workitemeditor.rtcGitConnector_theme_" + version + ".zip"
            })
        ]
    };

    return [config, themeConfig];
};
