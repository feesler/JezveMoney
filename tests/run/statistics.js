import { test, formatDate } from 'jezve-test';
import { App } from '../Application.js';
import { fixDate } from '../common.js';
import { Transaction } from '../model/Transaction.js';

export const checkInitialState = async () => {
    await test('Initial state of transaction statistics view', () => {
        const expected = App.view.getExpectedState();
        return App.view.checkState(expected);
    });
};

export const filterByType = async (type) => {
    const typeName = Transaction.typeToString(type);
    await test(`${typeName} statistics view`, () => App.view.filterByType(type));
};

export const byAccounts = async () => {
    await test('Show report by accounts', () => App.view.byAccounts());
};

export const byCurrencies = async () => {
    await test('Show report by currencies', () => App.view.byCurrencies());
};

export const filterByAccounts = async (accounts) => {
    await test(`Filter by accounts [${accounts}]`, () => App.view.filterByAccounts(accounts));
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
