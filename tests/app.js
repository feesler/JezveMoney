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
		this.dates.startDate = (now.getDate() > 6) ? this.dates.weekAgo : firstDay;

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

		await ApiTests.run();
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
