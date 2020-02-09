import { api } from '../../api.js';
import { TransactionsList } from '../../trlist.js';
import {
	DEBT,
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
	async getExpectedTransaction(params)
	{
		let res = copyObject(params);

		let isDebt = (res.transtype == DEBT);
		if (isDebt)
		{
			let reqCurr = (res.debtop == 1) ? res.src_curr : res.dest_curr;
			let personAcc = await this.state.getPersonAccount(res.person_id, reqCurr);

			if (res.debtop == 1)
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

			delete res.debtop;
			delete res.person_id;
			delete res.acc_id;
		}

		res.type = res.transtype;
		delete res.transtype;

		res.comment = res.comm;
		delete res.comm;

		return res;
	},


	async updateExpectedTransaction(expTrans, accList, params)
	{
		let isDebt = (params.transtype == DEBT);
		if (!isDebt)
			return { transaction : expTrans, accounts : accList };

		let res = {
			transaction : copyObject(expTrans),
			accounts : copyObject(accList)
		};

		let debtType = params.debtop == 1;

		// Obtain newly created account of person
		if ((debtType && !res.transaction.src_id) ||
			(!debtType && !res.transaction.dest_id))
		{
			let pcurr_id = debtType ? res.transaction.src_curr : res.transaction.dest_curr;

			let personAccount = await this.state.getPersonAccount(params.person_id, pcurr_id);
			if (!personAccount)
				throw new Error('Person account not found');

			if (debtType)
				res.transaction.src_id = personAccount.id;
			else
				res.transaction.dest_id = personAccount.id;

			res.accounts.push(personAccount);
		}

		return res;
	},


	// Create transaction with specified params
	// (transtype, src_id, dest_id, src_amount, dest_amount, src_curr, dest_curr, date, comm)
	async createTest(params)
	{
		let scope = this.run.api.transaction;
		let transaction_id = 0;

		if (!params.date)
			params.date = formatDate(new Date());
		if (!params.comm)
			params.comm = '';

		await test('Create ' + getTransactionTypeStr(params.transtype) + ' transaction', async () =>
		{
			let expTransList = await this.state.getTransactionsList();

			// Prepare expected transaction object
			let expTrans = await scope.getExpectedTransaction(params);
			expTrans.pos = 0;

			// Prepare expected updates of accounts
			let accBefore = await this.state.getAccountsList();

			this.state.accounts = null;
			this.state.transactions = null;

			// Send API sequest to server
			let createRes = await api.transaction.create(params);
			if (!createRes || !createRes.id)
				return false;

			expTrans.id = transaction_id = createRes.id;

			// Prepare expected updates of accounts
			let updState = await scope.updateExpectedTransaction(expTrans, accBefore, params);
			expTrans = updState.transaction;
			accBefore = updState.accounts;

			let expAccountList = this.state.createTransaction(accBefore, expTrans);

			// Prepare expected updates of transactions
			expTransList.create(expTrans);

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
	// (transtype, src_id, dest_id, src_amount, dest_amount, src_curr, dest_curr, date, comm)
	async updateTest(params)
	{
		let scope = this.run.api.transaction;
		let updateRes;

		let expTransList = await this.state.getTransactionsList();
		let origTrans = expTransList.list.find(item => item.id == params.id);

		let updParams = copyObject(origTrans);

		updParams.transtype = updParams.type;
		delete updParams.type;

		let fullAccList = await this.state.getAccountsList();

		let srcAcc = fullAccList.find(item => item.id == updParams.src_id);
		let destAcc = fullAccList.find(item => item.id == updParams.dest_id);

		let isDebt = (updParams.transtype == DEBT);
		if (isDebt)
		{
			if (srcAcc && srcAcc.owner_id != this.user_id)
			{
				updParams.debtop = 1;
				updParams.person_id = srcAcc.owner_id;
				updParams.acc_id = (destAcc) ? destAcc.id : 0;
			}
			else if (destAcc && destAcc.owner_id != this.user_id)
			{
				updParams.debtop = 2;
				updParams.person_id = destAcc.owner_id;
				updParams.acc_id = (srcAcc) ? srcAcc.id : 0;
			}

			delete updParams.src_id;
			delete updParams.dest_id;
		}

		updParams.comm = updParams.comment;
		delete updParams.comment;

		setParam(updParams, params);

		// Synchronize currencies with accounts
		if (isDebt)
		{
			if (updParams.acc_id && updParams.acc_id != origTrans.acc_id)
			{
				let acc = fullAccList.find(item => item.id == updParams.acc_id);
				if (updParams.debtop == 1)
					updParams.dest_curr = acc.curr_id;
				else
					updParams.src_curr = acc.curr_id;
			}
		}
		else
		{
			if (updParams.src_id && updParams.src_id != origTrans.src_id)
			{
				let acc = fullAccList.find(item => item.id == updParams.src_id);
				updParams.src_curr = acc.curr_id;
			}

			if (updParams.dest_id && updParams.dest_id != origTrans.dest_id)
			{
				let acc = fullAccList.find(item => item.id == updParams.dest_id);
				updParams.dest_curr = acc.curr_id;
			}
		}

		await test('Update ' + getTransactionTypeStr(origTrans.type) + ' transaction', async () =>
		{
			// Prepare expected transaction object
			let expTrans = await scope.getExpectedTransaction(updParams);
			expTrans.pos = origTrans.pos;

			this.state.accounts = null;
			this.state.transactions = null;

			// Send API sequest to server
			updateRes = await api.transaction.update(updParams);
			if (!updateRes)
				return false;

			// Prepare expected updates of accounts
			let updState = await scope.updateExpectedTransaction(expTrans, fullAccList, updParams);
			expTrans = updState.transaction;
			fullAccList = updState.accounts;

			let expAccountList = this.state.updateTransaction(fullAccList, origTrans, expTrans);

			// Prepare expected updates of transactions
			expTransList.update(expTrans.id, expTrans);

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

		await test('Delete transaction', async () =>
		{
			if (!Array.isArray(ids))
				ids = [ ids ];

			let trBefore = await this.state.getTransactionsList();
			let accBefore = await this.state.getAccountsList();

			// Prepare expected updates of transactions list
			let expAccList = this.state.deleteTransactions(accBefore, ids.map(id => trBefore.list.find(item => item.id == id)));
			let expTransList = trBefore.deleteItems(ids);

			this.state.accounts = null;
			this.state.transactions = null;

			// Send API sequest to server
			deleteRes = await api.transaction.del(ids);
			if (!deleteRes)
				throw new Error('Fail to delete account(s)');

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
