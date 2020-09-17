import { copyObject } from './common.js';

import { EXPENSE, INCOME, TRANSFER, DEBT, Transaction, availTransTypes } from './model/transaction.js';

import * as ProfileTests from './run/profile.js';
import * as AccountTests from './run/account.js';
import * as PersonTests from './run/person.js';

import * as TransactionTests from './run/transaction/common.js';
import * as ExpenseTransactionTests from './run/transaction/expense.js';
import * as IncomeTransactionTests from './run/transaction/income.js';
import * as TransferTransactionTests from './run/transaction/transfer.js';
import * as DebtTransactionTests from './run/transaction/debt.js';

import * as TransactionListTests from './run/transactions.js';
import * as StatisticsTests from './run/statistics.js';

import * as ApiTests from './run/api.js';
import * as AccountApiTests from './run/api/account.js';
import * as PersonApiTests from './run/api/person.js';
import * as TransactionApiTests from './run/api/transaction.js';

import { api } from './model/api.js';
import { Runner } from './runner.js';
import { App } from './app.js';


const RUB = 1;
const USD = 2;
const EUR = 3;
const PLN = 4;


export class Scenario
{
	constructor(environment)
	{
		this.environment = environment;
	}


	static async create(environment)
	{
		let instance = new this(environment);

		await instance.init();

		return instance;
	}


	async init()
	{
		// Setup test runner
		this.runner = new Runner;
	}


	async run()
	{
		this.fullTest = true;

		if (this.fullTest)
			await this.runFullScenario();
		else
			await this.runTestScenatio();
	}


	async runTestScenatio()
	{
		await ProfileTests.relogin(App.config.testUser);
	}


	async runFullScenario()
	{
		await this.apiTests();
		await this.profileTests();
		await this.accountTests();
		await this.personTests();
		await this.transactionTests();
		await this.postTransactionAccountTests();
		await StatisticsTests.run();
	}


	async apiTests()
	{
		this.environment.setBlock('API tests', 1);
		this.environment.setBlock('User', 2);

		await ApiTests.deleteUserIfExist(App.config.apiTestUser);
		await ApiTests.registerAndLogin(App.config.apiTestUser);

		await this.prepareApiSecurityTests();

		await ApiTests.login({ login : '', password : App.config.testUser.password });
		await ApiTests.login({ login : App.config.testUser.login, password : '' });

		// Login with main test user
		await ApiTests.login(App.config.testUser);
		await ApiTests.resetAll();

		this.environment.setBlock('Accounts', 2);

		await ApiTests.resetAccounts();

		await this.apiCreateAccounts();
		await this.apiCreatePersons();
		await this.apiCreateTransactions();

		await this.apiSecurityTests();

		await this.apiUpdateTransactions();
		await this.apiSetTransactionPos();

		await this.apiFilterTransactions();

		await this.apiUpdateAccounts();
		await this.apiDeleteAccounts();

		await this.apiUpdatePersons();
		await this.apiDeletePersons();

		await this.apiDeleteTransactions();

		await this.apiProfile();

		await api.user.login(App.config.testUser);
	}


	async prepareApiSecurityTests()
	{
		this.environment.setBlock('Prepare data for security tests', 2);

		[
			this.API_USER_ACC_RUB,
			this.API_USER_ACC_USD,
		] = await this.runner.runGroup(AccountApiTests.create, [
			{ name : 'RUB', curr_id : RUB, initbalance : 100.1, icon_id : 5, flags : 0 },
			{ name : 'USD', curr_id : USD, initbalance : 50, icon_id : 2, flags : 0 },
		]);

		[ this.API_USER_PERSON ] = await this.runner.runGroup(PersonApiTests.create, [
			{ name : 'API user Person', flags : 0 }
		]);

		[ this.API_USER_TRANSACTION ] = await this.runner.runGroup(TransactionApiTests.extractAndCreate, [
			{ type : EXPENSE, src_id: this.API_USER_ACC_RUB, src_amount: 100 }
		]);
	}


	async apiSecurityTests()
	{
		await this.apiAccountsSecurity();
		await this.apiPersonsSecurity();
		await this.apiTransactionsSecurity();
	}


	async apiAccountsSecurity()
	{
		const { API_USER_ACC_RUB } = this;

		this.environment.setBlock('Accounts security', 2);

		const tasks = [
			{ action : AccountApiTests.update, data : { id : API_USER_ACC_RUB, name : 'EUR', curr_id : EUR, initbalance : 10, icon_id : 2, flags : 0 } },
			{ action : AccountApiTests.del, data : API_USER_ACC_RUB },
		];

		await this.runner.runTasks(tasks);
	}


	async apiPersonsSecurity()
	{
		const { API_USER_PERSON } = this;

		this.environment.setBlock('Persons security', 2);

		const tasks = [
			{ action : PersonApiTests.update, data : { id : API_USER_PERSON, name : 'API Person', flags : 0 } },
			{ action : PersonApiTests.del, data : API_USER_PERSON },
		];

		await this.runner.runTasks(tasks);
	}


	async apiTransactionsSecurity()
	{
		this.environment.setBlock('Transaction security', 2);

		await this.apiCreateTransactionSecurity();
		await this.apiUpdateTransactionSecurity();
		await this.apiDeleteTransactionSecurity();
	}


