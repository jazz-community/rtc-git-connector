const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const moment = require('moment');
const packageJson = require('./package.json');
const JazzUpdateSitePlugin = require('jazz-update-site-webpack-plugin');

module.exports = (env) => {
    const now = new Date();
    const timestamp = moment().format('[-]YYYYMMDD-HHMM');
    const version = (typeof env !== 'undefined' && packageJson.version + "-" + env.buildUUID) || packageJson.version + timestamp;
    const config = {
        node : {
            fs : 'empty',
            net : 'empty',
            tls : 'empty'
        },

        entry: {
            app: './src/RtcGitConnectorModules.js',
        },

        output: {
            libraryTarget: 'var',
            library: 'com_siemens_bt_jazz_rtcgitconnector_modules',
            filename: './resources/dist/modules-bundle.js',
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

            new UglifyJsPlugin()
        ]
    };
    return config;
};