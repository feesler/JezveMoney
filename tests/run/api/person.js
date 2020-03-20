import { api } from '../../api.js';
import { ApiRequestError } from '../../apirequesterror.js'
import {
	isObject,
	test,
	setParam,
	copyObject,
	checkObjValue
} from '../../common.js';


let runPersonAPI =
{
	async checkCorrectness(params, id)
	{
		if (!isObject(params))
			return false;

		if (typeof params.name !== 'string' || params.name == '')
			return false;

		// Check there is no person with same name
		let personsList = await this.state.getPersonsList();
		let lname = params.name.toLowerCase();
		let personObj = personsList.find(item => item.name.toLowerCase() == lname);
		if (personObj && (!id || id && id != personObj.id))
			return false;

		return true;
	},


	/**
	 * Person tests
	 */

	// Create person with specified params (name)
	// And check expected state of app
	async createTest(params)
	{
		let scope = this.run.api.person;
		let person_id = 0;

		await test('Create person', async () =>
		{
			let pBefore = await this.state.getPersonsList();
			if (!Array.isArray(pBefore))
				return false;

			let resExpected = await scope.checkCorrectness(params);

			let expPersonObj = copyObject(params);

			this.state.cleanCache();

			let createRes;
			try
			{
				createRes = await api.person.create(params);
				if (resExpected && (!createRes || !createRes.id))
					return false;
			}
			catch(e)
			{
				if (!(e instanceof ApiRequestError) || resExpected)
					throw e;
			}

			let expPersonList = copyObject(pBefore);
			if (resExpected)
			{
				expPersonList.push(expPersonObj);
				person_id = createRes.id;
			}

			let pList = await this.state.getPersonsList();

			return checkObjValue(pList, expPersonList);
		}, this.environment);

		return person_id;
	},


	// Update person with specified params (name)
	// And check expected state of app
	async updateTest(id, params)
	{
		let scope = this.run.api.person;
		let updateRes = false;
		let resExpected;

		await test('Update person', async () =>
		{
			let pBefore = await this.state.getPersonsList();
			if (!Array.isArray(pBefore))
				return false;

			let origPerson = pBefore.find(item => item.id == id);
			let expPersonObj;
			if (origPerson)
			{
				expPersonObj = copyObject(origPerson);
				setParam(expPersonObj, params);
			}

			if (origPerson)
				resExpected = await scope.checkCorrectness(params, id);
			else
				resExpected = false;

			this.state.cleanCache();

			let updateRes;
			try
			{
				updateRes = await api.person.update(id, params);
				if (resExpected != updateRes)
					return false;
			}
			catch(e)
			{
				if (!(e instanceof ApiRequestError) || resExpected)
					throw e;
			}

			let expPersonList = copyObject(pBefore);
			if (resExpected)
			{
				let pIndex = expPersonList.findIndex(item => item.id == expPersonObj.id);
				if (pIndex !== -1)
					expPersonList.splice(pIndex, 1, expPersonObj);
			}

			let pList = await this.state.getPersonsList();

			return checkObjValue(pList, expPersonList);
		}, this.environment);

		return updateRes;
	},


	// Delete specified person(s)
	// And check expected state of app
	async deleteTest(ids)
	{
		let deleteRes;
		let resExpected = true;

		await test('Delete person', async () =>
		{
			if (!Array.isArray(ids))
				ids = [ ids ];

			let pBefore = await this.state.getPersonsList();
			if (!Array.isArray(pBefore))
				return false;

			for(let person_id of ids)
			{
				if (!pBefore.find(item => item.id == person_id))
				{
					resExpected = false;
					break;
				}
			}

			// Prepare expected updates of accounts list
			let expPersonList;
			let expTransList = await this.state.getTransactionsList();
			if (resExpected)
			{
				expPersonList = this.state.deleteByIds(pBefore, ids);
				let accRemoveList = pBefore.filter(item => Array.isArray(item.accounts) && ids.includes(item.id))
											.flatMap(item => item.accounts)
											.map(item => item.id);

				// Prepare expected updates of transactions
				let accList = await this.state.getAccountsList();
				expTransList = expTransList.deleteAccounts(accList, accRemoveList)
											.updateResults(accList);
			}
			else
			{
				expPersonList = copyObject(pBefore);
			}

			this.state.cleanCache();

			// Send API sequest to server
			try
			{
				deleteRes = await api.person.del(ids);
				if (resExpected != deleteRes)
					return false;
			}
			catch(e)
			{
				if (!(e instanceof ApiRequestError) || resExpected)
					throw e;
			}

			let pList = await this.state.getPersonsList();
			let trList = await this.state.getTransactionsList();

			let res = checkObjValue(pList, expPersonList) &&
						checkObjValue(trList.list, expTransList.list);

			return res;
		}, this.environment);

		return deleteRes;
	}
};


export { runPersonAPI };
