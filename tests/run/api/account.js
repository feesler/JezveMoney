import { api } from '../../api.js';
import { ApiRequestError } from '../../apirequesterror.js'
import { Currency } from '../../currency.js';
import {
	getIcon,
	test,
	copyObject,
	isObject,
	setParam,
	checkObjValue,
	isValidValue,
	formatProps
} from '../../common.js';


let runAccountAPI =
{
	async checkCorrectness(params, id)
	{
		if (!isObject(params))
			return false;

		if (typeof params.name !== 'string' || params.name == '')
			return false;

		// Check there is no account with same name
		let accList = await this.state.getAccountsList();
		let lname = params.name.toLowerCase();
		let accObj = accList.find(item => item.name.toLowerCase() == lname);
		if (accObj && (!id || (id && id != accObj.id)))
			return false;

		let currObj = Currency.getById(params.curr_id);
		if (!currObj)
			return false;

		if (!getIcon(params.icon))
			return false;

		if (!isValidValue(params.balance))
			return false;

		return true;
	},


	/**
	 * Account tests
	 */

	// Create account with specified params (name, curr_id, balance, icon)
	// And check expected state of app
	async createTest(params)
	{
		let scope = this.run.api.account;
		let resExpected = false;
		let acc_id = 0;

		await test('Create account', async () =>
		{
			let accBefore = await this.state.getAccountsList();
			if (!Array.isArray(accBefore))
				return false;

			resExpected = await scope.checkCorrectness(params);

			let expAccObj = copyObject(params);

			this.state.accounts = null;

			let createRes;
			try
			{
				createRes = await api.account.create(params);
				if (resExpected && (!createRes || !createRes.id))
					return false;
			}
			catch(e)
			{
				if (!(e instanceof ApiRequestError) || resExpected)
					throw e;
			}

			acc_id = createRes.id;

			let expAccList = copyObject(accBefore);
			if (resExpected)
				expAccList.push(expAccObj);

			let accList = await this.state.getAccountsList();

			return checkObjValue(accList, expAccList);
		}, this.environment);

		return acc_id;
	},


	// Update account with specified params (name, curr_id, balance, icon)
	// And check expected state of app
	async updateTest(id, params)
	{
		let scope = this.run.api.account;
		let updateRes, resExpected;

		await test(`Update account (${id}, ${formatProps(params)})`, async () =>
		{
			let trBefore = await this.state.getTransactionsList();
			let accBefore = await this.state.getAccountsList();

			let origAccInd = accBefore.findIndex(item => item.id == id);
			let origAcc = (origAccInd !== -1) ? accBefore[origAccInd] : null;
			let updParams, expAccList, expTransList;

			if (origAcc)
			{
				updParams = copyObject(origAcc);
				updParams.curr_id = ('curr_id' in params) ? params.curr_id : updParams.curr_id;

				// Prepare expected account object
				let expAccObj = copyObject(origAcc);
				expAccObj.curr_id = updParams.curr_id;

				let balDiff = expAccObj.balance - origAcc.initbalance;
				if (balDiff.toFixed(2) != 0)
				{
					expAccObj.initbalance = expAccObj.balance;
					expAccObj.balance = origAcc.balance + balDiff;
				}

				// Prepare expected updates of accounts list
				expAccList = copyObject(accBefore);
				expAccList.splice(origAccInd, 1, expAccObj);

				// Prepare expected updates of transactions list
				expTransList = trBefore.updateAccount(accBefore, expAccObj)
										.updateResults(expAccList);
			}
			else
			{
				updParams = params;
				expTransList = trBefore;
				expAccList = accBefore;
			}

			if (origAcc)
				resExpected = await scope.checkCorrectness(updParams, id);
			else
				resExpected = false;

			this.state.accounts = null;
			this.state.transactions = null;

			// Send API sequest to server
			try
			{
				updateRes = await api.account.update(id, updParams);
				if (resExpected != updateRes)
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

		return updateRes;
	},


	// Delete specified account(s)
	// And check expected state of app
	async deleteTest(ids)
	{
		let deleteRes;
		let resExpected = true;

		await test('Delete account', async () =>
		{
			if (!Array.isArray(ids))
				ids = [ ids ];

			let accBefore = await this.state.getAccountsList();
			if (!Array.isArray(accBefore))
				return false;

			for(let acc_id of ids)
			{
				if (!accBefore.find(item => item.id == acc_id))
				{
					resExpected = false;
					break;
				}
			}

			let expAccList, expTransList;
			// Prepare expected updates of transactions
			let trBefore = await this.state.getTransactionsList();
			if (resExpected)
			{
				// Prepare expected updates of accounts list
				expAccList = this.state.deleteByIds(accBefore, ids);

				expTransList = trBefore.deleteAccounts(accBefore, ids)
										.updateResults(expAccList);
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
				deleteRes = await api.account.del(ids);
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
	}
};


export { runAccountAPI };
