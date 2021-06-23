import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
    target: ['web', 'es5'],
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
        path: resolve(__dirname, 'dist'),
        clean: {
            keep: 'vendor',
        },
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: ['babel-loader', 'astroturf/loader'],
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
        ]
    },
};