	async apiCreateTransactionSecurity()
	{
		this.environment.setBlock('Create', 3);

		const { API_USER_ACC_RUB, API_USER_PERSON, CASH_RUB } = this;

		const data = [
			{ type : EXPENSE, src_id : API_USER_ACC_RUB, dest_id : 0, src_curr : RUB, dest_curr : RUB, src_amount : 100, dest_amount : 100 },
			{ type : INCOME, src_id : 0, dest_id : API_USER_ACC_RUB, src_curr : RUB, dest_curr : RUB, src_amount : 100, dest_amount : 100 },
			{ type : TRANSFER, src_id : CASH_RUB, dest_id : API_USER_ACC_RUB, src_curr : RUB, dest_curr : RUB, src_amount : 100, dest_amount : 100 },
			{ type : DEBT, op : 1, person_id : API_USER_PERSON, acc_id : 0, src_curr : RUB, dest_curr : RUB, src_amount : 100, dest_amount : 100 },
		];

		await this.runner.runGroup(TransactionApiTests.create, data);
	}


	async apiUpdateTransactionSecurity()
	{
		this.environment.setBlock('Update', 3);

		const {
			API_USER_ACC_RUB, API_USER_ACC_USD,
			API_USER_PERSON,
			API_USER_TRANSACTION,
			CASH_RUB,
			TR_EXPENSE_1, TR_INCOME_1, TR_TRANSFER_1, TR_DEBT_1, TR_DEBT_2, TR_DEBT_3
		} = this;

		const data = [
			{ id : TR_EXPENSE_1, src_id : API_USER_ACC_RUB },
			{ id : TR_INCOME_1, dest_id : API_USER_ACC_RUB },
			{ id : TR_TRANSFER_1, src_id : API_USER_ACC_RUB, dest_id : API_USER_ACC_USD },
			// Trying to update transaction of another user
			{ id: API_USER_TRANSACTION, type : EXPENSE, src_id : CASH_RUB, dest_id : 0, src_curr : RUB, dest_curr : RUB, src_amount : 100, dest_amount : 100 },
			// Trying to set person of another user
			{ id: TR_DEBT_1, person_id : API_USER_PERSON },
			// Trying to set account of another user
			{ id: TR_DEBT_2, acc_id : API_USER_ACC_RUB },
			// Trying to set both person and account of another user
			{ id: TR_DEBT_3, person_id : API_USER_PERSON, acc_id : API_USER_ACC_RUB },
		];

		await this.runner.runGroup(TransactionApiTests.update, data);
	}


	async apiDeleteTransactionSecurity()
	{
		this.environment.setBlock('Delete', 3);
	
		const { API_USER_TRANSACTION } = this;

		const data = [
			[ API_USER_TRANSACTION ],
		];

		await this.runner.runGroup(TransactionApiTests.del, data);
	}


	async apiCreateAccounts()
	{
		const data = [
			{ name : 'acc ru', curr_id : RUB, initbalance : 100, icon_id : 1, flags : 0 },
			{ name : 'cash ru', curr_id : RUB, initbalance : 5000, icon_id : 3, flags : 0 },
			{ name : 'acc usd', curr_id : USD, initbalance : 10.5, icon_id : 5, flags : 0 },
			// Try to create account with existing name
			{ name : 'acc ru', curr_id : USD, initbalance : 10.5, icon_id : 0, flags : 0 },
			// Try to create account without some of fields
			{ curr_id : USD, initbalance : 10.5, icon_id : 0, flags : 0 },
			{ name : 'acc tst', initbalance : 10.5 },
			// Try to create account with excess properties
			{ name : 'acc tst', curr_id : USD, initbalance : 10.5, icon_id : 5, flags : 0, xxx : 1, yyy : 2 },
			// Try to create account with invalid data
			{ name : '', curr_id : USD, initbalance : 10.5, icon_id : 5, flags : 0 },
			{ name : 'acc tst', curr_id : 9999, initbalance : 10.5, icon_id : 5, flags : 0 },
			{ name : 'acc tst', curr_id : USD, initbalance : 'fff', icon_id : 5, flags : 0 },
		];

		[ this.ACC_RUB, this.CASH_RUB, this.ACC_USD ] = await this.runner.runGroup(AccountApiTests.create, data);
	}


	async apiUpdateAccounts()
	{
		const { ACC_RUB, CASH_RUB } = this;

		const data = [
			{ id : ACC_RUB, name : 'acc rub', curr_id : USD, initbalance : 101, icon_id : 2 },
			// Try to update name of account to an existing one
			{ id : CASH_RUB, name : 'acc rub' },
		];

		return this.runner.runGroup(AccountApiTests.update, data);
	}


	async apiDeleteAccounts()
	{
		const { ACC_USD, CASH_RUB } = this;

		const data = [
			[ ACC_USD, CASH_RUB ],
		];

		return this.runner.runGroup(AccountApiTests.del, data);
	}


	async apiCreatePersons()
	{
		const data = [
			{ name : 'Person X', flags : 0 },
			{ name : 'Y', flags : 0 },
			// Try to create person with existing name
			{ name : 'Y', flags : 0 },
			// Invalid data tests
			{ flags : 0 },
			{ name : 'ZZZ' },
			{ name : '', flags : 1, xxx : 1 },
			{ name : '', flags : 1 },
		];

		[ this.PERSON_X, this.PERSON_Y ] = await this.runner.runGroup(PersonApiTests.create, data);
	}


