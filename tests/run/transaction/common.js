import { TransactionsView } from '../../view/transactions.js';
import { MainView } from '../../view/main.js';
import { TransactionsList } from '../../trlist.js';
import { api } from '../../api.js';
import {
	test,
	isObject,
	checkObjValue,
	formatProps,
	getTransactionTypeStr
} from '../../common.js';


let runTransactionsCommon =
{
	async iteratePages()
	{
		let res = { items : [], pages : [] };

		if (!(this.view instanceof TransactionsView) || !this.view.content.transList)
			throw new Error('Not expected view');

		if (!this.view.isFirstPage())
			await this.view.goToFirstPage();

		let pos = this.view.pagesCount() * this.config.transactionsOnPage;
		while(this.view.content.transList.items.length)
		{
			let pageItems = this.view.content.transList.items.map(item => {
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

			if (this.view.isLastPage())
				break;

			await this.view.goToNextPage();
		}

		return res;
	},


	// Check transactions data from API is the same as show on the transactions list page
	// Return instance of TransactionsList with current data
	async checkData(descr, expTransList, iterateView = false)
	{
		let scope = this.run.transactions;
		let transList, expected;

		// Save all transactions
		if (iterateView)
		{
			if (!(this.view instanceof TransactionsView))
			{
				if (!(this.view instanceof MainView))
					await this.goToMainView();
				await this.view.goToTransactions();
			}

			let transListPages = await scope.iteratePages();
			transList = transListPages.items;

			expected = await this.state.renderTransactionsList(expTransList.list);
		}
		else
		{
			transList = await this.state.getTransactionsList(true);
			expected = expTransList.list;
		}

		await test(descr, () => checkObjValue(transList, expected), this.environment);
	},


	async create(type, params, submitHandler)
	{
		let scope = this.run.transactions;

		this.view.setBlock('Create ' + getTransactionTypeStr(type) + ' (' + formatProps(params) + ')', 2);

		let accList = await this.state.getAccountsList();
		let pList = await this.state.getPersonsList();
		let expTransList = await this.state.getTransactionsList();

		// Navigate to create transaction page
		let accNum = ('fromAccount' in params) ? params.fromAccount : 0;
		await this.goToMainView();
		await this.view.goToNewTransactionByAccount(accNum);

		if (this.view.content.typeMenu.activeType != type)
			await this.view.changeTransactionType(type);

		// Input data and submit
		let expectedTransaction = await submitHandler.call(this, params);

		// Prepare data for next calculations
		let afterCreate = this.state.createTransaction(accList, expectedTransaction);
		expTransList.create(expectedTransaction);
		let expectedState = await this.state.render(afterCreate, pList, expTransList.list);

		await test('Main page widgets update', async () => {}, this.view, expectedState);

		this.accountTiles = this.view.content.widgets[this.config.AccountsWidgetPos].tiles.items;
		this.personTiles = this.view.content.widgets[this.config.PersonsWidgetPos].infoTiles.items;

		// Read updated list of transactions
		await scope.checkData('List of transactions update', expTransList);

		this.transactions = expTransList.list;
	},


	async update(type, params, submitHandler)
	{
		let view = this.view;
		let scope = this.run.transactions;

		if (!isObject(params))
			throw new Error('Parameters not specified');

		let pos = parseInt(params.pos);
		if (isNaN(pos) || pos < 0)
			throw new Error('Position of transaction not specified');
		delete params.pos;

		view.setBlock('Update ' + getTransactionTypeStr(type) + ' [' + pos + '] (' + formatProps(params) + ')', 2);

		let accList = await this.state.getAccountsList();
		let pList = await this.state.getPersonsList();
		let expTransList = await this.state.getTransactionsList();

		await this.goToMainView();
		await this.view.goToTransactions();

		if (this.view.content.typeMenu.activeType != type)
			await this.view.filterByType(type);

		await this.view.goToUpdateTransaction(pos);

		// Step
		let origTransaction = this.view.getExpectedTransaction();

		let canceled = this.state.cancelTransaction(accList, origTransaction);
		this.state.accounts = canceled;
		await this.view.parse();

		let expectedTransaction = await submitHandler.call(this, params);

		let afterUpdate = this.state.updateTransaction(accList, origTransaction, expectedTransaction);
		expTransList.update(origTransaction.id, expectedTransaction);
		let expectedState = await this.state.render(afterUpdate, pList, expTransList.list);

		await this.goToMainView();
		await test('Main page widgets update', async () => {}, this.view, expectedState);

		await scope.checkData('List of transactions update', expTransList);
	},


	async del(type, transactions)
	{
		let scope = this.run.transactions;

		this.view.setBlock('Delete transactions [' + transactions.join() + ']', 3);

		await this.goToMainView();

		// Save accounts and persons before delete transactions
		let accList = await this.state.getAccountsList();
		let pList = await this.state.getPersonsList();
		let expTransList = await this.state.getTransactionsList();

		// Navigate to transactions view and filter by specified type of transaction
		await this.view.goToTransactions();
		await this.view.filterByType(type);
		// Request view to select and delete transactions
		await this.view.deleteTransactions(transactions);

		this.state.accounts = null;
		this.state.persons = null;
		this.state.transactions = null;

		await this.goToMainView();

		// Prepare expected transaction list
		let removedTrans = expTransList.del(type, transactions);
		accList = this.state.deleteTransactions(accList, removedTrans);

		let expectedState = await this.state.render(accList, pList, expTransList.list);

		await test('Main page widgets update', async () => {}, this.view, expectedState);

		this.accountTiles = this.view.content.widgets[this.config.AccountsWidgetPos].tiles.items;
		this.personTiles = this.view.content.widgets[this.config.PersonsWidgetPos].infoTiles.items;

		await scope.checkData('List of transactions update', expTransList);

		this.transactions = expTransList.list;
	}
};


export { runTransactionsCommon };
