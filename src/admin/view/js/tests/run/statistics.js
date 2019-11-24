if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var test = common.test;

	var EXPENSE = common.EXPENSE;
	var INCOME = common.INCOME;
	var TRANSFER = common.TRANSFER;
	var DEBT = common.DEBT;

	var App = null;
}


var runStatistics = (function()
{
	function onAppUpdate(props)
	{
		props = props || {};

		if ('App' in props)
			App = props.App;
	}


	async function statisticsTests(view)
	{
		view.setBlock('Statistics', 1);

		view = await App.goToMainView(view);
		view = await view.goToStatistics();

		// Expense transactions filter
		var state = { value : { chart : { bars : { length : 1 } } } };
		await test('Expense statistics view', async () => {}, view, state);

		// Income transactions filter
		view = await view.filterByType(INCOME);

		var state = { value : { chart : { bars : { length : 0 } } } };
		await test('Income statistics view', async () => {}, view, state);

		// Transfer transactions filter
		view = await view.filterByType(TRANSFER);

		var state = { value : { chart : { bars : { length : 2 } } } };
		await test('Transfer statistics view', async () => {}, view, state);

		// Debt transactions filter
		view = await view.filterByType(DEBT);

		var state = { value : { chart : { bars : { length : 3 } } } };
		await test('Debt statistics view', async () => {}, view, state);

		// Filter by accounts
		view = await view.filterByType(EXPENSE);
		view = await view.selectAccountByPos(1);

		var state = { value : { chart : { bars : { length : 0 } } } };
		await test('Filter statistics by account', async () => {}, view, state);

		// Test grouping
		view = await view.filterByType(DEBT);
		view = await view.groupByDay();

		var state = { value : { chart : { bars : { length : 1 } } } };
		await test('Group statistics by day', async () => {}, view, state);

		view = await view.groupByWeek();

		var state = { value : { chart : { bars : { length : 1 } } } };
		await test('Group statistics by week', async () => {}, view, state);

		view = await view.groupByMonth();

		var state = { value : { chart : { bars : { length : 1 } } } };
		await test('Group statistics by month', async () => {}, view, state);

		view = await view.groupByYear();

		var state = { value : { chart : { bars : { length : 1 } } } };
		await test('Group statistics by year', async () => {}, view, state);

		// Filter by currencies
		view = await view.byCurrencies();

		var state = { value : { chart : { bars : { length : 1 } } } };
		await test('Filter by currencies', async () => {}, view, state);

		return view;
	}


	return { onAppUpdate : onAppUpdate,
				run : statisticsTests };
})();


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runStatistics;
}
