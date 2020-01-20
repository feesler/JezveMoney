import { common } from './common.js';
import { api } from './api.js';
import { config } from './config.js';
import { AppState } from './state.js';

import { runProfile } from './run/profile.js';
import { runAccounts } from './run/account.js';
import { runPersons } from './run/person.js';

import { runTransactionsCommon } from './run/transaction/common.js';
import { runExpense } from './run/transaction/expense.js';
import { runIncome } from './run/transaction/income.js';
import { runTransfer } from './run/transaction/transfer.js';
import { runDebt } from './run/transaction/debt.js';

import { runTransList } from './run/transactions.js';
import { runStatistics } from './run/statistics.js';

import { runAPI } from './run/api.js';


class Application
{
	constructor()
	{
		this.config = config;

		this.user_id = null;

		this.run = {};

		this.accountTiles = [];
		this.personTiles = [];
		this.transactions = [];
		this.currencies = [];

		this.dates = {};
		this.dateList = [];
	}


	bindRunner(runner)
	{
		let res = {};

		let methods = Object.keys(runner);
		for(let method of methods)
		{
			res[method] = runner[method].bind(this);
		}

		return res;
	}


	async init()
	{
		this.startTime = Date.now();

		// Inject common functions
		for(let key in common)
		{
			this[key] = common[key];
		}

		// Setup test runners
		this.run.api = this.bindRunner(runAPI);

		this.run.profile = this.bindRunner(runProfile);
		this.run.accounts = this.bindRunner(runAccounts);
		this.run.persons = this.bindRunner(runPersons);

		this.run.transactions = this.bindRunner(runTransactionsCommon);
		this.run.transactions.expense = this.bindRunner(runExpense);
		this.run.transactions.income = this.bindRunner(runIncome);
		this.run.transactions.transfer = this.bindRunner(runTransfer);
		this.run.transactions.debt = this.bindRunner(runDebt);

		this.run.transactions.list = this.bindRunner(runTransList);

		this.run.statistics = this.bindRunner(runStatistics);

		api.setEnv(this);

		// Login and obtain profile information
		let loginResult = await api.user.login(this.config.testUser.login, this.config.testUser.password);
		if (!loginResult)
			throw new Error('Fail to login');

		let userProfile = await api.profile.read();
		if (!userProfile || !userProfile.user_id)
			throw new Error('Fail to read user profile');

		this.user_id = userProfile.user_id;
		this.owner_id = userProfile.owner_id;

		this.state = new AppState(this);

		this.currencies = await api.currency.list();

		let now = new Date();
		this.dates.now = this.formatDate(now);
		this.dates.monthAgo = this.formatDate(new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()));
		this.dates.weekAgo = this.formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7));
		this.dates.yesterday = this.formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
		this.dates.yearAgo = this.formatDate(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));

		this.dateList.push(...Object.values(this.dates));
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

		await this.init();

		await this.apiTests();
		await this.profileTests();
		await this.accountTests();
		await this.personTests();
		await this.transactionTests();
		await this.run.statistics.run();

		this.finish();
	}


	async goToMainView()
	{
		await this.view.goToMainView();

		this.accountTiles = this.view.content.widgets[this.config.AccountsWidgetPos].tiles.items;
		this.personTiles = this.view.content.widgets[this.config.PersonsWidgetPos].infoTiles.items;
	}


	async profileTests()
	{
		this.view.setBlock('Profile tests', 1);

		await this.run.profile.register({ login : 'newuser', name : 'Newbie', password : '12345' });
		await this.run.profile.deleteProfile();
		await this.run.profile.relogin(this.config.testUser);
		await this.run.profile.resetAll();
		await this.run.profile.changeName();
		await this.run.profile.changePass();
	}


	async accountTests()
	{
		this.view.setBlock('Accounts', 1);

		await this.run.accounts.stateLoop();

		this.view.setBlock('Create accounts', 2);
		await this.run.accounts.create({ name : 'acc_1', balance : 1000.01, curr_id : 1 });
		await this.run.accounts.create({ name : 'acc_2', balance : '1000.01', curr_id : 3 });

		this.view.setBlock('Update accounts', 2);
		await this.run.accounts.update({ pos : 0, icon : 1, curr_id : 2 });

		this.view.setBlock('Delete accounts', 2);
		await this.run.accounts.del([0, 1]);
	}


	async personTests()
	{
		this.view.setBlock('Persons', 1);

		await this.goToMainView();
		await this.view.goToPersons();
		await this.run.persons.checkInitial();
		await this.run.persons.create('Alex');
		await this.run.persons.create('Maria');
		await this.run.persons.create('Johnny');
		await this.run.persons.create('Иван');
		await this.run.persons.update(3, 'Ivan<');
		await this.run.persons.del([0, 2]);
	}


	async prepareTransactionTests()
	{
		let accList =
		[
			{ name : 'acc_3', currency : 1, balance : '500.99', icon : 2 },
			{ name : 'acc RUB', currency : 1, balance : '500.99', icon : 5 },
			{ name : 'acc USD', currency : 2, balance : '500.99', icon : 4 },
			{ name : 'acc EUR', currency : 3, balance : '10000.99', icon : 3 },
			{ name : 'card RUB', currency : 1, balance : '35000.40', icon : 3 },
		];

		for(let account of accList)
		{
			await api.account.create(account);
		}
	}


	async transactionTests()
	{
		this.view.setBlock('Transactions', 1);

		await this.prepareTransactionTests();

		await this.createTransactionTests();
		await this.updateTransactionTests();
		await this.transactionsListTests();
		await this.deleteTransactionTests();
	}


	async createTransactionTests()
	{
		this.view.setBlock('Create transaction', 1);

		await this.goToMainView();
		await this.view.goToNewTransactionByAccount(0);
		await this.run.transactions.expense.stateLoop();
		await this.runCreateExpenseTests();

		await this.goToMainView();
		await this.view.goToNewTransactionByAccount(0);
		await this.view.changeTransactionType(this.INCOME);
		await this.run.transactions.income.stateLoop();
		await this.runCreateIncomeTests();

		await this.goToMainView();
		await this.view.goToNewTransactionByAccount(0);
		await this.view.changeTransactionType(this.TRANSFER);
		await this.run.transactions.transfer.stateLoop();
		await this.runCreateTransferTests();

		await this.goToMainView();
		await this.view.goToNewTransactionByAccount(0);
		await this.view.changeTransactionType(this.DEBT);
		await this.run.transactions.debt.stateLoop();
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


	async deleteTransactionTests()
	{
		this.view.setBlock('Delete transaction', 1);

		await this.runDeleteExpenseTests();
		await this.runDeleteIncomeTests();
		await this.runDeleteTransferTests();
		await this.runDeleteDebtTests();
	}


	async runCreateExpenseTests()
	{
		this.view.setBlock('Create expense transactions', 1);

		let list = [
			{ fromAccount : 0, destAmount : '123.7801' },
			{ fromAccount : 3, srcAmount : '100', destAmount : '7013.21', destCurr : 1 },
			{ fromAccount : 1, destAmount : '0.01', date : this.dates.yesterday },
			{ fromAccount : 1, srcAcc : 4, destAmount : '99.99', date : this.dates.monthAgo },
		];

		for(let props of list)
		{
			await this.run.transactions.expense.create(props);
		}
	}


	async runCreateIncomeTests()
	{
		this.view.setBlock('Create income transactions', 1);

		let list = [
			{ fromAccount : 0, srcAmount : '10023.7801', date : this.dates.yesterday },
			{ fromAccount : 3, srcAmount : '7013.21', destAmount : '100', srcCurr : 2 },
			{ fromAccount : 1, srcAmount : '0.01', date : this.dates.weekAgo },
			{ fromAccount : 1, destAcc : 4, srcAmount : '99.99', date : this.dates.monthAgo },
		];

		for(let props of list)
		{
			await this.run.transactions.income.create(props);
		}
	}


	async runCreateTransferTests()
	{
		this.view.setBlock('Create transfer transactions', 1);

		let list = [
			{ srcAmount : '1000' },
			{ destAcc : 2, srcAmount : '11.4', destAmount : '10' },
			{ srcAcc : 1, destAcc : 3, srcAmount : '5.0301', destAmount : '4.7614' },
			{ srcAcc : 2, srcAmount : '10', destAmount : '9.75' },
			{ destAcc : 3, srcAmount : '10', destAmount : '9.50' },
		];

		for(let props of list)
		{
			await this.run.transactions.transfer.create(props);
		}
	}


	async runCreateDebtTests()
	{
		this.view.setBlock('Submit debt transactions', 1);

		let list = [
			{ srcAmount : '1000' },
			{ debtType : false, acc : 2, srcAmount : '200', date : this.dates.weekAgo },
			{ debtType : true, acc : 3, srcAmount : '100.0101' },
			{ debtType : false, person : 1, acc : 3, srcAmount : '10', date : this.dates.yesterday },
			{ acc : null, srcAmount : '105', date : this.dates.yesterday },
			{ debtType : false, person : 1, acc : null, srcAmount : '105' },
		];

		for(let props of list)
		{
			await this.run.transactions.debt.create(props);
		}
	}


	async runUpdateExpenseTests()
	{
		this.view.setBlock('Update expense transactions', 2);

		let list = [
			{ pos : 3, destAmount : '124.7701' },
			{ pos : 0, srcAmount : '101', destAmount : '7065.30', destCurr : 1 },
			{ pos : 2, destAmount : '0.02', date : this.dates.weekAgo },
			{ pos : 3, srcAcc : 3, destAmount : '99.9', date : this.dates.yesterday },
		];

		for(let props of list)
		{
			await this.run.transactions.expense.update(props);
		}
	}


	async runUpdateIncomeTests()
	{
		this.view.setBlock('Update income transactions', 2);

		let list = [
			{ pos : 1, srcAmount : '100.001', date : this.dates.weekAgo },
			{ pos : 2, srcAmount : '0.02' },
			{ pos : 0, srcAmount : '7065.30', destAmount : '101', srcCurr : 1 },
			{ pos : 3, destAcc : 3, srcAmount : '99.9' },
		];

		for(let props of list)
		{
			await this.run.transactions.income.update(props);
		}
	}


	async runUpdateTransferTests()
	{
		this.view.setBlock('Update transfer transactions', 2);

		let list = [
			{ pos : 0, destAcc : 0, srcAmount : '11' },
			{ pos : 1, srcAcc : 2, srcAmount : '100', destAmount : '97.55' },
			{ pos : 2, srcAcc : 3, srcAmount : '5.0301' },
			{ pos : 3, srcAcc : 0, srcAmount : '50', destAmount : '0.82' },
			{ pos : 4, srcAmount : '1050.01' },
		];

		for(let props of list)
		{
			await this.run.transactions.transfer.update(props);
		}
	}


	async runUpdateDebtTests()
	{
		this.view.setBlock('Update debt transactions', 2);

		let list = [
			{ pos : 0, person : 0, srcAmount : '105' },
			{ pos : 3, acc : 1, srcAmount : '105', date : this.dates.now },
			{ pos : 4, debtType : true, srcAmount : '10' },
			{ pos : 1, debtType : false, acc : 2, srcAmount : '200.0202', date : this.dates.monthAgo },
			{ pos : 5, acc : null, srcAmount : '200' },
			{ pos : 2, srcAmount : '1001', date : this.dates.weekAgo },
		];

		for(let props of list)
		{
			await this.run.transactions.debt.update(props);
		}
	}


	async runDeleteExpenseTests()
	{
		this.view.setBlock('Delete expense transactions', 2);

		let list = [
			[0],
			[0, 1, 11, 13],
		];

		for(let props of list)
		{
			await this.run.transactions.del(this.EXPENSE, props);
		}
	}


	async runDeleteIncomeTests()
	{
		this.view.setBlock('Delete income transactions', 2);

		let list = [
			[0],
			[0, 1, 2, 15],
		];

		for(let props of list)
		{
			await this.run.transactions.del(this.INCOME, props);
		}
	}


	async runDeleteTransferTests()
	{
		this.view.setBlock('Delete transfer transactions', 2);

		let list = [
			[1],
			[0, 2],
		];

		for(let props of list)
		{
			await this.run.transactions.del(this.TRANSFER, props);
		}
	}


	async runDeleteDebtTests()
	{
		this.view.setBlock('Delete debt transactions', 2);

		let list = [
			[0],
			[0, 1],
		];

		for(let props of list)
		{
			await this.run.transactions.del(this.DEBT, props);
		}
	}


	async apiTests()
	{
		await this.run.api.run();
	}


	async transactionsListTests()
	{
		await this.run.transactions.list.run();
	}
}


let App = new Application;


export { App };
