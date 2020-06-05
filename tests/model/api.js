import { urlJoin, formatDate, setParam } from '../common.js';
import { DEBT } from './transaction.js'
import { App } from '../app.js';


// Error class to throw in case of API response with result: fail
export class ApiRequestError extends Error
{
	constructor(message)
	{
		super(message);
	}
}


const defaultRequestHdrs = { 'X-Requested-With' : 'XMLHttpRequest' };


function checkFields(fields, expFields)
{
	let postData = {};

	if (!fields || !expFields)
		throw new Error("Wrong parameters");

	for(let f of expFields)
	{
		if (!(f in fields))
			throw new Error('Expected field: ' + f);

		postData[f] = fields[f];
	}

	return postData;
}


async function apiRequest(method, url, data = null)
{
	if (!App.environment)
		throw new Error('Environment not set up');

	let reqUrl = App.config.url + 'api/' + url;

	let response = await App.environment.httpReq(method, reqUrl, data, defaultRequestHdrs);
	if (response.status != 200)
	{
		console.log('Invalid status code: ' + response.status);
		return false;
	}

	try
	{
		return JSON.parse(response.body);
	}
	catch(e)
	{
		console.log(response.body);
		throw e;
	}
}


async function apiGet(method)
{
	if (!method)
		throw new Error('Method not specified');

	return apiRequest('GET', method);
}


async function apiPost(method, data = {})
{
	if (!method)
		throw new Error('Method not specified');

	return apiRequest('POST', method, data);
}


/**
 * User
 */
const userReqFields = ['login', 'password', 'name'];

/**
 * Currency
 */
const currReqFields = ['name', 'sign', 'format'];

/**
 * Accounts
 */
const accReqFields = ['name', 'initbalance', 'curr_id', 'icon'];

/**
 * Persons
 */
const pReqFields = ['name'];

/**
 * Transactions
 */
const trReqFields = ['type', 'src_amount', 'dest_amount', 'src_curr', 'dest_curr', 'date', 'comment'];
const setPosReqFields = ['id', 'pos'];
const clTrReqFields = ['src_id', 'dest_id'];
const debtReqFields = ['op', 'person_id', 'acc_id'];
const filterFields = ['type', 'acc_id', 'page', 'count', 'stdate', 'enddate', 'search', 'order'];


function prepareTransactionData(options)
{
	if (!options.date)
		options.date = formatDate(new Date());
	if (typeof options.comment === 'undefined')
		options.comment = '';

	let res = checkFields(options, trReqFields);
	let additionalData = checkFields(options, (res.type == DEBT) ? debtReqFields : clTrReqFields);

	setParam(res, additionalData);

	return res;
}


function idsRequest(base, ids)
{
	if (!base)
		throw new ApiRequestError('Invalid request');

	if (!Array.isArray(ids))
		ids = [ ids ];

	// Check correctness of ids
	for(let id of ids)
	{
		id = parseInt(id);
		if (!id || isNaN(id))
			throw new ApiRequestError('Wrong id specified');
	}

	let res = base;
	if (ids.length == 1)
		res += ids[0];
	else
		res += '?' + urlJoin({ id : ids });

	return res;
}


