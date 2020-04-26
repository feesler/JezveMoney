import { MainView } from '../view/main.js';
import { AccountsView } from '../view/accounts.js';
import { Transaction } from '../model/transaction.js';
import { Currency } from '../model/currency.js';
import { test, formatProps } from '../common.js';
import { App } from '../app.js';


export async function stateLoop()
{
	App.view.setBlock('View state loop', 2);

	// Navigate to create account view
	if (!(App.view instanceof AccountsView))
	{
		await App.goToMainView();
		await App.view.goToAccounts();
	}
	await App.view.goToCreateAccount();

	// Check initial state
	let expAccount = { name : '', initbalance : 0, balance : '0', curr_id : 1, icon : 0 };
	App.view.setExpectedAccount(expAccount);
	await test('Initial state of account view', () => App.view.checkState());

	// Check account name is 'New account' brefore input name
	await test('Change currency', () => App.view.changeCurrency(3));
	await test('Input balance (100 .01)', () => App.view.inputBalance('100.01'));
	await test('Change icon', () => App.view.changeIcon(1));

	await test('Account name input', () => App.view.inputName('acc_1'));

	// Change currency to USD
	await test('Change currency', () => App.view.changeCurrency(2));

	await test('Input balance (100 000.01)', () => App.view.inputBalance('100000.01'));

	// Change currency back to RUB
	await test('Change currency back', () => App.view.changeCurrency(1));

	// Input empty value for initial balance
	await test('Input empty balance', () => App.view.inputBalance(''));
	await test('Input dot (.) balance', () => App.view.inputBalance('.'));
	await test('Input (.01) balance', () => App.view.inputBalance('.01'));
	await test('Input (10000000.01) balance', () => App.view.inputBalance('10000000.01'));

	// Change icon to safe
	await test('Change icon', () => App.view.changeIcon(2));
	await test('Input (1000.01) balance', () => App.view.inputBalance('1000.01'));

	await App.view.navigation(() => App.view.click(App.view.content.cancelBtn));
}


export async function submitAccount(params)
{
	// Input account name
	if ('name' in params)
		await test(`Input name (${params.name})`, () => App.view.inputName(params.name));

	// Change currency
	if ('curr_id' in params)
		await test(`Select currency ${params.curr_id}`, () => App.view.changeCurrency(params.curr_id));

	// Input balance
	if ('initbalance' in params)
		await test('Tile balance format update', () => App.view.inputBalance(params.initbalance));

	// Change icon
	if ('icon' in params)
		await test('Tile icon update', () => App.view.changeIcon(params.icon));

	let expected = App.view.getExpectedAccount();

	await App.view.navigation(() => App.view.click(App.view.content.submitBtn));

	return expected;
}


export async function create(params)
{
	if (!params)
		throw new Error('No params specified');

	let title = formatProps(params);
	App.view.setBlock(`Create account (${title})`, 2);

	if (!params.name || !params.name.length)
		throw new Error('Name not specified');

// Navigate to create account view
	if (!(App.view instanceof AccountsView))
	{
		await App.goToMainView();
		await App.view.goToAccounts();
	}
	await App.view.goToCreateAccount();

// Check initial state
	await App.state.fetch();

	let expAccount = { name : '', owner_id : App.owner_id, initbalance : '0', balance : 0, curr_id : 1, icon : 0 };
	App.view.setExpectedAccount(expAccount);
	await test('Initial state of account view', () => App.view.checkState());

	expAccount = await submitAccount(params);

	App.state.createAccount(expAccount);

	App.view.expectedState = AccountsView.render(App.state);
	await test('Create account', () => App.view.checkState());
}


