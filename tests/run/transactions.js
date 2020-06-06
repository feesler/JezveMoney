import { App } from '../app.js';
import { test } from '../common.js';
import { TransactionsView } from '../view/transactions.js';
import { MainView } from '../view/main.js';
import { Transaction } from '../model/transaction.js';


// Navigate to transactions list page
async function checkNavigation()
{
	if (App.view instanceof TransactionsView)
		return true;

	if (!(App.view instanceof MainView))
		await App.goToMainView();

	await App.view.goToTransactions();
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

	const accountNames = accounts.map(account_id =>
	{
		const item = App.state.accounts.getItem(account_id);
		return item ? item.name : `(${account_id})`;
	});

	await test(`Filter by accounts [${accountNames.join()}]`, () => App.view.filterByAccounts(accounts));
	await test('Correctness of transaction list', () => App.view.iteratePages());
}


export async function filterByDate({ start, end })
{
	await checkNavigation();

	await test('Select date range', () => App.view.selectDateRange(start, end));
	await test('Correctness of transaction list', () => App.view.iteratePages());
}


export async function search(text)
{
	await checkNavigation();

	await test(`Search (${text})`, () => App.view.search(text));
	await test('Correctness of transaction list', () => App.view.iteratePages());
} 

