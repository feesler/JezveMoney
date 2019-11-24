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


	function onAppUpdateStatistics(props)
	{
		props = props || {};

		if ('App' in props)
			App = props.App;
	}


	function statisticsTests(view)
	{
		view.setBlock('Statistics', 1);

		return App.goToMainView(view)
				.then(view => view.goToStatistics())
				.then(async view =>
				{
					var state = { value : { chart : { bars : { length : 1 } } } };
					await test('Initial state of statistics view', async () => {}, view, state);

					return view;
				})
				.then(view => view.filterByType(INCOME))
				.then(async view =>
				{
					var state = { value : { chart : { bars : { length : 0 } } } };
					await test('Income statistics view', async () => {}, view, state);

					return view;
				})
				.then(view => view.filterByType(TRANSFER))
				.then(async view =>
				{
					var state = { value : { chart : { bars : { length : 2 } } } };
					await test('Transfer statistics view', async () => {}, view, state);

					return view;
				})
				.then(view => view.filterByType(DEBT))
				.then(async view =>
				{
					var state = { value : { chart : { bars : { length : 3 } } } };
					await test('Debt statistics view', async () => {}, view, state);

					return view;
				})
				.then(view => view.filterByType(EXPENSE))
				.then(view => view.selectAccountByPos(1))
				.then(async view =>
				{
					var state = { value : { chart : { bars : { length : 0 } } } };
					await test('Filter statistics by account', async () => {}, view, state);

					return view;
				})
				.then(view => view.filterByType(DEBT))
				.then(view => view.groupByDay())
				.then(async view =>
				{
					var state = { value : { chart : { bars : { length : 1 } } } };
					await test('Group statistics by day', async () => {}, view, state);

					return view;
				})
				.then(view => view.groupByWeek())
				.then(async view =>
				{
					var state = { value : { chart : { bars : { length : 1 } } } };
					await test('Group statistics by week', async () => {}, view, state);

					return view;
				})
				.then(view => view.groupByMonth())
				.then(async view =>
				{
					var state = { value : { chart : { bars : { length : 1 } } } };
					await test('Group statistics by month', async () => {}, view, state);

					return view;
				})
				.then(view => view.groupByYear())
				.then(async view =>
				{
					var state = { value : { chart : { bars : { length : 1 } } } };
					await test('Group statistics by year', async () => {}, view, state);

					return view;
				})
				.then(view => view.byCurrencies())
				.then(async view =>
				{
					var state = { value : { chart : { bars : { length : 1 } } } };
					await test('Filter by currencies', async () => {}, view, state);

					return view;
				});
	}


var runStatistics = { onAppUpdate : onAppUpdate,
						run : statisticsTests };


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runStatistics;
}
