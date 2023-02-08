import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const filename = fileURLToPath(import.meta.url);
const currentDir = dirname(filename);

export default {
    target: 'browserslist',
    context: resolve(currentDir, '..'),
    entry: {
        polyfills: {
            import: './src/view/js/polyfill/index.js',
            filename: 'view/js/polyfill/index.js',
        },

        locale_en: {
            import: './src/view/js/locale/en.js',
            filename: 'view/js/locale/en.js',
        },

        locale_ru: {
            import: './src/view/js/locale/ru.js',
            filename: 'view/js/locale/ru.js',
        },

        MainView: {
            import: './src/view/Views/Main/MainView.js',
            filename: 'view/js/[name].js',
        },
        LoginView: {
            import: './src/view/Views/Login/LoginView.js',
            filename: 'view/js/[name].js',
        },
        RegisterView: {
            import: './src/view/Views/Register/RegisterView.js',
            filename: 'view/js/[name].js',
        },
        AccountListView: {
            import: './src/view/Views/AccountList/AccountListView.js',
            filename: 'view/js/[name].js',
        },
        AccountView: {
            import: './src/view/Views/Account/AccountView.js',
            filename: 'view/js/[name].js',
        },
        PersonListView: {
            import: './src/view/Views/PersonList/PersonListView.js',
            filename: 'view/js/[name].js',
        },
        PersonView: {
            import: './src/view/Views/Person/PersonView.js',
            filename: 'view/js/[name].js',
        },
        CategoryListView: {
            import: './src/view/Views/CategoryList/CategoryListView.js',
            filename: 'view/js/[name].js',
        },
        CategoryView: {
            import: './src/view/Views/Category/CategoryView.js',
            filename: 'view/js/[name].js',
        },
        ProfileView: {
            import: './src/view/Views/Profile/ProfileView.js',
            filename: 'view/js/[name].js',
        },
        AboutView: {
            import: './src/view/Views/About/AboutView.js',
            filename: 'view/js/[name].js',
        },
        TransactionListView: {
            import: './src/view/Views/TransactionList/TransactionListView.js',
            filename: 'view/js/[name].js',
        },
        TransactionView: {
            import: './src/view/Views/Transaction/TransactionView.js',
            filename: 'view/js/[name].js',
        },
        ImportView: {
            import: './src/view/Views/Import/ImportView.js',
            filename: 'view/js/[name].js',
        },
        StatisticsView: {
            import: './src/view/Views/Statistics/StatisticsView.js',
            filename: 'view/js/[name].js',
        },

        ApiConsoleView: {
            import: './src/admin/view/Views/ApiConsole/ApiConsoleView.js',
            filename: 'admin/view/js/[name].js',
        },
        AdminCurrencyView: {
            import: './src/admin/view/Views/Currency/CurrencyView.js',
            filename: 'admin/view/js/[name].js',
        },
        AdminIconView: {
            import: './src/admin/view/Views/Icon/IconView.js',
            filename: 'admin/view/js/[name].js',
        },
        AdminUserView: {
            import: './src/admin/view/Views/User/UserView.js',
            filename: 'admin/view/js/[name].js',
        },
        BalanceView: {
            import: './src/admin/view/Views/Balance/BalanceView.js',
            filename: 'admin/view/js/[name].js',
        },
        AdminMainView: {
            import: './src/admin/view/Views/Main/MainView.js',
            filename: 'admin/view/js/[name].js',
        },
        AdminLogsView: {
            import: './src/admin/view/Views/Logs/LogsView.js',
            filename: 'admin/view/js/[name].js',
        },
        DBInstallView: {
            import: './src/admin/view/Views/DBInstall/DBInstallView.js',
            filename: 'admin/view/js/[name].js',
        },
        QueriesView: {
            import: './src/admin/view/Views/Queries/QueriesView.js',
            filename: 'admin/view/js/[name].js',
        },
        AdminTestsView: {
            import: './src/admin/view/Views/Tests/TestsView.js',
            filename: 'admin/view/js/[name].js',
        },
    },
    output: {
        filename: '[name].js',
        path: resolve(currentDir, '../dist'),
        clean: {
            keep: 'vendor',
        },
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: ({ chunk }) => (
                chunk.filenameTemplate
                    .replace('/js/', '/css/')
                    .replace('.js', '.css')
            ),
        }),
    ],
    module: {
        rules: [
            {
                test: /\.m?js$/,
                include: [
                    resolve(currentDir, '../src'),
                    resolve(currentDir, '../node_modules/jezvejs'),
                ],
                exclude: /node_modules\/(?!(jezvejs)\/).*/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true,
                            babelrc: false,
                            rootMode: 'upward',
                        },
                    },
                    'astroturf/loader',
                ],
            },
            {
                test: /\.(scss|css)$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'postcss-loader',
                    'sass-loader',
                ],
                sideEffects: true,
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
        ],
    },
    cache: {
        type: 'filesystem',
    },
};
