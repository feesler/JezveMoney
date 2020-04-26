import { api } from '../../api.js';
import { ApiRequestError } from '../../apirequesterror.js'
import {
	test,
	copyObject,
	setParam,
	formatProps
} from '../../common.js';
import { App } from '../../app.js';


// Create account with specified params (name, curr_id, balance, icon)
// And check expected state of app
export async function create(params)
{
	let acc_id = 0;

	await test('Create account', async () =>
	{
		let resExpected = App.state.createAccount(params);

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

		return App.state.fetchAndTest();
	});

	return acc_id;
}


// Update account with specified params (name, curr_id, balance, icon)
// And check expected state of app
export async function update(params)
{
	let updateRes = false;

	await test(`Update account (${formatProps(params)})`, async () =>
	{
		let resExpected = App.state.updateAccount(params);
		let updParams = {};

		let item = App.state.accounts.getItem(params.id);
		if (item)
			updParams = copyObject(item);

		if (!resExpected)
			setParam(updParams, params);

		// Send API sequest to server
		try
		{
			updateRes = await api.account.update(params.id, updParams);
			if (resExpected != updateRes)
				return false;
		}
		catch(e)
		{
			if (!(e instanceof ApiRequestError) || resExpected)
				throw e;
		}

		return App.state.fetchAndTest();
	});

	return updateRes;
}


// Delete specified account(s)
// And check expected state of app
export async function del(ids)
{
	let deleteRes = false;

	await test('Delete account', async () =>
	{
		let resExpected = App.state.deleteAccounts(ids);

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

		return App.state.fetchAndTest();
	});

	return deleteRes;
}
