import { test } from 'jezve-test';
import { App } from '../Application.js';
import { setBlock } from '../env.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../model/Transaction.js';

export async function run() {
    setBlock('Statistics', 1);

    await App.goToMainView();
    await App.view.goToStatistics();

    // Expense transactions filter
    const expected = { chart: { bars: { length: 2 } } };
    await test('Expense statistics view', () => App.view.checkState(expected));

    // Income transactions filter
    await App.view.filterByType(INCOME);

    expected.chart.bars.length = 3;
    await test('Income statistics view', () => App.view.checkState(expected));

    // Transfer transactions filter
    await App.view.filterByType(TRANSFER);

    expected.chart.bars.length = 0;
    await test('Transfer statistics view', () => App.view.checkState(expected));

    // Debt transactions filter
    await App.view.filterByType(DEBT);

    expected.chart.bars.length = 1;
    await test('Debt statistics view', () => App.view.checkState(expected));

    // Filter by accounts
    await App.view.filterByType(EXPENSE);
    await App.view.selectAccountByPos(2);

    expected.chart.bars.length = 10;
    await test('Filter statistics by account', () => App.view.checkState(expected));

    // Test grouping
    await App.view.filterByType(DEBT);
    await App.view.groupByDay();
    expected.chart.bars.length = 3;
    await test('Group statistics by day', () => App.view.checkState(expected));

    await App.view.groupByWeek();
    await test('Group statistics by week', () => App.view.checkState(expected));

    await App.view.groupByMonth();
    expected.chart.bars.length = 2;
    await test('Group statistics by month', () => App.view.checkState(expected));

    await App.view.groupByYear();
    expected.chart.bars.length = 1;
    await test('Group statistics by year', () => App.view.checkState(expected));

    // Filter by currencies
    await App.view.byCurrencies();
    await test('Filter by currencies', () => App.view.checkState(expected));
}
