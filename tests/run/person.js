let runPersons =
{
	async checkInitial()
	{
		let test = this.test;

		let state = { value : { tiles : { items : { length : 0 } } } };
		await test('Initial persons structure', () => {}, this.view, state);
	},


	// From persons list view go to new person view, input name and submit
	// Next check name result and callback
	async create(personName)
	{
		let test = this.test;

		await this.view.goToCreatePerson();

		this.state.persons = null;
		await this.view.createPerson(personName);

		let state = { value : { tiles : { items : { length : this.personTiles.length + 1 } } } };
		state.value.tiles.items[this.personTiles.length] = { name : personName };

		await test('Create person', () => {}, this.view, state);

		this.personTiles = this.view.content.tiles.items;
	},


	async update(num, personName)
	{
		let test = this.test;

		await this.view.goToUpdatePerson(num);

		let state = { visibility : { name : true },
	 					values : { name : this.personTiles[num].name } };

		await test('Update person view state', () => {}, this.view, state);

		await this.view.inputName(personName);

		this.state.persons = null;
		await this.view.navigation(() => this.view.click(this.view.content.submitBtn));

		// Check updates in the person tiles
		state = { values : { tiles : { items : { length : this.personTiles.length } } } };
		state.values.tiles.items[num] = { name : personName };

		await test('Update person', () => {}, this.view, state);

		this.personTiles = this.view.content.tiles.items;
	},


	async del(persons)
	{
		let test = this.test;

		this.state.persons = null;
		await this.view.deletePersons(persons);

		let state = { values : { tiles : { items : { length : this.personTiles.length - persons.length } } } };

		await test('Delete persons [' + persons.join() + ']', () => {}, this.view, state);

		this.personTiles = this.view.content.tiles.items;
	}
};


export { runPersons };
