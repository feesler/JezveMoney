if (typeof module !== 'undefined' && module.exports)
{
	var api = require('../../api.js');
}
else
{
	var api = apiModule;
}


var runTransactionAPI = (function()
{
	let env = null;
	let App = null;


	function setupEnvironment(e, app)
	{
		if (!e || !app)
			throw new Error('Unexpected setup');

		env = e;
		App = app;
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
		let checkList = (cmpDate) ? trList.filter(item => convDate(item.date) <= cmpDate) : trList;

		let res = checkList.reduce((r, item) => Math.max(r, (item.pos) ? item.pos : 0), 0);

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
	function applyTransaction(accList, transObj)
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


	// Cancel transaction to accounts
	function cancelTransaction(accList, transObj)
	{
		let res = App.copyObject(accList);

		let srcAcc = App.idSearch(res, transObj.src_id);
		if (srcAcc)
			srcAcc.balance += transObj.src_amount;

		let destAcc = App.idSearch(res, transObj.dest_id);
		if (destAcc)
			destAcc.balance -= transObj.dest_amount;

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


	// Create transaction with specified params
	// (transtype, src_id, dest_id, src_amount, dest_amount, src_curr, dest_curr, date, comm)
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
			let expTrans = await getExpectedTransaction(params);
			expTrans.pos = 0;

			// Prepare expected updates of accounts
			let accBefore = await api.account.list();
			let expAccountList = applyTransaction(accBefore, expTrans);

			// Send API sequest to server
			let createRes = await api.transaction.create(params);
			if (!createRes || !createRes.id)
				return false;

			expTrans.id = transaction_id = createRes.id;

			// Prepare expected updates of transactions
			let expTransList = App.copyObject(trBefore);
			expTransList.push(expTrans);

			let trPos = getExpectedPos(expTransList, params);
			updatePos(expTransList, transaction_id, trPos);

			expTransList.sort((a, b) => a.pos - b.pos);


			let trList = await api.transaction.list();
			let accList = await api.account.list();
			let transObj = App.idSearch(trList, transaction_id);

			let res = App.checkObjValue(transObj, expTrans) &&
						App.checkObjValue(trList, expTransList) &&
						App.checkObjValue(accList, expAccountList);

			return res;
		}, env);

		return transaction_id;
	}


	async function createExpenseTest(params)
	{
		return apiCreateTransactionTest(await api.transaction.expense(params));
	}


	async function createIncomeTest(params)
	{
		return apiCreateTransactionTest(await api.transaction.income(params));
	}


	async function createTransferTest(params)
	{
		return apiCreateTransactionTest(await api.transaction.transfer(params));
	}


	async function createDebtTest(params)
	{
		return apiCreateTransactionTest(await api.transaction.debt(params));
	}


	// Update transaction with specified params
	// (transtype, src_id, dest_id, src_amount, dest_amount, src_curr, dest_curr, date, comm)
	async function apiUpdateTransactionTest(params)
	{
		let updateRes;

		let accBefore = await api.account.list();

		let trList = await api.transaction.read(params.id);
		let origTrans = trList[0];
		let updParams = App.copyObject(origTrans);

		updParams.transtype = updParams.type;
		delete updParams.type;

		let origDate = new Date(updParams.date);
		updParams.date = App.formatDate(origDate);

		let fullAccList = await api.account.list(true);

		let srcAcc = App.idSearch(fullAccList, updParams.src_id);
		let destAcc = App.idSearch(fullAccList, updParams.dest_id);

		let isDebt = (updParams.transtype == App.DEBT);
		if (isDebt)
		{
			if (srcAcc && srcAcc.owner_id != App.user_id)
			{
				updParams.debtop = 1;
				updParams.person_id = srcAcc.owner_id;
				updParams.acc_id = (destAcc) ? destAcc.id : 0;
			}
			else if (destAcc && destAcc.owner_id != App.user_id)
			{
				updParams.debtop = 2;
				updParams.person_id = destAcc.owner_id;
				updParams.acc_id = (srcAcc) ? srcAcc.id : 0;
			}

			delete updParams.src_id;
			delete updParams.dest_id;
		}

		updParams.comm = updParams.comment;
		delete updParams.comment;

		App.setParam(updParams, params);

		// Synchronize currencies with accounts
		if (isDebt)
		{
			if (updParams.acc_id && updParams.acc_id != origTrans.acc_id)
			{
				let acc = App.idSearch(fullAccList, updParams.acc_id);
				if (updParams.debtop == 1)
					updParams.dest_curr = acc.curr_id;
				else
					updParams.src_curr = acc.curr_id;
			}
		}
		else
		{
			if (updParams.src_id && updParams.src_id != origTrans.src_id)
			{
				let acc = App.idSearch(fullAccList, updParams.src_id);
				updParams.src_curr = acc.curr_id;
			}

			if (updParams.dest_id && updParams.dest_id != origTrans.dest_id)
			{
				let acc = App.idSearch(fullAccList, updParams.dest_id);
				updParams.dest_curr = acc.curr_id;
			}
		}

		await App.test('Update transaction', async () =>
		{
			let trBefore = await api.transaction.list();
			let origTrans = App.idSearch(trBefore, updParams.id);

			// Prepare expected transaction object
			let expTrans = await getExpectedTransaction(updParams);
			expTrans.pos = origTrans.pos;

			// Prepare expected updates of accounts
			let accCanceled = cancelTransaction(accBefore, origTrans);
			let expAccountList = applyTransaction(accCanceled, expTrans);

			// Send API sequest to server
			updateRes = await api.transaction.update(updParams);
			if (!updateRes)
				return false;

			// Prepare expected updates of transactions
			let expTransList = App.copyObject(trBefore);
			let trIndex = expTransList.findIndex(item => item.id == expTrans.id);
			if (trIndex !== -1)
				expTransList.splice(trIndex, 1, expTrans);

			if (origTrans.date != expTrans.date)
			{
				expTrans.pos = 0;
				let newPos = getExpectedPos(expTransList, updParams);
				updatePos(expTransList, expTrans.id, newPos);
				expTransList.sort((a, b) => a.pos - b.pos);
			}

			let trList = await api.transaction.list();
			let accList = await api.account.list();
			let transObj = App.idSearch(trList, updParams.id);

			let res = App.checkObjValue(transObj, expTrans) &&
						App.checkObjValue(trList, expTransList) &&
						App.checkObjValue(accList, expAccountList);

			return res;
		}, env);

		return updateRes;
	}


	// Delete specified transaction(s)
	// And check expected state of app
	async function apiDeleteTransactionTest(ids)
	{
		let deleteRes;

		await App.test('Delete transaction', async () =>
		{
			if (!App.isArray(ids))
				ids = [ ids ];

			let trBefore = await api.transaction.list();
			let accBefore = await api.account.list();
			if (!App.isArray(trBefore))
				return false;

			// Prepare expected updates of transactions list
			let expTransList = App.copyObject(trBefore);
			let expAccList = App.copyObject(accBefore);
			for(let tr_id of ids)
			{
				let trIndex = expTransList.findIndex(item => item.id == tr_id);
				if (trIndex !== -1)
					expTransList.splice(trIndex, 1);

				expAccList = cancelTransaction(expAccList, App.idSearch(trBefore, tr_id));
			}

			// Send API sequest to server
			deleteRes = await api.transaction.del(ids);
			if (!deleteRes)
				throw new Error('Fail to delete account(s)');

			let accList = await api.account.list();
			let trList = await api.transaction.list();

			let res = App.checkObjValue(accList, expAccList) &&
						App.checkObjValue(trList, expTransList);

			return res;
		}, env);

		return deleteRes;
	}


	return { setEnv : setupEnvironment,
				createTest : apiCreateTransactionTest,
				createExpenseTest,
				createIncomeTest,
				createTransferTest,
				createDebtTest,
	 			updateTest : apiUpdateTransactionTest,
				deleteTest : apiDeleteTransactionTest };
})();


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runTransactionAPI;
}