	async apiUpdatePersons()
	{
		const { PERSON_X } = this;

		const data = [
			{ id : PERSON_X, name : 'XX!' },
			// Try to update name of person to an existing one
			{ id : PERSON_X, name : 'XX!' },
			{ id : PERSON_X, name : '' },
		];

		return this.runner.runGroup(PersonApiTests.update, data);
	}


	async apiDeletePersons()
	{
		const { PERSON_Y } = this;

		const data = [
			[ PERSON_Y ],
			[]
		];

		return this.runner.runGroup(PersonApiTests.del, data);
	}


	async apiCreateTransactions()
	{
		this.environment.setBlock('Create', 3);

		const { CASH_RUB, ACC_RUB, ACC_USD, PERSON_X, PERSON_Y } = this;

		const data = [
			{ type : EXPENSE, src_id : ACC_RUB, src_amount : 100, comment: '11' },
			{ type : EXPENSE, src_id : ACC_RUB, src_amount : 7608, dest_amount : 100, dest_curr : EUR, comment : '22' },
			{ type : EXPENSE, src_id : ACC_USD, src_amount : 1, date : App.dates.yesterday },
			{ type : INCOME, dest_id : ACC_RUB, dest_amount : 1000.50, comment : 'lalala' },
			{ type : INCOME, dest_id : ACC_USD, src_amount : 6500, dest_amount : 100, src_curr : RUB, comment : 'la' },
			{ type : TRANSFER, src_id : ACC_RUB, dest_id : CASH_RUB, src_amount : 500, dest_amount : 500 },
			{ type : TRANSFER, src_id : ACC_RUB, dest_id : ACC_USD, src_amount : 6500, dest_amount : 100 },
			{ type : DEBT, op : 1, person_id : PERSON_X, acc_id : 0, src_amount : 500, src_curr : RUB, comment : 'к кк' },
			{ type : DEBT, op : 2, person_id : PERSON_Y, acc_id : 0, src_amount : 1000, src_curr : USD, comment : 'к' },
			{ type : DEBT, op : 1, person_id : PERSON_X, acc_id : 0, src_amount : 500, src_curr : RUB, comment : 'ппп' },
			{ type : DEBT, op : 2, person_id : PERSON_Y, acc_id : 0, src_amount : 1000, src_curr : USD },
		];

		[
			this.TR_EXPENSE_1, this.TR_EXPENSE_2, this.TR_EXPENSE_3,
			this.TR_INCOME_1, this.TR_INCOME_2,
			this.TR_TRANSFER_1, this.TR_TRANSFER_2,
			this.TR_DEBT_1, this.TR_DEBT_2, this.TR_DEBT_3
		] = await this.runner.runGroup(TransactionApiTests.extractAndCreate, data);


		const invData = [
			{ type : EXPENSE, src_id : 0, src_amount : 100 },
			{ type : EXPENSE, src_id : ACC_RUB, src_amount : 0 },
			{ type : EXPENSE, src_id : 0, dest_id : ACC_RUB, src_amount : 100 },
			{ type : INCOME, dest_id : 0, dest_amount : 100 },
			{ type : INCOME, src_id : ACC_RUB, dest_id : 0, dest_amount : 100 },
			{ type : INCOME, dest_id : ACC_RUB, dest_amount : '' },
			{ type : INCOME, dest_id : ACC_RUB, dest_amount : 99.1, date: '1f1f' },
			{ type : TRANSFER, src_id : 0, dest_id : 0, src_amount : 100 },
			{ type : TRANSFER, src_id : ACC_RUB, dest_id : 0, src_amount : 100 },
			{ type : TRANSFER, src_id : 0, dest_id : ACC_RUB, src_amount : 100 },
			{ type : DEBT, op : 0, person_id : PERSON_X, acc_id : 0, src_amount : 500, src_curr : RUB },
			{ type : DEBT, op : 1, person_id : 0, acc_id : 0, src_amount : 500, src_curr : RUB },
			{ type : DEBT, op : 1, person_id : PERSON_X, acc_id : 0, src_amount : '', src_curr : RUB },
			{ type : DEBT, op : 1, person_id : PERSON_X, acc_id : 0, src_amount : 10, src_curr : 9999 },
		];
		await this.runner.runGroup(TransactionApiTests.create, invData);
	}


