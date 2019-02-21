const JazzUpdateSitePlugin = require('jazz-update-site-webpack-plugin');
const RemovePlugin = require('remove-files-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const moment = require('moment');
const packageJson = require('./package.json');

module.exports = (env) => {
    const timestamp = moment().format('[_]YYYYMMDD[-]HHmm');
    const version = (typeof env !== 'undefined' && (packageJson.version + "_" + env.buildUUID)) || packageJson.version + timestamp;
    const config = {
        node: {
            fs: 'empty',
            net: 'empty',
            tls: 'empty',
            readline: 'empty'
        },

        entry: {
            app: './src/RtcGitConnectorModules.js',
        },

        output: {
            libraryTarget: 'var',
            library: 'com_siemens_bt_jazz_rtcgitconnector_modules',
            filename: 'modules-bundle.js',
            path: __dirname + '/resources/dist'
        },

        resolve: {
            alias: {
                handlebars: 'handlebars/dist/handlebars.min.js'
            }
        },

        module: {
            rules: [
                {
                    test: /RtcGitConnectorModules\.js$/,
                    loader: 'string-replace-loader',
                    options: {
                        search: '__BUILD_VERSION__',
                        replace: version,
                        flags: 'i',
                        strict: true
                    }
                }
            ]
        },

        plugins: [
            new JazzUpdateSitePlugin({
                appType: 'ccm',
                projectId: 'com.siemens.bt.jazz.workitemeditor.rtcGitConnector',
                acceptGlobPattern: [
                    'resources/**',
                    'META-INF/**',
                    'plugin.xml',
                ],
                projectInfo: {
                    author: packageJson.author,
                    copyright: packageJson.author,
                    description: packageJson.description,
                    license: packageJson.license,
                    version: version,
                },
            }),

            new UglifyJsPlugin(),

            new RemovePlugin({
                before: {
                    root: __dirname,
                    test: [
                        {
                            folder: './',
                            method: (filePath) => {
                                return new RegExp(/com\.siemens\.bt\.jazz\.workitemeditor\.rtcGitConnector.*\.zip$/, 'i').test(filePath);
                            }
                        }
                    ]
                },
                after: {
                    root: __dirname,
                    include: ['dist']
                }
            })
        ]
    };

    const themeConfig = {
        entry: './src/theme/customMenuItems.js',

        output: {
            path: __dirname + "/dist",
            filename: 'com.siemens.bt.jazz.workitemeditor.rtcGitConnector_theme_' + version + ".js"
        },

        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                }
            ]
        },

        plugins: [
            new ZipPlugin({
                path: __dirname,
                filename: 'com.siemens.bt.jazz.workitemeditor.rtcGitConnector_theme_' + version + ".zip"
            })
        ]
    };

    return [config, themeConfig];
};