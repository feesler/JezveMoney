import { api } from '../../api.js';


let runPersonAPI =
{
	/**
	 * Person tests
	 */

	// Create person with specified params (name)
	// And check expected state of app
	async createTest(params)
	{
		let env = this.environment;
		let test = this.test;
		let person_id = 0;

		await test('Create person', async () =>
		{
			let pBefore = await api.person.list();
			if (!Array.isArray(pBefore))
				return false;

			let expPersonObj = this.copyObject(params);

			let createRes = await api.person.create(params);
			if (!createRes || !createRes.id)
				return false;

			person_id = createRes.id;

			let pList = await api.person.list();
			if (!Array.isArray(pList))
				return false;

			if (pList.length != pBefore.length + 1)
				throw new Error('Length of persons list must increase');

			if (this.idSearch(pBefore, person_id))
				throw new Error('Already exist person returned');

			let personObj = this.idSearch(pList, person_id);

			return this.checkObjValue(personObj, expPersonObj);
		}, env);

		return person_id;
	},


	// Update person with specified params (name)
	// And check expected state of app
	async updateTest(id, params)
	{
		let env = this.environment;
		let test = this.test;
		let updateRes = false;

		await test('Update person', async () =>
		{
			let pBefore = await api.person.list();
			if (!Array.isArray(pBefore))
				return false;

			let origPerson = this.idSearch(pBefore, id);

			let expPersonObj = this.copyObject(origPerson);
			this.setParam(expPersonObj, params);

			let updateRes = await api.person.update(id, params);
			if (!updateRes)
				return false;

			let expPersonList = this.copyObject(pBefore);
			let pIndex = expPersonList.findIndex(item => item.id == expPersonObj.id);
			if (pIndex !== -1)
				expPersonList.splice(pIndex, 1, expPersonObj);

			let pList = await api.person.list();
			if (!Array.isArray(pList))
				return false;

			let personObj = this.idSearch(pList, id);

			let res = this.checkObjValue(personObj, expPersonObj) &&
						this.checkObjValue(pList, expPersonList);

			return res;
		}, env);

		return updateRes;
	},


	// Delete specified person(s)
	// And check expected state of app
	async deleteTest(ids)
	{
		let env = this.environment;
		let test = this.test;
		let deleteRes;

		await test('Delete person', async () =>
		{
			if (!Array.isArray(ids))
				ids = [ ids ];

			let accList = await api.account.list();
			if (!Array.isArray(accList))
				return false;
			let pBefore = await api.person.list();
			if (!Array.isArray(pBefore))
				return false;

			// Prepare expected updates of accounts list
			let expPersonList = this.copyObject(pBefore);
			let accRemoveList = [];
			for(let person_id of ids)
			{
				let pIndex = expPersonList.findIndex(item => item.id == person_id);
				if (pIndex !== -1)
				{
					if (Array.isArray(expPersonList[pIndex].accounts))
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
			let expTransList = this.run.api.account.onDelete(trBefore, accList, accRemoveList);

			// Send API sequest to server
			deleteRes = await api.person.del(ids);
			if (!deleteRes)
				throw new Error('Fail to delete person(s)');

			let pList = await api.person.list();
			let trList = await api.transaction.list();

			let res = this.checkObjValue(pList, expPersonList) &&
						this.checkObjValue(trList, expTransList);

			return res;
		}, env);

		return deleteRes;
	}
};


export { runPersonAPI };

