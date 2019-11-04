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


async function checkInitialPersons(page)
{
	var state = { value : { tiles : { length : 0 } } };
	await test('Initial persons structure', async () => {}, page, state);

	return page;
}


// From persons list page go to new person page, input name and submit
// Next check name result and callback
function createPerson(page, personName)
{
	return page.goToCreatePerson()
			.then(page => page.createPerson(personName))
			.then(async page =>
			{
				var state = { value : { tiles : { length : App.persons.length + 1 } } };
				state.value.tiles[App.persons.length] = { name : personName };

				await test('Create person', async () => {}, page, state);

				App.persons = page.content.tiles;
				App.notify();

				return page;
			});
}


function updatePerson(page, num, personName)
{
	return page.goToUpdatePerson(num)
			.then(async page =>
			{
				var state = { visibility : { name : true },
			 					values : { name : App.persons[num].name } };

				await test('Update person page state', async () => {}, page, state);

				await page.inputName(personName);

				return page.navigation(() => page.click(page.content.submitBtn));
			})
			.then(async page =>
			{
				var state = { values : { tiles : { length : App.persons.length } }};
				state.values.tiles[num] = { name : personName };

				await test('Update person', async () => {}, page, state);

				App.persons = page.content.tiles;
				App.notify();

				return page;
			});
}


function deletePersons(page, persons)
{
	return page.deletePersons(persons)
			.then(async (page) =>
			{
				var state = { values : { tiles : { length : App.persons.length - persons.length } } };

				await test('Delete persons [' + persons.join() + ']', async () => {}, page, state);

				return page;
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
