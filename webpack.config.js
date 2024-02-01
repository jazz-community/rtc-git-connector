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
        entry: {
            CommitLinkEncoder: ["./src/CommitLinkEncoder.js"],
            FontAwesomeProvider: ["./src/FontAwesomeProvider.js"],
            ClipboardJS: ["clipboard"],
            GitHubApi: ["@octokit/rest"],
            GitLabApi: ["@gitbeaker/rest"],
            Handlebars: ["handlebars"],
            JustHandlebarsHelpers: ["just-handlebars-helpers"],
            TurndownService: ["turndown"]
        },
        output: {
            filename: "[name].js",
            path: __dirname + "/resources/dist"
        },
        optimization: {
            minimizer: [new TerserPlugin()]
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            exclude: /node_modules[\\/]@babel/,
                            presets: [["@babel/preset-env", { "modules": "amd" }]],
                            plugins: ["@babel/plugin-transform-runtime"]
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
                    ],
                    include: ["./resources/dist"]
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
                            exclude: /node_modules[\\/]@babel/,
                            presets: [["@babel/preset-env", { "modules": "amd" }]],
                            plugins: ["@babel/plugin-transform-runtime"]
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
