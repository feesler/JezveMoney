import { TransactionsView } from '../../view/transactions.js';
import { MainView } from '../../view/main.js';
import { EXPENSE, INCOME, TRANSFER, DEBT, Transaction } from '../../model/transaction.js';
import { TransactionsList } from '../../model/transactionslist.js';
import { AccountsList } from '../../model/accountslist.js';
import { api } from '../../api.js';
import {
	test,
	isObject,
	copyObject,
	checkObjValue,
	formatProps,
} from '../../common.js';


export const runTransactionsCommon =
{
	expenseTransaction(params)
	{
		if (!params.src_id)
			throw new Error('Source account not specified');

		let res = copyObject(params);

		res.type = EXPENSE;
		res.dest_id = 0;

		if (!res.dest_amount)
			res.dest_amount = res.src_amount;

		let acc = this.state.accounts.getItem(res.src_id);
		if (!acc)
			throw new Error('Account not found');
		res.src_curr = acc.curr_id;

		if (!res.dest_curr)
			res.dest_curr = res.src_curr;

		return res;
	},


	incomeTransaction(params)
	{
		if (!params.dest_id)
			throw new Error('Destination account not specified');

		let res = copyObject(params);

		res.type = INCOME;
		res.src_id = 0;

		if (!res.src_amount)
			res.src_amount = res.dest_amount;

		let acc = this.state.accounts.getItem(res.dest_id);
		if (!acc)
			throw new Error('Account not found');
		res.dest_curr = acc.curr_id;

		if (!res.src_curr)
			res.src_curr = res.dest_curr;

		return res;
	},


	transferTransaction(params)
	{
		if (!params.src_id)
			throw new Error('Source account not specified');
		if (!params.dest_id)
			throw new Error('Destination account not specified');

		let res = copyObject(params);

		res.type = TRANSFER;

		if (!res.dest_amount)
			res.dest_amount = res.src_amount;

		let srcAcc = this.state.accounts.getItem(res.src_id);
		if (!srcAcc)
			throw new Error('Account not found');
		res.src_curr = srcAcc.curr_id;

		let destAcc = this.state.accounts.getItem(res.dest_id);
		if (!destAcc)
			throw new Error('Account not found');
		res.dest_curr = destAcc.curr_id;

		if (!res.src_curr)
			res.src_curr = res.dest_curr;

		return res;
	},


	debtTransaction(params)
	{
		if (!params.person_id)
			throw new Error('Person not specified');

		let res = copyObject(params);

		res.type = DEBT;

		if (!res.dest_amount)
			res.dest_amount = res.src_amount;

		let acc = this.state.accounts.getItem(res.acc_id);
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

			expected = this.state.renderTransactionsList(expTransList.data);
		}
		else
		{
			expected = copyObject(expTransList.data);
			await this.state.fetch();
			transList = this.state.transactions.data;
		}

		await test(descr, () => checkObjValue(transList, expected), this.environment);
	},


	async create(type, params, submitHandler)
	{
		let scope = this.run.transactions;

		this.view.setBlock(`Create ${Transaction.typeToStr(type)} (${formatProps(params)})`, 2);

		await this.state.fetch();

		// Navigate to create transaction page
		let accNum = ('fromAccount' in params) ? params.fromAccount : 0;
		await this.goToMainView();
		await this.view.goToNewTransactionByAccount(accNum);

		if (this.view.content.typeMenu.activeType != type)
			await this.view.changeTransactionType(type);

		// Input data and submit
		let expectedTransaction = await submitHandler.call(this, params);

		this.state.createTransaction(expectedTransaction);

		this.view.expectedState = this.state.render();

		await test('Main page widgets update', () => {}, this.view);

		// Read updated list of transactions
		await scope.checkData('List of transactions update', this.state.transactions);
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

		view.setBlock(`Update ${Transaction.typeToStr(type)} [${pos}] (${formatProps(params)})`, 2);

		await this.state.fetch();

		await this.goToMainView();
		await this.view.goToTransactions();

		if (this.view.content.typeMenu.activeType != type)
			await this.view.filterByType(type);

		await this.view.goToUpdateTransaction(pos);

		// Step
		let origTransaction = this.view.getExpectedTransaction();
		origTransaction = this.state.getExpectedTransaction(origTransaction);
		let originalAccounts = copyObject(this.state.accounts.data);
		let canceled = AccountsList.cancelTransaction(originalAccounts, origTransaction);
		this.state.accounts.data = canceled;
		await this.view.parse();

		let expectedTransaction = await submitHandler.call(this, params);

		await this.goToMainView();

		this.state.accounts.data = originalAccounts;
		this.state.updateTransaction(expectedTransaction);

		this.view.expectedState = this.state.render();

		await test('Main page widgets update', () => {}, this.view);

		await scope.checkData('List of transactions update', this.state.transactions);
	},


	async del(type, transactions)
	{
		let scope = this.run.transactions;

		this.view.setBlock('Delete transactions [' + transactions.join() + ']', 3);

		await this.goToMainView();

		await this.state.fetch();
		let ids = this.state.transactions.filterByType(type).positionsToIds(transactions);
		this.state.deleteTransactions(ids);

		// Navigate to transactions view and filter by specified type of transaction
		await this.view.goToTransactions();
		await this.view.filterByType(type);
		// Request view to select and delete transactions
		await this.view.deleteTransactions(transactions);

		await this.goToMainView();

		this.view.expectedState = this.state.render();
		await test('Main page widgets update', async () => {}, this.view);

		await scope.checkData('List of transactions update', this.state.transactions);
	},


	async delFromUpdate(type, pos)
	{
		let view = this.view;
		let scope = this.run.transactions;

		pos = parseInt(pos);
		if (isNaN(pos) || pos < 0)
			throw new Error('Position of transaction not specified');

		view.setBlock(`Delete ${Transaction.typeToStr(type)} from update view [${pos}]`, 2);

		await this.state.fetch();
		let ids = this.state.transactions.filterByType(type).positionsToIds(pos);
		this.state.deleteTransactions(ids);

		if (!(this.view instanceof TransactionsView))
		{
			if (!(this.view instanceof MainView))
				await this.goToMainView();
			await this.view.goToTransactions();
		}

		if (this.view.content.typeMenu.activeType != type)
			await this.view.filterByType(type);

		await this.view.goToUpdateTransaction(pos);

		await this.view.deleteSelfItem();

		await this.goToMainView();

		this.view.expectedState = this.state.render();
		await test('Main page widgets update', () => {}, this.view);

		await scope.checkData('List of transactions update', this.state.transactions);
	}
};

