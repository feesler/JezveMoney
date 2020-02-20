import { api } from '../../api.js';
import { test, copyObject, setParam, checkObjValue } from '../../common.js';


let runAccountAPI =
{
	/**
	 * Account tests
	 */

	// Create account with specified params (name, currency, balance, icon)
	// And check expected state of app
	async createTest(params)
	{
		let acc_id = 0;

		await test('Create account', async () =>
		{
			let accBefore = await this.state.getAccountsList();
			if (!Array.isArray(accBefore))
				return false;

			let expAccObj = copyObject(params);
			expAccObj.curr_id = params.currency;
			delete expAccObj.currency;

			this.state.accounts = null;

			let createRes = await api.account.create(params);
			if (!createRes || !createRes.id)
				return false;

			acc_id = createRes.id;

			let accList = await this.state.getAccountsList();
			if (!Array.isArray(accList))
				return false;

			if (accList.length != accBefore.length + 1)
				throw new Error('Length of accounts list must increase');

			if (accBefore.find(item => item.id == acc_id))
				throw new Error('Already exist account returned');

			let accObj = accList.find(item => item.id == acc_id);

			return checkObjValue(accObj, expAccObj);
		}, this.environment);

		return acc_id;
	},


	// Update account with specified params (name, currency, balance, icon)
	// And check expected state of app
	async updateTest(id, params)
	{
		let updateRes;

		await test('Update account', async () =>
		{
			let trBefore = await this.state.getTransactionsList();
			let accBefore = await this.state.getAccountsList();

			let origAccInd = accBefore.findIndex(item => item.id == id);
			let origAcc = accBefore[origAccInd];

			let updParams = copyObject(origAcc);
			updParams.currency = ('currency' in params) ? params.currency : updParams.curr_id;
			delete updParams.curr_id;

			// Prepare expected account object
			let expAccObj = copyObject(origAcc);
			expAccObj.curr_id = updParams.currency;

			let balDiff = expAccObj.balance - origAcc.initbalance;
			if (balDiff.toFixed(2) != 0)
			{
				expAccObj.initbalance = expAccObj.balance;
				expAccObj.balance = origAcc.balance + balDiff;
			}

			// Prepare expected updates of accounts list
			let expAccList = copyObject(accBefore);
			expAccList.splice(origAccInd, 1, expAccObj);

			// Prepare expected updates of transactions list
			let expTransList = trBefore.updateAccount(accBefore, expAccObj);
			expTransList = expTransList.updateResults(expAccList);

			this.state.accounts = null;
			this.state.transactions = null;

			// Send API sequest to server
			updateRes = await api.account.update(id, updParams);
			if (!updateRes)
				throw new Error('Fail to update account');

			let accList = await this.state.getAccountsList();
			let trList = await this.state.getTransactionsList();

			let res = checkObjValue(accList, expAccList) &&
						checkObjValue(trList.list, expTransList.list);
			return res;
		}, this.environment);

		return updateRes;
	},


	// Delete specified account(s)
	// And check expected state of app
	async deleteTest(ids)
	{
		let deleteRes;

		await test('Delete account', async () =>
		{
			if (!Array.isArray(ids))
				ids = [ ids ];

			let accBefore = await this.state.getAccountsList();
			if (!Array.isArray(accBefore))
				return false;

			// Prepare expected updates of accounts list
			let expAccList = this.state.deleteByIds(accBefore, ids);

			// Prepare expected updates of transactions
			let trBefore = await this.state.getTransactionsList();
			let expTransList = trBefore.deleteAccounts(accBefore, ids);
			expTransList = expTransList.updateResults(expAccList);

			this.state.accounts = null;
			this.state.transactions = null;

			// Send API sequest to server
			deleteRes = await api.account.del(ids);
			if (!deleteRes)
				throw new Error('Fail to delete account(s)');

			let accList = await this.state.getAccountsList();
			let trList = await this.state.getTransactionsList();

			let res = checkObjValue(accList, expAccList) &&
						checkObjValue(trList.list, expTransList.list);

			return res;
		}, this.environment);

		return deleteRes;
	}
};


export { runAccountAPI };
