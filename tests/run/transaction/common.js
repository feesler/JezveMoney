import { TransactionsView } from '../../view/transactions.js';
import { MainView } from '../../view/main.js';
import { Transaction } from '../../model/transaction.js';
import { AccountsList } from '../../model/accountslist.js';
import { App } from '../../app.js';
import {
	test,
	isObject,
	copyObject,
	formatProps,
} from '../../common.js';


export async function create(type, params, submitHandler)
{
	App.view.setBlock(`Create ${Transaction.typeToStr(type)} (${formatProps(params)})`, 2);

	// Navigate to create transaction page
	let accNum = ('fromAccount' in params) ? params.fromAccount : 0;
	await App.goToMainView();
	await App.view.goToNewTransactionByAccount(accNum);

	if (App.view.content.typeMenu.activeType != type)
		await App.view.changeTransactionType(type);

	// Input data and submit
	let expectedTransaction = await submitHandler(params);

	App.state.createTransaction(expectedTransaction);

	App.view.expectedState = MainView.render(App.state);
	await test('Main page widgets update', () => App.view.checkState());
	await test('App state', () => App.state.fetchAndTest());
}


export async function update(type, params, submitHandler)
{
	let view = App.view;

	if (!isObject(params))
		throw new Error('Parameters not specified');

	let pos = parseInt(params.pos);
	if (isNaN(pos) || pos < 0)
		throw new Error('Position of transaction not specified');
	delete params.pos;

	view.setBlock(`Update ${Transaction.typeToStr(type)} [${pos}] (${formatProps(params)})`, 2);

	await App.goToMainView();
	await App.view.goToTransactions();

	if (App.view.content.typeMenu.activeType != type)
		await App.view.filterByType(type);

	await App.view.goToUpdateTransaction(pos);

	// Step
	let origTransaction = App.view.getExpectedTransaction();
	let expectedState = App.state.clone();
	origTransaction = expectedState.getExpectedTransaction(origTransaction);
	let originalAccounts = copyObject(expectedState.accounts.data);
	let canceled = AccountsList.cancelTransaction(originalAccounts, origTransaction);
	App.state.accounts.data = canceled;
	await App.view.parse();

	let expectedTransaction = await submitHandler(params);

	expectedState.accounts.data = originalAccounts;
	expectedState.updateTransaction(expectedTransaction);
	App.state.setState(expectedState);

	await App.goToMainView();

	App.view.expectedState = MainView.render(App.state);
	await test('Main page widgets update', () => App.view.checkState());
	await test('App state', () => App.state.fetchAndTest());
}


export async function del(type, transactions)
{
	App.view.setBlock(`Delete transactions [${transactions.join()}]`, 3);

	await App.goToMainView();

	let expectedState = App.state.clone();
	let ids = expectedState.transactions.filterByType(type).positionsToIds(transactions);
	expectedState.deleteTransactions(ids);

	// Navigate to transactions view and filter by specified type of transaction
	await App.view.goToTransactions();
	await App.view.filterByType(type);
	// Request view to select and delete transactions
	await App.view.deleteTransactions(transactions);

	await App.goToMainView();

	App.state.setState(expectedState);
	App.view.expectedState = MainView.render(App.state);
	await test('Main page widgets update', () => App.view.checkState());
	await test('App state', () => App.state.fetchAndTest());
}


export async function delFromUpdate(type, pos)
{
	pos = parseInt(pos);
	if (isNaN(pos) || pos < 0)
		throw new Error('Position of transaction not specified');

	App.view.setBlock(`Delete ${Transaction.typeToStr(type)} from update view [${pos}]`, 2);

	let expectedState = App.state.clone();
	let ids = expectedState.transactions.filterByType(type).positionsToIds(pos);
	expectedState.deleteTransactions(ids);

	if (!(App.view instanceof TransactionsView))
	{
		if (!(App.view instanceof MainView))
			await App.goToMainView();
		await App.view.goToTransactions();
	}

	if (App.view.content.typeMenu.activeType != type)
		await App.view.filterByType(type);

	await App.view.goToUpdateTransaction(pos);

	await App.view.deleteSelfItem();

	await App.goToMainView();

	App.state.setState(expectedState);
	App.view.expectedState = MainView.render(App.state);
	await test('Main page widgets update', () => App.view.checkState());
	await test('App state', () => App.state.fetchAndTest());
}
