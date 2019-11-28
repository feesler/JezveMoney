if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var test = common.test;
	var isArray = common.isArray;
	var idSearch = common.idSearch;
	var copyObject = common.copyObject;
	var checkObjValue = common.checkObjValue;

	var api = require('../api.js');

	var App = null;
}
else
{
	var api = apiModule;
}


var runAPI = (function()
{
	let env = null;


	function onAppUpdate(props)
	{
		props = props || {};

		if ('App' in props)
			App = props.App;
	}


	// Create account with specified params (name, currency, balance, icon)
	// And check expected state of app
	async function apiCreateAccountTest(params)
	{
		await test('Create account', async () => {
			let accBefore = await api.account.list();
			if (!isArray(accBefore))
				return false;

			let expAccObj = copyObject(params);
			expAccObj.curr_id = params.currency;
			delete expAccObj.currency;

			let createRes = await api.account.create(params);
			if (!createRes || !createRes.id)
				return false;

			let accList = await api.account.list();
			if (!isArray(accList))
				return false;

			if (accList.length != accBefore.length + 1)
				throw new Error('Length of accounts list must increase');

			if (idSearch(accBefore, createRes.id))
				throw new Error('Already exist account returned');

			let accObj = idSearch(accList, createRes.id);

			return checkObjValue(accObj, expAccObj);
		}, env);
	}


	// Create person with specified params (name)
	// And check expected state of app
	async function apiCreatePersonTest(params)
	{
		await test('Create person', async () => {
			let pBefore = await api.person.list();
			if (!isArray(pBefore))
				return false;

			let expPersonObj = copyObject(params);

			let createRes = await api.person.create(params);
			if (!createRes || !createRes.id)
				return false;

			let pList = await api.person.list();
			if (!isArray(pList))
				return false;

			if (pList.length != pBefore.length + 1)
				throw new Error('Length of persons list must increase');

			if (idSearch(pBefore, createRes.id))
				throw new Error('Already exist person returned');

			let personObj = idSearch(pList, createRes.id);

			return checkObjValue(personObj, expPersonObj);
		}, env);
	}


	async function runTests(view, App)
	{
		console.log('api.run()');
		env = view.props.environment;

		api.setEnv(env, App);

		await test('Login user', () => api.user.login('test', 'test'), env);

		await test('Reset all data', async () => {
			return await api.profile.reset();
		}, env);

		env.setBlock('Accounts', 1);

		await test('Reset accounts', async () => {
			return await api.account.reset();
		}, env);

		await test('Accounts list', async () => {
			let accList = await api.account.list();

			return isArray(accList) && accList.length == 0;
		}, env);

		await apiCreateAccountTest({ name : 'acc ru', currency : 1, balance : 100, icon : 1 });
		await apiCreateAccountTest({ name : 'acc usd', currency : 2, balance : 10.5, icon : 5 });


		env.setBlock('Persons', 1);

		await test('Persons list', async () => {
			let pList = await api.person.list();

			return isArray(pList);
		}, env);

		await apiCreatePersonTest({ name : 'Person X' });
		await apiCreatePersonTest({ name : 'Y' });

		env.setBlock('Transactions', 1);

		await test('Transactions list', async () => {
			let trList = await api.transaction.list();

			return isArray(trList);
		}, env);
	}


	return { onAppUpdate : onAppUpdate,
				run : runTests };
})();


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runAPI;
}
