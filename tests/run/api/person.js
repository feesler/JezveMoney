import { api } from '../../api.js';
import { ApiRequestError } from '../../apirequesterror.js'
import {
	isObject,
	test,
	setParam,
	copyObject,
	checkObjValue
} from '../../common.js';
import { AppState } from '../../state.js';


export const runPersonAPI =
{
	/**
	 * Person tests
	 */

	// Create person with specified params (name)
	// And check expected state of app
	async createTest(params)
	{
		let person_id = 0;

		await test('Create person', async () =>
		{
			let expected = new AppState;
			await expected.fetch();
			let resExpected = expected.createPerson(params);

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

			if (createRes)
				person_id = createRes.id;
			else
				person_id = resExpected;

			await this.state.fetch();

			return this.state.meetExpectation(expected);
		}, this.environment);

		return person_id;
	},


	// Update person with specified params (name)
	// And check expected state of app
	async updateTest(id, params)
	{
		let updateRes = false;

		await test('Update person', async () =>
		{
			let expected = new AppState;
			await expected.fetch();

			params.id = id;
			let resExpected = expected.updatePerson(params);
			let updParams = (resExpected) ? expected.persons.getItem(id) : params;

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

			await this.state.fetch();

			return this.state.meetExpectation(expected);
		}, this.environment);

		return updateRes;
	},


	// Delete specified person(s)
	// And check expected state of app
	async deleteTest(ids)
	{
		let deleteRes = false;

		await test('Delete person', async () =>
		{
			let expected = new AppState;
			await expected.fetch();

			let resExpected = expected.deletePersons(ids);

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

			await this.state.fetch();

			return this.state.meetExpectation(expected);
		}, this.environment);

		return deleteRes;
	}
};
