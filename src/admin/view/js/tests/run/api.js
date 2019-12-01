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


	function convDate(dateStr)
	{
		return (dateStr) ? Date.parse(dateStr.split('.').reverse().join('-')) : null;
	}


	function getExpectedPos(trList, params)
	{
		let pos = getLastestPos(trList, params.date);

		return pos + 1;
	}


	function getLastestPos(trList, date = null)
	{
		let cmpDate = convDate(date);
		let checkList = (cmpDate) ? trList.filter(item => convDate(item.date) == cmpDate) : trList;

		let res = checkList.reduce((r, item) => Math.max(r, item.pos), 0);

		return res;
	}


	function updatePos(trList, item_id, pos)
	{
		let trObj = App.idSearch(trList, item_id);
		if (!trObj)
			throw new Error('Transaction ' + item_id + ' not found');

		let oldPos = trObj.pos;
		if (oldPos == pos)
			return;

		if (trList.find(item => item.pos == pos))
		{
			for(let item of trList)
			{
				if (oldPos == 0)			// insert with specified position
				{
					if (item.pos >= pos)
						item.pos += 1;
				}
				else if (pos < oldPos)		// moving up
				{
					if (item.pos >= pos && item.pos < oldPos)
						item.pos += 1;
				}
				else if (pos > oldPos)		// moving down
				{
					if (item.pos > oldPos && item.pos <= pos)
						item.pos -= 1;
				}
			}
		}

		trObj.pos = pos;
	}


	// Apply transaction to accounts
	function getExpectedAccounts(accList, transObj)
	{
		let res = App.copyObject(accList);

		let srcAcc = App.idSearch(res, transObj.src_id);
		if (srcAcc)
			srcAcc.balance -= transObj.src_amount;

		let destAcc = App.idSearch(res, transObj.dest_id);
		if (destAcc)
			destAcc.balance += transObj.dest_amount;

		return res;
	}


	async function getExpectedTransaction(params)
	{
		let res = App.copyObject(params);

		let isDebt = (res.transtype == App.DEBT);
		if (isDebt)
		{
			let personObj = await api.person.read(res.person_id);
			if (!personObj)
				throw new Error('Person not found');

			if (!personObj.accounts)
				personObj.accounts = [];

			let reqCurr = (res.debtop == 1) ? res.src_curr : res.dest_curr;
			let personAcc = (personObj.accounts) ? personObj.accounts.find(item => item.curr_id == reqCurr) : null;

			if (res.debtop == 1)
			{
				if (personAcc)
					res.src_id = personAcc.id;
				res.dest_id = res.acc_id;
			}
			else
			{
				res.src_id = res.acc_id;
				if (personAcc)
					res.dest_id = personAcc.id;
			}

			delete res.debtop;
			delete res.person_id;
			delete res.acc_id;
		}

		res.type = res.transtype;
		delete res.transtype;

		res.comment = res.comm;
		delete res.comm;

		return res;
	}


	// Create person with specified params (name)
	// And check expected state of app
	async function apiCreateTransactionTest(params)
	{
		let transaction_id = 0;

		if (!params.date)
			params.date = App.formatDate(new Date());
		if (!params.comm)
			params.comm = '';

		await App.test('Create transaction', async () =>
		{
			let trBefore = await api.transaction.list();
			if (!App.isArray(trBefore))
				return false;

			// Prepare expected transaction object
			let expTransObj = await getExpectedTransaction(params);
			expTransObj.pos = getExpectedPos(trBefore, params);

			// Prepare expected updates of accounts
			let accBefore = await api.account.list();
			let expAccountList = getExpectedAccounts(accBefore, expTransObj);

			// Send API sequest to server
			let createRes = await api.transaction.create(params);
			if (!createRes || !createRes.id)
				return false;

			expTransObj.id = transaction_id = createRes.id;

			// Prepare expected updates of transactions
			let expTransList = App.copyObject(trBefore);
			expTransList.push(expTransObj);
			updatePos(expTransList, transaction_id, expTransObj.pos);

			let trList = await api.transaction.list();
			let accList = await api.account.list();
			let transObj = App.idSearch(trList, transaction_id);

			return App.checkObjValue(transObj, expTransObj) &&
					App.checkObjValue(trList, expTransList) &&
					App.checkObjValue(accList, expAccountList);
		}, env);

		return transaction_id;
	}


	async function createExpenseTest(params)
	{
		params.transtype = App.EXPENSE;
		params.dest_id = 0;

		if (!params.dest_amount)
			params.dest_amount = params.src_amount;

		let accList = await api.account.list();
		let acc = App.idSearch(accList, params.src_id);
		params.src_curr = acc.curr_id;

		if (!params.dest_curr)
			params.dest_curr = params.src_curr;

		return apiCreateTransactionTest(params);
	}


	async function createIncomeTest(params)
	{
		params.transtype = App.INCOME;
		params.src_id = 0;

		if (!params.src_amount)
			params.src_amount = params.dest_amount;

		let accList = await api.account.list();
		let acc = App.idSearch(accList, params.dest_id);
		params.dest_curr = acc.curr_id;

		if (!params.src_curr)
			params.src_curr = params.dest_curr;

		return apiCreateTransactionTest(params);
	}


	async function createTransferTest(params)
	{
		params.transtype = App.TRANSFER;

		if (!params.dest_amount)
			params.dest_amount = params.src_amount;

		let accList = await api.account.list();

		let srcAcc = App.idSearch(accList, params.src_id);
		params.src_curr = srcAcc.curr_id;

		let destAcc = App.idSearch(accList, params.dest_id);
		params.dest_curr = destAcc.curr_id;

		if (!params.src_curr)
			params.src_curr = params.dest_curr;

		return apiCreateTransactionTest(params);
	}


	async function createDebtTest(params)
	{
		params.transtype = App.DEBT;

		if (!params.dest_amount)
			params.dest_amount = params.src_amount;

		let accList = await api.account.list();

		let acc = App.idSearch(accList, params.acc_id);
		if (acc)
			params.src_curr = params.dest_curr = acc.curr_id;
		else
			params.src_curr = params.dest_curr = (params.src_curr || params.dest_curr);

		return apiCreateTransactionTest(params);
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

		let ACC_RUB = await apiCreateAccountTest({ name : 'acc ru', currency : RUB, balance : 100, icon : 1 });
		let CASH_RUB = await apiCreateAccountTest({ name : 'cash ru', currency : RUB, balance : 5000, icon : 3 });
		let ACC_USD = await apiCreateAccountTest({ name : 'acc usd', currency : USD, balance : 10.5, icon : 5 });


		env.setBlock('Persons', 1);

		await App.test('Persons list', async () => {
			let pList = await api.person.list();

			return App.isArray(pList);
		}, env);

		let PERSON_X = await apiCreatePersonTest({ name : 'Person X' });
		let PERSON_Y = await apiCreatePersonTest({ name : 'Y' });


		let now = new Date();

		env.setBlock('Transactions', 1);

		await App.test('Transactions list', async () => {
			let trList = await api.transaction.list();

			return App.isArray(trList) && trList.length == 0;
		}, env);



		const TR_EXPENSE_1 = await createExpenseTest({ src_id : ACC_RUB,
														src_amount : 100 });

		const TR_EXPENSE_2 = await createExpenseTest({ src_id : ACC_RUB,
														src_amount : 100,
														dest_amount : 7608,
														dest_curr : EUR });

		const TR_EXPENSE_3 = await createExpenseTest({ src_id : ACC_USD,
														src_amount : 1 });

		const TR_INCOME_1 = await createIncomeTest({ dest_id : ACC_RUB,
														dest_amount : 1000.50 });

		const TR_INCOME_2 = await createIncomeTest({ dest_id : ACC_USD,
													 	src_amount : 6500,
													 	dest_amount : 100,
														dest_curr : RUB });


		const TR_TRANSFER_1 = await createTransferTest({ src_id : ACC_RUB,
															dest_id : CASH_RUB,
														 	src_amount : 500,
														 	dest_amount : 500 });

		const TR_TRANSFER_2 = await createTransferTest({ src_id : ACC_RUB,
															dest_id : ACC_USD,
														 	src_amount : 6500,
														 	dest_amount : 100 });

		const TR_DEBT_1 = await createDebtTest({ debtop : 1,
													person_id : PERSON_X,
													acc_id : CASH_RUB,
												 	src_amount : 500 });

		const TR_DEBT_2 = await createDebtTest({ debtop : 2,
													person_id : PERSON_Y,
													acc_id : CASH_RUB,
												 	src_amount : 1000 });

		const TR_DEBT_3 = await createDebtTest({ debtop : 1,
													person_id : PERSON_X,
													acc_id : 0,
												 	src_amount : 500,
													src_curr : RUB });

		const TR_DEBT_4 = await createDebtTest({ debtop : 2,
													person_id : PERSON_Y,
													acc_id : 0,
												 	src_amount : 1000,
													src_curr : USD });

	}


	return { onAppUpdate : onAppUpdate,
				run : runTests };
})();


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runAPI;
}
