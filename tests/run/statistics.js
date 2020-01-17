let runStatistics =
{
	async run()
	{
		let test = this.test;

		this.view.setBlock('Statistics', 1);

		await this.goToMainView();
		await this.view.goToStatistics();

		// Expense transactions filter
		let state = { value : { chart : { bars : { length : 1 } } } };
		await test('Expense statistics view', () => {}, this.view, state);

		// Income transactions filter
		await this.view.filterByType(this.INCOME);

		state.value.chart.bars.length = 0;
		await test('Income statistics view', () => {}, this.view, state);

		// Transfer transactions filter
		await this.view.filterByType(this.TRANSFER);

		state.value.chart.bars.length = 2;
		await test('Transfer statistics view', () => {}, this.view, state);

		// Debt transactions filter
		await this.view.filterByType(this.DEBT);

		state.value.chart.bars.length = 3;
		await test('Debt statistics view', () => {}, this.view, state);

		// Filter by accounts
		await this.view.filterByType(this.EXPENSE);
		await this.view.selectAccountByPos(1);

		state.value.chart.bars.length = 0;
		await test('Filter statistics by account', () => {}, this.view, state);

		// Test grouping
		await this.view.filterByType(this.DEBT);
		await this.view.groupByDay();
		state.value.chart.bars.length = 1;
		await test('Group statistics by day', () => {}, this.view, state);

		await this.view.groupByWeek();
		await test('Group statistics by week', () => {}, this.view, state);

		await this.view.groupByMonth();
		await test('Group statistics by month', () => {}, this.view, state);

		await this.view.groupByYear();
		await test('Group statistics by year', () => {}, this.view, state);

		// Filter by currencies
		await this.view.byCurrencies();
		await test('Filter by currencies', () => {}, this.view, state);
	}
};


export { runStatistics };
