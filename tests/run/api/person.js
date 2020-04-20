import { api } from '../../api.js';
import { ApiRequestError } from '../../apirequesterror.js'
import { test } from '../../common.js';
import { App } from '../../app.js';


// Create person with specified params (name)
// And check expected state of app
export async function create(params)
{
	let person_id = 0;

	await test('Create person', async () =>
	{
		let expected = App.state.clone();
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

		person_id = (createRes) ? createRes.id : resExpected;

		await App.state.fetch();
		return App.state.meetExpectation(expected);
	}, App.environment);

	return person_id;
}


// Update person with specified params (name)
// And check expected state of app
export async function update(params)
{
	let updateRes = false;

	await test('Update person', async () =>
	{
		let expected = App.state.clone();
		let resExpected = expected.updatePerson(params);
		let updParams = (resExpected) ? expected.persons.getItem(params.id) : params;

		try
		{
			updateRes = await api.person.update(params.id, updParams);
			if (resExpected != updateRes)
				return false;
		}
		catch(e)
		{
			if (!(e instanceof ApiRequestError) || resExpected)
				throw e;
		}

		await App.state.fetch();
		return App.state.meetExpectation(expected);
	}, App.environment);

	return updateRes;
}


// Delete specified person(s)
// And check expected state of app
export async function del(ids)
{
	let deleteRes = false;

	await test('Delete person', async () =>
	{
		let expected = App.state.clone();
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

		await App.state.fetch();
		return App.state.meetExpectation(expected);
	}, App.environment);

	return deleteRes;
}
