import { test, setBlock, formatDate } from 'jezve-test';
import { App } from '../Application.js';
import { fixDate } from '../common.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../model/Transaction.js';

const selectDateRange = async ({ start, end }) => {
    const startDateFmt = formatDate(new Date(fixDate(start)));
    const endDateFmt = formatDate(new Date(fixDate(end)));

    await test(
        `Select date range (${startDateFmt} - ${endDateFmt})`,
        () => App.view.selectDateRange(start, end),
    );
};

export const run = async () => {
    setBlock('Statistics', 1);

    await App.view.navigateToStatistics();

    // Expense transactions filter
    await test('Expense statistics view', () => {
        const expected = App.view.getExpectedState();
        return App.view.checkState(expected);
    });

    // Income transactions filter
    await test('Income statistics view', () => App.view.filterByType(INCOME));

    // Transfer transactions filter
    await test('Transfer statistics view', () => App.view.filterByType(TRANSFER));

    // Debt transactions filter
    await test('Debt statistics view', () => App.view.filterByType(DEBT));

    // Filter by accounts
    await test('Filter statistics by account', async () => {
        await App.view.filterByType(EXPENSE);
        return App.view.selectAccountByPos(2);
    });

    // Test grouping
    await test('Group statistics by day', async () => {
        await App.view.filterByType(DEBT);
        return App.view.groupByDay();
    });

    await test('Group statistics by week', () => App.view.groupByWeek());
    await test('Group statistics by month', () => App.view.groupByMonth());
    await test('Group statistics by year', () => App.view.groupByYear());

    // Filter by currencies
    await test('Filter by currencies', () => App.view.byCurrencies());
    // Change transaction type when currencies filter is selected
    await test('Change transaction type', () => App.view.filterByType(EXPENSE));

    await selectDateRange({ start: App.dates.yearAgo, end: App.dates.monthAgo });
    await selectDateRange({ start: App.dates.weekAgo, end: App.dates.now });

    await test('Clear date range', () => App.view.clearDateRange());
};
