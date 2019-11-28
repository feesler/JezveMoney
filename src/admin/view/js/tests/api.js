/**
 * API tests module
 * @return
 */
var apiModule = (function()
{
	let defaultRequestHdrs = { 'X-Requested-With' : 'XMLHttpRequest' };
	let env = null;
	let apiBase = null;


	function setupEnvironment(e, app)
	{
		if (!e || !app || !app.config || !app.config.url)
			throw new Error('Unexpected setup');

		env = e;
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

		return JSON.parse(response.body);
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

		return JSON.parse(response.body);
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


	async function createAccount(options)
	{
		let postData = checkFields(options, accReqFields);

		let apiRes = await apiPost('account/create', postData);
		if (!apiRes || !apiRes.result || apiRes.result != 'ok')
			return false;

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
			return false;

		return true;
	}


	async function accountsList()
	{
		let jsonRes = await apiGet('account/list');
		if (!jsonRes || !jsonRes.result || jsonRes.result != 'ok')
			return false;

		return jsonRes.data;
	}


	async function resetAccounts()
	{
		let jsonRes = await apiGet('account/reset');

		return (jsonRes && jsonRes.result && jsonRes.result == 'ok');
	}


/**
 * Persons
 */

	let pReqFields = ['name'];


	async function createPerson(options)
	{
		let postData = checkFields(options, pReqFields);

		let apiRes = await apiPost('person/create', postData);
		if (!apiRes || !apiRes.result || apiRes.result != 'ok')
			return false;

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
		if (!apiRes || !apiRes.result || apiRes.result != 'ok')
			return false;

		return true;
	}


	async function personsList()
	{
		let jsonRes = await apiGet('person/list');
		if (!jsonRes || !jsonRes.result || jsonRes.result != 'ok')
			return false;

		return jsonRes.data;
	}


/**
 * Transactions
 */

	async function transList()
	{
		let jsonRes = await apiGet('transaction/list');
		if (!jsonRes || !jsonRes.result || jsonRes.result != 'ok')
			return false;

		return jsonRes.data;
	}



	return {
		setEnv : setupEnvironment,

		user : {
			login : loginUser
		},

		profile : {
			read : readProfile,
			reset : resetProfile
		},

		account : {
			create : createAccount,
			update : updateAccount,
			list : accountsList,
			reset : resetAccounts
		},

		person : {
			create : createPerson,
			update : updatePerson,
			list : personsList
		},

		transaction : {
			list : transList
		}
	};

})();


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = apiModule;
}
