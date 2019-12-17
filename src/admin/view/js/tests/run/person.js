var runPersons = (function()
{
	let App = null;
	let test = null;

	function onAppUpdate(props)
	{
		props = props || {};

		if ('App' in props)
		{
			App = props.App;
			test = App.test;
		}
	}


	async function checkInitialPersons(app)
	{
		var state = { value : { tiles : { items : { length : 0 } } } };
		await test('Initial persons structure', async () => {}, app.view, state);
	}


	// From persons list view go to new person view, input name and submit
	// Next check name result and callback
	async function createPerson(app, personName)
	{
		await app.view.goToCreatePerson();
		await app.view.createPerson(personName);

		var state = { value : { tiles : { items : { length : app.persons.length + 1 } } } };
		state.value.tiles.items[app.persons.length] = { name : personName };

		await test('Create person', async () => {}, app.view, state);

		app.persons = app.view.content.tiles.items;
		app.notify();
	}


	async function updatePerson(app, num, personName)
	{
		await app.view.goToUpdatePerson(num);

		var state = { visibility : { name : true },
	 					values : { name : app.persons[num].name } };

		await test('Update person view state', async () => {}, app.view, state);

		await app.view.inputName(personName);

		await app.view.navigation(() => app.view.click(app.view.content.submitBtn));

		// Check updates in the person tiles
		var state = { values : { tiles : { items : { length : app.persons.length } } } };
		state.values.tiles.items[num] = { name : personName };

		await test('Update person', async () => {}, app.view, state);

		app.persons = app.view.content.tiles.items;
		app.notify();
	}


	async function deletePersons(app, persons)
	{
		await app.view.deletePersons(persons);

		var state = { values : { tiles : { items : { length : app.persons.length - persons.length } } } };

		await test('Delete persons [' + persons.join() + ']', async () => {}, app.view, state);

		app.persons = app.view.content.tiles.items;
		app.notify();
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
