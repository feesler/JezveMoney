import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';

const filename = fileURLToPath(import.meta.url);
const currentDir = dirname(filename);

export default {
    mode: 'production',
    target: 'browserslist',
    context: resolve(currentDir, '..'),
    entry: './tests/index.js',
    output: {
        filename: 'index.js',
        path: resolve(currentDir, '../dist/app/admin/view/js/tests'),
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                include: [
                    resolve(currentDir, '../tests'),
                    resolve(currentDir, '../node_modules/jezvejs'),
                    resolve(currentDir, '../node_modules/jezve-test'),
                ],
                exclude: /node_modules\/(?!(jezve-test|jezvejs)\/).*/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true,
                            babelrc: false,
                            rootMode: 'upward',
                            plugins: [
                                '@babel/plugin-syntax-import-assertions',
                            ],
                        },
                    },
                ],
            },
        ],
    },
    optimization: {
        minimize: false,
    },
    plugins: [
        new webpack.NormalModuleReplacementPlugin(
            /jezve-test\/NodeEnvironment/,
            'jezve-test/BrowserEnvironment',
        ),
    ],
};
