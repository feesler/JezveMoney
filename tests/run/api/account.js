import { api } from '../../api.js';


let runAccountAPI =
{
	/**
	 * Account tests
	 */

	// Create account with specified params (name, currency, balance, icon)
	// And check expected state of app
	async createTest(params)
	{
		let env = this.environment;
		let test = this.test;
		let acc_id = 0;

		await test('Create account', async () =>
		{
			let accBefore = await this.state.getAccountsList();
			if (!Array.isArray(accBefore))
				return false;

			let expAccObj = this.copyObject(params);
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

			return this.checkObjValue(accObj, expAccObj);
		}, env);

		return acc_id;
	},


	// Update account with specified params (name, currency, balance, icon)
	// And check expected state of app
	async updateTest(id, params)
	{
		let env = this.environment;
		let test = this.test;
		let updateRes;

		let accList = await api.account.read(id);
		let updParams = accList[0];

		updParams.currency = updParams.curr;
		delete updParams.curr;

		this.setParam(updParams, params);

		await test('Update account', async () =>
		{
			let trBefore = await this.state.getTransactionsList();

			let accBefore = await this.state.getAccountsList();
			if (!Array.isArray(accBefore))
				return false;
			let origAcc = accBefore.find(item => item.id == updParams.id);

			// Prepare expected account object
			let expAccObj = this.copyObject(updParams);
			expAccObj.id = id;
			expAccObj.owner_id = expAccObj.owner;
			expAccObj.curr_id = expAccObj.currency;
			delete expAccObj.currency;
			delete expAccObj.owner;
			delete expAccObj.sign;
			delete expAccObj.iconclass;

			let balDiff = expAccObj.balance - origAcc.initbalance;
			if (balDiff.toFixed(2) != 0)
			{
				expAccObj.balance = origAcc.balance + balDiff;
				expAccObj.initbalance = expAccObj.balance;
			}

			// Prepare expected updates of accounts list
			let expAccList = this.copyObject(accBefore);
			let accIndex = expAccList.findIndex(item => item.id == expAccObj.id);
			if (accIndex !== -1)
				expAccList.splice(accIndex, 1, expAccObj);

			// Prepare expected updates of transactions list
			let expTransList = this.state.updateAccount(trBefore, accBefore, expAccObj);

			this.state.accounts = null;
			this.state.transactions = null;

			// Send API sequest to server
			updateRes = await api.account.update(id, updParams);
			if (!updateRes)
				throw new Error('Fail to update account');

			let accList = await this.state.getAccountsList();
			let trList = await this.state.getTransactionsList();

			let res = this.checkObjValue(accList, expAccList) &&
						this.checkObjValue(trList, expTransList);
			return res;
		}, env);

		return updateRes;
	},


	// Delete specified account(s)
	// And check expected state of app
	async deleteTest(ids)
	{
		let env = this.environment;
		let test = this.test;
		let deleteRes;

		await test('Delete account', async () =>
		{
			if (!Array.isArray(ids))
				ids = [ ids ];

			let accBefore = await this.state.getAccountsList();
			if (!Array.isArray(accBefore))
				return false;

			// Prepare expected updates of accounts list
			let expAccList = this.copyObject(accBefore);
			for(let acc_id of ids)
			{
				let accIndex = expAccList.findIndex(item => item.id == acc_id);
				if (accIndex !== -1)
					expAccList.splice(accIndex, 1);
			}

			// Prepare expected updates of transactions
			let trBefore = await this.state.getTransactionsList();
			let expTransList = this.state.deleteAccounts(trBefore, accBefore, ids);

			this.state.accounts = null;
			this.state.transactions = null;

			// Send API sequest to server
			deleteRes = await api.account.del(ids);
			if (!deleteRes)
				throw new Error('Fail to delete account(s)');

			let accList = await this.state.getAccountsList();
			let trList = await this.state.getTransactionsList();

			let res = this.checkObjValue(accList, expAccList) &&
						this.checkObjValue(trList, expTransList);

			return res;
		}, env);

		return deleteRes;
	}
};


export { runAccountAPI };

