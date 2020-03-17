import { api } from '../../api.js';
import { TransactionsList } from '../../trlist.js';
import { ApiRequestError } from '../../apirequesterror.js'
import {
	EXPENSE,
	INCOME,
	TRANSFER,
	DEBT,
	availTransTypes,
	isObject,
	test,
	copyObject,
	setParam,
	formatDate,
	fixDate,
	checkObjValue,
	formatProps,
	getTransactionTypeStr
} from '../../common.js';


let runTransactionAPI =
{
	async checkCorrectness(params)
	{
		if (!isObject(params))
			return false;

		if (!availTransTypes.includes(params.type))
			return false;

		if (params.type == DEBT)
		{
			if (!params.person_id)
				return false;

			let person = await this.state.getPerson(params.person_id);
			if (!person)
				return false;

			if (params.acc_id)
			{
				let account = await this.state.getAccount(params.acc_id);
				if (!account)
					return false;
			}
		}
		else
		{
			if (params.src_id)
			{
				if (params.type == INCOME)
					return false;

				let account = await this.state.getAccount(params.src_id);
				if (!account)
					return false;
			}

			if (params.dest_id)
			{
				if (params.type == EXPENSE)
					return false;

				let account = await this.state.getAccount(params.dest_id);
				if (!account)
					return false;
			}
		}

		return true;
	},


	async getExpectedTransaction(params, accList)
	{
		if (!params.date)
			params.date = this.dates.now;
		if (!params.comment)
			params.comment = '';

		let res = {
			transaction : copyObject(params),
			accounts : copyObject(accList)
		};

		if (params.type != DEBT)
			return res;

		let reqCurr = (res.transaction.op == 1) ? res.transaction.src_curr : res.transaction.dest_curr;
		let personAcc = await this.state.getExpectedPersonAccount(res.transaction.person_id, reqCurr);
		if (!personAcc)
			throw new Error('Fail to obtain expected account of person');

		// Save new account of person
		if (!res.accounts.find(item => item.id == personAcc.id))
		{
			res.accounts.push(personAcc);
		}

		if (res.transaction.op == 1)
		{
			res.transaction.src_id = personAcc.id;
			res.transaction.dest_id = res.transaction.acc_id;
		}
		else
		{
			res.transaction.src_id = res.transaction.acc_id;
			res.transaction.dest_id = personAcc.id;
		}

		// Different currencies not supported yet for debts
		res.transaction.src_curr = res.transaction.dest_curr = reqCurr;

		delete res.transaction.op;
		delete res.transaction.person_id;
		delete res.transaction.acc_id;

		return res;
	},


	// Convert real transaction object to request
	// Currently only DEBT affected:
	//  (person_id, acc_id, op) parameters are used instead of (src_id, dest_id)
	transactionToRequest(transaction, accList)
	{
		if (!transaction)
			return transaction;

		let res = copyObject(transaction);
		if (transaction.type != DEBT)
			return res;

		let srcAcc = accList.find(item => item.id == transaction.src_id);
		let destAcc = accList.find(item => item.id == transaction.dest_id);
		if (srcAcc && srcAcc.owner_id != this.owner_id)
		{
			res.op = 1;
			res.person_id = srcAcc.owner_id;
			res.acc_id = (destAcc) ? destAcc.id : 0;
		}
		else if (destAcc && destAcc.owner_id != this.owner_id)
		{
			res.op = 2;
			res.person_id = destAcc.owner_id;
			res.acc_id = (srcAcc) ? srcAcc.id : 0;
		}
		else
			throw new Error('Invalid transaction');

		delete res.src_id;
		delete res.dest_id;

		return res;
	},


	// Create transaction with specified params
	// (type, src_id, dest_id, src_amount, dest_amount, src_curr, dest_curr, date, comment)
	async createTest(params)
	{
		let scope = this.run.api.transaction;
		let transaction_id = 0;

		await test('Create ' + getTransactionTypeStr(params.type) + ' transaction', async () =>
		{
			let expTransList = await this.state.getTransactionsList();
			let accBefore = await this.state.getAccountsList();
			let resExpected = await scope.checkCorrectness(params);

			// Prepare expected transaction object
			let updState = await scope.getExpectedTransaction(params, accBefore);
			let expTrans = updState.transaction;
			expTrans.pos = 0;

			let expAccountList = updState.accounts;

			this.state.cleanCache();

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

			if (resExpected)
			{
				let latest = this.state.getLatestId(expTransList.list);
				transaction_id = expTrans.id = (latest > 0) ? (latest + 1) : createRes.id;

				// Prepare expected updates of accounts
				expAccountList = this.state.createTransaction(expAccountList, expTrans);

				// Prepare expected updates of transactions
				expTransList.create(expTrans);
				expTransList = expTransList.updateResults(expAccountList);
			}
			else
			{
				expAccountList = accBefore;
			}

			this.state.cleanCache();

			let trList = await this.state.getTransactionsList();
			let accList = await this.state.getAccountsList();

			let res = checkObjValue(trList.list, expTransList.list) &&
						checkObjValue(accList, expAccountList);

			return res;
		}, this.environment);

		return transaction_id;
	},


	async createExpenseTest(params)
	{
		return this.run.api.transaction.createTest(await this.run.transactions.expenseTransaction(params));
	},


	async createIncomeTest(params)
	{
		return this.run.api.transaction.createTest(await this.run.transactions.incomeTransaction(params));
	},


	async createTransferTest(params)
	{
		return this.run.api.transaction.createTest(await this.run.transactions.transferTransaction(params));
	},


	async createDebtTest(params)
	{
		return this.run.api.transaction.createTest(await this.run.transactions.debtTransaction(params));
	},


	// Update transaction with specified params
	// (type, src_id, dest_id, src_amount, dest_amount, src_curr, dest_curr, date, comment)
	async updateTest(params)
	{
		let scope = this.run.api.transaction;
		let updateRes;

		let expTransList = await this.state.getTransactionsList();
		let origTrans = expTransList.list.find(item => item.id == params.id);
		let fullAccList = await this.state.getAccountsList();

		let updParams = { date : this.dates.now, comment : '' };
		if (origTrans)
			updParams = scope.transactionToRequest(origTrans, fullAccList);

		setParam(updParams, params);

		let testDescr = 'Update transaction';
		if (origTrans)
			testDescr = 'Update ' + getTransactionTypeStr(origTrans.type) + ' transaction';

		await test(testDescr, async () =>
		{
			let resExpected = false;
			if (origTrans)
				resExpected = await scope.checkCorrectness(updParams);

			// Prepare expected transaction object
			let expTrans;
			if (resExpected)
			{
				let updState = await scope.getExpectedTransaction(updParams, fullAccList);
				expTrans = updState.transaction;
				fullAccList = updState.accounts;
				if (origTrans)
					expTrans.pos = origTrans.pos;
			}

			this.state.cleanCache();

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

			let expAccountList;
			if (resExpected)
			{
				// Prepare expected updates of accounts
				expAccountList = this.state.updateTransaction(fullAccList, origTrans, expTrans);

				// Prepare expected updates of transactions
				expTransList.update(expTrans.id, expTrans);
				expTransList = expTransList.updateResults(expAccountList);
			}
			else
			{
				expAccountList = fullAccList;
			}

			this.state.cleanCache();

			let trList = await this.state.getTransactionsList();
			let accList = await this.state.getAccountsList();

			let res = checkObjValue(trList.list, expTransList.list) &&
						checkObjValue(accList, expAccountList);

			return res;
		}, this.environment);

		return updateRes;
	},


	// Delete specified transaction(s)
	// And check expected state of app
	async deleteTest(ids)
	{
		let deleteRes;
		let resExpected = true;

		await test('Delete transaction', async () =>
		{
			if (!Array.isArray(ids))
				ids = [ ids ];

			let trBefore = await this.state.getTransactionsList();
			let accBefore = await this.state.getAccountsList();

			for(let transaction_id of ids)
			{
				if (trBefore.findItem(transaction_id) === -1)
				{
					resExpected = false;
					break;
				}
			}

			// Prepare expected updates of transactions list
			let expAccList, expTransList;
			if (resExpected)
			{
				expAccList = this.state.deleteTransactions(accBefore, ids.map(id => trBefore.list.find(item => item.id == id)));
				expTransList = trBefore.deleteItems(ids)
										.updateResults(accBefore);
			}
			else
			{
				expAccList = accBefore;
				expTransList = trBefore;
			}

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

			this.state.cleanCache();

			let accList = await this.state.getAccountsList();
			let trList = await this.state.getTransactionsList();

			let res = checkObjValue(accList, expAccList) &&
						checkObjValue(trList.list, expTransList.list);

			return res;
		}, this.environment);

		return deleteRes;
	},


	// Filter list of transaction by specified params
	async filterTest(params)
	{
		await test(`Filter transactions (${formatProps(params)})`, async () =>
		{
			let trBefore = await this.state.getTransactionsList();
			let expTransList = trBefore.filter(params);

			// Prepare request parameters
			let reqParams = {};

			if ('type' in params)
				reqParams.type = getTransactionTypeStr(params.type);
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

			let res = checkObjValue(trList, expTransList.list);

			return res;
		}, this.environment);
	}
};


export { runTransactionAPI };
