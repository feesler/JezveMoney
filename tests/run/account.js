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
		let state = { visibility : { heading : true, iconDropDown : true, name : true, currDropDown : true },
						values : { tile : { name : 'New account', balance : '0 ₽' },
								name : '', balance : '0' } };

		await test('Initial state of new account view', () => {}, this.view, state);

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

		await this.view.navigation(() => this.view.click(this.view.content.cancelBtn));
	},


	setExpectedState(account)
	{
		let tileIcon = this.view.tileIcons[account.icon];
		let currObj = this.getCurrency(account.curr_id, this.currencies);
		if (!currObj)
			throw new Error('Unexpected currency specified');

		let res = {
			values : {
				tile : this.state.accountToTile(account),
				name : account.name,
				currDropDown : { textValue : currObj.name },
				iconDropDown : { textValue : tileIcon.title }
			}
		};

		return res;
	},


	async submitAccount(account, params)
	{
		let view = this.view;
		let test = this.test;
		let scope = this.run.accounts;
		let expected = this.copyObject(account);

	// Input account name
		if ('name' in params)
		{
			expected.name = params.name;
			view.expectedState = scope.setExpectedState(expected);
			await test(`Input name (${params.name})`, () => view.inputName(params.name), view);
		}

		// Change currency
		if ('curr_id' in params)
	{
			expected.curr_id = params.curr_id;
			view.expectedState = scope.setExpectedState(expected);
			await test(`Select currency ${params.curr_id}`, () => view.changeCurrency(params.curr_id), view);
		}

		// Input balance
		if ('balance' in params)
		{
			let normBalance = this.normalize(params.balance);
			if (isNaN(normBalance))
				throw new Error('Wrong balance value specified');

			expected.balance = normBalance;
			view.expectedState = scope.setExpectedState(expected);
			await test('Tile balance format update', () => view.inputBalance(params.balance), view);
		}

		// Change icon
		if ('icon' in params)
		{
			if (params.icon < 0 || params.icon > view.tileIcons.length)
				throw new Error('Icon not found');

			expected.icon = params.icon;
			view.expectedState = scope.setExpectedState(expected);
			await test('Tile icon update', () => view.changeIcon(params.icon), view);
		}

		this.state.accounts = null;

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
		expAccount = await this.run.accounts.submitAccount(expAccount, params);

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

		expAccount = await this.run.accounts.submitAccount(expAccount, params);

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
