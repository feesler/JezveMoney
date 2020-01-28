import { test } from '../common.js';
import { PersonsView } from '../view/persons.js';


let runPersons =
{
	async checkInitial()
	{
		this.view.expectedState = { value : { tiles : { items : { length : 0 } } } };
		await test('Initial persons structure', () => {}, this.view);
	},


	// From persons list view go to new person view, input name and submit
	// Next check name result and callback
	async create(personName)
	{
		// Navigate to create person view
		if (!(this.view instanceof PersonsView))
		{
			await this.goToMainView();
			await this.view.goToPersons();
		}
		await this.view.goToCreatePerson();

		let expectedList = await this.state.getPersonsList();
		let expectedPerson = { name : personName, accounts : [] };
		expectedList.push(expectedPerson);

		this.state.persons = null;
		await this.view.createPerson(personName);

		this.view.expectedState = { values : this.state.renderPersonsWidget(expectedList, false) };
		await test(`Create person (${personName})`, () => {}, this.view);

		this.personTiles = this.view.content.tiles.items;
	},


	async update(num, personName)
	{
		// Navigate to update person view
		if (!(this.view instanceof PersonsView))
		{
			await this.goToMainView();
			await this.view.goToPersons();
		}
		await this.view.goToUpdatePerson(num);

		let expectedList = await this.state.getPersonsList();
		let expectedPerson = await this.state.getPersonByPos(num);

		this.view.expectedState = { visibility : { name : true },
	 								values : { name : expectedPerson.name } };

		await test('Update person view state', () => {}, this.view);

		await this.view.inputName(personName);

		this.state.persons = null;
		await this.view.navigation(() => this.view.click(this.view.content.submitBtn));

		// Check updates in the person tiles
		expectedPerson.name = personName;
		expectedList[num] = expectedPerson;

		this.view.expectedState = { values : this.state.renderPersonsWidget(expectedList, false) };
		await test(`Update person [${num}]`, () => {}, this.view);

		this.personTiles = this.view.content.tiles.items;
	},


	async del(persons)
	{
		// Navigate to persons list view
		if (!(this.view instanceof PersonsView))
		{
			await this.goToMainView();
			await this.view.goToPersons();
		}

		// Prepare expected updates of accounts list
		let expectedList = await this.state.getPersonsList();
		let ids = this.state.positionsToIds(expectedList, persons);
		expectedList = this.state.deleteByIds(expectedList, ids);

		this.state.persons = null;
		this.state.accounts = null;
		this.state.transactions = null;
		await this.view.deletePersons(persons);

		this.view.expectedState = { values : this.state.renderPersonsWidget(expectedList, false) };
		await test('Delete persons [' + persons.join() + ']', () => {}, this.view);

		this.personTiles = this.view.content.tiles.items;
	}
};


export { runPersons };
