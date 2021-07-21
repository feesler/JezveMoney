import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

export default {
    target: 'browserslist',
    entry: {
        MainView: {
            import: './src/view/js/MainView.js',
            filename: 'view/js/[name].js',
        },
        LoginView: {
            import: './src/view/js/LoginView.js',
            filename: 'view/js/[name].js',
        },
        RegisterView: {
            import: './src/view/js/RegisterView.js',
            filename: 'view/js/[name].js',
        },
        AccountListView: {
            import: './src/view/js/AccountListView.js',
            filename: 'view/js/[name].js',
        },
        AccountView: {
            import: './src/view/js/AccountView.js',
            filename: 'view/js/[name].js',
        },
        PersonListView: {
            import: './src/view/js/PersonListView.js',
            filename: 'view/js/[name].js',
        },
        PersonView: {
            import: './src/view/js/PersonView.js',
            filename: 'view/js/[name].js',
        },
        ProfileView: {
            import: './src/view/js/ProfileView.js',
            filename: 'view/js/[name].js',
        },
        TransactionListView: {
            import: './src/view/js/TransactionListView.js',
            filename: 'view/js/[name].js',
        },
        TransactionView: {
            import: './src/view/js/TransactionView.js',
            filename: 'view/js/[name].js',
        },
        ImportView: {
            import: './src/view/js/ImportView.js',
            filename: 'view/js/[name].js',
        },
        StatisticsView: {
            import: './src/view/js/StatisticsView.js',
            filename: 'view/js/[name].js',
        },

        ApiConsoleView: {
            import: './src/admin/view/js/ApiConsoleView.js',
            filename: 'admin/view/js/[name].js',
        },
        AdminCurrencyView: {
            import: './src/admin/view/js/CurrencyView.js',
            filename: 'admin/view/js/[name].js',
        },
        AdminIconView: {
            import: './src/admin/view/js/IconView.js',
            filename: 'admin/view/js/[name].js',
        },
        AdminImportRuleView: {
            import: './src/admin/view/js/ImportRuleView.js',
            filename: 'admin/view/js/[name].js',
        },
        AdminImportTplView: {
            import: './src/admin/view/js/ImportTplView.js',
            filename: 'admin/view/js/[name].js',
        },
        AdminUserView: {
            import: './src/admin/view/js/UserView.js',
            filename: 'admin/view/js/[name].js',
        },
    },
    output: {
        filename: '[name].js',
        path: resolve(__dirname, './dist'),
        clean: {
            keep: 'vendor',
        },
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: ({ chunk }) => chunk.filenameTemplate
                .replace("/js/", "/css/")
                .replace(".js", ".css")
        }),
    ],
    module: {
        rules: [
            {
                test: /\.m?js$/,
                include: [
                    resolve(__dirname, 'src'),
                    resolve('node_modules/jezvejs'),
                ],
                exclude: /node_modules\/(?!(jezvejs)\/).*/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true,
                            babelrc: false,
                            rootMode: 'upward',
                        }
                    },
                    'astroturf/loader'
                ],
            },
            {
                test: /\.css$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'postcss-loader',
                ],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
        ]
    },
};
