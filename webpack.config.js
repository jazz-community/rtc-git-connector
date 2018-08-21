const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const moment = require('moment');
const packageJson = require('./package.json');
const JazzUpdateSitePlugin = require('jazz-update-site-webpack-plugin');

module.exports = (env) => {
    const timestamp = moment().format('[_]YYYYMMDD[-]HHmm');
    const version = (typeof env !== 'undefined' && (packageJson.version + "_" + env.buildUUID)) || packageJson.version + timestamp;
    const config = {
        node: {
            fs: 'empty',
            net: 'empty',
            tls: 'empty'
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