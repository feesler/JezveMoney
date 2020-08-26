import { test, setParam } from '../common.js';
import { PersonsView } from '../view/persons.js';
import { MainView } from '../view/main.js';
import { App } from '../app.js';


// From persons list view go to new person view, input name and submit
// Next check name result and callback
export async function create(params)
{
	// Navigate to create person view
	if (!(App.view instanceof PersonsView))
	{
		await App.goToMainView();
		await App.view.goToPersons();
	}
	await App.view.goToCreatePerson();

	App.state.createPerson(params);

	await App.view.createPerson(params.name);

	App.view.expectedState = PersonsView.render(App.state);
	await test(`Create person ({ name : ${params.name} })`, () => App.view.checkState());

	await App.state.fetch();
}


export async function update(params)
{
	if (!params)
		throw new Error('No params specified');

	let pos;
	if ('id' in params)
	{
		pos = App.state.persons.getIndexOf(params.id);
	}
	else
	{
		pos = parseInt(params.pos);
		if (isNaN(pos))
			throw new Error('Position of person not specified');
		delete params.pos;
	}

	// Navigate to update person view
	if (!(App.view instanceof PersonsView))
	{
		await App.goToMainView();
		await App.view.goToPersons();
	}
	await App.view.goToUpdatePerson(pos);

	let ids = getPersonsByIndexes(pos);
	let expectedPerson = App.state.persons.getItem(ids[0]);
	if (!expectedPerson)
		throw new Error('Can not find specified person');

	App.view.expectedState = { visibility : { name : true },
								values : { name : expectedPerson.name } };
	await test('Update person view state', () => App.view.checkState());

	await App.view.inputName(params.name);

	await App.view.navigation(() => App.view.click(App.view.content.submitBtn));

	// Check updates in the person tiles
	setParam(expectedPerson, params);
	App.state.updatePerson(expectedPerson);

	App.view.expectedState = PersonsView.render(App.state);
	await test(`Update person [${pos}]`, () => App.view.checkState());

	await App.state.fetch();
}


export async function del(persons)
{
	// Navigate to persons list view
	if (!(App.view instanceof PersonsView))
	{
		await App.goToMainView();
		await App.view.goToPersons();
	}

	// Prepare expected updates of persons list
	let ids = getPersonsByIndexes(persons);
	App.state.deletePersons(ids);

	await App.view.deletePersons(persons);

	App.view.expectedState = PersonsView.render(App.state);
	await test(`Delete persons [${persons.join()}]`, () => App.view.checkState());

	await App.state.fetch();
}


export async function delFromUpdate(pos)
{
	pos = parseInt(pos);
	if (isNaN(pos) || pos < 0)
		throw new Error('Position of person not specified');

	App.view.setBlock(`Delete person from update view [${pos}]`, 2);

	if (!(App.view instanceof PersonsView))
	{
		if (!(App.view instanceof MainView))
			await App.goToMainView();
		await App.view.goToPersons();
	}

	let ids = getPersonsByIndexes(pos);
	App.state.deletePersons(ids);

	await App.view.goToUpdatePerson(pos);
	await App.view.deleteSelfItem();

	App.view.expectedState = PersonsView.render(App.state);
	await test(`Delete person [${pos}]`, () => App.view.checkState());

	await App.goToMainView();

	App.view.expectedState = MainView.render(App.state);
	await test('Main page widgets update', () => App.view.checkState());
	await test('App state', () => App.state.fetchAndTest());
}


function getPersonByIndex(ind, visibleList, hiddenList)
{
	if (ind < 0 || ind > visibleList.length + hiddenList.length)
		throw new Error(`Invalid person index ${ind}`);

	if (ind < visibleList.length)
	{
		return visibleList[ind].id;
	}
	else
	{
		let hiddenInd = ind - visibleList.length;
		return hiddenList[hiddenInd].id;
	}
}


function getPersonsByIndexes(persons)
{
	if (!Array.isArray(persons))
		persons = [ persons ];

	let visibleList = App.state.persons.getVisible(true);
	let hiddenList = App.state.persons.getHidden(true);

	return persons.map(ind => getPersonByIndex(ind, visibleList, hiddenList));
}


export async function show(persons, val = true)
{
	if (!Array.isArray(persons))
		persons = [ persons ];

	let showVerb = val ? 'Show' : 'Hide';
	App.view.setBlock(`${showVerb} person(s) [${persons.join()}]`, 2);

	// Navigate to create persons view
	if (!(App.view instanceof PersonsView))
	{
		await App.goToMainView();
		await App.view.goToPersons();
	}

	// Check initial state
	await App.state.fetch();
	let ids = getPersonsByIndexes(persons);
	App.state.showPersons(ids, val);

	await App.view.showPersons(persons, val);

	App.view.expectedState = PersonsView.render(App.state);

	await test(`${showVerb} persons [${persons.join()}]`, () => App.view.checkState());
	await test('App state', () => App.state.fetchAndTest());
}


export async function hide(persons)
{
	return show(persons, false);
}
