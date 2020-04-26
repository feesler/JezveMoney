import { api } from '../api.js';
import { App } from '../app.js';
import { checkData } from './transaction/common.js';
import { test, convDate, copyObject } from '../common.js';
import { EXPENSE, INCOME, TRANSFER, DEBT, Transaction } from '../model/transaction.js';


const RUB = 1;
const USD = 2;
const EUR = 3;
const PLN = 4;

let accountsList = [
	{ name : 'acc_4', curr_id : RUB, initbalance : '60500.12', icon : 1 },
	{ name : 'acc_5', curr_id : RUB, initbalance : '78000', icon : 2 },
	{ name : 'cash USD', curr_id : USD, initbalance : '10000', icon : 4 },
	{ name : 'cash EUR', curr_id : EUR, initbalance : '1000', icon : 5 }
];

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


async function setupAccounts(list)
{
	let res = [];

	for(let params of list)
	{
		let acc = App.state.accounts.findByName(params.name);
		if (!acc)
		{
			acc = await api.account.create(params);
			App.state.createAccount(params);
		}

		if (acc)
			res.push(acc.id);
	}

	return res;
}


async function setupPersons(list)
{
	let res = [];

	for(let params of list)
	{
		let pers = App.state.persons.findByName(params.name);
		if (!pers)
		{
			pers = await api.person.create(params);
			App.state.createPerson(params);
		}

		if (pers)
			res.push(pers.id);
	}

	return res;
}


function populateTransactions(list, convertFunc)
{
	let res = [];

	if (!list)
		return res;

	if (!Array.isArray(list))
		list = [ list ];

	for(let props of list)
	{
		let convertedProps = convertFunc(props);
		for(let date of App.dateList)
		{
			convertedProps.date = date;
			res.push(copyObject(convertedProps));
		}
	}

	return res;
}


async function preCreateData()
{
	console.log('Precreate data...');

	await api.user.login('test', 'test');
	await App.state.fetch();

	accIds = await setupAccounts(accountsList);
	personIds = await setupPersons(personsList);

	// Expense transactions
	let created = populateTransactions(expensesList, props =>
	{
		props.src_id = accIds[props.src_id];
		return Transaction.expense(props, App.state);
	});
	newExpenses.push(...created);

	// Income transactions
	created = populateTransactions(incomesList, props =>
		{
			props.dest_id = accIds[props.dest_id];
			return Transaction.income(props, App.state);
		});
	newIncomes.push(...created);

	// Transfer transactions
	created = populateTransactions(transfersList, props =>
		{
			props.src_id = accIds[props.src_id];
			props.dest_id = accIds[props.dest_id];
			return Transaction.transfer(props, App.state);
		});
	newTransfers.push(...created);

	// Debt transactions
	created = populateTransactions(debtsList, props =>
		{
			props.person_id = personIds[props.person_id];
			props.acc_id = (props.acc_id) ? accIds[props.acc_id] : 0;
			return Transaction.debt(props, App.state);
		});
	newDebts.push(...created);

	let multi = [].concat(newExpenses, newIncomes, newTransfers, newDebts);
	await api.transaction.createMultiple(multi);

	await App.state.fetch();

	console.log('Done');
}


export async function run()
{
	App.view.setBlock('Transaction List view', 1);

	await preCreateData();

	let allTrList = App.state.transactions;

	await App.goToMainView();
	await App.view.goToTransactions();

	// Filter all transactions with account acc_2
	let acc_2_all = allTrList.filterByAccounts(accIds[2]);
	// Filter debt transactions with account acc_2
	let acc_2_debts = acc_2_all.filterByType(DEBT);

	// Filter transactions with account acc_2 over the week
	// Prepare date range for week
	let now = new Date(convDate(App.dates.now));
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

	await test('Initial state of transaction list view', () => App.view.checkState(state));

	state.values.paginator.active = 2;
	await App.view.goToNextPage();
	await test('Navigate to page 2', () => App.view.checkState(state));

	state.values.modeSelector.detailsMode.isActive = true;
	state.values.modeSelector.listMode.isActive = false;
	await App.view.setDetailsMode();
	await test('Change list mode to details', () => App.view.checkState(state));

	state.values.paginator.active = 3;
	await App.view.goToNextPage();
	await test('Navigate to page 3', () => App.view.checkState(state));

	// Expense
	let allExpenses = allTrList.filterByType(EXPENSE);

	state.values.typeMenu.activeType = EXPENSE;
	state.values.paginator.active = 1;
	state.values.paginator.pages = allExpenses.expectedPages();
	await App.view.filterByType(state.values.typeMenu.activeType);
	await test('Filter by Expense', () => App.view.checkState(state));
	await checkData('Correctness of transaction list', allExpenses, true);

	// Income
	let allIncomes = allTrList.filterByType(INCOME);

	state.values.typeMenu.activeType = INCOME;
	state.values.paginator.pages = allIncomes.expectedPages();
	await App.view.filterByType(state.values.typeMenu.activeType);
	await test('Filter by Income', () => App.view.checkState(state));
	await checkData('Correctness of transaction list', allIncomes, true);

	// Transfer
	let allTransfers = allTrList.filterByType(TRANSFER);

	state.values.typeMenu.activeType = TRANSFER;
	state.values.paginator.pages = allTransfers.expectedPages();
	await App.view.filterByType(state.values.typeMenu.activeType);
	await test('Filter by Transfer', () => App.view.checkState(state));
	await checkData('Correctness of transaction list', allTransfers, true);

	// Debt
	let allDebts = allTrList.filterByType(DEBT);

	state.values.typeMenu.activeType = DEBT;
	state.values.paginator.pages = allDebts.expectedPages();
	await App.view.filterByType(state.values.typeMenu.activeType);
	await test('Filter by Debt', () => App.view.checkState(state));
	await checkData('Correctness of transaction list', allDebts, true);

	// Filter by account 2 and debt
	state.values.paginator.pages = acc_2_debts.expectedPages();
	await App.view.filterByAccounts(accIds[2]);
	await test('Filter by accounts', () => App.view.checkState(state));
	await checkData('Correctness of transaction list', acc_2_debts, true);

	// Filter by account 2 and all types of transaction
	state.values.typeMenu.activeType = 0;
	state.values.paginator.pages = acc_2_all.expectedPages();
	await App.view.filterByType(state.values.typeMenu.activeType);
	await test('Show all transactions of account', () => App.view.checkState(state));
	await checkData('Correctness of transaction list', acc_2_all, true);

	// Filter by account 2 and last week date
	state.values.paginator.pages = acc_2_week.expectedPages();
	await App.view.selectDateRange(day1, day2);
	await test('Select date range', () => App.view.checkState(state));

	await checkData('Correctness of transaction list', acc_2_week, true);

	// Search '1'
	state.values.paginator.pages = acc_2_query.expectedPages();
	state.values.searchForm.value = '1';
	await App.view.search(state.values.searchForm.value);
	await test('Search', () => App.view.checkState(state));

	await checkData('Correctness of transaction list', acc_2_query, true);
}
