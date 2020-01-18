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
			let accBefore = await api.account.list();
			if (!Array.isArray(accBefore))
				return false;

			let expAccObj = this.copyObject(params);
			expAccObj.curr_id = params.currency;
			delete expAccObj.currency;

			let createRes = await api.account.create(params);
			if (!createRes || !createRes.id)
				return false;

			acc_id = createRes.id;

			let accList = await api.account.list();
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
			let accBefore = await api.account.list();
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

			// Send API sequest to server
			updateRes = await api.account.update(id, updParams);
			if (!updateRes)
				throw new Error('Fail to update account');

			let accList = await api.account.list();
			let accObj = accList.find(item => item.id == id);

			let res = this.checkObjValue(accObj, expAccObj) &&
						this.checkObjValue(accList, expAccList);
			return res;
		}, env);

		return updateRes;
	},


	onDelete(trList, accList, ids)
	{
		let res = [];

		if (!Array.isArray(ids))
			ids = [ ids ];

		for(let trans of trList)
		{
			if (trans.type == this.EXPENSE && ids.indexOf(trans.src_id) !== -1)
				continue;
			if (trans.type == this.INCOME && ids.indexOf(trans.dest_id) !== -1)
				continue;
			if ((trans.type == this.TRANSFER || trans.type == this.DEBT) &&
				ids.indexOf(trans.src_id) !== -1 && ids.indexOf(trans.dest_id) !== -1)
				continue;
			if (trans.type == this.DEBT && ids.indexOf(trans.src_id) !== -1 && trans.dest_id == 0)
				continue;
			if (trans.type == this.DEBT && ids.indexOf(trans.dest_id) !== -1 && trans.src_id == 0)
				continue;

			let convTrans = this.copyObject(trans);

			if (convTrans.type == this.TRANSFER)
			{
				if (ids.indexOf(convTrans.src_id) !== -1)
				{
					convTrans.type = this.INCOME;
					convTrans.src_id = 0;
				}
				else if (ids.indexOf(convTrans.dest_id) !== -1)
				{
					convTrans.type = this.EXPENSE;
					convTrans.dest_id = 0;
				}
			}
			else if (convTrans.type == this.DEBT)
			{
				for(let acc_id of ids)
				{
					let acc = accList.find(item => item.id == acc_id);

					if (convTrans.src_id == acc_id)
					{
						if (acc.owner_id != this.user_id)
						{
							convTrans.type = this.INCOME;
						}

						convTrans.src_id = 0;
					}
					else if (convTrans.dest_id == acc_id)
					{
						if (acc.owner_id != this.user_id)
						{
							convTrans.type = this.EXPENSE;
						}
						convTrans.dest_id = 0;
					}
				}
			}

			res.push(convTrans);
		}

		return res;
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

			let accBefore = await api.account.list();
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
			let trBefore = await api.transaction.list();
			let expTransList = this.run.api.account.onDelete(trBefore, accBefore, ids);

			// Send API sequest to server
			deleteRes = await api.account.del(ids);
			if (!deleteRes)
				throw new Error('Fail to delete account(s)');

			let accList = await api.account.list();
			let trList = await api.transaction.list();

			let res = this.checkObjValue(accList, expAccList) &&
						this.checkObjValue(trList, expTransList);

			return res;
		}, env);

		return deleteRes;
	}
};


export { runAccountAPI };

