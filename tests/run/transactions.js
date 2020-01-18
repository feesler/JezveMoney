import { TransactionsList } from '../trlist.js';
import { api } from '../api.js';


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


let runTransList =
{
	async setupAccounts(list)
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
	},


	async setupPersons(list)
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
	},


	async populateTransactions(list, convertFunc)
	{
		let res = [];

		if (!list)
			return res;

		if (!Array.isArray(list))
			list = [ list ];

		for(let props of list)
		{
			let convertedProps = await convertFunc(props);
			for(let date of this.dateList)
			{
				convertedProps.date = date;
				let createResult = await api.transaction.create(convertedProps);
				res.push(createResult.id);
			}
		}

		return res;
	},


	async preCreateData()
	{
		let scope = this.run.transactions.list;

		console.log('Precreate data...');

		await api.user.login('test', 'test');

		accIds = await scope.setupAccounts(accountsList);
		personIds = await scope.setupPersons(personsList);

		// Expense transactions
		let created = await scope.populateTransactions(expensesList, props =>
		{
			props.src_id = accIds[props.src_id];
			return api.transaction.expense(props);
		});
		newExpenses.push(...created);

		// Income transactions
		created = await scope.populateTransactions(incomesList, props =>
			{
				props.dest_id = accIds[props.dest_id];
				return api.transaction.income(props);
			});
		newIncomes.push(...created);

		// Transfer transactions
		created = await scope.populateTransactions(transfersList, props =>
			{
				props.src_id = accIds[props.src_id];
				props.dest_id = accIds[props.dest_id];
				return api.transaction.transfer(props);
			});
		newTransfers.push(...created);

		// Debt transactions
		created = await scope.populateTransactions(debtsList, props =>
			{
				props.person_id = personIds[props.person_id];
				props.acc_id = (props.acc_id) ? accIds[props.acc_id] : 0;
				return api.transaction.debt(props);
			});
		newDebts.push(...created);

		console.log('Done');
	},


	expectedPages(listLength)
	{
		return Math.max(Math.ceil(listLength / this.config.transactionsOnPage), 1);
	},


	async run()
	{
		let scope = this.run.transactions.list;
		let env = this.environment;
		let test = this.test;

		api.setEnv(this);

		env.setBlock('Transaction List view', 1);

		let transBefore = await api.transaction.list();
		let expensesBefore = transBefore.filter(item => item.type == this.EXPENSE);
		let incomesBefore = transBefore.filter(item => item.type == this.INCOME);
		let transfersBefore = transBefore.filter(item => item.type == this.TRANSFER);
		let debtsBefore = transBefore.filter(item => item.type == this.DEBT);

		await scope.preCreateData();

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

		await this.goToMainView();
		await this.view.goToTransactions();

		let totalExpenses = newExpenses.length + expensesBefore.length;
		let totalIncomes = newIncomes.length + incomesBefore.length;
		let totalTransfers = newTransfers.length + transfersBefore.length;
		let totalDebts = newDebts.length + debtsBefore.length;

		let allTrList = new TransactionsList(this, allTransactions);
		// Filter all transactions with account acc_2
		let acc_2_all = allTrList.filterByAccounts(accIds[2]);
		// Filter debt transactions with account acc_2
		let acc_2_debts = acc_2_all.filterByType(this.DEBT);

		// Filter transactions with account acc_2 over the week
		// Prepare date range for week
		let now = new Date(this.convDate(this.dates.now));
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

		let acc_2_week = acc_2_all.filterByDate(weekStartDate, weekEndDate);
		// Search transactions with '1' in the comment
		let acc_2_query = acc_2_all.filterByQuery('1');


		let totalTransactions = totalExpenses + totalIncomes + totalTransfers + totalDebts;

		let state = { visibility : { typeMenu : true, accDropDown : true, searchForm : true,
										modeSelector : true, paginator : true, transList : true },
	 					values : { typeMenu : { activeType : 0 },
									searchForm : { value : '' },
									paginator : { pages : scope.expectedPages(totalTransactions), active : 1 },
									modeSelector : { listMode : { isActive : true },
														detailsMode : { isActive : false } } } };

		await test('Initial state of transaction list view', async () => {}, this.view, state);

		state.values.paginator.active = 2;
		await this.view.goToNextPage();
		await test('Navigate to page 2', () => {}, this.view, state);

		state.values.modeSelector.detailsMode.isActive = true;
		state.values.modeSelector.listMode.isActive = false;
		await this.view.setDetailsMode();
		await test('Change list mode to details', () => {}, this.view, state);

		state.values.paginator.active = 3;
		await this.view.goToNextPage();
		await test('Navigate to page 3', () => {}, this.view, state);

		state.values.typeMenu.activeType = this.EXPENSE;
		state.values.paginator.active = 1;
		state.values.paginator.pages = scope.expectedPages(totalExpenses);
		await this.view.filterByType(state.values.typeMenu.activeType);
		await test('Filter by Expense', () => {}, this.view, state);

		state.values.typeMenu.activeType = this.INCOME;
		state.values.paginator.pages = scope.expectedPages(totalIncomes);
		await this.view.filterByType(state.values.typeMenu.activeType);
		await test('Filter by Income', () => {}, this.view, state);

		state.values.typeMenu.activeType = this.TRANSFER;
		state.values.paginator.pages = scope.expectedPages(totalTransfers);
		await this.view.filterByType(state.values.typeMenu.activeType);
		await test('Filter by Transfer', () => {}, this.view, state);

		state.values.typeMenu.activeType = this.DEBT;
		state.values.paginator.pages = scope.expectedPages(totalDebts);
		await this.view.filterByType(state.values.typeMenu.activeType);
		await test('Filter by Debt', () => {}, this.view, state);

		// Filter by account 2 and debt
		state.values.paginator.pages = scope.expectedPages(acc_2_debts.list.length);
		await this.view.filterByAccounts(accIds[2]);
		await test('Filter by accounts', () => {}, this.view, state);

		// Filter by account 2 and all types of transaction
		state.values.typeMenu.activeType = 0;
		state.values.paginator.pages = scope.expectedPages(acc_2_all.list.length);
		await this.view.filterByType(state.values.typeMenu.activeType);
		await test('Show all transactions', () => {}, this.view, state);

		// Filter by account 2 and last week date
		state.values.paginator.pages = scope.expectedPages(acc_2_week.list.length);
		await this.view.selectDateRange(day1, day2);
		await test('Select date range', () => {}, this.view, state);

		state.values.paginator.pages = scope.expectedPages(acc_2_query.list.length);
		state.values.searchForm.value = '1';
		await this.view.search(state.values.searchForm.value);
		await test('Search', () => {}, this.view, state);
	}
};


export { runTransList };
