import { TransactionsList } from '../trlist.js';
import { api } from '../api.js';
import { EXPENSE, INCOME, TRANSFER, DEBT, test, convDate, copyObject } from '../common.js';


const RUB = 1;
const USD = 2;
const EUR = 3;
const PLN = 4;

let accountsList = [{ name : 'acc_4', curr_id : RUB, initbalance : '60500.12', icon : 1 },
					{ name : 'acc_5', curr_id : RUB, initbalance : '78000', icon : 2 },
					{ name : 'cash USD', curr_id : USD, initbalance : '10000', icon : 4 },
					{ name : 'cash EUR', curr_id : EUR, initbalance : '1000', icon : 5 }];

let accIds = [];

let personsList = [{ name : 'Alex' }, { name : 'noname &' }];
let personIds = [];

let newExpenses = [];
let newIncomes = [];
let newTransfers = [];
let newDebts = [];

let expensesList = [
	{ src_id : 0, src_amount : '500', comment: 'lalala' },
	{ src_id : 0, src_amount : '500', dest_curr : USD, comment: 'lalala' },
	{ src_id : 1, src_amount : '100', comment: 'hohoho' },
	{ src_id : 1, src_amount : '780', dest_amount : '10', dest_curr : EUR, comment: 'кккк' },
	{ src_id : 2, src_amount : '50', comment: '1111' }
];

let incomesList = [
	{ dest_id : 3, src_amount : '7500', dest_amount : '100', src_curr : RUB, comment: '232323' },
	{ dest_id : 0, src_amount : '1000000', dest_amount : '64000', src_curr : PLN, comment: '111 кккк' },
	{ dest_id : 0, dest_amount : '100', comment: '22222' },
	{ dest_id : 1, src_amount : '7013.21', dest_amount : '5000', comment: '33333' },
	{ dest_id : 3, src_amount : '287', dest_amount : '4', src_curr : RUB, comment: 'dddd' },
	{ dest_id : 3, dest_amount : '33', comment: '11 ho' }
];

let transfersList = [
	{ src_id : 0, dest_id : 1, src_amount : '300', comment: 'd4' },
	{ src_id : 0, dest_id : 2, src_amount : '6500', dest_amount : '100', comment: 'g6' },
	{ src_id : 1, dest_id : 0, src_amount : '800.01', comment: 'x0' },
	{ src_id : 1, dest_id : 2, src_amount : '7', dest_amount : '0.08', comment: 'l2' },
	{ src_id : 3, dest_id : 2, src_amount : '5.0301', dest_amount : '4.7614', comment: 'i1' }
];

let debtsList = [
	{ op : 1, person_id : 0, src_amount : '1050', src_curr : RUB, comment: '111 кккк' },
	{ op : 1, person_id : 1, acc_id : 1, src_amount : '780', comment: '--**' },
	{ op : 2, person_id : 0, src_amount : '990.99', src_curr : RUB, comment: 'ппп ppp' },
	{ op : 2, person_id : 1, acc_id : 2, src_amount : '105', comment: '6050 кккк' },
	{ op : 1, person_id : 0, acc_id : 3, src_amount : '4', comment: '111 кккк' }
];


