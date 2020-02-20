import { MainView } from '../view/main.js';
import { AccountsView } from '../view/accounts.js';
import { TransactionsList } from '../trlist.js';
import { api } from '../api.js';
import { test, formatProps } from '../common.js';


let runAccounts =
{
	async stateLoop()
	{
		this.view.setBlock('View state loop', 2);

	// Navigate to create account view
		if (!(this.view instanceof AccountsView))
		{
			await this.goToMainView();
			await this.view.goToAccounts();
		}
		await this.view.goToCreateAccount();

	// Check initial state
		let expAccount = { name : '', initbalance : 0, balance : '0', curr_id : 1, icon : 0 };
		this.view.setExpectedAccount(expAccount);
		await test('Initial state of account view', () => {}, this.view);

	// Check account name is 'New account' brefore input name
		await test('Change currency', () => this.view.changeCurrency(3), this.view);
		await test('Input balance (100 .01)', () => this.view.inputBalance('100.01'), this.view);
		await test('Change icon', () => this.view.changeIcon(1), this.view);

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
		let scope = this.run.accounts;

		// Input account name
		if ('name' in params)
			await test(`Input name (${params.name})`, () => this.view.inputName(params.name), this.view);

		// Change currency
		if ('curr_id' in params)
			await test(`Select currency ${params.curr_id}`, () => this.view.changeCurrency(params.curr_id), this.view);

		// Input balance
		if ('balance' in params)
			await test('Tile balance format update', () => this.view.inputBalance(params.balance), this.view);

		// Change icon
		if ('icon' in params)
			await test('Tile icon update', () => this.view.changeIcon(params.icon), this.view);

		this.state.accounts = null;
		this.state.transactions = null;

		let expected = this.view.getExpectedAccount();

		await this.view.navigation(() => this.view.click(this.view.content.submitBtn));

		return expected;
	},


	async create(params)
	{
		if (!params)
			throw new Error('No params specified');

		let title = formatProps(params);
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
		let expAccount = { name : '', owner_id : this.owner_id, initbalance : '0', balance : 0, curr_id : 1, icon : 0 };
		this.view.setExpectedAccount(expAccount);
		await test('Initial state of account view', () => {}, this.view);

		expAccount = await this.run.accounts.submitAccount(params);

		expectedList.push(expAccount);
		this.view.expectedState = { values : this.state.renderAccountsWidget(expectedList) };

		await test('Create account', () => {}, this.view);
	},


	async update(params)
	{
		if (!params)
			throw new Error('No params specified');

		let pos = parseInt(params.pos);
		if (isNaN(pos))
			throw new Error('Position of account not specified');
		delete params.pos;

		let title = formatProps(params);
		this.view.setBlock(`Update account [${pos}] (${title})`, 2);

		// Navigate to create account view
		if (!(this.view instanceof AccountsView))
		{
			await this.goToMainView();
			await this.view.goToAccounts();
		}
		await this.view.goToUpdateAccount(pos);

		// Check initial state
		let accBefore = await this.state.getAccountsList();
		let trBefore = await this.state.getTransactionsList();
		let expectedList = await this.state.getUserAccountsList();
		let expAccount = await this.state.getAccountByPos(pos);
		if (!expAccount)
			throw new Error('Can not find specified account');
		this.view.setExpectedAccount(expAccount);
		await test('Initial state of account view', () => {}, this.view);

		expAccount = await this.run.accounts.submitAccount(params);

		expectedList[pos] = expAccount;

		// Prepare expected updates of transactions list
		let expTransList = trBefore.updateAccount(accBefore, expAccount);

		this.view.expectedState = { values : this.state.renderAccountsWidget(expectedList) };

		await test('Update account', () => {}, this.view);

		await this.run.transactions.checkData('List of transactions update', expTransList);
	},


	async del(accounts)
	{
		this.view.setBlock(`Delete account(s) [${accounts.join()}]`, 2);

		// Navigate to create account view
		if (!(this.view instanceof AccountsView))
		{
			await this.goToMainView();
			await this.view.goToAccounts();
		}

		// Check initial state
		let userAccList = await this.state.getUserAccountsList();
		let accList = await this.state.getAccountsList();
		let pList = await this.state.getPersonsList();
		let trBefore = await this.state.getTransactionsList();
		let ids = this.state.positionsToIds(userAccList, accounts);

		this.state.accounts = null;
		this.state.transactions = null;

		await this.view.deleteAccounts(accounts);

		// Prepare expected updates of accounts list
		let expectedList = this.state.deleteByIds(accList, ids);
		// Prepare expected updates of transactions
		let expTransList = trBefore.deleteAccounts(accList, ids);

		this.view.expectedState = { values : this.state.renderAccountsWidget(expectedList) };
		await test('Delete accounts [' + accounts.join() + ']', () => {}, this.view);

		await this.run.transactions.checkData('List of transactions update', expTransList);
	},


	async delFromUpdate(pos)
	{
		let view = this.view;
		let scope = this.run.accounts;

		pos = parseInt(pos);
		if (isNaN(pos) || pos < 0)
			throw new Error('Position of account not specified');

		view.setBlock('Delete account from update view [' + pos + ']', 2);

		let accList = await this.state.getAccountsList();
		let pList = await this.state.getPersonsList();
		let trBefore = await this.state.getTransactionsList();

		if (!(this.view instanceof AccountsView))
		{
			if (!(this.view instanceof MainView))
				await this.goToMainView();
			await this.view.goToAccounts();
		}

		await this.view.goToUpdateAccount(pos);

		this.state.accounts = null;
		this.state.persons = null;
		this.state.transactions = null;

		await this.view.deleteSelfItem();

		// Prepare expected updates of accounts list
		let userAccList = accList.filter(item => item.owner_id == this.owner_id);
		let ids = this.state.positionsToIds(userAccList, pos)
		let expectedList = this.state.deleteByIds(accList, ids);
		// Prepare expected updates of transactions
		let expTransList = trBefore.deleteAccounts(accList, ids);

		expTransList = expTransList.updateResults(expectedList);

		let updState = await this.state.updatePersons(pList, expectedList);
		pList = updState.persons;
		expectedList = updState.accounts;

		this.view.expectedState = { values : this.state.renderAccountsWidget(expectedList) };
		await test('Delete account [' + pos + ']', () => {}, this.view);

		await this.goToMainView();

		this.view.expectedState = await this.state.render(expectedList, pList, expTransList.list);
		await test('Main page widgets update', async () => {}, this.view);

		await this.run.transactions.checkData('List of transactions update', expTransList);
	}
};


export { runAccounts };
