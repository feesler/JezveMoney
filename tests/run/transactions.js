import { api } from '../api.js';


var runTransList = (function()
{
	let app = null;
	let env = null;

	const RUB = 1;
	const USD = 2;
	const EUR = 3;
	const PLN = 4;

	let accountsList = [{ name : 'acc_4', currency : RUB, balance : '60500.12', icon : 1 },
 						{ name : 'acc_5', currency : RUB, balance : '78000', icon : 2 },
						{ name : 'cash USD', currency : USD, balance : '10000', icon : 4 },
						{ name : 'cash EUR', currency : EUR, balance : '1000', icon : 5 }];

	let accIds = [];

	let personsList = [{ name : 'Alex' }, { name : 'noname &' }];
	let personIds = [];

	let newExpenses = [];
	let newIncomes = [];
	let newTransfers = [];
	let newDebts = [];

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


	async function setupAccounts(list)
	{
		let res = [];

		let accountsBefore = await api.account.list();
		for(let params of list)
		{
			let acc = accountsBefore.find(item => item.name == params.name);
			if (!acc)
			{
				acc = await api.account.create(params);
			}

			if (acc)
				res.push(acc.id);
		}

		return res;
	}


	async function setupPersons(list)
	{
		let res = [];

		let personsBefore = await api.person.list();
		for(let params of list)
		{
			let pers = personsBefore.find(item => item.name == params.name);
			if (!pers)
			{
				pers = await api.person.create(params);
			}

			if (pers)
				res.push(pers.id);
		}

		return res;
	}


	async function preCreateData()
	{
		console.log('Precreate data...');

		await api.user.login('test', 'test');

		accIds = await setupAccounts(accountsList);
		personIds = await setupPersons(personsList);

		// Expense transactions
		for(let params of expensesList)
		{
			params.src_id = accIds[params.src_id];
			let expenseParam = await api.transaction.expense(params);
			for(let date of app.dateList)
			{
				expenseParam.date = date;
				let createResult = await api.transaction.create(expenseParam);
				if (createResult)
					newExpenses.push(createResult.id);
			}
		}

		// Income transactions
		for(let params of incomesList)
		{
			params.dest_id = accIds[params.dest_id];
			let incomeParam = await api.transaction.income(params);
			for(let date of app.dateList)
			{
				incomeParam.date = date;
				let createResult = await api.transaction.create(incomeParam);
				if (createResult)
					newIncomes.push(createResult.id);
			}
		}

		// Transfer transactions
		for(let params of transfersList)
		{
			params.src_id = accIds[params.src_id];
			params.dest_id = accIds[params.dest_id];
			let transferParam = await api.transaction.transfer(params);
			for(let date of app.dateList)
			{
				transferParam.date = date;
				let createResult = await api.transaction.create(transferParam);
				if (createResult)
					newTransfers.push(createResult.id);
			}
		}

		// Debt transactions
		for(let params of debtsList)
		{
			params.person_id = personIds[params.person_id];
			params.acc_id = (params.acc_id) ? accIds[params.acc_id] : 0;
			let debtParam = await api.transaction.debt(params);
			for(let date of app.dateList)
			{
				debtParam.date = date;
				let createResult = await api.transaction.create(debtParam);
				if (createResult)
					newDebts.push(createResult.id);
			}
		}

		console.log('Done');
	}


	function filterTransactionsByType(trans, type)
	{
		if (!trans)
			throw new Error('Wrong parameters');

		return trans.filter(item => item.type == type);
	}


	function filterTransactionsByAccount(trans, acc_id)
	{
		if (!trans || !acc_id)
			throw new Error('Wrong parameters');

		return trans.filter(item => item.src_id == acc_id || item.dest_id == acc_id);
	}


	function filterTransactionsByDate(trans, start, end)
	{
		if (!trans)
			throw new Error('Wrong parameters');

		return trans.filter(item =>
		{
			let date = app.convDate(item.date);
			if (!date)
				return false;

			if (start && date < start)
				return false;
			if (end && date > end)
				return false;

			return true;
		});
	}


	function filterTransactionsByQuery(trans, query)
	{
		if (!trans)
			throw new Error('Wrong parameters');

		return trans.filter(item => item.comment.indexOf(query) !== -1);
	}


	function expectedPages(listLength)
	{
		return Math.max(Math.ceil(listLength / app.config.transactionsOnPage), 1);
	}


	async function runTests(appInstance)
	{
		app = appInstance;
		env = app.view.props.environment;
		let test = app.test;

		api.setEnv(env, app);

		env.setBlock('Transaction List view', 1);

		let transBefore = await api.transaction.list();
		let expensesBefore = transBefore.filter(item => item.type == app.EXPENSE);
		let incomesBefore = transBefore.filter(item => item.type == app.INCOME);
		let transfersBefore = transBefore.filter(item => item.type == app.TRANSFER);
		let debtsBefore = transBefore.filter(item => item.type == app.DEBT);

		await preCreateData(app);

		if (newExpenses.length)
			newExpenses = await api.transaction.read(newExpenses);
		if (newIncomes.length)
			newIncomes = await api.transaction.read(newIncomes);
		if (newTransfers.length)
			newTransfers = await api.transaction.read(newTransfers);
		if (newDebts.length)
			newDebts = await api.transaction.read(newDebts);

		let newTransactions = [].concat(newExpenses, newIncomes, newTransfers, newDebts);

		let allTransactions = transBefore.concat(newTransactions);

		await app.goToMainView();
		await app.view.goToTransactions();

		let totalExpenses = newExpenses.length + expensesBefore.length;
		let totalIncomes = newIncomes.length + incomesBefore.length;
		let totalTransfers = newTransfers.length + transfersBefore.length;
		let totalDebts = newDebts.length + debtsBefore.length;

		let acc_2_all = filterTransactionsByAccount(allTransactions, accIds[2]);
		let acc_2_debts = filterTransactionsByType(acc_2_all, app.DEBT);

		// Prepare date range for week
		let now = new Date(app.convDate(app.dates.now));
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

		let weekStartDate = Date.UTC(now.getFullYear(), now.getMonth(), day1);
		let weekEndDate = Date.UTC(now.getFullYear(), now.getMonth(), day2);

		let acc_2_week = filterTransactionsByDate(acc_2_all, weekStartDate, weekEndDate);

		let totalTransactions = totalExpenses + totalIncomes + totalTransfers + totalDebts;

		let state = { visibility : { typeMenu : true, accDropDown : true, searchForm : true,
										modeSelector : true, paginator : true, transList : true },
	 					values : { typeMenu : { activeType : 0 },
									searchForm : { value : '' },
									paginator : { pages : expectedPages(totalTransactions), active : 1 },
									modeSelector : { listMode : { isActive : true },
														detailsMode : { isActive : false } } } };

		await test('Initial state of transaction list view', async () => {}, app.view, state);

		state.values.paginator.active = 2;
		await app.view.goToNextPage();
		await test('Navigate to page 2', () => {}, app.view, state);

		state.values.modeSelector.detailsMode.isActive = true;
		state.values.modeSelector.listMode.isActive = false;
		await app.view.setDetailsMode();
		await test('Change list mode to details', () => {}, app.view, state);

		state.values.paginator.active = 3;
		await app.view.goToNextPage();
		await test('Navigate to page 3', () => {}, app.view, state);

		state.values.typeMenu.activeType = app.EXPENSE;
		state.values.paginator.active = 1;
		state.values.paginator.pages = expectedPages(totalExpenses);
		await app.view.filterByType(state.values.typeMenu.activeType);
		await test('Filter by Expense', () => {}, app.view, state);

		state.values.typeMenu.activeType = app.INCOME;
		state.values.paginator.pages = expectedPages(totalIncomes);
		await app.view.filterByType(state.values.typeMenu.activeType);
		await test('Filter by Income', () => {}, app.view, state);

		state.values.typeMenu.activeType = app.TRANSFER;
		state.values.paginator.pages = expectedPages(totalTransfers);
		await app.view.filterByType(state.values.typeMenu.activeType);
		await test('Filter Transfer transactions', () => {}, app.view, state);

		state.values.typeMenu.activeType = app.DEBT;
		state.values.paginator.pages = expectedPages(totalDebts);
		await app.view.filterByType(state.values.typeMenu.activeType);
		await test('Filter by Debt', () => {}, app.view, state);

		// Filter by account 2 and debt
		state.values.paginator.pages = expectedPages(acc_2_debts.length);
		await app.view.filterByAccounts(accIds[2]);
		await test('Filter by accounts', () => {}, app.view, state);

		// Filter by account 2
		state.values.typeMenu.activeType = 0;
		state.values.paginator.pages = expectedPages(acc_2_all.length);
		await app.view.filterByType(state.values.typeMenu.activeType);
		await test('Show all transactions', () => {}, app.view, state);

		state.values.typeMenu.activeType = 0;

		// Filter by account 2 and last week date
		state.values.paginator.pages = expectedPages(acc_2_week.length);
		await app.view.selectDateRange(day1, day2);
		await test('Select date range', () => {}, app.view, state);

		let acc_2_query = filterTransactionsByQuery(acc_2_week, '1');

		state.values.paginator.pages = expectedPages(acc_2_query.length);
		state.values.searchForm.value = '1';
		await app.view.search(state.values.searchForm.value);
		await test('Search', () => {}, app.view, state);
	}


	return { run : runTests };
})();


export { runTransList };
