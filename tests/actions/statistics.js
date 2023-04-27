import {
    test,
    asArray,
    assert,
} from 'jezve-test';
import { App } from '../Application.js';
import { Transaction } from '../model/Transaction.js';
import { StatisticsView } from '../view/StatisticsView.js';

/** Navigate to statistics page */
const checkNavigation = async () => {
    if (App.view instanceof StatisticsView) {
        return;
    }

    await App.view.navigateToStatistics();
};

export const checkInitialState = async () => {
    await test('Initial state of transaction statistics view', async () => {
        await checkNavigation();
        await App.view.waitForLoad();
        const expected = App.view.getExpectedState();
        return App.view.checkState(expected);
    });
};

export const filterByType = async (type) => {
    const types = asArray(type);
    assert(types.length > 0, 'Invalid transaction type filter');
    const typeNames = types.map((item) => Transaction.typeToString(item));

    await checkNavigation();
    await test(`Filter by transaction types: [${typeNames}]`, () => App.view.filterByType(type));
};

export const byCategories = async () => {
    await checkNavigation();
    await test('Show report by categories', () => App.view.byCategories());
};

export const byAccounts = async () => {
    await checkNavigation();
    await test('Show report by accounts', () => App.view.byAccounts());
};

export const byCurrencies = async () => {
    await checkNavigation();
    await test('Show report by currencies', () => App.view.byCurrencies());
};

export const filterByCategories = async (ids) => {
    const names = asArray(ids).map((id) => {
        if (parseInt(id, 10) === 0) {
            return 'No category';
        }

        const item = App.state.categories.getItem(id);
        return (item) ? item.name : `(${id})`;
    });

    await checkNavigation();
    await test(`Filter by categories [${names.join()}]`, () => App.view.filterByCategories(ids));
};

export const filterByAccounts = async (ids) => {
    const names = asArray(ids).map((accountId) => {
        const item = App.state.accounts.getItem(accountId);
        return (item) ? item.name : `(${accountId})`;
    });

    await checkNavigation();
    await test(`Filter by accounts [${names.join()}]`, () => App.view.filterByAccounts(ids));
};

export const selectCurrency = async (id) => {
    const currency = App.currency.getItem(id);
    const code = (currency) ? currency.code : `(${id})`;

    await checkNavigation();
    await test(`Select currency [${code}]`, () => App.view.selectCurrency(id));
};

export const groupByDay = async () => {
    await checkNavigation();
    await test('Group statistics by day', () => App.view.groupByDay());
};

export const groupByWeek = async () => {
    await checkNavigation();
    await test('Group statistics by week', () => App.view.groupByWeek());
};

export const groupByMonth = async () => {
    await checkNavigation();
    await test('Group statistics by month', () => App.view.groupByMonth());
};

export const groupByYear = async () => {
    await checkNavigation();
    await test('Group statistics by year', () => App.view.groupByYear());
};

export const selectStartDateFilter = async (date) => {
    const dateFmt = App.reformatDate(date);

    await checkNavigation();
    await test(`Select start date (${dateFmt})`, () => (
        App.view.selectStartDateFilter(date)
    ));
};

export const selectEndDateFilter = async (date) => {
    const dateFmt = App.reformatDate(date);

    await checkNavigation();
    await test(`Select end date (${dateFmt})`, () => (
        App.view.selectEndDateFilter(date)
    ));
};

export const clearStartDateFilter = async () => {
    await checkNavigation();
    await test('Clear start date', () => App.view.clearStartDateFilter());
};

export const clearEndDateFilter = async () => {
    await checkNavigation();
    await test('Clear end date', () => App.view.clearEndDateFilter());
};
