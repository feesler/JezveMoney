import { api, ApiRequestError } from '../../model/api.js';
import { Transaction } from '../../model/transaction.js';
import {
	test,
	setParam,
	formatDate,
	fixDate,
	checkObjValue,
	formatProps
} from '../../common.js';
import { App } from '../../app.js';


// Create transaction with specified params
// (type, src_id, dest_id, src_amount, dest_amount, src_curr, dest_curr, date, comment)
export async function create(params)
{
	let transaction_id = 0;

	await test(`Create ${Transaction.typeToStr(params.type)} transaction`, async () =>
	{
		let resExpected = App.state.createTransaction(params);

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

		transaction_id = (createRes) ? createRes.id : resExpected;

		return App.state.fetchAndTest();
	});

	return transaction_id;
}


export async function extractAndCreate(data)
{
	let extracted = Transaction.extract(data, App.state);

	return create(extracted);
}


// Update transaction with specified params
// (type, src_id, dest_id, src_amount, dest_amount, src_curr, dest_curr, date, comment)
export async function update(params)
{
	let updateRes;

	await test('Update transaction', async () =>
	{
		let resExpected = App.state.updateTransaction(params);

		// Obtain data for API request
		let updParams = { date : App.dates.now, comment : '' };
		let expTrans = App.state.transactions.getItem(params.id);

		if (expTrans)
			updParams = App.state.transactionToRequest(expTrans);
		if (!resExpected)
			setParam(updParams, params);

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

		return App.state.fetchAndTest();
	});

	return updateRes;
}


// Delete specified transaction(s)
// And check expected state of app
export async function del(ids)
{
	let deleteRes;

	await test('Delete transaction', async () =>
	{
		let resExpected = App.state.deleteTransactions(ids);

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

		return App.state.fetchAndTest();
	});

	return deleteRes;
}


// Set new position for specified transaction
export async function setPos(params)
{
	let result;

	await test('Set position of transaction', async () =>
	{
		let resExpected = App.state.setTransactionPos(params);

		// Send API sequest to server
		try
		{
			result = await api.transaction.setPos(params);
			if (resExpected != result)
				return false;
		}
		catch(e)
		{
			if (!(e instanceof ApiRequestError) || resExpected)
				throw e;
		}

		return App.state.fetchAndTest();
	});

	return result;
}


// Filter list of transaction by specified params
export async function filter(params)
{
	await test(`Filter transactions (${formatProps(params)})`, async () =>
	{
		let transactions = App.state.transactions.clone();
		let expTransList = transactions.filter(params);
		if ('page' in params || 'onPage' in params)
		{
			let targetPage = ('page' in params) ? params.page : 1;
			expTransList = expTransList.getPage(targetPage, params.onPage);
		}

		// Prepare request parameters
		let reqParams = {};

		if ('order' in params)
			reqParams.order = params.order;
		if ('type' in params)
			reqParams.type = params.type
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

		return checkObjValue(trList, expTransList.data);
	});
}
