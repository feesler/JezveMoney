var runPersons = (function()
{
	let test = null;


	async function checkInitialPersons(app)
	{
		test = app.test;

		let state = { value : { tiles : { items : { length : 0 } } } };
		await test('Initial persons structure', async () => {}, app.view, state);
	}


	// From persons list view go to new person view, input name and submit
	// Next check name result and callback
	async function createPerson(app, personName)
	{
		test = app.test;

		await app.view.goToCreatePerson();

		app.personsCache = null;
		await app.view.createPerson(personName);

		let state = { value : { tiles : { items : { length : app.persons.length + 1 } } } };
		state.value.tiles.items[app.persons.length] = { name : personName };

		await test('Create person', async () => {}, app.view, state);

		app.persons = app.view.content.tiles.items;
	}


	async function updatePerson(app, num, personName)
	{
		test = app.test;

		await app.view.goToUpdatePerson(num);

		let state = { visibility : { name : true },
	 					values : { name : app.persons[num].name } };

		await test('Update person view state', async () => {}, app.view, state);

		await app.view.inputName(personName);

		app.personsCache = null;
		await app.view.navigation(() => app.view.click(app.view.content.submitBtn));

		// Check updates in the person tiles
		state = { values : { tiles : { items : { length : app.persons.length } } } };
		state.values.tiles.items[num] = { name : personName };

		await test('Update person', async () => {}, app.view, state);

		app.persons = app.view.content.tiles.items;
	}


	async function deletePersons(app, persons)
	{
		test = app.test;

		app.personsCache = null;
		await app.view.deletePersons(persons);

		let state = { values : { tiles : { items : { length : app.persons.length - persons.length } } } };

		await test('Delete persons [' + persons.join() + ']', async () => {}, app.view, state);

		app.persons = app.view.content.tiles.items;
	}


	return { checkInitial : checkInitialPersons,
				create : createPerson,
				update : updatePerson,
				del : deletePersons };
})();


export { runPersons };
