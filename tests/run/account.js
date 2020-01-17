let runAccounts =
{
	async createAccount1()
	{
		let test = this.test;

		let state = { visibility : { heading : true, iconDropDown : true, name : true, currDropDown : true },
						values : { tile : { name : 'New account', balance : '0 ₽' },
								name : '', balance : '0' } };

		await test('Initial state of new account view', async () => {}, this.view, state);

		this.setParam(state.values, { tile : { name : 'acc_1' }, name : 'acc_1' });
		await test('Account name input', () => this.view.inputName('acc_1'), this.view, state);

	// Change currency to USD
		this.setParam(state.values, { currDropDown : { textValue : 'USD' }, tile : { balance : '$ 0' } });
		await test('Change currency', () => this.view.changeCurrency(2), this.view, state);

		this.setParam(state.values, { tile : { balance : '$ 100 000.01' }, balance : '100000.01' });
		await test('Input balance (100 000.01)', () => this.view.inputBalance('100000.01'), this.view, state);

	// Change currency back to RUB
		this.setParam(state.values, { currDropDown : { textValue : 'RUB' }, tile : { balance : '100 000.01 ₽' } });
		await test('Change currency back', () => this.view.changeCurrency(1), this.view, state);

	// Input empty value for initial balance
		this.setParam(state.values, { tile : { balance : '0 ₽' }, balance : '' });
		await test('Input empty balance', () => this.view.inputBalance(''), this.view, state);

		state.values.balance = '.';
		await test('Input dot (.) balance', () => this.view.inputBalance('.'), this.view, state);

		this.setParam(state.values, { tile : { balance : '0.01 ₽' }, balance : '.01' });
		await test('Input (.01) balance', () => this.view.inputBalance('.01'), this.view, state);

		this.setParam(state.values, { tile : { balance : '10 000 000.01 ₽' }, balance : '10000000.01' });
		await test('Input (10000000.01) balance', () => this.view.inputBalance('10000000.01'), this.view, state);

	// Change icon to safe
		this.setParam(state.values, { iconDropDown : { textValue : 'Safe' },
								tile : { icon : this.view.tileIcons[2] } });
		await test('Change icon', () => this.view.changeIcon(2), this.view, state);

		this.setParam(state.values, { tile : { balance : '1 000.01 ₽' }, balance : '1000.01' });
		await test('Input (1000.01) balance', () => this.view.inputBalance('1000.01'), this.view, state);

		this.state.accounts = null;

		await this.view.navigation(() => this.view.click(this.view.content.submitBtn));
		await this.run.accounts.checkCreateAccount({ name : 'acc_1', balance : 1000.01, curr_id : 1 });
	},


	async checkCreateAccount(params)
	{
		let test = this.test;

		let state = { value : { tiles : { items : { length : this.accountTiles.length + 1 } } } };
		let fmtBal = this.formatCurrency(this.normalize(params.balance), params.curr_id, this.currencies);

		state.value.tiles.items[this.accountTiles.length] = { balance : fmtBal, name : params.name, icon : params.icon };

		await test('Account create', async () => {}, this.view, state);

		this.accountTiles = this.view.content.tiles.items;
	},


	async createAccount2()
	{
		let test = this.test;

		let state = { values : { tile : { name : 'acc_2', balance : '0 ₽' }, currDropDown : { textValue : 'RUB' } } };

	// Input account name
		await test('Account tile name update', () => this.view.inputName('acc_2'), this.view, state);

	// Change currency to EUR
		this.setParam(state.values, { tile : { balance : '€ 0' }, currDropDown : { textValue : 'EUR' } });
		await test('EUR currency select', () => this.view.changeCurrency(3), this.view, state);

		state.values.tile.balance = '€ 1 000.01';
		await test('Account tile balance on EUR 1 000.01 balance input field', () => this.view.inputBalance('1000.01'), this.view, state);

		this.state.accounts = null;

		await this.view.navigation(() => this.view.click(this.view.content.submitBtn));
		await this.run.accounts.checkCreateAccount({ name : 'acc_2', balance : 1000.01, curr_id : 3 });
	},


	async editAccount1()
	{
		let test = this.test;

		let state = { values : { tile : { name : 'acc_1', balance : '1 000.01 ₽', icon : this.view.tileIcons[2] }, currDropDown : { textValue : 'RUB' } } };

		await test('Initial state of edit account view', async () => {}, this.view, state);

	// Change currency to USD
		let fmtBal = this.formatCurrency(1000.01, 2, this.currencies);
		this.setParam(state.values, { tile : { balance : fmtBal }, currDropDown : { textValue : 'USD' } });
		await test('USD currency select', () => this.view.changeCurrency(2), this.view, state);

	// Change icon to purse
		state.values.tile.icon = this.view.tileIcons[1];
		await test('Icon change', () => this.view.changeIcon(1), this.view, state);

		this.state.accounts = null;

	// Submit
		await this.view.navigation(() => this.view.click(this.view.content.submitBtn));
		await this.run.accounts.checkUpdateAccount({ updatePos : 0,
										name : 'acc_1',
										balance : 1000.01,
										curr_id : 2,
										icon : this.view.tileIcons[1] });
	},


	async checkUpdateAccount(params)
	{
		let test = this.test;

		let state = { value : { tiles : { items : { length : this.accountTiles.length } } } };
		let fmtBal = this.formatCurrency(this.normalize(params.balance), params.curr_id, this.currencies);

		state.value.tiles.items[params.updatePos] = { balance : fmtBal, name : params.name, icon : params.icon };

		await test('Account update', async () => {}, this.view, state);

		this.accountTiles = this.view.content.tiles.items;
	},


	async create(params)
	{
		let test = this.test;

		if (!params)
			throw new Error('No params specified');
		if (!params.name || !params.name.length)
			throw new Error('Name not specified');
		let currObj = this.getCurrency(params.curr_id, this.currencies);
		if (!currObj)
			throw new Error('Wrong currency specified');
		let normBalance = this.normalize(params.balance);
		if (isNaN(normBalance))
			throw new Error('Balance not specified');

		let state = { values : { tile : { name : params.name }, name : params.name } };

	// Input account name
		await test('Account tile name update', () => this.view.inputName(params.name), this.view, state);

	// Change currency
		let fmtBal = this.formatCurrency(0, currObj.id, this.currencies);
		this.setParam(state.values, { currDropDown : { textValue : currObj.name }, tile : { balance : fmtBal } });
		await test(currObj.name + ' currency select', () => this.view.changeCurrency(currObj.id), this.view, state);

	// Input balance
		fmtBal = this.formatCurrency(normBalance, currObj.id, this.currencies);
		this.setParam(state.values, { tile : { balance : fmtBal } });
		await test('Tile balance format update', () => this.view.inputBalance(params.balance), this.view, state);

	// Change icon
		if (params.icon)
		{
			if (params.icon < 0 || params.icon > this.view.tileIcons.length)
				throw new Error('Icon not found');

			this.setParam(state.values, { iconDropDown : { textValue : this.view.tileIcons[params.icon].title }, tile : { icon : this.view.tileIcons[params.icon] } });
			await test('Tile icon update', () => this.view.changeIcon(params.icon), this.view, state);
		}

		this.state.accounts = null;

		await this.view.navigation(() => this.view.click(this.view.content.submitBtn));
		await this.run.accounts.checkCreateAccount(params);
	},


	async del(accounts)
	{
		let test = this.test;

		this.state.accounts = null;

		await this.view.deleteAccounts(accounts);

		let state = { value : { tiles : { items : { length : this.accountTiles.length - accounts.length } } } };

		await test('Delete accounts [' + accounts.join() + ']', async () => {}, this.view, state);

		this.accountTiles = this.view.content.tiles.items;
	}
};


export { runAccounts };
