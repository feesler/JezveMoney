import { test } from '../common.js';
import { PersonsView } from '../view/persons.js';
import { MainView } from '../view/main.js';


let runPersons =
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

		let expectedList = await this.state.getPersonsList();
		let expectedPerson = { name : personName, accounts : [] };
		expectedList.push(expectedPerson);

		this.state.cleanCache();
		await this.view.createPerson(personName);

		this.view.expectedState = { values : this.state.renderPersonsWidget(expectedList, false) };
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

		let expectedList = await this.state.getPersonsList();
		let expectedPerson = await this.state.getPersonByPos(num);

		this.view.expectedState = { visibility : { name : true },
	 								values : { name : expectedPerson.name } };
		await test('Update person view state', () => {}, this.view);

		await this.view.inputName(personName);

		this.state.cleanCache();
		await this.view.navigation(() => this.view.click(this.view.content.submitBtn));

		// Check updates in the person tiles
		expectedPerson.name = personName;
		expectedList[num] = expectedPerson;

		this.view.expectedState = { values : this.state.renderPersonsWidget(expectedList, false) };
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

		// Prepare expected updates of accounts list
		let expectedList = await this.state.getPersonsList();
		let ids = this.state.positionsToIds(expectedList, persons);
		expectedList = this.state.deleteByIds(expectedList, ids);

		this.state.cleanCache();
		await this.view.deletePersons(persons);

		this.view.expectedState = { values : this.state.renderPersonsWidget(expectedList, false) };
		await test('Delete persons [' + persons.join() + ']', () => {}, this.view);
	},


	async delFromUpdate(pos)
	{
		pos = parseInt(pos);
		if (isNaN(pos) || pos < 0)
			throw new Error('Position of person not specified');

		this.view.setBlock(`Delete person from update view [${pos}]`, 2);

		let accList = await this.state.getAccountsList();
		let pList = await this.state.getPersonsList();
		let trBefore = await this.state.getTransactionsList();

		if (!(this.view instanceof PersonsView))
		{
			if (!(this.view instanceof MainView))
				await this.goToMainView();
			await this.view.goToPersons();
		}

		this.state.cleanCache();

		await this.view.goToUpdatePerson(pos);
		await this.view.deleteSelfItem();

		// Prepare expected updates of persons list
		let personObj = pList[pos];
		let expectedList = this.state.deleteByIds(pList, personObj.id);
		// Prepare expected updates of transactions
		let personAccounts = personObj.accounts.map(item => item.id);
		let expTransList = trBefore.deleteAccounts(accList, personAccounts);
		// Prepare expected updates of accounts list
		let expAccList = this.state.deleteByIds(accList, personAccounts);

		expTransList = expTransList.updateResults(accList);

		this.view.expectedState = { values : this.state.renderPersonsWidget(expectedList, false) };
		await test(`Delete person [${pos}]`, () => {}, this.view);

		this.state.cleanCache();

		await this.goToMainView();

		this.view.expectedState = await this.state.render(expAccList, expectedList, expTransList.list);
		await test('Main page widgets update', async () => {}, this.view);

		await this.run.transactions.checkData('List of transactions update', expTransList);
	}
};


export { runPersons };
