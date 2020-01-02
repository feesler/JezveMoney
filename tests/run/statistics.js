var runStatistics = (function()
{
	async function statisticsTests(app)
	{
		let test = app.test;

		app.view.setBlock('Statistics', 1);

		await app.goToMainView();
		await app.view.goToStatistics();

		// Expense transactions filter
		let state = { value : { chart : { bars : { length : 1 } } } };
		await test('Expense statistics view', async () => {}, app.view, state);

		// Income transactions filter
		await app.view.filterByType(app.INCOME);

		state.value.chart.bars.length = 0;
		await test('Income statistics view', async () => {}, app.view, state);

		// Transfer transactions filter
		await app.view.filterByType(app.TRANSFER);

		state.value.chart.bars.length = 2;
		await test('Transfer statistics view', async () => {}, app.view, state);

		// Debt transactions filter
		await app.view.filterByType(app.DEBT);

		state.value.chart.bars.length = 3;
		await test('Debt statistics view', async () => {}, app.view, state);

		// Filter by accounts
		await app.view.filterByType(app.EXPENSE);
		await app.view.selectAccountByPos(1);

		state.value.chart.bars.length = 0;
		await test('Filter statistics by account', async () => {}, app.view, state);

		// Test grouping
		await app.view.filterByType(app.DEBT);
		await app.view.groupByDay();
		state.value.chart.bars.length = 1;
		await test('Group statistics by day', async () => {}, app.view, state);

		await app.view.groupByWeek();
		await test('Group statistics by week', async () => {}, app.view, state);

		await app.view.groupByMonth();
		await test('Group statistics by month', async () => {}, app.view, state);

		await app.view.groupByYear();
		await test('Group statistics by year', async () => {}, app.view, state);

		// Filter by currencies
		await app.view.byCurrencies();
		await test('Filter by currencies', async () => {}, app.view, state);
	}


	return { run : statisticsTests };
})();


export { runStatistics };
