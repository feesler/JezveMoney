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


	async getExpectedTransaction(params)
	{
		let res = copyObject(params);

		let isDebt = (res.type == DEBT);
		if (isDebt)
		{
			let reqCurr = (res.op == 1) ? res.src_curr : res.dest_curr;
			let personAcc = await this.state.getPersonAccount(res.person_id, reqCurr);

			if (res.op == 1)
			{
				if (personAcc)
					res.src_id = personAcc.id;
				res.dest_id = res.acc_id;
			}
			else
			{
				res.src_id = res.acc_id;
				if (personAcc)
					res.dest_id = personAcc.id;
			}

			delete res.op;
			delete res.person_id;
			delete res.acc_id;
		}

		return res;
	},


	async updateExpectedTransaction(expTrans, accList, params)
	{
		let isDebt = (params.type == DEBT);
		if (!isDebt)
			return { transaction : expTrans, accounts : accList };

		let res = {
			transaction : copyObject(expTrans),
			accounts : copyObject(accList)
		};

		let debtType = params.op == 1;

		if (params.acc_id)
		{
			let account = await this.state.getAccount(params.acc_id);
			if (!account)
				throw new Error('Account not found');

			if (debtType)
				res.transaction.dest_id = account.id;
			else
				res.transaction.src_id = account.id;
		}

		// Obtain newly created account of person
		if ((debtType && !res.transaction.src_id) ||
			(!debtType && !res.transaction.dest_id))
		{
			let pcurr_id = debtType ? res.transaction.src_curr : res.transaction.dest_curr;

			let personAccount = await this.state.getPersonAccount(params.person_id, pcurr_id);
			if (!personAccount)
				throw new Error('Person account not found');

			// Save id of person account into transaction
			if (debtType)
				res.transaction.src_id = personAccount.id;
			else
				res.transaction.dest_id = personAccount.id;

			// Check if account of person is not set yet
			// Cancel transaction from person account because accounts was
			let pAcc = res.accounts.find(item => item.id == personAccount.id)
			if (!pAcc)
			{
				personAccount.balance = 0;
				res.accounts.push(personAccount);
			}
		}

		return res;
	},


	// Create transaction with specified params
	// (type, src_id, dest_id, src_amount, dest_amount, src_curr, dest_curr, date, comment)
	async createTest(params)
	{
		let scope = this.run.api.transaction;
		let transaction_id = 0;
		let resExpected = false;

		if (!params.date)
			params.date = formatDate(new Date());
		if (!params.comment)
			params.comment = '';

		await test('Create ' + getTransactionTypeStr(params.type) + ' transaction', async () =>
		{
			let expTransList = await this.state.getTransactionsList();

			resExpected = await scope.checkCorrectness(params);

			// Prepare expected transaction object
			let expTrans = await scope.getExpectedTransaction(params);
			expTrans.pos = 0;

			// Prepare expected updates of accounts
			let accBefore = await this.state.getAccountsList();

			this.state.accounts = null;
			this.state.persons = null;
			this.state.transactions = null;

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

			let expAccountList;
			if (resExpected)
			{
				expTrans.id = transaction_id = createRes.id;

				// Prepare expected updates of accounts
				let updState = await scope.updateExpectedTransaction(expTrans, accBefore, params);
				expTrans = updState.transaction;
				expAccountList = this.state.createTransaction(updState.accounts, expTrans);

				// Prepare expected updates of transactions
				expTransList.create(expTrans);
			}
			else
			{
				expAccountList = accBefore;
			}

			this.state.accounts = null;
			this.state.persons = null;
			this.state.transactions = null;

			let trList = await this.state.getTransactionsList();
			let accList = await this.state.getAccountsList();

			expTransList = expTransList.updateResults(accList);

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
	// (type, src_id, dest_id, src_amount, dest_amount, src_curr, dest_curr, date, comment
	async updateTest(params)
	{
		let scope = this.run.api.transaction;
		let updateRes;
		let isDebt = false;
		let resExpected;

		let expTransList = await this.state.getTransactionsList();
		let origTrans = expTransList.list.find(item => item.id == params.id);

		let fullAccList = await this.state.getAccountsList();

		let updParams;
		if (origTrans)
		{
			updParams = copyObject(origTrans);

			isDebt = (updParams.type == DEBT);
			if (isDebt)
			{
				let srcAcc = fullAccList.find(item => item.id == updParams.src_id);
				let destAcc = fullAccList.find(item => item.id == updParams.dest_id);

				if (srcAcc && srcAcc.owner_id != this.owner_id)
				{
					updParams.op = 1;
					updParams.person_id = srcAcc.owner_id;
					updParams.acc_id = (destAcc) ? destAcc.id : 0;
				}
				else if (destAcc && destAcc.owner_id != this.owner_id)
				{
					updParams.op = 2;
					updParams.person_id = destAcc.owner_id;
					updParams.acc_id = (srcAcc) ? srcAcc.id : 0;
				}

				delete updParams.src_id;
				delete updParams.dest_id;
			}
		}
		else
		{
			updParams = { date : formatDate(new Date()), comment : '' };
		}

		setParam(updParams, params);

		// Synchronize currencies with accounts
		if (origTrans)
		{
			if (isDebt)
			{
				if (updParams.acc_id && updParams.acc_id != origTrans.acc_id)
				{
					let acc = fullAccList.find(item => item.id == updParams.acc_id);
					if (acc)
					{
						if (updParams.op == 1)
							updParams.dest_curr = acc.curr_id;
						else
							updParams.src_curr = acc.curr_id;
					}
				}
			}
			else
			{
				if (updParams.src_id && updParams.src_id != origTrans.src_id)
				{
					let acc = fullAccList.find(item => item.id == updParams.src_id);
					if (acc)
						updParams.src_curr = acc.curr_id;
				}

				if (updParams.dest_id && updParams.dest_id != origTrans.dest_id)
				{
					let acc = fullAccList.find(item => item.id == updParams.dest_id);
					if (acc)
						updParams.dest_curr = acc.curr_id;
				}
			}
		}

		let testDescr = '';
		if (origTrans)
			testDescr = 'Update ' + getTransactionTypeStr(origTrans.type) + ' transaction';
		else
			testDescr = 'Update transaction';

		await test(testDescr, async () =>
		{
			if (origTrans)
				resExpected = await scope.checkCorrectness(updParams);
			else
				resExpected = false;

			// Prepare expected transaction object
			let expTrans = await scope.getExpectedTransaction(updParams);
			if (origTrans)
				expTrans.pos = origTrans.pos;

			this.state.accounts = null;
			this.state.persons = null;
			this.state.transactions = null;

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
				let updState = await scope.updateExpectedTransaction(expTrans, fullAccList, updParams);
				expTrans = updState.transaction;
				fullAccList = updState.accounts;

				expAccountList = this.state.updateTransaction(fullAccList, origTrans, expTrans);

				// Prepare expected updates of transactions
				expTransList.update(expTrans.id, expTrans);
				expTransList = expTransList.updateResults(fullAccList);
			}
			else
			{
				expAccountList = fullAccList;
			}

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

			this.state.accounts = null;
			this.state.transactions = null;

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
