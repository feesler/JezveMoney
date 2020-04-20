import { test } from '../common.js';
import { App } from '../app.js';
import { EXPENSE, INCOME, TRANSFER, DEBT } from '../model/transaction.js';


export async function run()
{
	App.view.setBlock('Statistics', 1);

	await App.goToMainView();
	await App.view.goToStatistics();

	// Expense transactions filter
	let state = { value : { chart : { bars : { length : 1 } } } };
	await test('Expense statistics view', () => {}, App.view, state);

	// Income transactions filter
	await App.view.filterByType(INCOME);

	state.value.chart.bars.length = 0;
	await test('Income statistics view', () => {}, App.view, state);

	// Transfer transactions filter
	await App.view.filterByType(TRANSFER);

	state.value.chart.bars.length = 2;
	await test('Transfer statistics view', () => {}, App.view, state);

	// Debt transactions filter
	await App.view.filterByType(DEBT);

	state.value.chart.bars.length = 3;
	await test('Debt statistics view', () => {}, App.view, state);

	// Filter by accounts
	await App.view.filterByType(EXPENSE);
	await App.view.selectAccountByPos(1);

	state.value.chart.bars.length = 0;
	await test('Filter statistics by account', () => {}, App.view, state);

	// Test grouping
	await App.view.filterByType(DEBT);
	await App.view.groupByDay();
	state.value.chart.bars.length = 1;
	await test('Group statistics by day', () => {}, App.view, state);

	await App.view.groupByWeek();
	await test('Group statistics by week', () => {}, App.view, state);

	await App.view.groupByMonth();
	await test('Group statistics by month', () => {}, App.view, state);

	await App.view.groupByYear();
	await test('Group statistics by year', () => {}, App.view, state);

	// Filter by currencies
	await App.view.byCurrencies();
	await test('Filter by currencies', () => {}, App.view, state);
}


