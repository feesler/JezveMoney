import { formatDate, setupTest, copyObject } from './common.js';
import { api } from './api.js';
import { config } from './config.js';
import { AppState } from './state.js';
import { Currency } from './model/currency.js';
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
import { Runner } from './runner.js';


const RUB = 1;
const USD = 2;
const EUR = 3;
const PLN = 4;


class Application
{
	constructor()
	{
		this.config = config;
		this.user_id = null;
		this.run = {};
		this.dates = {};
		this.dateList = [];
	}


	async init()
	{
		// Setup test runner
		this.runner = new Runner;

		// Login and obtain profile information
		let loginResult = await api.user.login(this.config.testUser);
		if (!loginResult)
			throw new Error('Fail to login');

		let userProfile = await api.profile.read();
		if (!userProfile || !userProfile.user_id)
			throw new Error('Fail to read user profile');

		this.user_id = userProfile.user_id;
		this.owner_id = userProfile.owner_id;

		this.state = new AppState;
		await this.state.fetch();
		await Currency.init();

		let now = new Date();
		this.dates.now = formatDate(now);
		this.dates.monthAgo = formatDate(new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()));
		this.dates.weekAgo = formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7));
		this.dates.weekAfter = formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7));
		this.dates.yesterday = formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
		this.dates.yearAgo = formatDate(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));

		this.dateList.push(...Object.values(this.dates));

		let firstDay = Date.UTC(now.getFullYear(), now.getMonth(), 1);
		this.dates.startDate = (now.getDate() > 7) ? this.dates.weekAgo : firstDay;

		setupTest(this.environment);
	}


	finish()
	{
		const SECOND = 1000;
		const MINUTE = 60000;
		const HOUR = 3600000;

		let testsDuration = Date.now() - this.startTime;
		let hours = Math.floor(testsDuration / HOUR);
		let minutes = Math.floor((testsDuration % HOUR) / MINUTE);
		let seconds = Math.floor((testsDuration % MINUTE) / SECOND);

		let timeTitle = [];
		if (hours > 0)
			timeTitle.push(hours + 'h');
		if (minutes > 0)
			timeTitle.push(minutes + 'm');
		timeTitle.push(seconds + 's');

		console.log('Duration of tests: ' + timeTitle.join(' '));
	}


	async startTests()
	{
		console.log('Starting tests');

		this.startTime = Date.now();

		await this.apiTests();
		await this.profileTests();
		await this.accountTests();
		await this.personTests();
		await this.transactionTests();
		await StatisticsTests.run();

		this.finish();
	}


	async goToMainView()
	{
		await this.view.goToMainView();
	}


	async apiTests()
	{
		this.environment.setBlock('API tests', 1);
		this.environment.setBlock('User', 2);

		await ApiTests.deleteUserIfExist(this.config.apiTestUser);
		await ApiTests.registerAndLogin(this.config.apiTestUser);

		await this.prepareApiSecurityTests();

		// Login with main test user
		await ApiTests.login(this.config.testUser);
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

		await api.user.login(this.config.testUser);
	}


	async prepareApiSecurityTests()
	{
		this.environment.setBlock('Prepare data for security tests', 2);

		[
			this.API_USER_ACC_RUB,
			this.API_USER_ACC_USD,
		] = await this.runner.runGroup(ApiTests.createAccount, [
			{ name : 'RUB', curr_id : RUB, initbalance : 100.1, icon : 5 },
			{ name : 'USD', curr_id : USD, initbalance : 50, icon : 2 },
		]);

		[ this.API_USER_PERSON ] = await this.runner.runGroup(ApiTests.createPerson, [
			{ name : 'API user Person' }
		]);

		[ this.API_USER_TRANSACTION ] = await this.runner.runGroup(ApiTests.extractAndCreateTransaction, [
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
			{ action : ApiTests.updateAccount, data : { id : API_USER_ACC_RUB, name : 'EUR', curr_id : EUR, initbalance : 10, icon : 2 } },
			{ action : ApiTests.deleteAccounts, data : API_USER_ACC_RUB },
		];

		await this.runner.runTasks(tasks);
	}


	async apiPersonsSecurity()
	{
		const { API_USER_PERSON } = this;

		this.environment.setBlock('Persons security', 2);

		const tasks = [
			{ action : ApiTests.updatePerson, data : { id : API_USER_PERSON, name : 'API Person' } },
			{ action : ApiTests.deletePersons, data : API_USER_PERSON },
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

		return this.runner.runGroup(ApiTests.createTransaction, data);
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

		return this.runner.runGroup(ApiTests.updateTransaction, data);
	}


	async apiDeleteTransactionSecurity()
	{
		this.environment.setBlock('Delete', 3);
	
		const { API_USER_TRANSACTION } = this;

		const data = [
			[ API_USER_TRANSACTION ],
		];

		await this.runner.runGroup(ApiTests.deleteTransactions, data);
	}


	async apiCreateAccounts()
	{
		const data = [
			{ name : 'acc ru', curr_id : RUB, initbalance : 100, icon : 1 },
			{ name : 'cash ru', curr_id : RUB, initbalance : 5000, icon : 3 },
			{ name : 'acc usd', curr_id : USD, initbalance : 10.5, icon : 5 },
			// Try to create account with existing name
			{ name : 'acc ru', curr_id : USD, initbalance : 10.5, icon : 0 },
		];

		[ this.ACC_RUB, this.CASH_RUB, this.ACC_USD ] = await this.runner.runGroup(ApiTests.createAccount, data);
	}


	async apiUpdateAccounts()
	{
		const { ACC_RUB, CASH_RUB } = this;

		const data = [
			{ id : ACC_RUB, name : 'acc rub', curr_id : USD, initbalance : 101, icon : 2 },
			// Try to update name of account to an existing one
			{ id : CASH_RUB, name : 'acc rub' },
		];

		return this.runner.runGroup(ApiTests.updateAccount, data);
	}


	async apiDeleteAccounts()
	{
		const { ACC_USD, CASH_RUB } = this;

		const data = [
			[ ACC_USD, CASH_RUB ],
		];

		return this.runner.runGroup(ApiTests.deleteAccounts, data);
	}


	async apiCreatePersons()
	{
		const data = [
			{ name : 'Person X' },
			{ name : 'Y' },
			// Try to create person with existing name
			{ name : 'Y' },
		];

		[ this.PERSON_X, this.PERSON_Y ] = await this.runner.runGroup(ApiTests.createPerson, data);
	}


	async apiUpdatePersons()
	{
		const { PERSON_X } = this;

		const data = [
			{ id : PERSON_X, name : 'XX!' },
			// Try to update name of person to an existing one
			{ id : PERSON_X, name : 'XX!' },
		];

		return this.runner.runGroup(ApiTests.updatePerson, data);
	}


	async apiDeletePersons()
	{
		const { PERSON_Y } = this;

		const data = [
			[ PERSON_Y ],
		];

		return this.runner.runGroup(ApiTests.deletePersons, data);
	}


	async apiCreateTransactions()
	{
		this.environment.setBlock('Create', 3);

		const { CASH_RUB, ACC_RUB, ACC_USD, PERSON_X, PERSON_Y } = this;

		const data = [
			{ type : EXPENSE, src_id : ACC_RUB, src_amount : 100, comment: '11' },
			{ type : EXPENSE, src_id : ACC_RUB, src_amount : 7608, dest_amount : 100, dest_curr : EUR, comment : '22' },
			{ type : EXPENSE, src_id : ACC_USD, src_amount : 1, date : this.dates.yesterday },
			{ type : INCOME, dest_id : ACC_RUB, dest_amount : 1000.50 },
			{ type : INCOME, dest_id : ACC_USD, src_amount : 6500, dest_amount : 100, src_curr : RUB },
			{ type : TRANSFER, src_id : ACC_RUB, dest_id : CASH_RUB, src_amount : 500, dest_amount : 500 },
			{ type : TRANSFER, src_id : ACC_RUB, dest_id : ACC_USD, src_amount : 6500, dest_amount : 100 },
			{ type : DEBT, op : 1, person_id : PERSON_X, acc_id : 0, src_amount : 500, src_curr : RUB },
			{ type : DEBT, op : 2, person_id : PERSON_Y, acc_id : 0, src_amount : 1000, src_curr : USD },
			{ type : DEBT, op : 1, person_id : PERSON_X, acc_id : 0, src_amount : 500, src_curr : RUB },
			{ type : DEBT, op : 2, person_id : PERSON_Y, acc_id : 0, src_amount : 1000, src_curr : USD },
		];

		[
			this.TR_EXPENSE_1, this.TR_EXPENSE_2, this.TR_EXPENSE_3,
			this.TR_INCOME_1, this.TR_INCOME_2,
			this.TR_TRANSFER_1, this.TR_TRANSFER_2,
			this.TR_DEBT_1, this.TR_DEBT_2, this.TR_DEBT_3
		] = await this.runner.runGroup(ApiTests.extractAndCreateTransaction, data);
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
			{ id : TR_EXPENSE_3, dest_amount : 0.89, dest_curr : EUR, date : this.dates.weekAgo },
			{ id : TR_INCOME_1, dest_id : CASH_RUB },
			{ id : TR_INCOME_2, src_amount : 100, src_curr : USD },
			{ id : TR_TRANSFER_1, dest_id : ACC_USD, dest_curr : USD, dest_amount : 8 },
			{ id : TR_TRANSFER_2, dest_id : CASH_RUB, dest_curr : RUB, dest_amount : 6500, date : this.dates.yesterday },
			{ id : TR_DEBT_1, op : 2 },
			{ id : TR_DEBT_2, person_id : PERSON_Y, acc_id : 0 },
			{ id : TR_DEBT_3, op : 1, acc_id : ACC_RUB },
		];

		return this.runner.runGroup(ApiTests.updateTransaction, data);
	}


	async apiDeleteTransactions()
	{
		const { TR_EXPENSE_2, TR_TRANSFER_1, TR_DEBT_3 } = this;

		const data = [
			[ TR_EXPENSE_2, TR_TRANSFER_1, TR_DEBT_3 ],
		];

		return this.runner.runGroup(ApiTests.deleteTransactions, data);
	}


	async apiSetTransactionPos()
	{
		const { TR_EXPENSE_2, TR_INCOME_2, TR_TRANSFER_1 } = this;

		const data = [
			{ id : TR_EXPENSE_2, pos : 5 },
			{ id : TR_INCOME_2, pos : 10 },
			{ id : TR_TRANSFER_1, pos : 100 },
		];

		return this.runner.runGroup(ApiTests.setTransactionPos, data);
	}


	async apiFilterTransactions()
	{
		this.environment.setBlock('Filter transactions', 2);

		const { ACC_RUB } = this;

		const data = [
			{ type : DEBT },
			{ accounts : ACC_RUB },
			{ type : DEBT, accounts : ACC_RUB },
			{ onPage : 10 },
			{ onPage : 10, page : 2 },
			{ startDate : this.dates.now, endDate : this.dates.weekAfter },
			{ startDate : this.dates.now, endDate : this.dates.weekAfter, search : '1' },
		];

		return this.runner.runGroup(ApiTests.filterTransactions, data);
	}


	async apiProfile()
	{
		this.environment.setBlock('Profile', 2);

		const tasks = [
			{ action : ApiTests.login, data : this.config.apiTestUser },
			{ action : ApiTests.changeName, data : 'App tester' },
			{ action : ApiTests.changePassword, data : { user : this.config.apiTestUser, newPassword : '54321' } },
			{ action : ApiTests.deleteProfile },
		];

		return this.runner.runTasks(tasks);
	}


	async profileTests()
	{
		this.view.setBlock('Profile tests', 1);

		const tasks = [
			{ action : ProfileTests.register, data : { login : 'newuser', name : 'Newbie', password : '12345' } },
			{ action : ProfileTests.deleteProfile },
			{ action : ProfileTests.relogin, data : this.config.testUser },
			{ action : ProfileTests.resetAll },
			{ action : ProfileTests.changeName },
			{ action : ProfileTests.changePass },
		];

		await this.runner.runTasks(tasks);
	}


	async accountTests()
	{
		this.view.setBlock('Accounts', 1);

		await AccountTests.stateLoop();

		await this.createAccountTests();
		await this.deleteAccountTests();
	}


	async createAccountTests()
	{
		this.view.setBlock('Create accounts', 2);

		let data = [
			{ name : 'acc_1', initbalance : 1000.01, curr_id : RUB },
			{ name : 'acc_2', initbalance : '1000.01', curr_id : EUR },
		];

		await this.runner.runGroup(AccountTests.create, data);
	}


	async updateAccountTests()
	{
		this.view.setBlock('Update accounts', 2);

		let data = [
			{ pos : 0, icon : 1, curr_id : USD },
			{ pos : 0, curr_id : RUB },
		];

		await this.runner.runGroup(AccountTests.update, data);
	}


	async deleteAccountTests()
	{
		this.view.setBlock('Delete accounts', 2);

		const data = [
			[0, 1]
		];

		await this.runner.runGroup(AccountTests.del, data);
	}


	async exportAccountsTest()
	{
		this.view.setBlock('Export accounts', 2);

		let data = [
			[0],
			[0, 1],
		];

		await this.runner.runGroup(AccountTests.exportTest, data);
	}


	async personTests()
	{
		this.view.setBlock('Persons', 1);

		await this.createPersonTests();
		await this.updatePersonTests();
		await this.deletePersonTests();
	}


	async createPersonTests()
	{
		this.view.setBlock('Create persons', 2);

		let data = [
			{ name : '&&<div>' },
			{ name : 'Alex' },
			{ name : 'Maria' },
			{ name : 'Johnny' },
			{ name : 'Иван' },
		];

		await this.runner.runGroup(PersonTests.create, data);
	}


	async updatePersonTests()
	{
		this.view.setBlock('Update persons', 2);

		let data = [
			{ pos : 4, name : 'Ivan<' },
		];

		await this.runner.runGroup(PersonTests.update, data);
	}


	async deletePersonTests()
	{
		this.view.setBlock('Delete persons', 2);

		let data = [
			[0],
			[0, 2],
		];

		await this.runner.runGroup(PersonTests.del, data);
	}


	async prepareTransactionTests()
	{
		let accList = [
			{ name : 'acc_3', curr_id : RUB, initbalance : '500.99', icon : 2 },
			{ name : 'acc RUB', curr_id : RUB, initbalance : '500.99', icon : 5 },
			{ name : 'acc USD', curr_id : USD, initbalance : '500.99', icon : 4 },
			{ name : 'acc EUR', curr_id : EUR, initbalance : '10000.99', icon : 3 },
			{ name : 'card RUB', curr_id : RUB, initbalance : '35000.40', icon : 3 },
		];

		for(let account of accList)
		{
			await api.account.create(account);
		}

		await this.state.fetch();
	}


	async transactionTests()
	{
		this.view.setBlock('Transactions', 1);

		await this.prepareTransactionTests();

		await this.transactionStateLoopTests();
		await this.createTransactionTests();
		await this.updateTransactionTests();
		await this.transactionsListTests();
		await this.deleteTransactionTests();

		await this.exportAccountsTest();
		await this.updateAccountTests();
		await this.deleteAccountTests();
	}


	async transactionStateLoopTests()
	{
		this.view.setBlock('Transaction view state loops', 1);

		await ExpenseTransactionTests.stateLoop();
		await IncomeTransactionTests.stateLoop();
		await TransferTransactionTests.stateLoop();
		await DebtTransactionTests.stateLoop();
	}


	async createTransactionTests()
	{
		this.view.setBlock('Create transaction', 1);

		await this.runCreateExpenseTests();
		await this.runCreateIncomeTests();
		await this.runCreateTransferTests();
		await this.runCreateDebtTests();
	}


	async updateTransactionTests()
	{
		this.view.setBlock('Update transaction', 1);

		await this.runUpdateExpenseTests();
		await this.runUpdateIncomeTests();
		await this.runUpdateTransferTests();
		await this.runUpdateDebtTests();
	}


	async setupAccounts()
	{
		let data = [
			{ name : 'acc_4', curr_id : RUB, initbalance : '60500.12', icon : 1 },
			{ name : 'acc_5', curr_id : RUB, initbalance : '78000', icon : 2 },
			{ name : 'cash USD', curr_id : USD, initbalance : '10000', icon : 4 },
			{ name : 'cash EUR', curr_id : EUR, initbalance : '1000', icon : 5 },
		];

		let res = [];
		for(let params of data)
		{
			let account = this.state.accounts.findByName(params.name);
			if (!account)
			{
				account = await api.account.create(params);
				this.state.createAccount(params);
			}

			if (account)
				res.push(account.id);
		}

		return res;
	}


	async setupPersons()
	{
		let data = [
			{ name : 'Alex' },
			{ name : 'noname &' },
		];

		let res = [];
		for(let params of data)
		{
			let person = this.state.persons.findByName(params.name);
			if (!person)
			{
				person = await api.person.create(params);
				this.state.createPerson(params);
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

		let multi = [];
		for(let transaction of data)
		{
			let extracted = Transaction.extract(transaction, this.state);
			for(let date of this.dateList)
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
		await this.state.fetch();

		let accIds = await this.setupAccounts();
		let personIds = await this.setupPersons();
		let transIds = await this.setupTransactions(accIds, personIds);

		await this.state.fetch();

		let res = {
			accounts : accIds,
			persons : personIds,
			transactions : transIds
		};

		return res;
	}


	async transactionsListTests()
	{
		this.environment.setBlock('Transaction List view', 1);

		let data = await this.prepareTrListData();

		await this.runner.runTasks([
			{ action : TransactionListTests.checkInitialState },
			{ action : TransactionListTests.goToNextPage },
			{ action : TransactionListTests.setDetailsMode },
			{ action : TransactionListTests.goToNextPage },
		]);

		await this.runner.runGroup(TransactionListTests.filterByType, availTransTypes);

		await this.runner.runTasks([
			{ action : TransactionListTests.filterByAccounts, data : data.accounts[2] },
			{ action : TransactionListTests.filterByType, data : 0 },
			{ action : TransactionListTests.filterByDate, data : { start : this.dates.startDate, end : this.dates.now } },
			{ action : TransactionListTests.search, data : '1' },
		]);
	}


	async deleteTransactionTests()
	{
		this.view.setBlock('Delete transaction', 1);

		await this.runDeleteExpenseTests();
		await this.runDeleteIncomeTests();
		await this.runDeleteTransferTests();
		await this.runDeleteDebtTests();

		await this.runDeleteFromUpdateTests();
	}


	async runCreateExpenseTests()
	{
		this.view.setBlock('Create expense transactions', 1);

		let data = [
			{ fromAccount : 0, destAmount : '123.7801' },
			{ fromAccount : 3, srcAmount : '100', destAmount : '7013.21', destCurr : 1 },
			{ fromAccount : 1, destAmount : '0.01', date : this.dates.yesterday },
			{ fromAccount : 1, srcAcc : 4, destAmount : '99.99', date : this.dates.monthAgo },
		];

		await this.runner.runGroup(ExpenseTransactionTests.create, data);
	}


	async runCreateIncomeTests()
	{
		this.view.setBlock('Create income transactions', 1);

		let data = [
			{ fromAccount : 0, srcAmount : '10023.7801', date : this.dates.yesterday },
			{ fromAccount : 3, srcAmount : '7013.21', destAmount : '100', srcCurr : 2 },
			{ fromAccount : 1, srcAmount : '0.01', date : this.dates.weekAgo },
			{ fromAccount : 1, destAcc : 4, srcAmount : '99.99', date : this.dates.monthAgo },
		];

		await this.runner.runGroup(IncomeTransactionTests.create, data);
	}


	async runCreateTransferTests()
	{
		this.view.setBlock('Create transfer transactions', 1);

		let data = [
			{ srcAmount : '1000' },
			{ destAcc : 2, srcAmount : '11.4', destAmount : '10' },
			{ srcAcc : 1, destAcc : 3, srcAmount : '5.0301', destAmount : '4.7614' },
			{ srcAcc : 2, srcAmount : '10', destAmount : '9.75' },
			{ destAcc : 3, srcAmount : '10', destAmount : '9.50' },
		];

		await this.runner.runGroup(TransferTransactionTests.create, data);
	}


	async runCreateDebtTests()
	{
		this.view.setBlock('Create debt transactions', 1);

		let data = [
			{ srcAmount : '1000' },
			{ debtType : false, acc : 2, srcAmount : '200', date : this.dates.weekAgo },
			{ debtType : true, acc : 3, srcAmount : '100.0101' },
			{ debtType : false, person : 1, acc : 3, srcAmount : '10', date : this.dates.yesterday },
			{ acc : null, srcAmount : '105', date : this.dates.yesterday },
			{ debtType : false, person : 1, acc : null, srcAmount : '105' },
		];

		await this.runner.runGroup(DebtTransactionTests.create, data);
	}


	async runUpdateExpenseTests()
	{
		this.view.setBlock('Update expense transactions', 2);

		let data = [
			{ pos : 3, destAmount : '124.7701' },
			{ pos : 0, srcAmount : '101', destAmount : '7065.30', destCurr : 1 },
			{ pos : 2, destAmount : '0.02', date : this.dates.weekAgo },
			{ pos : 3, srcAcc : 3, destAmount : '99.9', date : this.dates.yesterday },
		];

		await this.runner.runGroup(ExpenseTransactionTests.update, data);
	}


	async runUpdateIncomeTests()
	{
		this.view.setBlock('Update income transactions', 2);

		let data = [
			{ pos : 1, srcAmount : '100.001', date : this.dates.weekAgo },
			{ pos : 2, srcAmount : '0.02' },
			{ pos : 0, srcAmount : '7065.30', destAmount : '101', srcCurr : 1 },
			{ pos : 3, destAcc : 3, srcAmount : '99.9' },
		];

		await this.runner.runGroup(IncomeTransactionTests.update, data);
	}


	async runUpdateTransferTests()
	{
		this.view.setBlock('Update transfer transactions', 2);

		let data = [
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
		this.view.setBlock('Update debt transactions', 2);

		let data = [
			{ pos : 0, person : 0, srcAmount : '105' },
			{ pos : 3, acc : 1, srcAmount : '105', date : this.dates.now },
			{ pos : 4, debtType : true, srcAmount : '10' },
			{ pos : 1, debtType : false, acc : 2, srcAmount : '200.0202', date : this.dates.monthAgo },
			{ pos : 5, acc : null, srcAmount : '200' },
			{ pos : 2, srcAmount : '1001', date : this.dates.weekAgo },
		];

		await this.runner.runGroup(DebtTransactionTests.update, data);
	}


	async runDeleteExpenseTests()
	{
		this.view.setBlock('Delete expense transactions', 2);

		let data = [
			[0],
			[0, 1, 11, 13],
		];

		await this.runner.runGroup(TransactionTests.del.bind(null, EXPENSE), data);
	}


	async runDeleteIncomeTests()
	{
		this.view.setBlock('Delete income transactions', 2);

		let data = [
			[0],
			[0, 1, 2, 15],
		];

		await this.runner.runGroup(TransactionTests.del.bind(null, INCOME), data);
	}


	async runDeleteTransferTests()
	{
		this.view.setBlock('Delete transfer transactions', 2);

		let data = [
			[1],
			[0, 2],
		];

		await this.runner.runGroup(TransactionTests.del.bind(null, TRANSFER), data);
	}


	async runDeleteDebtTests()
	{
		this.view.setBlock('Delete debt transactions', 2);

		let data = [
			[0],
			[0, 1],
		];

		await this.runner.runGroup(TransactionTests.del.bind(null, DEBT), data);
	}


	async runDeleteFromUpdateTests()
	{
		this.view.setBlock('Delete from update view tests', 2);

		const tasks = [
			{ action : TransactionTests.delFromUpdate.bind(null, DEBT), data : 0 },
			{ action : AccountTests.delFromUpdate, data : 0},
			{ action : PersonTests.delFromUpdate, data : 0},
		];

		await this.runner.runTasks(tasks);
	}
}


export const App = new Application;
