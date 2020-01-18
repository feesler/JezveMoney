import { api } from '../../api.js';
import { TransactionsList } from '../../trlist.js';


let runTransactionAPI =
{
	async getExpectedTransaction(params)
	{
		let res = this.copyObject(params);

		let isDebt = (res.transtype == this.DEBT);
		if (isDebt)
		{
			let personObj = await api.person.read(res.person_id);
			if (!personObj)
				throw new Error('Person not found');

			if (!personObj.accounts)
				personObj.accounts = [];

			let reqCurr = (res.debtop == 1) ? res.src_curr : res.dest_curr;
			let personAcc = (personObj.accounts) ? personObj.accounts.find(item => item.curr_id == reqCurr) : null;

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


	// Create transaction with specified params
	// (transtype, src_id, dest_id, src_amount, dest_amount, src_curr, dest_curr, date, comm)
	async createTest(params)
	{
		let test = this.test;
		let env = this.environment;
		let scope = this.run.api.transaction;
		let transaction_id = 0;

		if (!params.date)
			params.date = this.formatDate(new Date());
		if (!params.comm)
			params.comm = '';

		await test('Create ' + this.getTransactionTypeStr(params.transtype) + ' transaction', async () =>
		{
			let trBefore = await api.transaction.list();
			if (!Array.isArray(trBefore))
				return false;

			// Prepare expected transaction object
			let expTrans = await scope.getExpectedTransaction(params);
			expTrans.pos = 0;

			// Prepare expected updates of accounts
			let accBefore = await api.account.list();
			let expAccountList = this.state.applyTransaction(accBefore, expTrans);

			// Send API sequest to server
			let createRes = await api.transaction.create(params);
			if (!createRes || !createRes.id)
				return false;

			expTrans.id = transaction_id = createRes.id;

			// Prepare expected updates of transactions
			let expTransList = new TransactionsList(this, trBefore);
			expTransList.create(expTrans);

			let trList = await api.transaction.list();
			let accList = await api.account.list();
			let transObj = trList.find(item => item.id == transaction_id);

			let res = this.checkObjValue(transObj, expTrans) &&
						this.checkObjValue(trList, expTransList.list) &&
						this.checkObjValue(accList, expAccountList);

			return res;
		}, env);

		return transaction_id;
	},


	async createExpenseTest(params)
	{
		return this.run.api.transaction.createTest(await api.transaction.expense(params));
	},


	async createIncomeTest(params)
	{
		return this.run.api.transaction.createTest(await api.transaction.income(params));
	},


	async createTransferTest(params)
	{
		return this.run.api.transaction.createTest(await api.transaction.transfer(params));
	},


	async createDebtTest(params)
	{
		return this.run.api.transaction.createTest(await api.transaction.debt(params));
	},


	// Update transaction with specified params
	// (transtype, src_id, dest_id, src_amount, dest_amount, src_curr, dest_curr, date, comm)
	async updateTest(params)
	{
		let test = this.test;
		let env = this.environment;
		let scope = this.run.api.transaction;
		let updateRes;

		let accBefore = await api.account.list();
		let trBefore = await api.transaction.list();
		let origTrans = trBefore.find(item => item.id == params.id);

		let updParams = this.copyObject(origTrans);

		updParams.transtype = updParams.type;
		delete updParams.type;

		let fullAccList = await api.account.list(true);

		let srcAcc = fullAccList.find(item => item.id == updParams.src_id);
		let destAcc = fullAccList.find(item => item.id == updParams.dest_id);

		let isDebt = (updParams.transtype == this.DEBT);
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

		this.setParam(updParams, params);

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

		await test('Update ' + this.getTransactionTypeStr(origTrans.type) + ' transaction', async () =>
		{
			// Prepare expected transaction object
			let expTrans = await scope.getExpectedTransaction(updParams);
			expTrans.pos = origTrans.pos;

			// Prepare expected updates of accounts
			let accCanceled = this.state.cancelTransaction(accBefore, origTrans);
			let expAccountList = this.state.applyTransaction(accCanceled, expTrans);

			// Send API sequest to server
			updateRes = await api.transaction.update(updParams);
			if (!updateRes)
				return false;

			// Prepare expected updates of transactions
			let expTransList = new TransactionsList(this, trBefore);

			expTransList.update(expTrans.id, expTrans);

			let trList = await api.transaction.list();
			let accList = await api.account.list();
			let transObj = trList.find(item => item.id == updParams.id);

			let res = this.checkObjValue(transObj, expTrans) &&
						this.checkObjValue(trList, expTransList.list) &&
						this.checkObjValue(accList, expAccountList);

			return res;
		}, env);

		return updateRes;
	},


	// Delete specified transaction(s)
	// And check expected state of app
	async deleteTest(ids)
	{
		let test = this.test;
		let env = this.environment;
		let deleteRes;

		await test('Delete transaction', async () =>
		{
			if (!Array.isArray(ids))
				ids = [ ids ];

			let trBefore = await api.transaction.list();
			let accBefore = await api.account.list();
			if (!Array.isArray(trBefore))
				return false;

			// Prepare expected updates of transactions list
			let expTransList = this.copyObject(trBefore);
			let expAccList = this.copyObject(accBefore);
			for(let tr_id of ids)
			{
				let trIndex = expTransList.findIndex(item => item.id == tr_id);
				if (trIndex !== -1)
					expTransList.splice(trIndex, 1);

				expAccList = this.state.cancelTransaction(expAccList, trBefore.find(item => item.id == tr_id));
			}

			// Send API sequest to server
			deleteRes = await api.transaction.del(ids);
			if (!deleteRes)
				throw new Error('Fail to delete account(s)');

			let accList = await api.account.list();
			let trList = await api.transaction.list();

			let res = this.checkObjValue(accList, expAccList) &&
						this.checkObjValue(trList, expTransList);

			return res;
		}, env);

		return deleteRes;
	},


	// Filter list of transaction by specified params
	async filterTest(params)
	{
		let test = this.test;
		let env = this.environment;

		await test('Filter transactions', async () =>
		{
			let trBefore = await api.transaction.list();
			let trListBefore = new TransactionsList(this, trBefore);
			let expTransList = trListBefore.filter(params);

			// Prepare request parameters
			let reqParams = {};

			if ('type' in params)
				reqParams.type = this.getTransactionTypeStr(params.type);
			if ('accounts' in params)
				reqParams.acc_id = params.accounts;
			if ('startDate' in params && 'endDate' in params)
			{
				reqParams.stdate = this.formatDate(new Date(this.fixDate(params.startDate)));
				reqParams.enddate = this.formatDate(new Date(this.fixDate(params.endDate)));
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

			let res = this.checkObjValue(trList, expTransList.list);

			return res;
		}, env);
	}
};


export { runTransactionAPI };

