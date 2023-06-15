import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
import ImageMinimizerPlugin from 'image-minimizer-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const filename = fileURLToPath(import.meta.url);
const currentDir = dirname(filename);

export default {
    target: 'browserslist',
    context: resolve(currentDir, '..'),
    entry: {
        polyfills: {
            import: './src/view/utils/polyfill/index.js',
            filename: 'view/js/polyfill/index.js',
        },

        locale_en: {
            import: './src/view/Locales/en.js',
            filename: 'view/js/locale/en.js',
        },

        locale_ru: {
            import: './src/view/Locales/ru.js',
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
        SettingsView: {
            import: './src/view/Views/Settings/SettingsView.js',
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
        ScheduleView: {
            import: './src/view/Views/Schedule/ScheduleView.js',
            filename: 'view/js/[name].js',
        },
        ScheduleItemView: {
            import: './src/view/Views/ScheduleItem/ScheduleItemView.js',
            filename: 'view/js/[name].js',
        },
        ReminderListView: {
            import: './src/view/Views/ReminderList/ReminderListView.js',
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
        path: resolve(currentDir, '../dist'),
        clean: {
            keep: 'vendor',
        },
        filename: (pathData) => (
            `view/js/chunk.${pathData.chunk.renderedHash}.js`
        ),
    },
    plugins: [
        new WebpackManifestPlugin({
            fileName: resolve(currentDir, '../dist/view/manifest.json'),
            generate: (seed, files) => {
                const entrypoints = new Set();
                files.forEach(
                    /* eslint-disable-next-line no-underscore-dangle */
                    (file) => ((file.chunk || {})._groups || []).forEach(
                        (group) => entrypoints.add(group),
                    ),
                );

                const entries = [...entrypoints];
                const entryArrayManifest = entries.reduce((acc, entry) => {
                    const name = (entry.options || {}).name
                        || (entry.runtimeChunk || {}).name;

                    const entryFiles = [].concat(
                        ...(entry.chunks || []).map((chunk) => ([...chunk.files])),
                    ).filter(Boolean);

                    return name ? { ...acc, [name]: entryFiles } : acc;
                }, seed);

                return entryArrayManifest;
            },
        }),
        new MiniCssExtractPlugin({
            filename: (pathData) => {
                if (pathData.chunk.filenameTemplate) {
                    return pathData.chunk.filenameTemplate
                        .replace('/js/', '/css/')
                        .replace('.js', '.css');
                }

                return `view/css/chunk.${pathData.chunk.renderedHash}.css`;
            },
            ignoreOrder: true,
        }),
        new CopyWebpackPlugin({
            patterns: [{
                context: resolve(currentDir, '../src/view/img').replace(/\\/g, '/'),
                from: '**/*',
                to: '../dist/view/img/',
            }],
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
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendor',
                    chunks: 'initial',
                },
            },
        },
        minimize: true,
        minimizer: [
            '...',
            new ImageMinimizerPlugin({
                test: /\.svg$/i,
                deleteOriginalAssets: false,
                minimizer: {
                    implementation: ImageMinimizerPlugin.imageminMinify,
                    options: {
                        plugins: [
                            [
                                'svgo',
                                {
                                    plugins: [
                                        {
                                            name: 'preset-default',
                                            params: {
                                                overrides: {
                                                    removeViewBox: false,
                                                    inlineStyles: false,
                                                },
                                            },
                                        },
                                        {
                                            name: 'removeAttrs',
                                            params: {
                                                attrs: '(fill|stroke|style)',
                                            },
                                        },
                                    ],
                                },
                            ],
                        ],
                    },
                },
                generator: [
                    {
                        type: 'asset',
                        implementation: ImageMinimizerPlugin.imageminGenerate,
                        options: {
                            plugins: [
                                'imagemin-svgo',
                            ],
                        },
                    },
                ],
            }),
        ],
    },
};