let runTransList =
{
	async setupAccounts(list)
	{
		let res = [];

		let accountsBefore = await this.state.getAccountsList();
		for(let params of list)
		{
			let acc = accountsBefore.find(item => item.name == params.name);
			if (!acc)
			{
				this.state.cleanCache();
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

		let personsBefore = await this.state.getPersonsList();
		for(let params of list)
		{
			let pers = personsBefore.find(item => item.name == params.name);
			if (!pers)
			{
				this.state.cleanCache();
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
				res.push(copyObject(convertedProps));
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
			return this.run.transactions.expenseTransaction(props);
		});
		newExpenses.push(...created);

		// Income transactions
		created = await scope.populateTransactions(incomesList, props =>
			{
				props.dest_id = accIds[props.dest_id];
				return this.run.transactions.incomeTransaction(props);
			});
		newIncomes.push(...created);

		// Transfer transactions
		created = await scope.populateTransactions(transfersList, props =>
			{
				props.src_id = accIds[props.src_id];
				props.dest_id = accIds[props.dest_id];
				return this.run.transactions.transferTransaction(props);
			});
		newTransfers.push(...created);

		// Debt transactions
		created = await scope.populateTransactions(debtsList, props =>
			{
				props.person_id = personIds[props.person_id];
				props.acc_id = (props.acc_id) ? accIds[props.acc_id] : 0;
				return this.run.transactions.debtTransaction(props);
			});
		newDebts.push(...created);

		let multi = [].concat(newExpenses, newIncomes, newTransfers, newDebts);
		await api.transaction.createMultiple(multi);

		this.state.cleanCache();

		console.log('Done');
	},


	async run()
	{
		let scope = this.run.transactions;

		this.view.setBlock('Transaction List view', 1);

		await scope.list.preCreateData();

		let allTrList = await this.state.getTransactionsList();

		await this.goToMainView();
		await this.view.goToTransactions();

		// Filter all transactions with account acc_2
		let acc_2_all = allTrList.filterByAccounts(accIds[2]);
		// Filter debt transactions with account acc_2
		let acc_2_debts = acc_2_all.filterByType(DEBT);

		// Filter transactions with account acc_2 over the week
		// Prepare date range for week
		let now = new Date(convDate(this.dates.now));
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
		let acc_2_query = acc_2_week.filterByQuery('1');

		let state = { visibility : { typeMenu : true, accDropDown : true, searchForm : true,
										modeSelector : true, paginator : true, transList : true },
	 					values : { typeMenu : { activeType : 0 },
									searchForm : { value : '' },
									paginator : { pages : allTrList.expectedPages(), active : 1 },
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

		// Expense
		let allExpenses = allTrList.filterByType(EXPENSE);

		state.values.typeMenu.activeType = EXPENSE;
		state.values.paginator.active = 1;
		state.values.paginator.pages = allExpenses.expectedPages();
		await this.view.filterByType(state.values.typeMenu.activeType);
		await test('Filter by Expense', () => {}, this.view, state);
		await scope.checkData('Correctness of transaction list', allExpenses, true);

		// Income
		let allIncomes = allTrList.filterByType(INCOME);

		state.values.typeMenu.activeType = INCOME;
		state.values.paginator.pages = allIncomes.expectedPages();
		await this.view.filterByType(state.values.typeMenu.activeType);
		await test('Filter by Income', () => {}, this.view, state);
		await scope.checkData('Correctness of transaction list', allIncomes, true);

		// Transfer
		let allTransfers = allTrList.filterByType(TRANSFER);

		state.values.typeMenu.activeType = TRANSFER;
		state.values.paginator.pages = allTransfers.expectedPages();
		await this.view.filterByType(state.values.typeMenu.activeType);
		await test('Filter by Transfer', () => {}, this.view, state);
		await scope.checkData('Correctness of transaction list', allTransfers, true);

		// Debt
		let allDebts = allTrList.filterByType(DEBT);

		state.values.typeMenu.activeType = DEBT;
		state.values.paginator.pages = allDebts.expectedPages();
		await this.view.filterByType(state.values.typeMenu.activeType);
		await test('Filter by Debt', () => {}, this.view, state);
		await scope.checkData('Correctness of transaction list', allDebts, true);

		// Filter by account 2 and debt
		state.values.paginator.pages = acc_2_debts.expectedPages();
		await this.view.filterByAccounts(accIds[2]);
		await test('Filter by accounts', () => {}, this.view, state);
		await scope.checkData('Correctness of transaction list', acc_2_debts, true);

		// Filter by account 2 and all types of transaction
		state.values.typeMenu.activeType = 0;
		state.values.paginator.pages = acc_2_all.expectedPages();
		await this.view.filterByType(state.values.typeMenu.activeType);
		await test('Show all transactions of account', () => {}, this.view, state);
		await scope.checkData('Correctness of transaction list', acc_2_all, true);

		// Filter by account 2 and last week date
		state.values.paginator.pages = acc_2_week.expectedPages();
		await this.view.selectDateRange(day1, day2);
		await test('Select date range', () => {}, this.view, state);

		await scope.checkData('Correctness of transaction list', acc_2_week, true);

		// Search '1'
		state.values.paginator.pages = acc_2_query.expectedPages();
		state.values.searchForm.value = '1';
		await this.view.search(state.values.searchForm.value);
		await test('Search', () => {}, this.view, state);

		await scope.checkData('Correctness of transaction list', acc_2_query, true);
	}
};


export { runTransList };
