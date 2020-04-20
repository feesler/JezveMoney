import { TransactionsView } from '../../view/transactions.js';
import { MainView } from '../../view/main.js';
import { EXPENSE, INCOME, TRANSFER, DEBT, Transaction } from '../../model/transaction.js';
import { AccountsList } from '../../model/accountslist.js';
import { App } from '../../app.js';
import {
	test,
	isObject,
	copyObject,
	checkObjValue,
	formatProps,
} from '../../common.js';



	export async function iteratePages()
	{
		let res = { items : [], pages : [] };

		if (!(App.view instanceof TransactionsView) || !App.view.content.transList)
			throw new Error('Not expected view');

		if (!App.view.isFirstPage())
			await App.view.goToFirstPage();

		let pos = App.view.pagesCount() * App.config.transactionsOnPage;
		while(App.view.content.transList.items.length)
		{
			let pageItems = App.view.content.transList.items.map(item => {
				return {
					id : item.id,
					accountTitle : item.accountTitle,
					amountText : item.amountText,
					dateFmt : item.dateFmt,
					comment : item.comment,
					pos : pos--
				}
			});

			res.pages.push(pageItems);
			res.items.push(...pageItems);

			if (App.view.isLastPage())
				break;

			await App.view.goToNextPage();
		}

		return res;
	}


	// Check transactions data from API is the same as show on the transactions list page
	// Return instance of TransactionsList with current data
	export async function checkData(descr, expTransList, iterateView = false)
	{
		let transList, expected;

		// Save all transactions
		if (iterateView)
		{
			if (!(App.view instanceof TransactionsView))
			{
				if (!(App.view instanceof MainView))
					await App.goToMainView();
				await App.view.goToTransactions();
			}

			let transListPages = await iteratePages();
			transList = transListPages.items;

			expected = App.state.renderTransactionsList(expTransList.data);
		}
		else
		{
			expected = copyObject(expTransList.data);
			await App.state.fetch();
			transList = App.state.transactions.data;
		}

		await test(descr, () => checkObjValue(transList, expected), App.environment);
	}


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

		App.view.expectedState = App.state.render();

		await test('Main page widgets update', () => {}, App.view);

		await App.state.fetchAndTest();
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
		origTransaction = App.state.getExpectedTransaction(origTransaction);
		let originalAccounts = copyObject(App.state.accounts.data);
		let canceled = AccountsList.cancelTransaction(originalAccounts, origTransaction);
		App.state.accounts.data = canceled;
		await App.view.parse();

		let expectedTransaction = await submitHandler(params);

		await App.goToMainView();

		App.state.accounts.data = originalAccounts;
		App.state.updateTransaction(expectedTransaction);

		App.view.expectedState = App.state.render();

		await test('Main page widgets update', () => {}, App.view);

		await App.state.fetchAndTest();
	}


	export async function del(type, transactions)
	{
		App.view.setBlock('Delete transactions [' + transactions.join() + ']', 3);

		await App.goToMainView();

		let ids = App.state.transactions.filterByType(type).positionsToIds(transactions);
		App.state.deleteTransactions(ids);

		// Navigate to transactions view and filter by specified type of transaction
		await App.view.goToTransactions();
		await App.view.filterByType(type);
		// Request view to select and delete transactions
		await App.view.deleteTransactions(transactions);

		await App.goToMainView();

		App.view.expectedState = App.state.render();
		await test('Main page widgets update', async () => {}, App.view);

		await App.state.fetchAndTest();
	}


	export async function delFromUpdate(type, pos)
	{
		pos = parseInt(pos);
		if (isNaN(pos) || pos < 0)
			throw new Error('Position of transaction not specified');

		App.view.setBlock(`Delete ${Transaction.typeToStr(type)} from update view [${pos}]`, 2);

		let ids = App.state.transactions.filterByType(type).positionsToIds(pos);
		App.state.deleteTransactions(ids);

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

		App.view.expectedState = App.state.render();
		await test('Main page widgets update', () => {}, App.view);

		await App.state.fetchAndTest();
	}
