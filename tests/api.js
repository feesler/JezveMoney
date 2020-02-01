import {
	EXPENSE,
	INCOME,
	TRANSFER,
	DEBT,
	copyObject,
	urlJoin,
	formatDate,
	setParam
} from './common.js';


/**
 * API tests module
 * @return
 */
let apiModule = (function()
{
	let defaultRequestHdrs = { 'X-Requested-With' : 'XMLHttpRequest' };
	let env = null;
	let app = null;
	let apiBase = null;


	function setupEnvironment(App)
	{
		if (!App || !App.config || !App.config.url || !App.environment)
			throw new Error('Unexpected setup');

		app = App;
		env = app.environment;
		apiBase = app.config.url + 'api/';
	}


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


	async function apiGet(method)
	{
		if (!env)
			throw new Error('Environment not set up');
		if (!method)
			throw new Error('Method not specified');

		let reqUrl = apiBase + method;

		let response = await env.httpReq('GET', reqUrl, null, defaultRequestHdrs);
		if (response.status != 200)
			return false;

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


	async function apiPost(method, data = {})
	{
		if (!env)
			throw new Error('Environment not set up');
		if (!method)
			throw new Error('Method not specified');

		let reqUrl = apiBase + method;

		let response = await env.httpReq('POST', reqUrl, data, defaultRequestHdrs);
		if (response.status != 200)
			return false;

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


/**
 * Currency
 */

	async function readCurrency(ids)
	{
		if (!Array.isArray(ids))
			ids = [ ids ];

		for(let id of ids)
		{
			id = parseInt(id);
			if (!id || isNaN(id))
				throw new Error('Wrong id specified');
		}

		let apiReq = 'currency/';
		if (ids.length == 1)
			apiReq += ids[0];
		else
			apiReq += '?' + urlJoin({ id : ids });

		let jsonRes = await apiGet(apiReq);
		if (!jsonRes || jsonRes.result != 'ok')
			throw new Error('Fail to read currency');

		return jsonRes.data;
	}


	async function currenciesList()
	{
		let reqUrl = 'currency/list';

		let jsonRes = await apiGet(reqUrl);
		if (!jsonRes || jsonRes.result != 'ok')
			throw new Error('Fail to obtain list of currencies');

		return jsonRes.data;
	}


/**
 * User/profile
 */

	// Try to login user and return boolean result
	async function loginUser(login, password)
	{
		let apiRes = await apiPost('login', { login : login, pwd : password });

		return (apiRes && apiRes.result && apiRes.result == 'ok');
	}


	// Read profile data of user
	async function readProfile()
	{
		let apiRes = await apiGet('profile/read');
		if (!apiRes || !apiRes.result || apiRes.result != 'ok')
			return false;

		return apiRes.data;
	}


	// Reset all data and return boolean result
	async function resetProfile()
	{
		let apiRes = await apiPost('profile/reset');
		return (apiRes && apiRes.result && apiRes.result == 'ok');
	}


/**
 * Accounts
 */

	let accReqFields = ['name', 'balance', 'currency', 'icon'];


	async function readAccount(ids)
	{
		if (!Array.isArray(ids))
			ids = [ ids ];

		for(let id of ids)
		{
			id = parseInt(id);
			if (!id || isNaN(id))
				throw new Error('Wrong id specified');
		}

		let apiReq = 'account/';
		if (ids.length == 1)
			apiReq += ids[0];
		else
			apiReq += '?' + urlJoin({ id : ids });

		let jsonRes = await apiGet(apiReq);
		if (!jsonRes || jsonRes.result != 'ok')
			throw new Error('Fail to read account');

		return jsonRes.data;
	}


	async function createAccount(options)
	{
		let postData = checkFields(options, accReqFields);

		let apiRes = await apiPost('account/create', postData);
		if (!apiRes || !apiRes.result || apiRes.result != 'ok')
			throw new Error('Fail to create account');

		return apiRes.data;
	}


	async function updateAccount(id, options)
	{
		id = parseInt(id);
		if (!id || isNaN(id))
			throw new Error('Wrong id specified');

		let postData = checkFields(options, accReqFields);
		postData.id = id;

		let apiRes = await apiPost('account/update', postData);
		if (!apiRes || !apiRes.result || apiRes.result != 'ok')
			throw new Error('Fail to update account');

		return true;
	}


	async function deleteAccount(ids)
	{
		if (!Array.isArray(ids))
			ids = [ ids ];

		for(let id of ids)
		{
			id = parseInt(id);
			if (!id || isNaN(id))
				throw new Error('Wrong id specified');
		}

		let postData = { id : ids };

		let apiRes = await apiPost('account/delete', postData);
		if (!apiRes || apiRes.result != 'ok')
			throw new Error('Fail to delete account');

		return true;
	}


	async function accountsList(full)
	{
		let reqUrl = 'account/list';

		if (full)
			reqUrl += '?full=1';

		let jsonRes = await apiGet(reqUrl);
		if (!jsonRes || jsonRes.result != 'ok')
			throw new Error('Fail to obtain list of accounts');

		return jsonRes.data;
	}


	async function resetAccounts()
	{
		let jsonRes = await apiGet('account/reset');

		if (!jsonRes || jsonRes.result != 'ok')
			throw new Error('Fail to reset accounts');

		return true;
	}


/**
 * Persons
 */

	let pReqFields = ['name'];


	async function readPerson(ids)
	{
		if (!Array.isArray(ids))
			ids = [ ids ];

		for(let id of ids)
		{
			id = parseInt(id);
			if (!id || isNaN(id))
				throw new Error('Wrong id specified');
		}

		let apiReq = 'person/';
		if (ids.length == 1)
			apiReq += ids[0];
		else
			apiReq += '?' + urlJoin({ id : ids });

		let jsonRes = await apiGet(apiReq);
		if (!jsonRes || jsonRes.result != 'ok')
			throw new Error('Fail to read person');

		return jsonRes.data;
	}


	async function createPerson(options)
	{
		let postData = checkFields(options, pReqFields);

		let apiRes = await apiPost('person/create', postData);
		if (!apiRes || apiRes.result != 'ok')
			throw new Error('Fail to create person');

		return apiRes.data;
	}


	async function updatePerson(id, options)
	{
		id = parseInt(id);
		if (!id || isNaN(id))
			throw new Error('Wrong id specified');

		let postData = checkFields(options, pReqFields);
		postData.id = id;

		let apiRes = await apiPost('person/update', postData);
		if (!apiRes || apiRes.result != 'ok')
			throw new Error('Fail to update person');

		return true;
	}


	async function deletePerson(ids)
	{
		if (!Array.isArray(ids))
			ids = [ ids ];

		for(let id of ids)
		{
			id = parseInt(id);
			if (!id || isNaN(id))
				throw new Error('Wrong id specified');
		}

		let postData = { id : ids };

		let apiRes = await apiPost('person/delete', postData);
		if (!apiRes || apiRes.result != 'ok')
			throw new Error('Fail to delete person');

		return true;
	}


	async function personsList()
	{
		let jsonRes = await apiGet('person/list');
		if (!jsonRes || jsonRes.result != 'ok')
			throw new Error('Fail to obtain list of persons');

		return jsonRes.data;
	}


/**
 * Transactions
 */

	let trReqFields = ['transtype', 'src_amount', 'dest_amount', 'src_curr', 'dest_curr', 'date', 'comm'];
	let clTrReqFields = ['src_id', 'dest_id'];
	let debtReqFields = ['debtop', 'person_id', 'acc_id'];


	async function readTransaction(ids)
	{
		if (!Array.isArray(ids))
			ids = [ ids ];

		for(let id of ids)
		{
			id = parseInt(id);
			if (!id || isNaN(id))
				throw new Error('Wrong id specified');
		}

		let apiReq = 'transaction/';
		if (ids.length == 1)
			apiReq += ids[0];
		else
			apiReq += '?' + urlJoin({ id : ids });

		let jsonRes = await apiGet(apiReq);
		if (!jsonRes || jsonRes.result != 'ok')
			throw new Error('Fail to read transaction');

		return jsonRes.data;
	}


	function prepareTransactionData(options)
	{
		if (!options.date)
			options.date = formatDate(new Date());
		if (typeof options.comm === 'undefined')
			options.comm = '';

 		let res = checkFields(options, trReqFields);

		let isDebt = (res.transtype == DEBT);
		let additionalData = checkFields(options, (isDebt) ? debtReqFields : clTrReqFields);

		setParam(res, additionalData);

		return res;
	}


 	async function createTransaction(options)
 	{
		let postData = prepareTransactionData(options);

 		let apiRes = await apiPost('transaction/create', postData);
 		if (!apiRes || apiRes.result != 'ok')
 			throw new Error('Fail to create transaction');

 		return apiRes.data;
 	}


 	async function createMultipleTransactions(data)
 	{
		let transactions = (Array.isArray(data)) ? data : [ data ];

		let postData = [];
		for(let options of transactions)
		{
			let itemData = prepareTransactionData(options);

			itemData.type = itemData.transtype;
			delete itemData.transtype;

			itemData.comment = itemData.comm;
			delete itemData.comm;

			postData.push(itemData);
		}

 		let apiRes = await apiPost('transaction/createMultiple', JSON.stringify(postData));
 		if (!apiRes || apiRes.result != 'ok')
 			throw new Error('Fail to create transactions');

 		return apiRes.data;
 	}


 	async function updateTransaction(options)
	{
		let id = parseInt(options.id);
		if (!id || isNaN(id))
		{
			console.debug(options);
			throw new Error('Wrong id specified');
		}

		let postData = checkFields(options, trReqFields);
		postData.transid = id;

		let isDebt = (postData.transtype == DEBT);
		let addData = checkFields(options, (isDebt) ? debtReqFields : clTrReqFields);

		setParam(postData, addData);

 		let apiRes = await apiPost('transaction/update', postData);
 		if (!apiRes || apiRes.result != 'ok')
			throw new Error('Fail to update transaction');

		return true;
 	}


	async function deleteTransaction(ids)
	{
		if (!Array.isArray(ids))
			ids = [ ids ];

		for(let id of ids)
		{
			id = parseInt(id);
			if (!id || isNaN(id))
				throw new Error('Wrong id specified');
		}

		let postData = { id : ids };

		let apiRes = await apiPost('transaction/delete', postData);
		if (!apiRes || apiRes.result != 'ok')
			throw new Error('Fail to delete transaction');

		return true;
	}


	let filterFields = ['type', 'acc_id', 'page', 'count', 'stdate', 'enddate', 'search'];

	async function transList(params)
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
			throw new Error('Fail to obtain list of transactions');

		jsonRes.data.sort((a, b) => b.pos - a.pos);

		return jsonRes.data;
	}


	async function expenseTransaction(params)
	{
		if (!params.src_id)
			throw new Error('Source account not specified');

		let res = copyObject(params);

		res.transtype = EXPENSE;
		res.dest_id = 0;

		if (!res.dest_amount)
			res.dest_amount = res.src_amount;

		let accList = await accountsList();
		let acc = accList.find(item => item.id == res.src_id);
		res.src_curr = acc.curr_id;

		if (!res.dest_curr)
			res.dest_curr = res.src_curr;

		return res;
	}


	async function incomeTransaction(params)
	{
		if (!params.dest_id)
			throw new Error('Destination account not specified');

		let res = copyObject(params);

		res.transtype = INCOME;
		res.src_id = 0;

		if (!res.src_amount)
			res.src_amount = res.dest_amount;

		let accList = await accountsList();
		let acc = accList.find(item => item.id == res.dest_id);
		res.dest_curr = acc.curr_id;

		if (!res.src_curr)
			res.src_curr = res.dest_curr;

		return res;
	}


	async function transferTransaction(params)
	{
		if (!params.src_id)
			throw new Error('Source account not specified');
		if (!params.dest_id)
			throw new Error('Destination account not specified');

		let res = copyObject(params);

		res.transtype = TRANSFER;

		if (!res.dest_amount)
			res.dest_amount = res.src_amount;

		let accList = await accountsList();

		let srcAcc = accList.find(item => item.id == res.src_id);
		res.src_curr = srcAcc.curr_id;

		let destAcc = accList.find(item => item.id == res.dest_id);
		res.dest_curr = destAcc.curr_id;

		if (!res.src_curr)
			res.src_curr = res.dest_curr;

		return res;
	}


	async function debtTransaction(params)
	{
		if (!params.person_id)
			throw new Error('Person not specified');

		let res = copyObject(params);

		res.transtype = DEBT;

		if (!res.dest_amount)
			res.dest_amount = res.src_amount;

		let accList = await accountsList();

		let acc = accList.find(item => item.id == res.acc_id);
		if (acc)
			res.src_curr = res.dest_curr = acc.curr_id;
		else
			res.src_curr = res.dest_curr = (res.src_curr || res.dest_curr);

		return res;
	}


	return {
		setEnv : setupEnvironment,

		currency : {
			read : readCurrency,
			list : currenciesList
		},

		user : {
			login : loginUser
		},

		profile : {
			read : readProfile,
			reset : resetProfile
		},

		account : {
			read : readAccount,
			create : createAccount,
			update : updateAccount,
			del : deleteAccount,
			list : accountsList,
			reset : resetAccounts
		},

		person : {
			read : readPerson,
			create : createPerson,
			update : updatePerson,
			del : deletePerson,
			list : personsList
		},

		transaction : {
			read : readTransaction,
			create : createTransaction,
			update : updateTransaction,
			del : deleteTransaction,
			list : transList,

		// tools for short transaction declarations
			expense : expenseTransaction,
			income : incomeTransaction,
			transfer : transferTransaction,
			debt : debtTransaction,
		}
	};

})();


export { apiModule as api };
