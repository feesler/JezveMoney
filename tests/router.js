import { MainView } from './view/MainView.js';
import { LoginView } from './view/LoginView.js';
import { RegisterView } from './view/RegisterView.js';
import { ProfileView } from './view/ProfileView.js';
import { AboutView } from './view/AboutView.js';
import { AccountView } from './view/AccountView.js';
import { AccountListView } from './view/AccountListView.js';
import { PersonView } from './view/PersonView.js';
import { PersonListView } from './view/PersonListView.js';
import { CategoryView } from './view/CategoryView.js';
import { CategoryListView } from './view/CategoryListView.js';
import { TransactionListView } from './view/TransactionListView.js';
import { TransactionView } from './view/TransactionView.js';
import { ScheduleView } from './view/ScheduleView.js';
import { ScheduleItemView } from './view/ScheduleItemView.js';
import { ReminderListView } from './view/ReminderListView.js';
import { ImportView } from './view/ImportView.js';
import { StatisticsView } from './view/StatisticsView.js';
import { SettingsView } from './view/SettingsView.js';

const routeMap = {
    index: MainView,
    login: LoginView,
    register: RegisterView,
    profile: ProfileView,
    settings: SettingsView,
    about: AboutView,
    import: ImportView,
    statistics: StatisticsView,
    accounts: {
        list: AccountListView,
        item: AccountView,
    },
    persons: {
        list: PersonListView,
        item: PersonView,
    },
    categories: {
        list: CategoryListView,
        item: CategoryView,
    },
    transactions: {
        list: TransactionListView,
        item: TransactionView,
    },
    schedule: {
        list: ScheduleView,
        item: ScheduleItemView,
    },
    reminders: ReminderListView,
};
const listViews = ['accounts', 'persons', 'categories', 'transactions', 'schedule'];

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
        reqPath = reqPath.substring(testUrl.pathname.length);
    }

    // cut leading and trailing slashes
    const path = reqPath.replace(/^\/+|\/+$/g, '');
    const parts = path.split('/');
    const part = parts.shift();

    if (!part || !part.length) {
        return routeMap.index;
    }

    const view = routeMap[part];
    if (typeof view === 'undefined') {
        throw new Error(`Unknown route: ${reqUrl.pathname}`);
    }

    if (listViews.includes(part)) {
        const actPart = parts.shift();
        if (actPart === 'create' || actPart === 'update') {
            return view.item;
        }

        return view.list;
    }

    return view;
}
