if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var test = common.test;

	var App = null;
}


function onAppUpdatePersons(props)
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
function createPerson(view, personName)
{
	return view.goToCreatePerson()
			.then(view => view.createPerson(personName))
			.then(async view =>
			{
				var state = { value : { tiles : { items : { length : App.persons.length + 1 } } } };
				state.value.tiles.items[App.persons.length] = { name : personName };

				await test('Create person', async () => {}, view, state);

				App.persons = view.content.tiles.items;
				App.notify();

				return view;
			});
}


function updatePerson(view, num, personName)
{
	return view.goToUpdatePerson(num)
			.then(async view =>
			{
				var state = { visibility : { name : true },
			 					values : { name : App.persons[num].name } };

				await test('Update person view state', async () => {}, view, state);

				await view.inputName(personName);

				return view.navigation(() => view.click(view.content.submitBtn));
			})
			.then(async view =>
			{
				var state = { values : { tiles : { items : { length : App.persons.length } } } };
				state.values.tiles.items[num] = { name : personName };

				await test('Update person', async () => {}, view, state);

				App.persons = view.content.tiles.items;
				App.notify();

				return view;
			});
}


function deletePersons(view, persons)
{
	return view.deletePersons(persons)
			.then(async (view) =>
			{
				var state = { values : { tiles : { items : { length : App.persons.length - persons.length } } } };

				await test('Delete persons [' + persons.join() + ']', async () => {}, view, state);

				return view;
			});
}


var runPersons = { onAppUpdate : onAppUpdatePersons,
					checkInitialPersons : checkInitialPersons,
					createPerson : createPerson,
					updatePerson : updatePerson,
					deletePersons : deletePersons };


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runPersons;
}