export async function update(params)
{
	if (!params)
		throw new Error('No params specified');

	// Check initial state
	await App.state.fetch();

	let pos;
	if ('id' in params)
	{
		pos = App.state.accounts.getIndexOf(params.id);
	}
	else
	{
		pos = parseInt(params.pos);
		if (isNaN(pos))
			throw new Error('Position of account not specified');
		delete params.pos;
	}

	let title = formatProps(params);
	App.view.setBlock(`Update account [${pos}] (${title})`, 2);

	// Navigate to create account view
	if (!(App.view instanceof AccountsView))
	{
		await App.goToMainView();
		await App.view.goToAccounts();
	}
	await App.view.goToUpdateAccount(pos);

	let expAccount = App.state.accounts.getItemByIndex(pos);
	if (!expAccount)
		throw new Error('Can not find specified account');
	App.view.setExpectedAccount(expAccount);
	await test('Initial state of account view', () => App.view.checkState());

	expAccount = await submitAccount(params);

	App.state.updateAccount(expAccount);

	App.view.expectedState = AccountsView.render(App.state);
	await test('Update account', () => App.view.checkState());

	await App.state.fetchAndTest();
}


export async function del(accounts)
{
	if (!Array.isArray(accounts))
		accounts = [ accounts ];

	App.view.setBlock(`Delete account(s) [${accounts.join()}]`, 2);

	// Navigate to create account view
	if (!(App.view instanceof AccountsView))
	{
		await App.goToMainView();
		await App.view.goToAccounts();
	}

	// Check initial state
	await App.state.fetch();

	let userAccList = App.state.accounts.getUserAccounts();
	App.state.deleteAccounts(userAccList.positionsToIds(accounts));

	await App.view.deleteAccounts(accounts);

	App.view.expectedState = AccountsView.render(App.state);
	await test('Delete accounts [' + accounts.join() + ']', () => App.view.checkState());

	await App.state.fetchAndTest();
}


export async function delFromUpdate(pos)
{
	pos = parseInt(pos);
	if (isNaN(pos) || pos < 0)
		throw new Error('Position of account not specified');

	App.view.setBlock('Delete account from update view [' + pos + ']', 2);

	if (!(App.view instanceof AccountsView))
	{
		if (!(App.view instanceof MainView))
			await App.goToMainView();
		await App.view.goToAccounts();
	}

	await App.view.goToUpdateAccount(pos);

	await App.state.fetch();

	let userAccList = App.state.accounts.getUserAccounts();
	App.state.deleteAccounts(userAccList.positionsToIds(pos));

	await App.view.deleteSelfItem();

	App.view.expectedState = AccountsView.render(App.state);
	await test('Delete account [' + pos + ']', () => App.view.checkState());

	await App.goToMainView();

	App.view.expectedState = MainView.render(App.state);
	await test('Main page widgets update', () => App.view.checkState());

	await App.state.fetchAndTest();
}


export async function exportTest(accounts)
{
	if (!Array.isArray(accounts))
		accounts = [ accounts ];

	// Navigate to create account view
	if (!(App.view instanceof AccountsView))
	{
		await App.goToMainView();
		await App.view.goToAccounts();
	}

	// Prepare expected content
	let delimiter = ';';
	let rows = [];
	let headerRow = [ 'ID', 'Type', 'Source amount', 'Destination amount', 'Source result', 'Destination result', 'Date', 'Comment' ];
	rows.push(headerRow.join(delimiter));

	// Prepare state
	await App.state.fetch();
	let userAccList = App.state.accounts.getUserAccounts();
	let ids = userAccList.positionsToIds(accounts);
	let trList = App.state.transactions.filterByAccounts(ids);
	let transactions = trList.sortAsc();

	for(let transaction of transactions)
	{
		let row = [
			transaction.id,
			Transaction.typeToStr(transaction.type),
			Currency.format(transaction.src_curr, transaction.src_amount),
			Currency.format(transaction.dest_curr, transaction.dest_amount),
			Currency.format(transaction.src_curr, transaction.src_result),
			Currency.format(transaction.dest_curr, transaction.dest_result),
			transaction.date,
			transaction.comment
		];

		rows.push(row.join(delimiter));
	}

	let expectedContent = rows.join('\r\n');
	expectedContent = expectedContent.trim();

	let content = await App.view.exportAccounts(accounts);
	content = content.trim();

	await test(`Export accounts [${accounts.join()}]`, () => expectedContent == content);
}
