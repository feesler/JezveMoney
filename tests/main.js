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


let profile = runProfile;
let accounts = runAccounts;
let persons = runPersons;

let transactions = {
	common : runTransactionsCommon,
	expense : runExpense,
	income : runIncome,
	transfer : runTransfer,
	debt : runDebt
};

// Shortcuts
transactions.del = transactions.common.del;

let statistics = runStatistics;



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


	async init()
	{
		this.startTime = Date.now();

		for(let key in common)
		{
			this[key] = common[key];
		}

		api.setEnv(this);

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
		await statistics.run(this);

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

		await profile.register(this, { login : 'newuser', name : 'Newbie', password : '12345' });
		await profile.deleteProfile(this);
		await profile.relogin(this, this.config.testUser);
		await profile.resetAll(this);
		await profile.changeName(this);
		await profile.changePass(this);
	}


	async accountTests()
	{
		this.view.setBlock('Accounts', 1);

		await this.goToMainView();
		await this.view.goToAccounts();
		await this.view.goToCreateAccount();
		await accounts.createAccount1(this);
		await this.view.goToCreateAccount();
		await accounts.createAccount2(this);
		await this.view.goToUpdateAccount(0);
		await accounts.editAccount1(this);
		await this.view.goToCreateAccount();
		await accounts.create(this, { name : 'acc_3', curr_id : 1, balance : '500.99', icon : 2 });
		await accounts.del(this, [0, 1]);
		await this.view.goToCreateAccount();
		await accounts.create(this, { name : 'acc RUB', curr_id : 1, balance : '500.99', icon : 5 });
		await this.view.goToCreateAccount();
		await accounts.create(this, { name : 'acc USD', curr_id : 2, balance : '500.99', icon : 4 });
		await this.view.goToCreateAccount();
		await accounts.create(this, { name : 'acc EUR', curr_id : 3, balance : '10000.99', icon : 3 });
		await this.view.goToCreateAccount();
		await accounts.create(this, { name : 'card RUB', curr_id : 1, balance : '35000.40', icon : 3 });
	}


	async personTests()
	{
		this.view.setBlock('Persons', 1);

		await this.goToMainView();
		await this.view.goToPersons();
		await persons.checkInitial(this);
		await persons.create(this, 'Alex');
		await persons.create(this, 'Maria');
		await persons.create(this, 'Johnny');
		await persons.create(this, 'Иван');
		await persons.update(this, 3, 'Ivan<');
		await persons.del(this, [0, 2]);
	}


	async transactionTests()
	{
		this.view.setBlock('Transactions', 1);

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
		await transactions.expense.stateLoop(this);
		await this.runCreateExpenseTests();

		await this.goToMainView();
		await this.view.goToNewTransactionByAccount(0);
		await this.view.changeTransactionType(App.INCOME);
		await transactions.income.stateLoop(this);
		await this.runCreateIncomeTests();

		await this.goToMainView();
		await this.view.goToNewTransactionByAccount(0);
		await this.view.changeTransactionType(App.TRANSFER);
		await transactions.transfer.stateLoop(this);
		await this.runCreateTransferTests();

		await this.goToMainView();
		await this.view.goToNewTransactionByAccount(0);
		await this.view.changeTransactionType(App.DEBT);
		await transactions.debt.stateLoop(this);
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
			await transactions.expense.create(this, props);
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
			await transactions.income.create(this, props);
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
			await transactions.transfer.create(this, props);
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
			await transactions.debt.create(this, props);
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
			await transactions.expense.update(this, props);
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
			await transactions.income.update(this, props);
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
			await transactions.transfer.update(this, props);
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
			await transactions.debt.update(this, props);
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
			await transactions.del(this, App.EXPENSE, props);
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
			await transactions.del(this, App.INCOME, props);
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
			await transactions.del(this, App.INCOME, props);
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
			await transactions.del(this, App.DEBT, props);
		}
	}


	async apiTests()
	{
		await runAPI.run(this);
	}


	async transactionsListTests()
	{
		await runTransList.run(this);
	}
}


let App = new Application;


export { App };
