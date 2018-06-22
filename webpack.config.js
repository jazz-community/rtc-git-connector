const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const packageJson = require('./package.json');
const JazzUpdateSitePlugin = require('jazz-update-site-webpack-plugin');

module.exports = (env) => {
    const version = (typeof env !== 'undefined' && env.buildUUID) || packageJson.version;
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