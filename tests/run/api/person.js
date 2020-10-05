import { api, ApiRequestError } from '../../model/api.js';
import { test, formatProps } from '../../common.js';
import { App } from '../../app.js';


/**
 * Create person with specified params and check expected state of app
 * @param {Object} params
 * @param {string} params.name - name of person
 */
export async function create(params)
{
	let person_id = 0;

	await test(`Create person (${formatProps(params)})`, async () =>
	{
		let createRes = null;
		let resExpected = App.state.createPerson(params);
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

		person_id = (createRes) ? createRes.id : resExpected;

		return App.state.fetchAndTest();
	});

	return person_id;
}


/**
 * Update person with specified params and check expected state of app
 * @param {Object} params
 * @param {string} params.id - person identifier
 * @param {string} params.name - name of person
 */
export async function update(params)
{
	let updateRes = false;

	await test(`Update person (${formatProps(params)})`, async () =>
	{
		let resExpected = App.state.updatePerson(params);
		let updParams = (resExpected) ? App.state.persons.getItem(params.id) : params;

		try
		{
			updateRes = await api.person.update(updParams);
			if (resExpected != updateRes)
				return false;
		}
		catch(e)
		{
			if (!(e instanceof ApiRequestError) || resExpected)
				throw e;
		}

		return App.state.fetchAndTest();
	});

	return updateRes;
}


/**
 * Delete specified person(s) and check expected state of app
 * @param {number[]} ids - array of person identificators
 */
export async function del(ids)
{
	let deleteRes = false;

	await test(`Delete person (${ids})`, async () =>
	{
		let resExpected = App.state.deletePersons(ids);

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

		return App.state.fetchAndTest();
	});

	return deleteRes;
}
