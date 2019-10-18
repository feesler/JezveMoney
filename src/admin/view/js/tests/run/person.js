function checkInitialPersons(page)
{
	var state = { value : { tiles : { length : 0 } } };
	test('Initial persons structure', () => {}, page, state);

	return Promise.resolve(page);
}


// From persons list page go to new person page, input name and submit
// Next check name result and callback
function createPerson(page, personName)
{
	return page.goToCreatePerson()
			.then(page => page.createPerson(personName))
			.then(page =>
			{
				var state = { value : { tiles : { length : App.persons.length + 1 } } };
				state.value.tiles[App.persons.length] = { name : personName };

				test('Create person', () => {}, page, state);

				App.persons = page.content.tiles;

				return Promise.resolve(page);
			});
}


function updatePerson(page, num, personName)
{
	return page.goToUpdatePerson(num)
			.then(page =>
			{
				var state = { visibility : { name : true },
			 					values : { name : App.persons[num].name } };

				test('Update person page state', () => {}, page, state);

				page.inputName(personName);

				return navigation(() => clickEmul(page.content.submitBtn), PersonsPage)
			})
			.then(page =>
			{
				var state = { values : { tiles : { length : App.persons.length } }};
				state.values.tiles[num] = { name : personName };

				test('Update person', () => {}, page, state);

				App.persons = page.content.tiles;

				return Promise.resolve(page);
			});
}


function deletePersons(page, persons)
{
	return page.deletePersons(persons)
			.then(function(page)
			{
				var state = { values : { tiles : { length : App.persons.length - persons.length } } };

				test('Delete persons [' + persons.join() + ']', () => {}, page, state);

				return Promise.resolve(page);
			});
}
