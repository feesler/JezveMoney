import { test } from '../common.js';
import { PersonsView } from '../view/persons.js';
import { MainView } from '../view/main.js';


export const runPersons =
{
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

		let expectedPerson = { name : personName };
		this.state.createPerson(expectedPerson);
		
		await this.view.createPerson(personName);

		this.view.expectedState = { values : this.state.renderPersonsWidget(this.state.persons.data, false) };
		await test(`Create person (${personName})`, () => {}, this.view);
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

		let expectedPerson = this.state.persons.getItemByIndex(num);
		if (!expectedPerson)
			throw new Error('Can not find specified person');

		this.view.expectedState = { visibility : { name : true },
	 								values : { name : expectedPerson.name } };
		await test('Update person view state', () => {}, this.view);

		await this.view.inputName(personName);

		await this.view.navigation(() => this.view.click(this.view.content.submitBtn));

		// Check updates in the person tiles
		expectedPerson.name = personName;
		this.state.updatePerson(expectedPerson);

		this.view.expectedState = { values : this.state.renderPersonsWidget(this.state.persons.data, false) };
		await test(`Update person [${num}]`, () => {}, this.view);
	},


	async del(persons)
	{
		// Navigate to persons list view
		if (!(this.view instanceof PersonsView))
		{
			await this.goToMainView();
			await this.view.goToPersons();
		}

		// Prepare expected updates of persons list
		this.state.deletePersons(this.state.persons.positionsToIds(persons));

		await this.view.deletePersons(persons);

		this.view.expectedState = { values : this.state.renderPersonsWidget(this.state.persons.data, false) };
		await test('Delete persons [' + persons.join() + ']', () => {}, this.view);
	},


	async delFromUpdate(pos)
	{
		pos = parseInt(pos);
		if (isNaN(pos) || pos < 0)
			throw new Error('Position of person not specified');

		this.view.setBlock(`Delete person from update view [${pos}]`, 2);

		if (!(this.view instanceof PersonsView))
		{
			if (!(this.view instanceof MainView))
				await this.goToMainView();
			await this.view.goToPersons();
		}

		this.state.deletePersons(this.state.persons.positionsToIds(pos));

		await this.view.goToUpdatePerson(pos);
		await this.view.deleteSelfItem();

		this.view.expectedState = { values : this.state.renderPersonsWidget(this.state.persons.data, false) };
		await test(`Delete person [${pos}]`, () => {}, this.view);

		await this.goToMainView();

		this.view.expectedState = this.state.render();
		await test('Main page widgets update', () => {}, this.view);

		await this.run.transactions.checkData('List of transactions update', this.state.transactions);
	}
};

