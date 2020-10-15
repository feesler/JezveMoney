import { App } from '../app.js';
import { test, formatDate, fixDate, copyObject, checkObjValue } from '../common.js';
import { TransactionsView } from '../view/transactions.js';
import { MainView } from '../view/main.js';
import { availTransTypes, Transaction } from '../model/transaction.js';


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


export async function toggleSelect(transactions)
{
	if (!Array.isArray(transactions))
		transactions = [ transactions ];

    await test(`Toggle select items [${transactions.join()}]`, async () => {
        await checkNavigation();

        let origItems = App.view.getItems();
        // Check correctness of arguments
        let indexes = [];
        for(let pos of transactions)
        {
            let ind = parseInt(pos);
            if (isNaN(ind) || ind < 0 || ind > origItems.length)
                throw new Error(`Invalid item index ${pos}`);
            indexes.push(ind);
        }

        let expectedItems = origItems.map((item, ind) =>
        {
            let res = copyObject(item);
            if (indexes.includes(ind))
                res.selected = !res.selected;

            return res;
        });

	    await App.view.selectTransactions(indexes);
        let items = App.view.getItems();
        checkObjValue(items, expectedItems);

        // Click by items again to inverse selection
        expectedItems = origItems;
	    await App.view.selectTransactions(indexes);
        items = App.view.getItems();
        checkObjValue(items, expectedItems);

        return true;
    });
}


export async function filterByType(type)
{
	await checkNavigation();

	let types = Array.isArray(type) ? type : [ type ];
	types = types.filter(item => availTransTypes.includes(item));

	const typeNames = types.map(Transaction.typeToString);

	let descr = (!types.length) ? 'Show all types of transactions' : `Filter by [${typeNames.join()}]`;
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

	let startDateFmt = formatDate(new Date(fixDate(start)));
	let endDateFmt = formatDate(new Date(fixDate(end)));

	await test(`Select date range (${startDateFmt} - ${endDateFmt})`, () => App.view.selectDateRange(start, end));
	await test('Correctness of transaction list', () => App.view.iteratePages());
}


export async function search(text)
{
	await checkNavigation();

	await test(`Search (${text})`, () => App.view.search(text));
	await test('Correctness of transaction list', () => App.view.iteratePages());
} 

