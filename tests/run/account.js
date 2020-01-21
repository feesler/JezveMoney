import { MainView } from '../view/main.js';
import { AccountsView } from '../view/accounts.js';


let runAccounts =
{
	async stateLoop()
	{
		let test = this.test;

		this.view.setBlock('View state loop', 2);

	// Navigate to create account view
		if (!(this.view instanceof AccountsView))
		{
			await this.goToMainView();
			await this.view.goToAccounts();
		}
		await this.view.goToCreateAccount();

	// Check initial state
		let expAccount = { name : '', balance : '0', curr_id : 1, icon : 0 };
		this.view.setExpectedAccount(expAccount);
		await test('Initial state of account view', () => {}, this.view);

		await test('Account name input', () => this.view.inputName('acc_1'), this.view);

	// Change currency to USD
		await test('Change currency', () => this.view.changeCurrency(2), this.view);

		await test('Input balance (100 000.01)', () => this.view.inputBalance('100000.01'), this.view);

	// Change currency back to RUB
		await test('Change currency back', () => this.view.changeCurrency(1), this.view);

	// Input empty value for initial balance
		await test('Input empty balance', () => this.view.inputBalance(''), this.view);
		await test('Input dot (.) balance', () => this.view.inputBalance('.'), this.view);
		await test('Input (.01) balance', () => this.view.inputBalance('.01'), this.view);
		await test('Input (10000000.01) balance', () => this.view.inputBalance('10000000.01'), this.view);

	// Change icon to safe
		await test('Change icon', () => this.view.changeIcon(2), this.view);
		await test('Input (1000.01) balance', () => this.view.inputBalance('1000.01'), this.view);

		this.state.accounts = null;

		await this.view.navigation(() => this.view.click(this.view.content.cancelBtn));
	},


	async submitAccount(params)
	{
		let view = this.view;
		let test = this.test;
		let scope = this.run.accounts;

	// Input account name
		if ('name' in params)
			await test(`Input name (${params.name})`, () => view.inputName(params.name), view);

		// Change currency
		if ('curr_id' in params)
			await test(`Select currency ${params.curr_id}`, () => view.changeCurrency(params.curr_id), view);

		// Input balance
		if ('balance' in params)
			await test('Tile balance format update', () => view.inputBalance(params.balance), view);

		// Change icon
		if ('icon' in params)
			await test('Tile icon update', () => view.changeIcon(params.icon), view);

		this.state.accounts = null;

		let expected = this.view.getExpectedAccount();

		await this.view.navigation(() => this.view.click(this.view.content.submitBtn));

		return expected;
	},


	async create(params)
	{
		let test = this.test;

		if (!params)
			throw new Error('No params specified');

		let title = this.formatProps(params);
		this.view.setBlock(`Create account (${title})`, 2);

		if (!params.name || !params.name.length)
			throw new Error('Name not specified');

	// Navigate to create account view
		if (!(this.view instanceof AccountsView))
		{
			await this.goToMainView();
			await this.view.goToAccounts();
		}
		await this.view.goToCreateAccount();

	// Check initial state
		let expectedList = await this.state.getUserAccountsList();
		let expAccount = { name : '', balance : '0', curr_id : 1, icon : 0 };
		this.view.setExpectedAccount(expAccount);
		await test('Initial state of account view', () => {}, this.view);

		expAccount = await this.run.accounts.submitAccount(params);

		expectedList.push(expAccount);
		this.view.expectedState = { values : this.state.renderAccountsWidget(expectedList) };

		await test('Create account', () => {}, this.view);
	},


	async update(params)
	{
		let test = this.test;

		if (!params)
			throw new Error('No params specified');

		let pos = parseInt(params.pos);
		if (isNaN(pos))
			throw new Error('Position of account not specified');
		delete params.pos;

		let title = this.formatProps(params);
		this.view.setBlock(`Update account [${pos}] (${title})`, 2);

		// Navigate to create account view
		if (!(this.view instanceof AccountsView))
		{
			await this.goToMainView();
			await this.view.goToAccounts();
		}
		await this.view.goToUpdateAccount(pos);

		// Check initial state
		let expectedList = await this.state.getUserAccountsList();
		let expAccount = await this.state.getAccountByPos(pos);
		if (!expAccount)
			throw new Error('Can not find specified account');
		this.view.setExpectedAccount(expAccount);
		await test('Initial state of account view', () => {}, this.view);

		expAccount = await this.run.accounts.submitAccount(params);

		expectedList[pos] = expAccount;

		this.view.expectedState = { values : this.state.renderAccountsWidget(expectedList) };

		await test('Update account', () => {}, this.view);
	},


	async del(accounts)
	{
		let test = this.test;

		// Navigate to create account view
		if (!(this.view instanceof AccountsView))
		{
			await this.goToMainView();
			await this.view.goToAccounts();
		}

		this.state.accounts = null;

		await this.view.deleteAccounts(accounts);

		let state = { value : { tiles : { items : { length : this.accountTiles.length - accounts.length } } } };

		await test('Delete accounts [' + accounts.join() + ']', () => {}, this.view, state);

		this.accountTiles = this.view.content.tiles.items;
	}
};


export { runAccounts };
