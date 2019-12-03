if (typeof module !== 'undefined' && module.exports)
{
	var api = require('../../api.js');
}
else
{
	var api = apiModule;
}


var runAccountAPI = (function()
{
	let env = null;
	let App = null;


	function setupEnvironment(e, app)
	{
		if (!e || !app)
			throw new Error('Unexpected setup');

		env = e;
		App = app;
	}


	/**
	 * Account tests
	 */

	// Create account with specified params (name, currency, balance, icon)
	// And check expected state of app
	async function apiCreateAccountTest(params)
	{
		let acc_id = 0;

		await App.test('Create account', async () =>
		{
			let accBefore = await api.account.list();
			if (!App.isArray(accBefore))
				return false;

			let expAccObj = App.copyObject(params);
			expAccObj.curr_id = params.currency;
			delete expAccObj.currency;

			let createRes = await api.account.create(params);
			if (!createRes || !createRes.id)
				return false;

			acc_id = createRes.id;

			let accList = await api.account.list();
			if (!App.isArray(accList))
				return false;

			if (accList.length != accBefore.length + 1)
				throw new Error('Length of accounts list must increase');

			if (App.idSearch(accBefore, acc_id))
				throw new Error('Already exist account returned');

			let accObj = App.idSearch(accList, acc_id);

			return App.checkObjValue(accObj, expAccObj);
		}, env);

		return acc_id;
	}


	// Update account with specified params (name, currency, balance, icon)
	// And check expected state of app
	async function apiUpdateAccountTest(id, params)
	{
		let updateRes;

		let accList = await api.account.read(id);
		let updParams = accList[0];

		updParams.currency = updParams.curr;
		delete updParams.curr;

		App.setParam(updParams, params);

		await App.test('Update account', async () =>
		{
			let accBefore = await api.account.list();
			if (!App.isArray(accBefore))
				return false;
			let origAcc = App.idSearch(accBefore, updParams.id);

			// Prepare expected account object
			let expAccObj = App.copyObject(updParams);
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
			let expAccList = App.copyObject(accBefore);
			let accIndex = expAccList.findIndex(item => item.id == expAccObj.id);
			if (accIndex !== -1)
				expAccList.splice(accIndex, 1, expAccObj);

			// Send API sequest to server
			updateRes = await api.account.update(id, updParams);
			if (!updateRes)
				throw new Error('Fail to update account');

			let accList = await api.account.list();
			let accObj = App.idSearch(accList, id);

			let res = App.checkObjValue(accObj, expAccObj) &&
						App.checkObjValue(accList, expAccList);
			return res;
		}, env);

		return updateRes;
	}


	function onAccountDelete(trList, accList, ids)
	{
		let res = [];

		if (!App.isArray(ids))
			ids = [ ids ];

		for(let trans of trList)
		{
			if (trans.type == App.EXPENSE && ids.indexOf(trans.src_id) !== -1)
				continue;
			if (trans.type == App.INCOME && ids.indexOf(trans.dest_id) !== -1)
				continue;
			if ((trans.type == App.TRANSFER || trans.type == App.DEBT) &&
				ids.indexOf(trans.src_id) !== -1 && ids.indexOf(trans.dest_id) !== -1)
				continue;
			if (trans.type == App.DEBT && ids.indexOf(trans.src_id) !== -1 && trans.dest_id == 0)
				continue;
			if (trans.type == App.DEBT && ids.indexOf(trans.dest_id) !== -1 && trans.src_id == 0)
				continue;

			let convTrans = App.copyObject(trans);

			if (convTrans.type == App.TRANSFER)
			{
				if (ids.indexOf(convTrans.src_id) !== -1)
				{
					convTrans.type = App.INCOME;
					convTrans.src_id = 0;
				}
				else if (ids.indexOf(convTrans.dest_id) !== -1)
				{
					convTrans.type = App.EXPENSE;
					convTrans.dest_id = 0;
				}
			}
			else if (convTrans.type == App.DEBT)
			{
				for(let acc_id of ids)
				{
					let acc = App.idSearch(accList, acc_id);

					if (convTrans.src_id == acc_id)
					{
						if (acc.owner_id != App.user_id)
						{
							convTrans.type = App.INCOME;
						}

						convTrans.src_id = 0;
					}
					else if (convTrans.dest_id == acc_id)
					{
						if (acc.owner_id != App.user_id)
						{
							convTrans.type = App.EXPENSE;
						}
						convTrans.dest_id = 0;
					}
				}
			}

			res.push(convTrans);
		}

		return res;
	}


	// Delete specified account(s)
	// And check expected state of app
	async function apiDeleteAccountTest(ids)
	{
		let deleteRes;

		await App.test('Delete account', async () =>
		{
			if (!App.isArray(ids))
				ids = [ ids ];

			let accBefore = await api.account.list();
			if (!App.isArray(accBefore))
				return false;

			// Prepare expected updates of accounts list
			let expAccList = App.copyObject(accBefore);
			for(let acc_id of ids)
			{
				let accIndex = expAccList.findIndex(item => item.id == acc_id);
				if (accIndex !== -1)
					expAccList.splice(accIndex, 1);
			}

			// Prepare expected updates of transactions
			let trBefore = await api.transaction.list();
			let expTransList = onAccountDelete(trBefore, accBefore, ids);
			expTransList.sort((a, b) => a.pos - b.pos);

			// Send API sequest to server
			deleteRes = await api.account.del(ids);
			if (!deleteRes)
				throw new Error('Fail to delete account(s)');

			let accList = await api.account.list();
			let trList = await api.transaction.list();

			let res = App.checkObjValue(accList, expAccList) &&
						App.checkObjValue(trList, expTransList);

			return res;
		}, env);

		return deleteRes;
	}


	return { setEnv : setupEnvironment,
				createTest : apiCreateAccountTest,
	 			updateTest : apiUpdateAccountTest,
				deleteTest : apiDeleteAccountTest,
				onDelete : onAccountDelete };
})();


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runAccountAPI;
}