	async apiUpdateTransactions()
	{
		this.environment.setBlock('Update', 3);

		const {
			CASH_RUB, ACC_RUB, ACC_USD,
			PERSON_Y,
			TR_EXPENSE_1, TR_EXPENSE_2, TR_EXPENSE_3,
			TR_INCOME_1, TR_INCOME_2,
			TR_TRANSFER_1, TR_TRANSFER_2,
			TR_DEBT_1, TR_DEBT_2, TR_DEBT_3
		} = this;

		const data = [
			{ id : TR_EXPENSE_1, src_id : CASH_RUB },
			{ id : TR_EXPENSE_2, dest_amount : 7608, dest_curr : RUB },
			{ id : TR_EXPENSE_3, dest_amount : 0.89, dest_curr : EUR, date : App.dates.weekAgo },
			{ id : TR_INCOME_1, dest_id : CASH_RUB },
			{ id : TR_INCOME_2, src_amount : 100, src_curr : USD },
			{ id : TR_TRANSFER_1, dest_id : ACC_USD, dest_curr : USD, dest_amount : 8 },
			{ id : TR_TRANSFER_2, dest_id : CASH_RUB, dest_curr : RUB, dest_amount : 6500, date : App.dates.yesterday },
			{ id : TR_DEBT_1, op : 2 },
			{ id : TR_DEBT_2, person_id : PERSON_Y, acc_id : 0 },
			{ id : TR_DEBT_3, op : 1, acc_id : ACC_RUB },
		];

		await this.runner.runGroup(TransactionApiTests.update, data);

		const invData = [
			{ id : TR_EXPENSE_1, src_id : 0 },
			{ id : TR_EXPENSE_2, dest_amount : 0, dest_curr : PLN },
			{ id : TR_EXPENSE_3, date : '' },
			{ id : TR_INCOME_1, dest_id : 0 },
			{ id : TR_INCOME_2, src_amount : 0, src_curr : EUR },
			{ id : TR_TRANSFER_1, src_id : 0 },
			{ id : TR_TRANSFER_1, dest_id : 0 },
			{ id : TR_TRANSFER_1, src_curr : 0 },
			{ id : TR_TRANSFER_1, dest_curr : 9999 },
			{ id : TR_TRANSFER_1, dest_id : ACC_USD, dest_curr : PLN },
			{ id : TR_TRANSFER_2, dest_id : CASH_RUB, dest_curr : RUB, dest_amount : 0, date : 'x' },
			{ id : TR_DEBT_1, op : 0 },
			{ id : TR_DEBT_2, person_id : 0 },
			{ id : TR_DEBT_3, op : 1, acc_id : 9999 },
		];

		await this.runner.runGroup(TransactionApiTests.update, invData);
	}


	async apiDeleteTransactions()
	{
		const { TR_EXPENSE_2, TR_TRANSFER_1, TR_DEBT_3 } = this;

		const data = [
			[ TR_EXPENSE_2, TR_TRANSFER_1, TR_DEBT_3 ],
			[],
			[ 9999 ]
		];

		return this.runner.runGroup(TransactionApiTests.del, data);
	}


	async apiSetTransactionPos()
	{
		const { TR_EXPENSE_2, TR_INCOME_2, TR_TRANSFER_1 } = this;

		const data = [
			{ id : TR_EXPENSE_2, pos : 5 },
			{ id : TR_INCOME_2, pos : 10 },
			{ id : TR_TRANSFER_1, pos : 100 },
		];

		return this.runner.runGroup(TransactionApiTests.setPos, data);
	}


	async apiFilterTransactions()
	{
		this.environment.setBlock('Filter transactions', 2);

		const { ACC_RUB, ACC_USD } = this;

		const data = [
			{ order : 'desc' },
			{ order : 'asc' },
			{ type : DEBT },
			{ type : [ EXPENSE, INCOME, TRANSFER ] },
			{ accounts : ACC_RUB },
			{ accounts : [ ACC_RUB, ACC_USD ] },
			{ accounts : ACC_RUB, order : 'desc' },
			{ type : DEBT, accounts : ACC_RUB },
			{ onPage : 10 },
			{ onPage : 10, page : 2 },
			{ startDate : App.dates.now, endDate : App.dates.weekAfter },
			{ startDate : App.dates.now, endDate : App.dates.weekAfter, search : '1' },
			{ search : 'la' },
			{ search : 'кк' },
		];

		return this.runner.runGroup(TransactionApiTests.filter, data);
	}


	async apiProfile()
	{
		this.environment.setBlock('Profile', 2);

		const tasks = [
			{ action : ApiTests.login, data : App.config.apiTestUser },
			{ action : ApiTests.changeName, data : '' },
			{ action : ApiTests.changeName, data : 'App tester' },
			{ action : ApiTests.changePassword, data : { user : App.config.apiTestUser, newPassword : '54321' } },
			{ action : ApiTests.deleteProfile },
		];

		return this.runner.runTasks(tasks);
	}


	async profileTests()
	{
		this.environment.setBlock('Profile tests', 1);

		await App.state.fetch();

		let origUserName = App.state.profile.name;
		const tmpPassword = 'test123'

		const tasks = [
			// Registration tests
			{ action : ProfileTests.register, data : { login : 'newuser', name : 'Newbie', password : '12345' } },
			{ action : ProfileTests.deleteProfile },
			{ action : ProfileTests.register, data : { login : '', name : '', password : '' } },
			{ action : ProfileTests.register, data : { login : '', name : 'Newbie', password : '12345' } },
			{ action : ProfileTests.register, data : { login : 'newuser', name : '', password : '12345' } },
			{ action : ProfileTests.register, data : { login : 'newuser', name : 'Newbie', password : '' } },
			// Login tests
			{ action : ProfileTests.relogin, data : { login : App.config.testUser.login, password : '' } },
			{ action : ProfileTests.relogin, data : { login : '', password : App.config.testUser.password } },
			{ action : ProfileTests.relogin, data : { login : '', password : '' } },
			{ action : ProfileTests.relogin, data : App.config.testUser },
			// Reset data tests
			{ action : ProfileTests.resetAll },
			// Change name tests
			{ action : ProfileTests.changeName, data : '' },
			{ action : ProfileTests.changeName, data : origUserName },
			{ action : ProfileTests.changeName, data : '^^&&>>' },
			{ action : ProfileTests.changeName, data : origUserName },
			// Change password tests
			{ action : ProfileTests.changePass, data : { oldPassword : '', newPassword : '' } },
			{ action : ProfileTests.changePass, data : { oldPassword : '123', newPassword : '' } },
			{ action : ProfileTests.changePass, data : { oldPassword : '', newPassword : '123' } },
			{ action : ProfileTests.changePass, data : { oldPassword : App.config.testUser.password, newPassword : tmpPassword } },
			{ action : ProfileTests.changePass, data : { oldPassword : tmpPassword, newPassword : App.config.testUser.password } },
		];

		await this.runner.runTasks(tasks);
	}


