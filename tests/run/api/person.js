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
			let pBefore = await this.state.getPersonsList();
			if (!Array.isArray(pBefore))
				return false;

			let expPersonObj = this.copyObject(params);

			this.state.persons = null;

			let createRes = await api.person.create(params);
			if (!createRes || !createRes.id)
				return false;

			person_id = createRes.id;

			let pList = await this.state.getPersonsList();
			if (!Array.isArray(pList))
				return false;

			if (pList.length != pBefore.length + 1)
				throw new Error('Length of persons list must increase');

			if (pBefore.find(item => item.id == person_id))
				throw new Error('Already exist person returned');

			let personObj = pList.find(item => item.id == person_id);

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
			let pBefore = await this.state.getPersonsList();
			if (!Array.isArray(pBefore))
				return false;

			let origPerson = pBefore.find(item => item.id == id);

			let expPersonObj = this.copyObject(origPerson);
			this.setParam(expPersonObj, params);

			this.state.persons = null;

			let updateRes = await api.person.update(id, params);
			if (!updateRes)
				return false;

			let expPersonList = this.copyObject(pBefore);
			let pIndex = expPersonList.findIndex(item => item.id == expPersonObj.id);
			if (pIndex !== -1)
				expPersonList.splice(pIndex, 1, expPersonObj);

			let pList = await this.state.getPersonsList();
			if (!Array.isArray(pList))
				return false;

			let personObj = pList.find(item => item.id == id);

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

			let accList = await this.state.getAccountsList();
			if (!Array.isArray(accList))
				return false;
			let pBefore = await this.state.getPersonsList();
			if (!Array.isArray(pBefore))
				return false;

			// Prepare expected updates of accounts list
			let expPersonList = this.state.deleteByIds(pBefore, ids);
			let accRemoveList = pBefore.filter(item => Array.isArray(item.accounts) && ids.includes(item.id))
										.flatMap(item => item.accounts)
										.map(item => item.id);

			// Prepare expected updates of transactions
			let trBefore = await this.state.getTransactionsList();
			let expTransList = trBefore.deleteAccounts(accList, accRemoveList);

			this.state.accounts = null;
			this.state.persons = null;
			this.state.transactions = null;

			// Send API sequest to server
			deleteRes = await api.person.del(ids);
			if (!deleteRes)
				throw new Error('Fail to delete person(s)');

			let pList = await this.state.getPersonsList();
			let trList = await this.state.getTransactionsList();

			let res = this.checkObjValue(pList, expPersonList) &&
						this.checkObjValue(trList.list, expTransList.list);

			return res;
		}, env);

		return deleteRes;
	}
};


export { runPersonAPI };
