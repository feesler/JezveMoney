import { api } from '../api.js';
import { App } from '../app.js';
import { test, copyObject, checkObjValue } from '../common.js';
import { TransactionList } from '../view/component/transactionlist.js';
import { TransactionsView } from '../view/transactions.js';
import { MainView } from '../view/main.js';
import { Transaction, availTransTypes } from '../model/transaction.js';
import { TransactionsList } from '../model/transactionslist.js';


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



// Navigate to transactions list page
async function checkNavigation()
{
	if (App.view instanceof TransactionsView)
		return true;

	if (!(App.view instanceof MainView))
		await App.goToMainView();

	await App.view.goToTransactions();
}


// Compare transactions list with specified data
export async function checkTransactionsList(expected)
{
	if (!(expected instanceof TransactionsList))
		throw new Error('Invalid data specified');

	await checkNavigation();

	let transListPages = await iteratePages();
	let transList = transListPages.items;

	let expTransactions = TransactionList.render(expected.data, App.state);

	return checkObjValue(transList, expTransactions);
}


export async function checkInitialState()
{
	await checkNavigation();

	App.view.expectedState = App.view.setExpectedState();
	await test('Initial state of transaction list view', () => App.view.checkState());
}


export async function goToNextPage()
{
	await checkNavigation();

	await test('Navigate to next page', () => App.view.goToNextPage());
}

export async function setDetailsMode()
{
	await checkNavigation();

	await test('Change list mode to details', () => App.view.setDetailsMode());
}


export async function filterByType(type)
{
	await checkNavigation();

	let descr = (!type) ? 'Show all types of transactions' : `Filter by ${Transaction.typeToStr(type)}`;
	await test(descr, () => App.view.filterByType(type));
	await test('Correctness of transaction list', () => App.view.iteratePages());
}


export async function filterByAccounts(accounts)
{
	if (!Array.isArray(accounts))
		accounts = [ accounts ];

	await checkNavigation();

	await test(`Filter by ${accounts.join()}`, () => App.view.filterByAccounts(accounts));
	await test('Correctness of transaction list', () => App.view.iteratePages());
}


export async function filterByDate(start, end)
{
	await checkNavigation();

	await test('Select date range', () => App.view.selectDateRange(start, end));
	await test('Correctness of transaction list', () => App.view.iteratePages());
}


export async function search(text)
{
	await checkNavigation();

	await test('Search', () => App.view.search(text));
	await test('Correctness of transaction list', () => App.view.iteratePages());
} 


export async function run()
{
	App.view.setBlock('Transaction List view', 1);

	await preCreateData();

	await checkInitialState();

	await goToNextPage();
	await setDetailsMode();
	await goToNextPage();

	for(let type of availTransTypes)
	{
		await filterByType(type);
	}

	await filterByAccounts(accIds[2]);
	await filterByType(0);

	let today = new Date();
	let firstDay = Date.UTC(today.getFullYear(), today.getMonth(), 1);
	let startDate = (today.getDate() > 6) ? App.dates.weekAgo : firstDay;
	await filterByDate(startDate, today);

	await search('1');

}