	async accountTests()
	{
		this.environment.setBlock('Accounts', 1);

		await AccountTests.stateLoop();

		await this.createAccountTests();
		await this.deleteAccountTests();
	}


	async postTransactionAccountTests()
	{
		await this.hideAccountsTest();
		await this.showAccountsTest();
		await this.exportAccountsTest();
		await this.updateAccountTests();
		await this.deleteAccountTests();
	}


	async createAccountTests()
	{
		this.environment.setBlock('Create accounts', 2);

		const data = [
			{ name : 'acc_1', initbalance : 1000.01, curr_id : RUB },
			{ name : 'acc_2', initbalance : '1000.01', curr_id : EUR },
			// Try to submit account with empty name
			{ name : '', initbalance : '100' },
			// Try to submit account with empty initial balance
			{ name : 'acc', initbalance : '' },
		];

		await this.runner.runGroup(AccountTests.create, data);
	}


	async updateAccountTests()
	{
		this.environment.setBlock('Update accounts', 2);

		const data = [
			{ pos : 0, icon_id : 1, curr_id : USD },
			{ pos : 0, curr_id : RUB },
		];

		await this.runner.runGroup(AccountTests.update, data);
	}


	async deleteAccountTests()
	{
		this.environment.setBlock('Delete accounts', 2);

		const data = [
			[0, 1]
		];

		await this.runner.runGroup(AccountTests.del, data);
	}


	async hideAccountsTest()
	{
		this.environment.setBlock('Hide accounts', 2);

		const data = [
			[0],
			[0, 4],
		];

		await this.runner.runGroup(AccountTests.hide, data);
	}


	async showAccountsTest()
	{
		this.environment.setBlock('Show accounts', 2);

		const data = [
			[5],
			[0, 6],
		];

		await this.runner.runGroup(AccountTests.show, data);
	}


	async exportAccountsTest()
	{
		this.environment.setBlock('Export accounts', 2);

		const data = [
			[0],
			[0, 1],
		];

		await this.runner.runGroup(AccountTests.exportTest, data);
	}


	async personTests()
	{
		this.environment.setBlock('Persons', 1);

		await this.createPersonTests();
		await this.hidePersonsTest();
		await this.showPersonsTest();
		await this.updatePersonTests();
		await this.deletePersonTests();
	}


	async createPersonTests()
	{
		this.environment.setBlock('Create persons', 2);

		const data = [
			{ name : '&&<div>' },
			{ name : 'Alex' },
			{ name : 'Maria' },
			{ name : 'Johnny' },
			{ name : 'Иван' },
			// Try to submit person with empty name
			{ name : '' },
		];

		await this.runner.runGroup(PersonTests.create, data);
	}


	async updatePersonTests()
	{
		this.environment.setBlock('Update persons', 2);

		const data = [
			{ pos : 4, name : 'Ivan<' },
			// Try to submit person with empty name
			{ pos : 0, name : '' },
		];

		await this.runner.runGroup(PersonTests.update, data);
	}


	async deletePersonTests()
	{
		this.environment.setBlock('Delete persons', 2);

		const data = [
			[0],
			[0, 2],
		];

		await this.runner.runGroup(PersonTests.del, data);
	}


	async hidePersonsTest()
	{
		this.environment.setBlock('Hide persons', 2);

		const data = [
			[0],
			[0, 1],
		];

		await this.runner.runGroup(PersonTests.hide, data);
	}


	async showPersonsTest()
	{
		this.environment.setBlock('Show persons', 2);

		const data = [
			[2],
			[0, 4],
		];

		await this.runner.runGroup(PersonTests.show, data);
	}


	async prepareTransactionTests()
	{
		const accList = [
			{ name : 'acc_3', curr_id : RUB, initbalance : '500.99', icon_id : 2, flags : 0 },
			{ name : 'acc RUB', curr_id : RUB, initbalance : '500.99', icon_id : 5, flags : 0 },
			{ name : 'acc USD', curr_id : USD, initbalance : '500.99', icon_id : 4, flags : 0 },
			{ name : 'acc EUR', curr_id : EUR, initbalance : '10000.99', icon_id : 3, flags : 0 },
			{ name : 'card RUB', curr_id : RUB, initbalance : '35000.40', icon_id : 3, flags : 0 },
		];

		for(const account of accList)
		{
			if (App.state.accounts.findByName(account.name))
				continue;

			await api.account.create(account);
		}

		const personsList = [
			{ name : 'Maria', flags : 0 },
			{ name : 'Ivan<', flags : 0 },
		];

		for(const person of personsList)
		{
			if (App.state.persons.findByName(person.name))
				continue;

			await api.person.create(person);
		}

		await App.state.fetch();
	}


