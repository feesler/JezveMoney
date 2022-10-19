import webpack from 'webpack';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
    mode: 'production',
    target: 'browserslist',
    context: resolve(__dirname, '..'),
    entry: './tests/index.js',
    output: {
        filename: 'index.js',
        path: resolve(__dirname, '../dist/admin/view/js/tests'),
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                include: [
                    resolve(__dirname, '../tests'),
                    resolve(__dirname, '../node_modules/jezvejs'),
                    resolve(__dirname, '../node_modules/jezve-test'),
                ],
                exclude: /node_modules\/(?!(jezve-test|jezvejs)\/).*/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true,
                            babelrc: false,
                            rootMode: 'upward',
                        }
                    }
                ],
            },
        ]
    },
    optimization: {
        minimize: false,
    },
    plugins: [
        new webpack.NormalModuleReplacementPlugin(
            /jezve-test\/NodeEnvironment/,
            'jezve-test\/BrowserEnvironment'
        ),
    ],
};
