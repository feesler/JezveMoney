import {
    test,
    formatDate,
    asArray,
    assert,
} from 'jezve-test';
import { App } from '../Application.js';
import { fixDate } from '../common.js';
import { Transaction } from '../model/Transaction.js';

export const checkInitialState = async () => {
    await test('Initial state of transaction statistics view', async () => {
        await App.view.waitForLoad();
        const expected = App.view.getExpectedState();
        return App.view.checkState(expected);
    });
};

export const filterByType = async (type) => {
    const types = asArray(type);
    assert(types.length > 0, 'Invalid transaction type filter');
    const typeNames = types.map((item) => Transaction.typeToString(item));

    await test(`Filter by transaction types: [${typeNames}]`, () => App.view.filterByType(type));
};

export const byCategories = async () => {
    await test('Show report by categories', () => App.view.byCategories());
};

export const byAccounts = async () => {
    await test('Show report by accounts', () => App.view.byAccounts());
};

export const byCurrencies = async () => {
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

    await test(`Filter by categories [${names.join()}]`, () => App.view.filterByCategories(ids));
};

export const filterByAccounts = async (ids) => {
    const names = asArray(ids).map((accountId) => {
        const item = App.state.accounts.getItem(accountId);
        return (item) ? item.name : `(${accountId})`;
    });

    await test(`Filter by accounts [${names.join()}]`, () => App.view.filterByAccounts(ids));
};

export const selectCurrency = async (id) => {
    const currency = App.currency.getItem(id);
    const name = (currency) ? currency.name : `(${id})`;

    await test(`Select currency [${name}]`, () => App.view.selectCurrency(id));
};

export const groupByDay = async () => {
    await test('Group statistics by day', () => App.view.groupByDay());
};

export const groupByWeek = async () => {
    await test('Group statistics by week', () => App.view.groupByWeek());
};

export const groupByMonth = async () => {
    await test('Group statistics by month', () => App.view.groupByMonth());
};

export const groupByYear = async () => {
    await test('Group statistics by year', () => App.view.groupByYear());
};

export const selectDateRange = async ({ start, end }) => {
    const startDateFmt = formatDate(new Date(fixDate(start)));
    const endDateFmt = formatDate(new Date(fixDate(end)));

    await test(
        `Select date range (${startDateFmt} - ${endDateFmt})`,
        () => App.view.selectDateRange(start, end),
    );
};

export const clearDateRange = async () => {
    await test('Clear date range', () => App.view.clearDateRange());
};
