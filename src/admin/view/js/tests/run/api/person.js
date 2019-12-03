if (typeof module !== 'undefined' && module.exports)
{
	var api = require('../../api.js');
}
else
{
	var api = apiModule;
}


var runPersonAPI = (function()
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


	/**
	 * Person tests
	 */

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


	// Update person with specified params (name)
	// And check expected state of app
	async function apiUpdatePersonTest(id, params)
	{
		let updateRes = false;

		await App.test('Update person', async () =>
		{
			let pBefore = await api.person.list();
			if (!App.isArray(pBefore))
				return false;

			let origPerson = App.idSearch(pBefore, id);

			let expPersonObj = App.copyObject(origPerson);
			App.setParam(expPersonObj, params);

			let updateRes = await api.person.update(id, params);
			if (!updateRes)
				return false;

			let expPersonList = App.copyObject(pBefore);
			let pIndex = expPersonList.findIndex(item => item.id == expPersonObj.id);
			if (pIndex !== -1)
				expPersonList.splice(pIndex, 1, expPersonObj);

			let pList = await api.person.list();
			if (!App.isArray(pList))
				return false;

			let personObj = App.idSearch(pList, id);

			let res = App.checkObjValue(personObj, expPersonObj) &&
						App.checkObjValue(pList, expPersonList);

			return res;
		}, env);

		return updateRes;
	}


	// Delete specified person(s)
	// And check expected state of app
	async function apiDeletePersonTest(ids)
	{
		let deleteRes;

		await App.test('Delete person', async () =>
		{
			if (!App.isArray(ids))
				ids = [ ids ];

			let accList = await api.account.list();
			if (!App.isArray(accList))
				return false;
			let pBefore = await api.person.list();
			if (!App.isArray(pBefore))
				return false;

			// Prepare expected updates of accounts list
			let expPersonList = App.copyObject(pBefore);
			let accRemoveList = [];
			for(let person_id of ids)
			{
				let pIndex = expPersonList.findIndex(item => item.id == person_id);
				if (pIndex !== -1)
				{
					if (App.isArray(expPersonList[pIndex].accounts))
					{
						for(let personAcc of expPersonList[pIndex].accounts)
						{
							accRemoveList.push(personAcc.id);
						}
					}
					expPersonList.splice(pIndex, 1);
				}
			}

			// Prepare expected updates of transactions
			let trBefore = await api.transaction.list();
			let expTransList = App.run.api.account.onDelete(trBefore, accList, accRemoveList);
			expTransList.sort((a, b) => a.pos - b.pos);

			// Send API sequest to server
			deleteRes = await api.person.del(ids);
			if (!deleteRes)
				throw new Error('Fail to delete person(s)');

			let pList = await api.person.list();
			let trList = await api.transaction.list();

			let res = App.checkObjValue(pList, expPersonList) &&
						App.checkObjValue(trList, expTransList);

			return res;
		}, env);

		return deleteRes;
	}


	return { setEnv : setupEnvironment,
				createTest : apiCreatePersonTest,
	 			updateTest : apiUpdatePersonTest,
				deleteTest : apiDeletePersonTest };
})();


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runPersonAPI;
}
