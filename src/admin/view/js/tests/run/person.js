if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var test = common.test;

	var App = null;
}


var runPersons = (function()
{
	function onAppUpdate(props)
	{
		props = props || {};

		if ('App' in props)
			App = props.App;
	}


	async function checkInitialPersons(view)
	{
		var state = { value : { tiles : { items : { length : 0 } } } };
		await test('Initial persons structure', async () => {}, view, state);

		return view;
	}


	// From persons list view go to new person view, input name and submit
	// Next check name result and callback
	async function createPerson(view, personName)
	{
		view = await view.goToCreatePerson();
		view = await view.createPerson(personName);

		var state = { value : { tiles : { items : { length : App.persons.length + 1 } } } };
		state.value.tiles.items[App.persons.length] = { name : personName };

		await test('Create person', async () => {}, view, state);

		App.persons = view.content.tiles.items;
		App.notify();

		return view;
	}


	async function updatePerson(view, num, personName)
	{
		view = await view.goToUpdatePerson(num);

		var state = { visibility : { name : true },
	 					values : { name : App.persons[num].name } };

		await test('Update person view state', async () => {}, view, state);

		await view.inputName(personName);

		view = await view.navigation(() => view.click(view.content.submitBtn));

		// Check updates in the person tiles
		var state = { values : { tiles : { items : { length : App.persons.length } } } };
		state.values.tiles.items[num] = { name : personName };

		await test('Update person', async () => {}, view, state);

		App.persons = view.content.tiles.items;
		App.notify();

		return view;
	}


	async function deletePersons(view, persons)
	{
		view = await view.deletePersons(persons);

		var state = { values : { tiles : { items : { length : App.persons.length - persons.length } } } };

		await test('Delete persons [' + persons.join() + ']', async () => {}, view, state);

		App.persons = view.content.tiles.items;
		App.notify();

		return view;
	}


	return { onAppUpdate : onAppUpdate,
				checkInitial : checkInitialPersons,
				create : createPerson,
				update : updatePerson,
				del : deletePersons };
})();


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runPersons;
}
