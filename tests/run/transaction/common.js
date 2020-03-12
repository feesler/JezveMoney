import { TransactionsView } from '../../view/transactions.js';
import { MainView } from '../../view/main.js';
import { TransactionsList } from '../../trlist.js';
import { api } from '../../api.js';
import {
	EXPENSE, INCOME, TRANSFER, DEBT,
	test,
	isObject,
	copyObject,
	checkObjValue,
	formatProps,
	getTransactionTypeStr
} from '../../common.js';


let runTransactionsCommon =
{
	async expenseTransaction(params)
	{
		if (!params.src_id)
			throw new Error('Source account not specified');

		let res = copyObject(params);

		res.type = EXPENSE;
		res.dest_id = 0;

		if (!res.dest_amount)
			res.dest_amount = res.src_amount;

		let acc = await this.state.getAccount(res.src_id);
		if (!acc)
			throw new Error('Account not found');
		res.src_curr = acc.curr_id;

		if (!res.dest_curr)
			res.dest_curr = res.src_curr;

		return res;
	},


	async incomeTransaction(params)
	{
		if (!params.dest_id)
			throw new Error('Destination account not specified');

		let res = copyObject(params);

		res.type = INCOME;
		res.src_id = 0;

		if (!res.src_amount)
			res.src_amount = res.dest_amount;

		let acc = await this.state.getAccount(res.dest_id);
		if (!acc)
			throw new Error('Account not found');
		res.dest_curr = acc.curr_id;

		if (!res.src_curr)
			res.src_curr = res.dest_curr;

		return res;
	},


	async transferTransaction(params)
	{
		if (!params.src_id)
			throw new Error('Source account not specified');
		if (!params.dest_id)
			throw new Error('Destination account not specified');

		let res = copyObject(params);

		res.type = TRANSFER;

		if (!res.dest_amount)
			res.dest_amount = res.src_amount;

		let srcAcc = await this.state.getAccount(res.src_id);
		if (!srcAcc)
			throw new Error('Account not found');
		res.src_curr = srcAcc.curr_id;

		let destAcc = await this.state.getAccount(res.dest_id);
		if (!destAcc)
			throw new Error('Account not found');
		res.dest_curr = destAcc.curr_id;

		if (!res.src_curr)
			res.src_curr = res.dest_curr;

		return res;
	},


	async debtTransaction(params)
	{
		if (!params.person_id)
			throw new Error('Person not specified');

		let res = copyObject(params);

		res.type = DEBT;

		if (!res.dest_amount)
			res.dest_amount = res.src_amount;

		let acc = await this.state.getAccount(res.acc_id);
		if (acc)
			res.src_curr = res.dest_curr = acc.curr_id;
		else
			res.src_curr = res.dest_curr = (res.src_curr || res.dest_curr);

		return res;
	},


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

		this.view.setBlock(`Create ${getTransactionTypeStr(type)} (${formatProps(params)})`, 2);

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

		let updState = await this.state.updatePersons(pList, afterCreate, expectedTransaction);
		pList = updState.persons;
		afterCreate = updState.accounts;

		expTransList = expTransList.updateResults(afterCreate);

		this.view.expectedState = await this.state.render(afterCreate, pList, expTransList.list);

		await test('Main page widgets update', () => {}, this.view);

		// Read updated list of transactions
		await scope.checkData('List of transactions update', expTransList);
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

		view.setBlock(`Update ${getTransactionTypeStr(type)} [${pos}] (${formatProps(params)})`, 2);

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

		await this.goToMainView();

		let afterUpdate = this.state.updateTransaction(accList, origTransaction, expectedTransaction);
		expTransList.update(origTransaction.id, expectedTransaction);

		let updState = await this.state.updatePersons(pList, afterUpdate, expectedTransaction, origTransaction);
		pList = updState.persons;
		afterUpdate = updState.accounts;
		expTransList = expTransList.updateResults(afterUpdate);

		this.view.expectedState = await this.state.render(afterUpdate, pList, expTransList.list);

		await test('Main page widgets update', () => {}, this.view);

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
		expTransList = expTransList.updateResults(accList);

		this.state.accounts = null;
		this.state.persons = null;
		this.state.transactions = null;

		let updState = await this.state.updatePersons(pList, accList);
		pList = updState.persons;
		accList = updState.accounts;

		this.view.expectedState = await this.state.render(accList, pList, expTransList.list);
		await test('Main page widgets update', async () => {}, this.view);

		await scope.checkData('List of transactions update', expTransList);
	},


	async delFromUpdate(type, pos)
	{
		let view = this.view;
		let scope = this.run.transactions;

		pos = parseInt(pos);
		if (isNaN(pos) || pos < 0)
			throw new Error('Position of transaction not specified');

		view.setBlock('Delete ' + getTransactionTypeStr(type) + ' from update view [' + pos + ']', 2);

		let accList = await this.state.getAccountsList();
		let pList = await this.state.getPersonsList();
		let expTransList = await this.state.getTransactionsList();

		if (!(this.view instanceof TransactionsView))
		{
			if (!(this.view instanceof MainView))
				await this.goToMainView();
			await this.view.goToTransactions();
		}

		if (this.view.content.typeMenu.activeType != type)
			await this.view.filterByType(type);

		await this.view.goToUpdateTransaction(pos);

		this.state.accounts = null;
		this.state.persons = null;
		this.state.transactions = null;

		await this.view.deleteSelfItem();

		// Prepare expected transaction list
		let removedTrans = expTransList.del(type, pos);
		accList = this.state.deleteTransactions(accList, removedTrans);
		expTransList = expTransList.updateResults(accList);

		await this.goToMainView();

		this.state.accounts = null;
		this.state.persons = null;
		this.state.transactions = null;

		let updState = await this.state.updatePersons(pList, accList);
		pList = updState.persons;
		accList = updState.accounts;

		this.view.expectedState = await this.state.render(accList, pList, expTransList.list);
		await test('Main page widgets update', async () => {}, this.view);

		await scope.checkData('List of transactions update', expTransList);
	}
};


export { runTransactionsCommon };
