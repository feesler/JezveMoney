if (typeof module !== 'undefined' && module.exports)
{
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


	// Create person with specified params (name)
	// And check expected state of app
	async function apiCreatePersonTest(params)
	{
		let person_id = 0;

		await App.test('Create person', async () =>
		{
			let pBefore = await api.person.list();
			if (!App.isArray(pBefore))
				return false;

			let expPersonObj = App.copyObject(params);

			let createRes = await api.person.create(params);
			if (!createRes || !createRes.id)
				return false;

			person_id = createRes.id;

			let pList = await api.person.list();
			if (!App.isArray(pList))
				return false;

			if (pList.length != pBefore.length + 1)
				throw new Error('Length of persons list must increase');

			if (App.idSearch(pBefore, person_id))
				throw new Error('Already exist person returned');

			let personObj = App.idSearch(pList, person_id);

			return App.checkObjValue(personObj, expPersonObj);
		}, env);

		return person_id;
	}


	async function runTests(view, App)
	{
		console.log('api.run()');
		env = view.props.environment;

		api.setEnv(env, App);

		await App.test('Login user', () => api.user.login('test', 'test'), env);

		await App.test('Reset all data', async () => {
			return await api.profile.reset();
		}, env);

		env.setBlock('Accounts', 1);

		await App.test('Reset accounts', async () => {
			return await api.account.reset();
		}, env);

		await App.test('Accounts list', async () => {
			let accList = await api.account.list();

			return App.isArray(accList) && accList.length == 0;
		}, env);

		const RUB = 1;
		const USD = 2;
		const EUR = 3;

		let ACC_RU = await apiCreateAccountTest({ name : 'acc ru', currency : RUB, balance : 100, icon : 1 });
		let ACC_USD = await apiCreateAccountTest({ name : 'acc usd', currency : USD, balance : 10.5, icon : 5 });


		env.setBlock('Persons', 1);

		await App.test('Persons list', async () => {
			let pList = await api.person.list();

			return App.isArray(pList);
		}, env);

		let PERSON_X = await apiCreatePersonTest({ name : 'Person X' });
		let PERSON_Y = await apiCreatePersonTest({ name : 'Y' });


		env.setBlock('Transactions', 1);

		await App.test('Transactions list', async () => {
			let trList = await api.transaction.list();

			return App.isArray(trList) && trList.length == 0;
		}, env);
	}


	return { onAppUpdate : onAppUpdate,
				run : runTests };
})();


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runAPI;
}
