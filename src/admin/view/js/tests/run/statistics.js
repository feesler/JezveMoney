var runStatistics = (function()
{
	let App = null;
	let test = null


	function onAppUpdate(props)
	{
		props = props || {};

		if ('App' in props)
		{
			App = props.App;
			test = App.test;
		}
	}


	async function statisticsTests(app)
	{
		app.view.setBlock('Statistics', 1);

		await app.goToMainView(app);
		await app.view.goToStatistics();

		// Expense transactions filter
		var state = { value : { chart : { bars : { length : 1 } } } };
		await test('Expense statistics view', async () => {}, app.view, state);

		// Income transactions filter
		await app.view.filterByType(app.INCOME);

		var state = { value : { chart : { bars : { length : 0 } } } };
		await test('Income statistics view', async () => {}, app.view, state);

		// Transfer transactions filter
		await app.view.filterByType(app.TRANSFER);

		var state = { value : { chart : { bars : { length : 2 } } } };
		await test('Transfer statistics view', async () => {}, app.view, state);

		// Debt transactions filter
		await app.view.filterByType(app.DEBT);

		var state = { value : { chart : { bars : { length : 3 } } } };
		await test('Debt statistics view', async () => {}, app.view, state);

		// Filter by accounts
		await app.view.filterByType(app.EXPENSE);
		await app.view.selectAccountByPos(1);

		var state = { value : { chart : { bars : { length : 0 } } } };
		await test('Filter statistics by account', async () => {}, app.view, state);

		// Test grouping
		await app.view.filterByType(app.DEBT);
		await app.view.groupByDay();

		var state = { value : { chart : { bars : { length : 1 } } } };
		await test('Group statistics by day', async () => {}, app.view, state);

		await app.view.groupByWeek();

		var state = { value : { chart : { bars : { length : 1 } } } };
		await test('Group statistics by week', async () => {}, app.view, state);

		await app.view.groupByMonth();

		var state = { value : { chart : { bars : { length : 1 } } } };
		await test('Group statistics by month', async () => {}, app.view, state);

		await app.view.groupByYear();

		var state = { value : { chart : { bars : { length : 1 } } } };
		await test('Group statistics by year', async () => {}, app.view, state);

		// Filter by currencies
		await app.view.byCurrencies();

		var state = { value : { chart : { bars : { length : 1 } } } };
		await test('Filter by currencies', async () => {}, app.view, state);
	}


	return { onAppUpdate : onAppUpdate,
				run : statisticsTests };
})();


export { runStatistics };
