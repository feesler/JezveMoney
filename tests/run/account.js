import { MainView } from '../view/main.js';
import { AccountsView } from '../view/accounts.js';
import { Transaction } from '../model/transaction.js';
import { TransactionsList } from '../model/transactionslist.js';
import { Currency } from '../model/currency.js';
import { api } from '../api.js';
import { test, formatDate, formatProps } from '../common.js';


export const runAccounts =
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
		if ('initbalance' in params)
			await test('Tile balance format update', () => this.view.inputBalance(params.initbalance), this.view);

		// Change icon
		if ('icon' in params)
			await test('Tile icon update', () => this.view.changeIcon(params.icon), this.view);

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
		await this.state.fetch();

		let expAccount = { name : '', owner_id : this.owner_id, initbalance : '0', balance : 0, curr_id : 1, icon : 0 };
		this.view.setExpectedAccount(expAccount);
		await test('Initial state of account view', () => {}, this.view);

		expAccount = await this.run.accounts.submitAccount(params);

		this.state.createAccount(expAccount);

		this.view.expectedState = { values : this.state.renderAccountsWidget(this.state.accounts.getUserAccounts(true)) };

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
		await this.state.fetch();

		let expAccount = this.state.accounts.getItemByIndex(pos);
		if (!expAccount)
			throw new Error('Can not find specified account');
		this.view.setExpectedAccount(expAccount);
		await test('Initial state of account view', () => {}, this.view);

		expAccount = await this.run.accounts.submitAccount(params);

		this.state.updateAccount(expAccount);

		this.view.expectedState = { values : this.state.renderAccountsWidget(this.state.accounts.getUserAccounts(true)) };

		await test('Update account', () => {}, this.view);

		await this.run.transactions.checkData('List of transactions update', this.state.transactions);
	},


	async del(accounts)
	{
		if (!Array.isArray(accounts))
			accounts = [ accounts ];

		this.view.setBlock(`Delete account(s) [${accounts.join()}]`, 2);

		// Navigate to create account view
		if (!(this.view instanceof AccountsView))
		{
			await this.goToMainView();
			await this.view.goToAccounts();
		}

		// Check initial state
		await this.state.fetch();

		let userAccList = this.state.accounts.getUserAccounts();
		this.state.deleteAccounts(userAccList.positionsToIds(accounts));

		await this.view.deleteAccounts(accounts);

		this.view.expectedState = { values : this.state.renderAccountsWidget(this.state.accounts.getUserAccounts(true)) };
		await test('Delete accounts [' + accounts.join() + ']', () => {}, this.view);

		await this.run.transactions.checkData('List of transactions update', this.state.transactions);
	},


	async delFromUpdate(pos)
	{
		let view = this.view;
		let scope = this.run.accounts;

		pos = parseInt(pos);
		if (isNaN(pos) || pos < 0)
			throw new Error('Position of account not specified');

		view.setBlock('Delete account from update view [' + pos + ']', 2);

		if (!(this.view instanceof AccountsView))
		{
			if (!(this.view instanceof MainView))
				await this.goToMainView();
			await this.view.goToAccounts();
		}

		await this.view.goToUpdateAccount(pos);

		await this.state.fetch();

		let userAccList = this.state.accounts.getUserAccounts();
		this.state.deleteAccounts(userAccList.positionsToIds(pos));

		await this.view.deleteSelfItem();

		this.view.expectedState = { values : this.state.renderAccountsWidget(this.state.accounts.data) };
		await test('Delete account [' + pos + ']', () => {}, this.view);

		await this.goToMainView();

		this.view.expectedState = this.state.render();
		await test('Main page widgets update', () => {}, this.view);

		await this.run.transactions.checkData('List of transactions update', this.state.transactions);
	},


	async exportTest(accounts)
	{
		if (!Array.isArray(accounts))
			accounts = [ accounts ];

		// Navigate to create account view
		if (!(this.view instanceof AccountsView))
		{
			await this.goToMainView();
			await this.view.goToAccounts();
		}

		// Prepare expected content
		let delimiter = ';';
		let rows = [];
		let headerRow = [ 'ID', 'Type', 'Source amount', 'Destination amount', 'Source result', 'Destination result', 'Date', 'Comment' ];
		rows.push(headerRow.join(delimiter));

		// Prepare state
		await this.state.fetch();
		let userAccList = this.state.accounts.getUserAccounts();
		let ids = userAccList.positionsToIds(accounts);
		let trList = this.state.transactions.filterByAccounts(ids);
		let transactions = trList.sortAsc();

		for(let transaction of transactions)
		{
			let row = [
				transaction.id,
				Transaction.typeToStr(transaction.type),
				Currency.format(transaction.src_curr, transaction.src_amount),
				Currency.format(transaction.dest_curr, transaction.dest_amount),
				Currency.format(transaction.src_curr, transaction.src_result),
				Currency.format(transaction.dest_curr, transaction.dest_result),
				transaction.date,
				transaction.comment
			];

			rows.push(row.join(delimiter));
		}

		let expectedContent = rows.join('\r\n');
		expectedContent = expectedContent.trim();

		let content = await this.view.exportAccounts(accounts);
		content = content.trim();

		await test(`Export accounts [${accounts.join()}]`, () => expectedContent == content, this.environment);
	},
};

