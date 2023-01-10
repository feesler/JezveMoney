import { assert, test } from 'jezve-test';
import { App } from '../Application.js';
import { tokensMap } from '../model/locale.js';
import { AccountListView } from '../view/AccountListView.js';
import { AccountView } from '../view/AccountView.js';
import { CategoryListView } from '../view/CategoryListView.js';
import { CategoryView } from '../view/CategoryView.js';
import { ImportView } from '../view/ImportView.js';
import { MainView } from '../view/MainView.js';
import { PersonListView } from '../view/PersonListView.js';
import { PersonView } from '../view/PersonView.js';
import { StatisticsView } from '../view/StatisticsView.js';
import { TransactionListView } from '../view/TransactionListView.js';
import { TransactionView } from '../view/TransactionView.js';

const translateExceptions = [
    'APP_NAME',
];

export const translationTest = async () => {
    const [baseLocale, ...locales] = Object.keys(tokensMap);
    await test('Base locale', () => {
        assert.isObject(tokensMap[baseLocale], 'Base locale not defined');
        return true;
    });

    const baseTokens = tokensMap[baseLocale];
    const baseTokenNames = Object.keys(baseTokens);

    for (const locale of locales) {
        await test(`Locale translation [${locale}]`, () => {
            const localeTokens = tokensMap[locale];

            // Check all tokens from base locale present in the current locale and translated
            baseTokenNames.forEach((name) => {
                const token = localeTokens[name];
                assert.isString(token, `Token '${name}' not defined at locale '${locale}'`);

                if (translateExceptions.includes(name)) {
                    return;
                }

                assert(token !== baseTokens[name], `Token '${name}' not translated at locale '${locale}'`);
            });

            // Check current locale not includes excess tokens
            const tokenNames = Object.keys(localeTokens);
            tokenNames.forEach((name) => {
                assert.isString(baseTokens[name], `Unknown token '${name}' at locale '${locale}'`);
            });

            return true;
        });
    }
};

const checkViewLocale = (locale) => {
    App.view.model.locale = locale;
    return App.view.checkState(App.view.getExpectedState());
};

export const changeLocale = async (locale) => {
    await test(`Change locale to '${locale}'`, async () => {
        await App.view.navigateToAccounts();
        assert.instanceOf(App.view, AccountListView, 'Invalid view');

        App.view.model.locale = locale;
        const expected = App.view.getExpectedState();

        await App.view.changeLocale(locale);
        assert.instanceOf(App.view, AccountListView, 'Invalid view');

        return App.view.checkState(expected);
    });

    await test('Main view', async () => {
        const expected = MainView.render(App.state);

        await App.goToMainView();
        assert.instanceOf(App.view, MainView, 'Invalid view');

        return App.view.checkState(expected);
    });

    await test('Account views', async () => {
        await App.view.navigateToAccounts();
        assert.instanceOf(App.view, AccountListView, 'Invalid view');
        checkViewLocale(locale);

        await App.view.goToCreateAccount();
        assert.instanceOf(App.view, AccountView, 'Invalid view');
        checkViewLocale(locale);

        await App.view.cancel();
        assert.instanceOf(App.view, AccountListView, 'Invalid view');
        await App.view.goToUpdateAccount(0);
        assert.instanceOf(App.view, AccountView, 'Invalid view');

        const account = App.state.getFirstAccount();
        assert(account, 'No accounts available');
        App.view.setExpectedAccount(account);
        return checkViewLocale(locale);
    });

    await test('Person views', async () => {
        await App.view.navigateToPersons();
        assert.instanceOf(App.view, PersonListView, 'Invalid view');
        checkViewLocale(locale);

        await App.view.goToCreatePerson();
        assert.instanceOf(App.view, PersonView, 'Invalid view');
        checkViewLocale(locale);

        await App.view.cancel();
        assert.instanceOf(App.view, PersonListView, 'Invalid view');
        await App.view.goToUpdatePerson(0);
        assert.instanceOf(App.view, PersonView, 'Invalid view');
        return checkViewLocale(locale);
    });

    await test('Category views', async () => {
        await App.view.navigateToCategories();
        assert.instanceOf(App.view, CategoryListView, 'Invalid view');
        checkViewLocale(locale);

        await App.view.goToCreateCategory();
        assert.instanceOf(App.view, CategoryView, 'Invalid view');
        checkViewLocale(locale);

        await App.view.cancel();
        assert.instanceOf(App.view, CategoryListView, 'Invalid view');
        await App.view.goToUpdateCategory(0);
        assert.instanceOf(App.view, CategoryView, 'Invalid view');
        return checkViewLocale(locale);
    });

    await test('Transaction views', async () => {
        await App.view.navigateToTransactions();
        assert.instanceOf(App.view, TransactionListView, 'Invalid view');
        checkViewLocale(locale);

        await App.view.goToCreateTransaction();
        assert.instanceOf(App.view, TransactionView, 'Invalid view');
        checkViewLocale(locale);

        await App.view.cancel();
        assert.instanceOf(App.view, TransactionListView, 'Invalid view');
        await App.view.goToUpdateTransaction(0);
        assert.instanceOf(App.view, TransactionView, 'Invalid view');
        return checkViewLocale(locale);
    });

    await test('Statistics view', async () => {
        await App.view.navigateToStatistics();
        assert.instanceOf(App.view, StatisticsView, 'Invalid view');

        await App.view.waitForLoad();

        return checkViewLocale(locale);
    });

    await test('Import view', async () => {
        await App.view.navigateToImport();
        assert.instanceOf(App.view, ImportView, 'Invalid view');
        return checkViewLocale(locale);
    });
};

export const changeLocaleTest = async () => {
    const locales = Object.keys(tokensMap);
    const initialLocale = App.view.locale;
    const remainLocales = locales.filter((locale) => locale !== initialLocale);

    for (const locale of remainLocales) {
        await changeLocale(locale);
    }

    await changeLocale(initialLocale);
};
