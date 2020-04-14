import { api } from '../../api.js';
import { ApiRequestError } from '../../apirequesterror.js'
import { Currency } from '../../model/currency.js';
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
import { AppState } from '../../state.js';


export const runAccountAPI =
{
	/**
	 * Account tests
	 */

	// Create account with specified params (name, curr_id, balance, icon)
	// And check expected state of app
	async createTest(params)
	{
		let acc_id = 0;

		await test('Create account', async () =>
		{
			let expected = this.state.clone();
			let resExpected = expected.createAccount(params);

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

			acc_id = (createRes) ? createRes.id : resExpected;

			await this.state.fetch();
			return this.state.meetExpectation(expected);
		}, this.environment);

		return acc_id;
	},


	// Update account with specified params (name, curr_id, balance, icon)
	// And check expected state of app
	async updateTest(id, params)
	{
		let updateRes = false;

		await test(`Update account (${id}, ${formatProps(params)})`, async () =>
		{
			let expected = this.state.clone();

			params.id = id;
			let resExpected = expected.updateAccount(params);
			let updParams = {};

			let item = expected.accounts.getItem(id);
			if (item)
			{
				updParams = copyObject(item);
			}

			if (!resExpected)
				setParam(updParams, params);

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

			await this.state.fetch();
			return this.state.meetExpectation(expected);
		}, this.environment);

		return updateRes;
	},


	// Delete specified account(s)
	// And check expected state of app
	async deleteTest(ids)
	{
		let deleteRes = false;

		await test('Delete account', async () =>
		{
			let expected = this.state.clone();
			let resExpected = expected.deleteAccounts(ids);

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

			await this.state.fetch();
			return this.state.meetExpectation(expected);
		}, this.environment);

		return deleteRes;
	}
};
