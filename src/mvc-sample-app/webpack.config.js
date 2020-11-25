const path = require('path');
var glob = require('glob');
var fs = require('fs');
const { CheckerPlugin } = require('awesome-typescript-loader');
var FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
buildMode = (process.env.NODE_ENV !== 'Release') ? 'development' : 'production';


const configCallback = (env, argv) => {
    mode = buildMode;
    console.log(`Running webpack with ${mode} mode`);
    var config = {
        entry: getTsFiles(),
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx']
        },
        mode,
        output: {
            path: mode === 'development' ? path.resolve(__dirname, './wwwroot/js') : path.resolve(__dirname, './wwwroot/dist/js'),
            filename: mode === 'development' ? '[name].js' : '[name].min.js',
            libraryTarget: 'umd',
            umdNamedDefine: true,
        },
        optimization: {
            splitChunks: {
                cacheGroups: {
                    vendor: {
                      // test: /node_modules/,
                      // test: /[\\/]node_modules[\\/]|(\/ts\/common\/)/,
                       test: /[\\/]node_modules|(common)[\\/]/,
                        chunks: 'all',
                        name: 'common',
                        priority: 10,
                        enforce: true
                    },
                    default: false
                }
            },
            runtimeChunk: false
        },    
        plugins: [
            new CheckerPlugin(),
            new FriendlyErrorsWebpackPlugin({
              compilationSuccessInfo: {
              },
              onErrors: function (severity, errors) {
                if (severity !== 'error') {
                    return;
                  }
                const error = errors.map(function(e){ return e.message}).join("\r\n\n");;
                fs.writeFileSync('../../cireports/errorlogs/app-error.txt', error);
              },
              clearConsole: true,
              additionalFormatters: [],
              additionalTransformers: []
            }),
            // {
            //   apply: (compiler) => {
            //     compiler.hooks.done.tap('MergeIntoSingleFilePlugin', (compilation) => {
            //       setTimeout(() => {
            //         new MergeIntoSingleFilePlugin({
            //           files: mode === 'development' ? development_bundle : production_bundle
            //         })
            //       });
            //     });
            //   }
            // },
        ],
        module: {
            rules: [{
              test: /\.tsx?$/,
              loader: 'awesome-typescript-loader',
              exclude: /node_modules/,
            }]
          },
    }

    if (mode === 'development') {
        config.devtool = 'source-map';
      }
    return config;
};

module.exports = configCallback;

function getTsFiles() {
    var files = glob.sync('wwwroot/ts/**/*.ts', { silent: true });
    var entries = {};
    for (var i = 0; i < files.length; i++) {
        var entry = files[i].replace('./', '');
        var entryPoint = entry.replace(/\.ts/, '').replace('wwwroot/ts/','');;
        entries[entryPoint] = './' + entry;
    }
    return entries;
}