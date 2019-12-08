if (typeof module !== 'undefined' && module.exports)
{
	var api = require('../api.js');
}


var runTransList = (function()
{
	let env = null;
	let App = null;

	const RUB = 1;
	const USD = 2;
	const EUR = 3;
	const PLN = 4;

	let accountsList = [{ name : 'acc_4', currency : RUB, balance : '60500.12', icon : 1 },
 						{ name : 'acc_5', currency : RUB, balance : '78000', icon : 2 },
						{ name : 'cash USD', currency : USD, balance : '10000', icon : 4 },
						{ name : 'cash EUR', currency : EUR, balance : '1000', icon : 5 }];

	let accIds = [];

	let personsList = [{ name : 'Maria' }, { name : 'Ivan <<' }];
	let personIds = [];

	let now = new Date();
	let monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
	let weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
	let yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

	let dateList = [now, yesterday, weekAgo, monthAgo];

	let expensesList = [
		{ src_id : 0, src_amount : '500', comm : 'lalala' },
		{ src_id : 0, src_amount : '500', destCurr : USD, comm : 'lalala' },
		{ src_id : 1, src_amount : '100', comm : 'hohoho' },
		{ src_id : 1, src_amount : '780', dest_amount : '10', destCurr : EUR, comm : 'кккк' },
		{ src_id : 2, src_amount : '50', comm : '1111' }
	];

	let incomesList = [
		{ dest_id : 3, src_amount : '100', dest_amount : '7500', destCurr : RUB, comm : '232323' },
		{ dest_id : 0, src_amount : '1000000', dest_amount : '64000', srcCurr : PLN, comm : '111 кккк' },
		{ dest_id : 0, dest_amount : '100', comm : '22222' },
		{ dest_id : 1, src_amount : '7013.21', dest_amount : '5000', comm : '33333' },
		{ dest_id : 3, src_amount : '287', dest_amount : '4', srcCurr : 1, comm : 'dddd' },
		{ dest_id : 3, dest_amount : '33', comm : '11 ho' }
	];

	let transfersList = [
		{ src_id : 0, dest_id : 1, src_amount : '300', comm : 'd4' },
		{ src_id : 0, dest_id : 2, src_amount : '6500', dest_amount : '100', comm : 'g6' },
		{ src_id : 1, dest_id : 0, src_amount : '800.01', comm : 'x0' },
		{ src_id : 1, dest_id : 2, src_amount : '7', dest_amount : '0.08', comm : 'l2' },
		{ src_id : 3, dest_id : 2, src_amount : '5.0301', dest_amount : '4.7614', comm : 'i1' }
	];

	let debtsList = [
		{ debtop : 1, person_id : 0, src_amount : '1050', src_curr : RUB, comm : '111 кккк' },
		{ debtop : 1, person_id : 1, acc_id : 1, src_amount : '780', comm : '--**' },
		{ debtop : 2, person_id : 0, src_amount : '990.99', src_curr : RUB, comm : 'ппп ppp' },
		{ debtop : 2, person_id : 1, acc_id : 2, src_amount : '105', comm : '6050 кккк' },
		{ debtop : 1, person_id : 0, acc_id : 3, src_amount : '4', comm : '111 кккк' }
	];


	async function preCreateData()
	{
		console.log('Precreate data...');

		dateList = dateList.map(item => App.formatDate(item));

		await api.user.login('test', 'test');
		await api.profile.reset();

		// Accounts
		for(let params of accountsList)
		{
			let res = await api.account.create(params);
			accIds.push(res.id);
		}

		// Persons
		for(let params of personsList)
		{
			let res = await api.person.create(params);
			personIds.push(res.id);
		}

		// Expense transactions
		for(let params of expensesList)
		{
			params.src_id = accIds[params.src_id];
			let expenseParam = await api.transaction.expense(params);
			for(let date of dateList)
			{
				expenseParam.date = date;
				await api.transaction.create(expenseParam);
			}
		}

		// Income transactions
		for(let params of incomesList)
		{
			params.dest_id = accIds[params.dest_id];
			let incomeParam = await api.transaction.income(params);
			for(let date of dateList)
			{
				incomeParam.date = date;
				await api.transaction.create(incomeParam);
			}
		}

		// Transfer transactions
		for(let params of transfersList)
		{
			params.src_id = accIds[params.src_id];
			params.dest_id = accIds[params.dest_id];
			let transferParam = await api.transaction.transfer(params);
			for(let date of dateList)
			{
				transferParam.date = date;
				await api.transaction.create(transferParam);
			}
		}

		// Debt transactions
		for(let params of debtsList)
		{
			params.person_id = personIds[params.person_id];
			params.acc_id = (params.acc_id) ? accIds[params.acc_id] : 0;
			let debtParam = await api.transaction.debt(params);
			for(let date of dateList)
			{
				debtParam.date = date;
				await api.transaction.create(debtParam);
			}
		}

		console.log('Done');
	}


	async function runTests(view, app)
	{
		env = view.props.environment;
		App = app;
		let test = App.test;

		api.setEnv(env, App);

		env.setBlock('Transaction List view', 1);

		await preCreateData();

		view = await App.goToMainView(view);
		view = await view.goToTransactions();

		const onPage = 10;
		let totalExpenses = expensesList.length * dateList.length;
		let totalIncomes = incomesList.length * dateList.length;
		let totalTransfers = transfersList.length * dateList.length;
		let totalDebts = debtsList.length * dateList.length;

		let totalTransactions = totalExpenses + totalIncomes + totalTransfers + totalDebts;
		let expectedPages = Math.ceil(totalTransactions / onPage);

		let state = { visibility : { typeMenu : true, accDropDown : true, searchForm : true,
										modeSelector : true, paginator : true, transList : true },
	 					values : { typeMenu : { activeType : 0 },
									searchForm : { value : '' },
									paginator : { pages : expectedPages, active : 1 },
									modeSelector : { listMode : { isActive : true },
														detailsMode : { isActive : false } } } };

		await test('Initial state of transaction list view', async () => {}, view, state);

		state.values.paginator.active = 2;
		view = await view.goToNextPage();
		await test('Navigate to page 2', () => {}, view, state);

		state.values.modeSelector.detailsMode.isActive = true;
		state.values.modeSelector.listMode.isActive = false;
		view = await view.setDetailsMode();
		await test('Change list mode to details', () => {}, view, state);

		state.values.paginator.active = 3;
		view = await view.goToNextPage();
		await test('Navigate to page 3', () => {}, view, state);

		state.values.typeMenu.activeType = App.EXPENSE;
		state.values.paginator.active = 1;
		state.values.paginator.pages = Math.ceil(totalExpenses / onPage);
		view = await view.filterByType(state.values.typeMenu.activeType);
		await test('Filter by Expense', () => {}, view, state);

		state.values.typeMenu.activeType = App.INCOME;
		state.values.paginator.pages = Math.ceil(totalIncomes / onPage);
		view = await view.filterByType(state.values.typeMenu.activeType);
		await test('Filter by Income', () => {}, view, state);

		state.values.typeMenu.activeType = App.TRANSFER;
		state.values.paginator.pages = Math.ceil(totalTransfers / onPage);
		view = await view.filterByType(state.values.typeMenu.activeType);
		await test('Filter Transfer transactions', () => {}, view, state);

		state.values.typeMenu.activeType = App.DEBT;
		state.values.paginator.pages = Math.ceil(totalDebts / onPage);
		view = await view.filterByType(state.values.typeMenu.activeType);
		await test('Filter by Debt', () => {}, view, state);

		let acc_2_debts = 1 * dateList.length;
		let acc_2_week = 5;
		let acc_2_all = acc_2_week  * dateList.length;
		state.values.paginator.pages = Math.ceil(acc_2_debts / onPage);
		view = await view.filterByAccounts(accIds[2]);
		await test('Filter by accounts', () => {}, view, state);

		state.values.typeMenu.activeType = 0;
		state.values.paginator.pages = Math.ceil(acc_2_all / onPage);
		view = await view.filterByType(state.values.typeMenu.activeType);
		await test('Show all transactions', () => {}, view, state);

		let day1 = now.getDate();
		let day2;
		if (day1 > 22)
		{
			day2 = day1;
			day1 = day2 - 6;
		}
		else
		{
			day2 = day1 + 6;
		}

		state.values.typeMenu.activeType = 0;
		state.values.paginator.pages = Math.ceil(acc_2_week / onPage);
		view = await view.selectDateRange(day1, day2);
		await test('Select date range', () => {}, view, state);

		state.values.searchForm.value = '1';
		view = await view.search(state.values.searchForm.value);
		await test('Search', () => {}, view, state);
	}


	return { run : runTests };
})();


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runTransList;
}