	async transactionTests()
	{
		this.environment.setBlock('Transactions', 1);

		await this.prepareTransactionTests();

		await this.transactionStateLoopTests();
		await this.createTransactionTests();
		await this.updateTransactionTests();
		await this.transactionsListTests();
		await this.deleteTransactionTests();
	}


	async transactionStateLoopTests()
	{
		this.environment.setBlock('Transaction view state loops', 1);

		await ExpenseTransactionTests.stateLoop();
		await IncomeTransactionTests.stateLoop();
		await TransferTransactionTests.stateLoop();
		await DebtTransactionTests.stateLoop();
	}


	async createTransactionTests()
	{
		this.environment.setBlock('Create transaction', 1);

		await this.runCreateExpenseTests();
		await this.runCreateIncomeTests();
		await this.runCreateTransferTests();
		await this.runCreateDebtTests();
	}


	async updateTransactionTests()
	{
		this.environment.setBlock('Update transaction', 1);

		await this.runUpdateExpenseTests();
		await this.runUpdateIncomeTests();
		await this.runUpdateTransferTests();
		await this.runUpdateDebtTests();
	}


	async setupAccounts()
	{
		let data = [
			{ name : 'acc_4', curr_id : RUB, initbalance : '60500.12', icon_id : 1, flags : 0 },
			{ name : 'acc_5', curr_id : RUB, initbalance : '78000', icon_id : 2, flags : 0 },
			{ name : 'cash USD', curr_id : USD, initbalance : '10000', icon_id : 4, flags : 0 },
			{ name : 'cash EUR', curr_id : EUR, initbalance : '1000', icon_id : 5, flags : 0 },
		];

		let res = [];
		for(let params of data)
		{
			let account = App.state.accounts.findByName(params.name);
			if (!account)
			{
				account = await api.account.create(params);
				App.state.createAccount(params);
			}

			if (account)
				res.push(account.id);
		}

		return res;
	}


	async setupPersons()
	{
		let data = [
			{ name : 'Alex', flags : 0 },
			{ name : 'noname &', flags : 0 },
		];

		let res = [];
		for(let params of data)
		{
			let person = App.state.persons.findByName(params.name);
			if (!person)
			{
				person = await api.person.create(params);
				App.state.createPerson(params);
			}

			if (person)
				res.push(person.id);
		}

		return res;
	}


	async setupTransactions(accountIds, personIds)
	{
		const [ ACC_4, ACC_5, CASH_USD, CASH_EUR ] = accountIds;
		const [ ALEX, NONAME ] = personIds;

		let data = [
			{ type : EXPENSE, src_id : ACC_4, src_amount : '500', comment: 'lalala' },
			{ type : EXPENSE, src_id : ACC_4, src_amount : '500', dest_curr : USD, comment: 'lalala' },
			{ type : EXPENSE, src_id : ACC_5, src_amount : '100', comment: 'hohoho' },
			{ type : EXPENSE, src_id : ACC_5, src_amount : '780', dest_amount : '10', dest_curr : EUR, comment: 'кккк' },
			{ type : EXPENSE, src_id : CASH_USD, src_amount : '50', comment: '1111' },
			{ type : INCOME, dest_id : CASH_EUR, src_amount : '7500', dest_amount : '100', src_curr : RUB, comment: '232323' },
			{ type : INCOME, dest_id : ACC_4, src_amount : '1000000', dest_amount : '64000', src_curr : PLN, comment: '111 кккк' },
			{ type : INCOME, dest_id : ACC_4, dest_amount : '100', comment: '22222' },
			{ type : INCOME, dest_id : ACC_5, src_amount : '7013.21', dest_amount : '5000', comment: '33333' },
			{ type : INCOME, dest_id : CASH_EUR, src_amount : '287', dest_amount : '4', src_curr : RUB, comment: 'dddd' },
			{ type : INCOME, dest_id : CASH_EUR, dest_amount : '33', comment: '11 ho' },
			{ type : TRANSFER, src_id : ACC_4, dest_id : ACC_5, src_amount : '300', comment: 'd4' },
			{ type : TRANSFER, src_id : ACC_4, dest_id : CASH_USD, src_amount : '6500', dest_amount : '100', comment: 'g6' },
			{ type : TRANSFER, src_id : ACC_5, dest_id : ACC_4, src_amount : '800.01', comment: 'x0' },
			{ type : TRANSFER, src_id : ACC_5, dest_id : CASH_USD, src_amount : '7', dest_amount : '0.08', comment: 'l2' },
			{ type : TRANSFER, src_id : CASH_EUR, dest_id : CASH_USD, src_amount : '5.0301', dest_amount : '4.7614', comment: 'i1' },
			{ type : DEBT, op : 1, person_id : ALEX, src_amount : '1050', src_curr : RUB, comment: '111 кккк' },
			{ type : DEBT, op : 1, person_id : NONAME, acc_id : ACC_5, src_amount : '780', comment: '--**' },
			{ type : DEBT, op : 2, person_id : ALEX, src_amount : '990.99', src_curr : RUB, comment: 'ппп ppp' },
			{ type : DEBT, op : 2, person_id : NONAME, acc_id : CASH_USD, src_amount : '105', comment: '6050 кккк' },
			{ type : DEBT, op : 1, person_id : ALEX, acc_id : CASH_EUR, src_amount : '4', comment: '111 кккк' },
		];

		// Check transactions already exists
		let personsAccounts = personIds.flatMap(person_id =>
		{
			let person = App.state.persons.getItem(person_id);
			if (person && Array.isArray(person.accounts))
				return person.accounts.map(item => item.id);

			return [];
		});

		let trList = App.state.transactions.filter({ accounts : accountIds.concat(personsAccounts) } );
		if (trList.length == data.length * App.dateList.length)
			return trList.data.map(item => item.id);

		let multi = [];
		for(let transaction of data)
		{
			let extracted = Transaction.extract(transaction, App.state);
			for(let date of App.dateList)
			{
				extracted.date = date;
				multi.push(copyObject(extracted));
			}
		}

		return api.transaction.createMultiple(multi);
	}


