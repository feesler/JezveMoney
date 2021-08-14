import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
    mode: 'production',
    target: 'browserslist',
    entry: './tests/index.browser.js',
    output: {
        filename: 'index.js',
        path: resolve(__dirname, 'dist/admin/view/js/tests'),
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                include: [
                    resolve(__dirname, 'tests'),
                    resolve('node_modules/jezvejs'),
                    resolve('node_modules/jezve-test'),
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
};