export const api = {
	currency : {
		read : async function(ids)
		{
			let apiReq = idsRequest('currency/', ids);

			let jsonRes = await apiGet(apiReq);
			if (!jsonRes || jsonRes.result != 'ok')
				throw new ApiRequestError('Fail to read currency');

			return jsonRes.data;
		},

		create : async function(options)
		{
			let postData = checkFields(options, currReqFields);

			let apiRes = await apiPost('currency/create', postData);
			if (!apiRes || !apiRes.result || apiRes.result != 'ok')
				throw new ApiRequestError('Fail to create account');

			return apiRes.data;
		},

		update : async function(id, options)
		{
			id = parseInt(id);
			if (!id || isNaN(id))
				throw new ApiRequestError('Wrong id specified');

			let postData = checkFields(options, currReqFields);
			postData.id = id;

			let apiRes = await apiPost('currency/update', postData);
			if (!apiRes || !apiRes.result || apiRes.result != 'ok')
				throw new ApiRequestError('Fail to update currency');

			return true;
		},

		del : async function(ids)
		{
			if (!Array.isArray(ids))
				ids = [ ids ];

			for(let id of ids)
			{
				id = parseInt(id);
				if (!id || isNaN(id))
					throw new ApiRequestError('Wrong id specified');
			}

			let postData = { id : ids };

			let apiRes = await apiPost('currency/delete', postData);
			if (!apiRes || apiRes.result != 'ok')
				throw new ApiRequestError('Fail to delete currency');

			return true;
		},

		list : async function()
		{
			let reqUrl = 'currency/list';

			let jsonRes = await apiGet(reqUrl);
			if (!jsonRes || jsonRes.result != 'ok')
				throw new ApiRequestError('Fail to obtain list of currencies');

			return jsonRes.data;
		}
	},

	user : {
		// Try to login user and return boolean result
		login : async function({ login, password })
		{
			let apiRes = await apiPost('login', { login, password });

			return (apiRes && apiRes.result == 'ok');
		},

		logout : async function()
		{
			let apiRes = await apiPost('logout');

			return (apiRes && apiRes.result == 'ok');
		},

		register : async function(options)
		{
			let postData = checkFields(options, userReqFields);

			let apiRes = await apiPost('register', postData);

			return (apiRes && apiRes.result == 'ok');
		},

		/**
		 * Admin methods
		 */

		list : async function()
		{
			let reqUrl = 'user/list';

			let jsonRes = await apiGet(reqUrl);
			if (!jsonRes || jsonRes.result != 'ok')
			{
				let msg = (jsonRes && jsonRes.msg) ? jsonRes.msg : 'Fail to obtain list of users';
				throw new ApiRequestError(msg);
			}

			return jsonRes.data;
		},

		create : async function(options)
		{
			let postData = checkFields(options, userReqFields);

			let apiRes = await apiPost('user/create', postData);
			if (!apiRes || apiRes.result != 'ok')
				throw new ApiRequestError('Fail to create user');

			return apiRes.data;
		},

		update : async function(id, options)
		{
			id = parseInt(id);
			if (!id || isNaN(id))
				throw new ApiRequestError('Wrong id specified');

			let postData = checkFields(options, accReqFields);
			postData.id = id;

			let apiRes = await apiPost('user/update', postData);
			if (!apiRes || apiRes.result != 'ok')
				throw new ApiRequestError('Fail to update user');

			return true;
		},

		changePassword : async function(id, password)
		{
			let apiRes = await apiPost('user/changePassword', { id, password });

			return (apiRes && apiRes.result == 'ok');
		},

		// Delete user and all related data
		del : async function(ids)
		{
			if (!Array.isArray(ids))
				ids = [ids];

			for (let id of ids)
			{
				id = parseInt(id);
				if (!id || isNaN(id))
					throw new ApiRequestError('Wrong id specified');
			}

			let postData = { id: ids };

			let apiRes = await apiPost('user/delete', postData);
			if (!apiRes || apiRes.result != 'ok')
				throw new ApiRequestError('Fail to delete user');

			return true;
		}
	},

	profile : {
		// Read profile data of current user
		read : async function()
		{
			let apiRes = await apiGet('profile/read');
			if (!apiRes || !apiRes.result || apiRes.result != 'ok')
				return false;

			return apiRes.data;
		},

		changeName : async function({ name })
		{
			let apiRes = await apiPost('profile/changename', { name });

			return (apiRes && apiRes.result == 'ok');
		},

		changePassword : async function({ oldPassword, newPassword })
		{
			let apiRes = await apiPost('profile/changepass', { current : oldPassword, new : newPassword });

			return (apiRes && apiRes.result == 'ok');
		},

		// Reset all data of current user and return boolean result
		reset : async function()
		{
			let apiRes = await apiPost('profile/reset');

			return (apiRes && apiRes.result == 'ok');
		},

		// Delete current user and all related data
		del : async function()
		{
			let apiRes = await apiPost('profile/delete');

			return (apiRes && apiRes.result == 'ok');
		},
	},

	state : {
		read : async function()
		{
			let jsonRes = await apiGet('state');
			if (!jsonRes || jsonRes.result != 'ok')
				throw new ApiRequestError('Fail to read state');

			return jsonRes.data;
		},
	},

	account : {
		read : async function(ids)
		{
			let apiReq = idsRequest('account/', ids);

			let jsonRes = await apiGet(apiReq);
			if (!jsonRes || jsonRes.result != 'ok')
				throw new ApiRequestError('Fail to read account');

			return jsonRes.data;
		},

		create : async function(options)
		{
			let postData = checkFields(options, accReqFields);

			let apiRes = await apiPost('account/create', postData);
			if (!apiRes || !apiRes.result || apiRes.result != 'ok')
				throw new ApiRequestError('Fail to create account');

			return apiRes.data;
		},

		update : async function(id, options)
		{
			id = parseInt(id);
			if (!id || isNaN(id))
				throw new ApiRequestError('Wrong id specified');

			let postData = checkFields(options, accReqFields);
			postData.id = id;

			let apiRes = await apiPost('account/update', postData);
			if (!apiRes || !apiRes.result || apiRes.result != 'ok')
				throw new ApiRequestError('Fail to update account');

			return true;
		},

		del : async function(ids)
		{
			if (!Array.isArray(ids))
				ids = [ ids ];

			for(let id of ids)
			{
				id = parseInt(id);
				if (!id || isNaN(id))
					throw new ApiRequestError('Wrong id specified');
			}

			let postData = { id : ids };

			let apiRes = await apiPost('account/delete', postData);
			if (!apiRes || apiRes.result != 'ok')
				throw new ApiRequestError('Fail to delete account');

			return true;
		},

		list : async function(full)
		{
			let reqUrl = 'account/list';

			if (full)
				reqUrl += '?full=1';

			let jsonRes = await apiGet(reqUrl);
			if (!jsonRes || jsonRes.result != 'ok')
				throw new ApiRequestError('Fail to obtain list of accounts');

			return jsonRes.data;
		},

		reset : async function()
		{
			let jsonRes = await apiGet('account/reset');

			if (!jsonRes || jsonRes.result != 'ok')
				throw new ApiRequestError('Fail to reset accounts');

			return true;
		}
	},

	person : {
		read : async function(ids)
		{
			let apiReq = idsRequest('person/', ids);

			let jsonRes = await apiGet(apiReq);
			if (!jsonRes || jsonRes.result != 'ok')
				throw new ApiRequestError('Fail to read person');

			return jsonRes.data;
		},

		create : async function(options)
		{
			let postData = checkFields(options, pReqFields);

			let apiRes = await apiPost('person/create', postData);
			if (!apiRes || apiRes.result != 'ok')
				throw new ApiRequestError('Fail to create person');

			return apiRes.data;
		},

		update : async function(id, options)
		{
			id = parseInt(id);
			if (!id || isNaN(id))
				throw new ApiRequestError('Wrong id specified');

			let postData = checkFields(options, pReqFields);
			postData.id = id;

			let apiRes = await apiPost('person/update', postData);
			if (!apiRes || apiRes.result != 'ok')
				throw new ApiRequestError('Fail to update person');

			return true;
		},

		del : async function(ids)
		{
			if (!Array.isArray(ids))
				ids = [ ids ];

			for(let id of ids)
			{
				id = parseInt(id);
				if (!id || isNaN(id))
					throw new ApiRequestError('Wrong id specified');
			}

			let postData = { id : ids };

			let apiRes = await apiPost('person/delete', postData);
			if (!apiRes || apiRes.result != 'ok')
				throw new ApiRequestError('Fail to delete person');

			return true;
		},

		list : async function()
		{
			let jsonRes = await apiGet('person/list');
			if (!jsonRes || jsonRes.result != 'ok')
				throw new ApiRequestError('Fail to obtain list of persons');

			return jsonRes.data;
		}
	},

	transaction : {
		read : async function(ids)
		{
			let apiReq = idsRequest('transaction/', ids);

			let jsonRes = await apiGet(apiReq);
			if (!jsonRes || jsonRes.result != 'ok')
				throw new ApiRequestError('Fail to read transaction');

			return jsonRes.data;
		},

		create : async function(options)
		{
			let postData = prepareTransactionData(options);

			let apiRes = await apiPost('transaction/create', postData);
			if (!apiRes || apiRes.result != 'ok')
				throw new ApiRequestError('Fail to create transaction');

			return apiRes.data;
		},

		createMultiple : async function(data)
		{
			let transactions = (Array.isArray(data)) ? data : [ data ];

			let postData = [];
			for(let options of transactions)
			{
				let itemData = prepareTransactionData(options);
				postData.push(itemData);
			}

			let apiRes = await apiPost('transaction/createMultiple', postData);
			if (!apiRes || apiRes.result != 'ok')
				throw new ApiRequestError('Fail to create transactions');

			return apiRes.data;
		},

		update : async function(options)
		{
			let id = parseInt(options.id);
			if (!id || isNaN(id))
			{
				console.debug(options);
				throw new ApiRequestError('Wrong id specified');
			}

			let postData = checkFields(options, trReqFields);
			postData.id = id;

			let addData = checkFields(options, (postData.type == DEBT) ? debtReqFields : clTrReqFields);

			setParam(postData, addData);

			let apiRes = await apiPost('transaction/update', postData);
			if (!apiRes || apiRes.result != 'ok')
				throw new ApiRequestError('Fail to update transaction');

			return true;
		},

		del : async function(ids)
		{
			if (!Array.isArray(ids))
				ids = [ ids ];

			for(let id of ids)
			{
				id = parseInt(id);
				if (!id || isNaN(id))
					throw new ApiRequestError('Wrong id specified');
			}

			let postData = { id : ids };

			let apiRes = await apiPost('transaction/delete', postData);
			if (!apiRes || apiRes.result != 'ok')
				throw new ApiRequestError('Fail to delete transaction');

			return true;
		},

		list : async function(params)
		{
			params = params || {};

			let reqParams = { count : 0 };
			for(let prop in params)
			{
				if (filterFields.includes(prop))
					reqParams[prop] = params[prop];
			}

			let apiReq = 'transaction/list?' + urlJoin(reqParams);

			let jsonRes = await apiGet(apiReq);
			if (!jsonRes || jsonRes.result != 'ok')
				throw new ApiRequestError('Fail to obtain list of transactions');

			jsonRes.data.sort((a, b) => b.pos - a.pos);

			return jsonRes.data;
		},

		setPos : async function(options)
		{
			let postData = checkFields(options, setPosReqFields);

			let apiRes = await apiPost('transaction/setpos', postData);
			if (!apiRes || apiRes.result != 'ok')
				throw new ApiRequestError('Fail to delete transaction');

			return true;
		}
	}
};