	async prepareTrListData()
	{
		await api.user.login('test', 'test');
		await App.state.fetch();

		let accIds = await this.setupAccounts();
		let personIds = await this.setupPersons();
		let transIds = await this.setupTransactions(accIds, personIds);

		await App.state.fetch();

		const res = {
			accounts : accIds,
			persons : personIds,
			transactions : transIds
		};

		return res;
	}


	async transactionsListTests()
	{
		this.environment.setBlock('Transaction List view', 1);

		const data = await this.prepareTrListData();

		await this.runner.runTasks([
			{ action : TransactionListTests.checkInitialState },
			{ action : TransactionListTests.goToNextPage },
			{ action : TransactionListTests.setDetailsMode },
			{ action : TransactionListTests.goToNextPage },
		]);

		await this.runner.runGroup(TransactionListTests.filterByType, availTransTypes);

		await this.runner.runTasks([
			{ action : TransactionListTests.filterByAccounts, data : data.accounts[2] },
			{ action : TransactionListTests.filterByAccounts, data : [ data.accounts[2], data.accounts[3] ] },
			{ action : TransactionListTests.filterByType, data : 0 },
			{ action : TransactionListTests.filterByType, data : EXPENSE },
			{ action : TransactionListTests.filterByType, data : [ INCOME, DEBT ] },
			{ action : TransactionListTests.filterByDate, data : { start : App.dates.weekAgo, end : App.dates.now } },
			{ action : TransactionListTests.filterByDate, data : { start : App.dates.yearAgo, end : App.dates.monthAgo } },
		]);

		const searchData = [
			'1',
			'la',
			'кк'
		];

		await this.runner.runGroup(TransactionListTests.search, searchData);
	}


	async deleteTransactionTests()
	{
		this.environment.setBlock('Delete transaction', 1);

		await this.runDeleteExpenseTests();
		await this.runDeleteIncomeTests();
		await this.runDeleteTransferTests();
		await this.runDeleteDebtTests();

		await this.runDeleteFromUpdateTests();
	}


	async runCreateExpenseTests()
	{
		this.environment.setBlock('Create expense transactions', 1);

		const data = [
			{ fromAccount : 0, destAmount : '123.7801' },
			{ fromAccount : 3, srcAmount : '100', destAmount : '7013.21', destCurr : 1 },
			{ fromAccount : 1, destAmount : '0.01', date : App.dates.yesterday },
			{ fromAccount : 1, srcAcc : 4, destAmount : '99.99', date : App.dates.monthAgo },
			// Try to submit expense with invalid amount
			{ fromAccount : 0, destAmount : '' },
			{ fromAccount : 1, destAmount : '1', destCurr : 5, srcAmount : '' },
			// Try to submit expense with invalid date
			{ fromAccount : 0, destAmount : '100', date : '01.01.69' },
		];

		await this.runner.runGroup(ExpenseTransactionTests.create, data);
	}


	async runCreateIncomeTests()
	{
		this.environment.setBlock('Create income transactions', 1);

		const data = [
			{ fromAccount : 0, srcAmount : '10023.7801', date : App.dates.yesterday },
			{ fromAccount : 3, srcAmount : '7013.21', destAmount : '100', srcCurr : 2 },
			{ fromAccount : 1, srcAmount : '0.01', date : App.dates.weekAgo },
			{ fromAccount : 1, destAcc : 4, srcAmount : '99.99', date : App.dates.monthAgo },
			// Try to submit income with invalid amount
			{ fromAccount : 0, srcAmount : '' },
			{ fromAccount : 1, srcAmount : '1', srcCurr : 5, destAmount : '' },
			// Try to submit income with invalid date
			{ fromAccount : 0, srcAmount : '100', date : '0921-dd.0' },
		];

		await this.runner.runGroup(IncomeTransactionTests.create, data);
	}


