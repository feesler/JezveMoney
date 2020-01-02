import { api } from '../../api.js';


var runPersonAPI = (function()
{
	let env = null;
	let app = null;
	let test = null;


	function setupEnvironment(e, App)
	{
		if (!e || !App)
			throw new Error('Unexpected setup');

		env = e;
		app = App;
		test = app.test;
	}


	/**
	 * Person tests
	 */

	// Create person with specified params (name)
	// And check expected state of app
	async function apiCreatePersonTest(params)
	{
		let person_id = 0;

		await test('Create person', async () =>
		{
			let pBefore = await api.person.list();
			if (!app.isArray(pBefore))
				return false;

			let expPersonObj = app.copyObject(params);

			let createRes = await api.person.create(params);
			if (!createRes || !createRes.id)
				return false;

			person_id = createRes.id;

			let pList = await api.person.list();
			if (!app.isArray(pList))
				return false;

			if (pList.length != pBefore.length + 1)
				throw new Error('Length of persons list must increase');

			if (app.idSearch(pBefore, person_id))
				throw new Error('Already exist person returned');

			let personObj = app.idSearch(pList, person_id);

			return app.checkObjValue(personObj, expPersonObj);
		}, env);

		return person_id;
	}


	// Update person with specified params (name)
	// And check expected state of app
	async function apiUpdatePersonTest(id, params)
	{
		let updateRes = false;

		await test('Update person', async () =>
		{
			let pBefore = await api.person.list();
			if (!app.isArray(pBefore))
				return false;

			let origPerson = app.idSearch(pBefore, id);

			let expPersonObj = app.copyObject(origPerson);
			app.setParam(expPersonObj, params);

			let updateRes = await api.person.update(id, params);
			if (!updateRes)
				return false;

			let expPersonList = app.copyObject(pBefore);
			let pIndex = expPersonList.findIndex(item => item.id == expPersonObj.id);
			if (pIndex !== -1)
				expPersonList.splice(pIndex, 1, expPersonObj);

			let pList = await api.person.list();
			if (!app.isArray(pList))
				return false;

			let personObj = app.idSearch(pList, id);

			let res = app.checkObjValue(personObj, expPersonObj) &&
						app.checkObjValue(pList, expPersonList);

			return res;
		}, env);

		return updateRes;
	}


	// Delete specified person(s)
	// And check expected state of app
	async function apiDeletePersonTest(ids)
	{
		let deleteRes;

		await test('Delete person', async () =>
		{
			if (!app.isArray(ids))
				ids = [ ids ];

			let accList = await api.account.list();
			if (!app.isArray(accList))
				return false;
			let pBefore = await api.person.list();
			if (!app.isArray(pBefore))
				return false;

			// Prepare expected updates of accounts list
			let expPersonList = app.copyObject(pBefore);
			let accRemoveList = [];
			for(let person_id of ids)
			{
				let pIndex = expPersonList.findIndex(item => item.id == person_id);
				if (pIndex !== -1)
				{
					if (app.isArray(expPersonList[pIndex].accounts))
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
			let expTransList = app.run.api.account.onDelete(trBefore, accList, accRemoveList);

			// Send API sequest to server
			deleteRes = await api.person.del(ids);
			if (!deleteRes)
				throw new Error('Fail to delete person(s)');

			let pList = await api.person.list();
			let trList = await api.transaction.list();

			let res = app.checkObjValue(pList, expPersonList) &&
						app.checkObjValue(trList, expTransList);

			return res;
		}, env);

		return deleteRes;
	}


	return { setEnv : setupEnvironment,
				createTest : apiCreatePersonTest,
	 			updateTest : apiUpdatePersonTest,
				deleteTest : apiDeletePersonTest };
})();


export { runPersonAPI };

