import { api } from '../../api.js';
import { Transaction } from '../../model/transaction.js';
import { TransactionsList } from '../../model/transactionslist.js';
import { ApiRequestError } from '../../apirequesterror.js'
import {
	test,
	setParam,
	formatDate,
	fixDate,
	checkObjValue,
	formatProps
} from '../../common.js';


export const runTransactionAPI =
{
	// Create transaction with specified params
	// (type, src_id, dest_id, src_amount, dest_amount, src_curr, dest_curr, date, comment)
	async createTest(params)
	{
		let transaction_id = 0;

		await test(`Create ${Transaction.typeToStr(params.type)} transaction`, async () =>
		{
			let expected = this.state.clone();
			let resExpected = expected.createTransaction(params);

			// Send API sequest to server
			let createRes;
			try
			{
				createRes = await api.transaction.create(params);
				if (resExpected && (!createRes || !createRes.id))
					return false;
			}
			catch(e)
			{
				if (!(e instanceof ApiRequestError) || resExpected)
					throw e;
			}

			transaction_id = (createRes) ? createRes.id : resExpected;

			await this.state.fetch();
			return this.state.meetExpectation(expected);
		}, this.environment);

		return transaction_id;
	},


	async createExpenseTest(params)
	{
		return this.run.api.transaction.createTest(this.run.transactions.expenseTransaction(params));
	},


	async createIncomeTest(params)
	{
		return this.run.api.transaction.createTest(this.run.transactions.incomeTransaction(params));
	},


	async createTransferTest(params)
	{
		return this.run.api.transaction.createTest(this.run.transactions.transferTransaction(params));
	},


	async createDebtTest(params)
	{
		return this.run.api.transaction.createTest(this.run.transactions.debtTransaction(params));
	},


	// Update transaction with specified params
	// (type, src_id, dest_id, src_amount, dest_amount, src_curr, dest_curr, date, comment)
	async updateTest(params)
	{
		let updateRes;

		await test('Update transaction', async () =>
		{
			let expected = this.state.clone();
			let resExpected = expected.updateTransaction(params);

			// Obtain data for API request
			let updParams = { date : this.dates.now, comment : '' };
			let expTrans = expected.transactions.getItem(params.id);

			if (expTrans)
				updParams = expected.transactionToRequest(expTrans);
			if (!resExpected)
				setParam(updParams, params);

			// Send API sequest to server
			try
			{
				updateRes = await api.transaction.update(updParams);
				if (resExpected != updateRes)
					return false;
			}
			catch(e)
			{
				if (!(e instanceof ApiRequestError) || resExpected)
					throw e;
			}

			await this.state.fetch();
			return this.state.meetExpectation(expected);
		}, this.environment);

		return updateRes;
	},


	// Delete specified transaction(s)
	// And check expected state of app
	async deleteTest(ids)
	{
		let deleteRes;

		await test('Delete transaction', async () =>
		{
			let expected = this.state.clone();
			let resExpected = expected.deleteTransactions(ids);

			// Send API sequest to server
			try
			{
				deleteRes = await api.transaction.del(ids);
				if (resExpected != deleteRes)
					return false;
			}
			catch(e)
			{
				if (!(e instanceof ApiRequestError) || resExpected)
					throw e;
			}

			await this.state.fetch();
			return this.state.meetExpectation(expected);
		}, this.environment);

		return deleteRes;
	},


	// Filter list of transaction by specified params
	async filterTest(params)
	{
		await test(`Filter transactions (${formatProps(params)})`, async () =>
		{
			let transactions = this.state.transactions.clone();
			let expTransList = transactions.filter(params);

			// Prepare request parameters
			let reqParams = {};

			if ('type' in params)
				reqParams.type = Transaction.typeToStr(params.type);
			if ('accounts' in params)
				reqParams.acc_id = params.accounts;
			if ('startDate' in params && 'endDate' in params)
			{
				reqParams.stdate = formatDate(new Date(fixDate(params.startDate)));
				reqParams.enddate = formatDate(new Date(fixDate(params.endDate)));
			}
			if ('search' in params)
				reqParams.search = params.search;
			if ('onPage' in params)
				reqParams.count = params.onPage;
			if ('page' in params)
				reqParams.page = params.page;

			// Send API sequest to server
			let trList = await api.transaction.list(reqParams);
			if (!trList)
				throw new Error('Fail to read list of transactions');

			return checkObjValue(trList, expTransList.data);
		}, this.environment);
	}
};