	async runCreateTransferTests()
	{
		this.environment.setBlock('Create transfer transactions', 1);

		const data = [
			{ srcAmount : '1000' },
			{ destAcc : 2, srcAmount : '11.4', destAmount : '10' },
			{ srcAcc : 1, destAcc : 3, srcAmount : '5.0301', destAmount : '4.7614' },
			{ srcAcc : 2, srcAmount : '10', destAmount : '9.75' },
			{ destAcc : 3, srcAmount : '10', destAmount : '9.50' },
			// Try to submit transfer with invalid amount
			{ srcAmount : '' },
			{ destAcc : 2, srcAmount : '11.4', destAmount : '' },
			// Try to submit transfer with invalid date
			{ srcAmount : '100', date : '' },
		];

		await this.runner.runGroup(TransferTransactionTests.create, data);
	}


	async runCreateDebtTests()
	{
		this.environment.setBlock('Create debt transactions', 1);

		const data = [
			{ srcAmount : '1000' },
			{ debtType : false, acc : 2, srcAmount : '200', date : App.dates.weekAgo },
			{ debtType : true, acc : 3, srcAmount : '100.0101' },
			{ debtType : false, person : 1, acc : 3, srcAmount : '10', date : App.dates.yesterday },
			{ acc : null, srcAmount : '105', date : App.dates.yesterday },
			{ debtType : false, person : 1, acc : null, srcAmount : '105' },
			// Try to submit debt with invalid amount
			{ srcAmount : '' },
			// Try to submit debt with invalid date
			{ srcAmount : '100', date : '0921-dd.0' },
		];

		await this.runner.runGroup(DebtTransactionTests.create, data);
	}


	async runUpdateExpenseTests()
	{
		this.environment.setBlock('Update expense transactions', 2);

		const data = [
			{ pos : 3, destAmount : '124.7701' },
			{ pos : 0, srcAmount : '101', destAmount : '7065.30', destCurr : 1 },
			{ pos : 2, destAmount : '0.02', date : App.dates.weekAgo },
			{ pos : 3, srcAcc : 3, destAmount : '99.9', date : App.dates.yesterday },
		];

		await this.runner.runGroup(ExpenseTransactionTests.update, data);
	}


	async runUpdateIncomeTests()
	{
		this.environment.setBlock('Update income transactions', 2);

		const data = [
			{ pos : 1, srcAmount : '100.001', date : App.dates.weekAgo },
			{ pos : 2, srcAmount : '0.02' },
			{ pos : 0, srcAmount : '7065.30', destAmount : '101', srcCurr : 1 },
			{ pos : 3, destAcc : 3, srcAmount : '99.9' },
		];

		await this.runner.runGroup(IncomeTransactionTests.update, data);
	}


	async runUpdateTransferTests()
	{
		this.environment.setBlock('Update transfer transactions', 2);

		const data = [
			{ pos : 0, destAcc : 0, srcAmount : '11' },
			{ pos : 1, srcAcc : 2, srcAmount : '100', destAmount : '97.55' },
			{ pos : 2, srcAcc : 3, srcAmount : '5.0301' },
			{ pos : 3, srcAcc : 0, srcAmount : '50', destAmount : '0.82' },
			{ pos : 4, srcAmount : '1050.01' },
		];

		await this.runner.runGroup(TransferTransactionTests.update, data);
	}


	async runUpdateDebtTests()
	{
		this.environment.setBlock('Update debt transactions', 2);

		const data = [
			{ pos : 0, person : 0, srcAmount : '105' },
			{ pos : 3, acc : 1, srcAmount : '105', date : App.dates.now },
			{ pos : 4, debtType : true, srcAmount : '10' },
			{ pos : 1, debtType : false, acc : 2, srcAmount : '200.0202', date : App.dates.monthAgo },
			{ pos : 5, acc : null, srcAmount : '200' },
			{ pos : 2, srcAmount : '1001', date : App.dates.weekAgo },
		];

		await this.runner.runGroup(DebtTransactionTests.update, data);
	}


	async runDeleteExpenseTests()
	{
		this.environment.setBlock('Delete expense transactions', 2);

		const data = [
			[0],
			[0, 1, 11, 13],
		];

		await this.runner.runGroup(TransactionTests.del.bind(null, EXPENSE), data);
	}


	async runDeleteIncomeTests()
	{
		this.environment.setBlock('Delete income transactions', 2);

		const data = [
			[0],
			[0, 1, 2, 15],
		];

		await this.runner.runGroup(TransactionTests.del.bind(null, INCOME), data);
	}


	async runDeleteTransferTests()
	{
		this.environment.setBlock('Delete transfer transactions', 2);

		const data = [
			[1],
			[0, 2],
		];

		await this.runner.runGroup(TransactionTests.del.bind(null, TRANSFER), data);
	}


	async runDeleteDebtTests()
	{
		this.environment.setBlock('Delete debt transactions', 2);

		const data = [
			[0],
			[0, 1],
		];

		await this.runner.runGroup(TransactionTests.del.bind(null, DEBT), data);
	}


	async runDeleteFromUpdateTests()
	{
		this.environment.setBlock('Delete from update view tests', 2);

		const tasks = [
			{ action : TransactionTests.delFromUpdate.bind(null, DEBT), data : 0 },
			{ action : AccountTests.delFromUpdate, data : 0},
			{ action : PersonTests.delFromUpdate, data : 0},
		];

		await this.runner.runTasks(tasks);
	}

}