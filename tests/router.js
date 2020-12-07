import { MainView } from './view/main.js';
import { LoginView } from './view/login.js';
import { RegisterView } from './view/register.js';
import { ProfileView } from './view/profile.js';
import { AccountView } from './view/account.js';
import { AccountsView } from './view/accounts.js';
import { PersonView } from './view/person.js';
import { PersonsView } from './view/persons.js';
import { TransactionsView } from './view/transactions.js';
import { ExpenseTransactionView } from './view/transaction/expense.js';
import { IncomeTransactionView } from './view/transaction/income.js';
import { TransferTransactionView } from './view/transaction/transfer.js';
import { DebtTransactionView } from './view/transaction/debt.js';
import { ImportView } from './view/import.js';
import { StatisticsView } from './view/statistics.js';

/** Process request url and return view class if match */
export async function route(env, url) {
    if (typeof url !== 'string') {
        throw new Error('URL not specified');
    }

    const testUrl = new URL(env.baseUrl());

    const reqUrl = new URL(url);
    if (reqUrl.host !== testUrl.host) {
        throw new Error(`Invalid URL specified: ${url}`);
    }

    // Remove leading directory if needed
    let reqPath = reqUrl.pathname;
    if (reqPath.startsWith(testUrl.pathname)) {
        reqPath = reqPath.substr(testUrl.pathname.length);
    }

    // cut leading and trailing slashes
    const path = reqPath.replace(/^\/+|\/+$/g, '');
    const parts = path.split('/');
    const part = parts.shift();

    if (!part) {
        return MainView;
    }

    if (part === 'login') {
        return LoginView;
    }

    if (part === 'register') {
        return RegisterView;
    }

    if (part === 'profile') {
        return ProfileView;
    }

    if (part === 'accounts') {
        const actPart = parts.shift();
        if (!actPart) {
            return AccountsView;
        }

        if (actPart === 'new' || actPart === 'edit') {
            return AccountView;
        }

        throw new Error(`Unknown route: ${reqUrl.pathname}`);
    }

    if (part === 'persons') {
        const actPart = parts.shift();
        if (!actPart) {
            return PersonsView;
        }

        if (actPart === 'new' || actPart === 'edit') {
            return PersonView;
        }

        throw new Error(`Unknown route: ${reqUrl.pathname}`);
    }

    if (part === 'transactions') {
        const actPart = parts.shift();
        if (!actPart) {
            return TransactionsView;
        }

        if (actPart === 'new') {
            const trType = reqUrl.searchParams.get('type');
            if (!trType || trType === 'expense') {
                return ExpenseTransactionView;
            }
            if (trType === 'income') {
                return IncomeTransactionView;
            }
            if (trType === 'transfer') {
                return TransferTransactionView;
            }
            if (trType === 'debt') {
                return DebtTransactionView;
            }

            throw new Error(`Unknown transaction type: ${trType}`);
        }

        if (actPart === 'edit') {
            const selectedMenuItem = await env.query('.trtype-menu__item_selected');
            if (!selectedMenuItem) {
                throw new Error('Invalid transaction type menu');
            }

            const trTypeData = await env.prop(selectedMenuItem, 'dataset.type');
            const trType = parseInt(trTypeData, 10);
            if (trType === 1) {
                return ExpenseTransactionView;
            }
            if (trType === 2) {
                return IncomeTransactionView;
            }
            if (trType === 3) {
                return TransferTransactionView;
            }
            if (trType === 4) {
                return DebtTransactionView;
            }

            throw new Error(`Unknown transaction type: ${trType}`);
        }

        throw new Error(`Unknown route: ${reqUrl.pathname}`);
    }

    if (part === 'import') {
        return ImportView;
    }

    if (part === 'statistics') {
        return StatisticsView;
    }

    throw new Error(`Unknown route: ${reqUrl.pathname}`);
}
