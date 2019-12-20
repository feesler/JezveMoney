import { common } from './common.js';
import { api } from './api.js';
import { config } from './config.js';


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


var profile = runProfile;
var accounts = runAccounts;
var persons = runPersons;

var transactions = {
	common : runTransactionsCommon,
	expense : runExpense,
	income : runIncome,
	transfer : runTransfer,
	debt : runDebt
};

// Shortcuts
transactions.del = transactions.common.del;

var statistics = runStatistics;



class Application
{
	constructor()
	{
		this.config = config;

		this.user_id = null;

		this.run = {};

		this.accounts = [];
		this.persons = [];
		this.transactions = [];
		this.currencies = [];
	}


	notify()
	{
		let notification = { App : this };

		common.onAppUpdate(notification);

		profile.onAppUpdate(notification);
		accounts.onAppUpdate(notification);
		persons.onAppUpdate(notification);

		transactions.common.onAppUpdate(notification);
		transactions.expense.onAppUpdate(notification);
		transactions.income.onAppUpdate(notification);
		transactions.transfer.onAppUpdate(notification);
		transactions.debt.onAppUpdate(notification);

		statistics.onAppUpdate(notification);

		runAPI.onAppUpdate(notification);
	}


	async init()
	{
		for(let key in common)
		{
			this[key] = common[key];
		}

		api.setEnv(this.view.props.environment, this);

		let loginResult = await api.user.login(this.config.testUser.login, this.config.testUser.password);
		if (!loginResult)
			throw new Error('Fail to login');

		let userProfile = await api.profile.read();
		if (!userProfile || !userProfile.user_id)
			throw new Error('Fail to read user profile');

		this.user_id = userProfile.user_id;

		this.notify();
	}


	async startTests()
	{
		console.log('Starting tests');

		await this.init();

		await apiTests(this);
		await profileTests(this);
		await accountTests(this);
		await personTests(this);
		await transactionTests(this);
		await statistics.run(this);
		await transactionsListTests(this);
	}


	async goToMainView()
	{
		await this.view.goToMainView();

		this.transactions = this.view.content.widgets[2].transList.items;
		this.accounts = this.view.content.widgets[0].tiles.items;
		this.persons = this.view.content.widgets[3].infoTiles.items;
		this.currencies = await this.view.global('currency');

		this.notify();
	}
}


async function profileTests(app)
{
	app.view.setBlock('Profile tests', 1);

	await profile.register(app, { login : 'newuser', name : 'Newbie', password : '12345' });
	await profile.deleteProfile(app);
	await profile.relogin(app, app.config.testUser);
	await profile.resetAll(app);
	await profile.changeName(app);
	await profile.changePass(app);
}


async function accountTests(app)
{
	app.view.setBlock('Accounts', 1);

	await app.goToMainView();
	await app.view.goToAccounts();
	await app.view.goToCreateAccount();
	await accounts.createAccount1(app);
	await app.view.goToCreateAccount();
	await accounts.createAccount2(app);
	await app.view.goToUpdateAccount(0);
	await accounts.editAccount1(app);
	await app.view.goToCreateAccount();
	await accounts.create(app, { name : 'acc_3', curr_id : 1, balance : '500.99', icon : 2 });
	await accounts.del(app, [0, 1]);
	await app.view.goToCreateAccount();
	await accounts.create(app, { name : 'acc RUB', curr_id : 1, balance : '500.99', icon : 5 });
	await app.view.goToCreateAccount();
	await accounts.create(app, { name : 'acc USD', curr_id : 2, balance : '500.99', icon : 4 });
	await app.view.goToCreateAccount();
	await accounts.create(app, { name : 'acc EUR', curr_id : 3, balance : '10000.99', icon : 3 });
	await app.view.goToCreateAccount();
	await accounts.create(app, { name : 'card RUB', curr_id : 1, balance : '35000.40', icon : 3 });
}


async function personTests(app)
{
	app.view.setBlock('Persons', 1);

	await app.goToMainView();
	await app.view.goToPersons();
	await persons.checkInitial(app);
	await persons.create(app, 'Alex');
	await persons.create(app, 'Maria');
	await persons.create(app, 'Johnny');
	await persons.create(app, 'Иван');
	await persons.update(app, 3, 'Ivan<');
	await persons.del(app, [0, 2]);
}


async function transactionTests(app)
{
	app.view.setBlock('Transactions', 1);

	await createTransactionTests(app);
	await updateTransactionTests(app);
	await deleteTransactionTests(app);
}


async function createTransactionTests(app)
{
	app.view.setBlock('Create transaction', 1);

	await app.goToMainView();
	await app.view.goToNewTransactionByAccount(0);
	await transactions.expense.stateLoop(app);
	await runCreateExpenseTests(app);

	await app.view.goToNewTransactionByAccount(0);
	await app.view.changeTransactionType(App.INCOME);
	await transactions.income.stateLoop(app);
	await runCreateIncomeTests(app);

	await app.view.goToNewTransactionByAccount(0);
	await app.view.changeTransactionType(App.TRANSFER);
	await transactions.transfer.stateLoop(app);
	await runCreateTransferTests(app);

	await app.view.goToNewTransactionByAccount(0);
	await app.view.changeTransactionType(App.DEBT);
	await transactions.debt.stateLoop(app);
	await runCreateDebtTests(app);
}


async function updateTransactionTests(app)
{
	app.view.setBlock('Update transaction', 1);

	await runUpdateExpenseTests(app);
	await runUpdateIncomeTests(app);
	await runUpdateTransferTests(app);
	await runUpdateDebtTests(app);
}


async function deleteTransactionTests(app)
{
	app.view.setBlock('Delete transaction', 1);

	await runDeleteExpenseTests(app);
	await runDeleteIncomeTests(app);
	await runDeleteTransferTests(app);
	await runDeleteDebtTests(app);
}


async function runCreateExpenseTests(app)
{
	app.view.setBlock('Create expense transactions', 1);

	await transactions.expense.create(app, 0, 0, { destAmount : '123.7801' })
	await transactions.expense.create(app, 3, 2, { srcAmount : '100', destAmount : '7013.21', destCurr : 1 });
	await transactions.expense.create(app, 1, 0, { destAmount : '0.01' });
	await transactions.expense.create(app, 1, 0, { srcAcc : 4, destAmount : '99.99' });
}


async function runCreateIncomeTests(app)
{
	app.view.setBlock('Create income transactions', 1);

	await transactions.income.create(app, 0, 0, { srcAmount : '10023.7801' });
	await transactions.income.create(app, 3, 2, { srcAmount : '7013.21', destAmount : '100', srcCurr : 1 });
	await transactions.income.create(app, 1, 0, { srcAmount : '0.01' });
	await transactions.income.create(app, 1, 0, { destAcc : 4, srcAmount : '99.99' });
}


async function runCreateTransferTests(app)
{
	app.view.setBlock('Create transfer transactions', 1);

	await transactions.transfer.create(app, 0, { srcAmount : '1000' })
	await transactions.transfer.create(app, 0, { destAcc : 2, srcAmount : '11.4', destAmount : '10' });
	await transactions.transfer.create(app, 0, { srcAcc : 1, destAcc : 3, srcAmount : '5.0301', destAmount : '4.7614' });
	await transactions.transfer.create(app, 0, { srcAcc : 2, srcAmount : '10', destAmount : '9.75' });
	await transactions.transfer.create(app, 0, { destAcc : 3, srcAmount : '10', destAmount : '9.50' });
}


async function runCreateDebtTests(app)
{
	app.view.setBlock('Submit debt transactions', 1);

	await transactions.debt.create(app, 0, { srcAmount : '1000' });
	await transactions.debt.create(app, 0, { debtType : false, acc : 2, srcAmount : '200' });
	await transactions.debt.create(app, 0, { debtType : true, acc : 3, srcAmount : '100.0101' });
	await transactions.debt.create(app, 0, { debtType : false, person : 1, acc : 3, srcAmount : '10' });
	await transactions.debt.create(app, 0, { acc : null, srcAmount : '105' });
	await transactions.debt.create(app, 0, { debtType : false, person : 1, acc : null, srcAmount : '105' });
}


async function runUpdateExpenseTests(app)
{
	app.view.setBlock('Update expense transactions', 2);

	await transactions.expense.update(app, 3, { destAmount : '124.7701' });
	await transactions.expense.update(app, 2, { srcAmount : '101', destAmount : '7065.30', destCurr : 1 });
	await transactions.expense.update(app, 1, { destAmount : '0.02' });
	await transactions.expense.update(app, 0, { srcAcc : 3, destAmount : '99.9' });
}


async function runUpdateIncomeTests(app)
{
	app.view.setBlock('Update income transactions', 2);

	await transactions.income.update(app, 0, { srcAmount : '100.001' });
	await transactions.income.update(app, 1, { srcAmount : '0.02' });
	await transactions.income.update(app, 2, { srcAmount : '7065.30', destAmount : '101', srcCurr : 1 });
	await transactions.income.update(app, 3, { destAcc : 3, srcAmount : '99.9' });
}


async function runUpdateTransferTests(app)
{
	app.view.setBlock('Update transfer transactions', 2);

	await transactions.transfer.update(app, 0, { destAcc : 0, srcAmount : '11' });
	await transactions.transfer.update(app, 1, { srcAcc : 2, srcAmount : '100', destAmount : '97.55' });
	await transactions.transfer.update(app, 2, { srcAcc : 3, srcAmount : '5.0301' });
	await transactions.transfer.update(app, 3, { srcAcc : 0, srcAmount : '50', destAmount : '0.82' });
	await transactions.transfer.update(app, 4, { srcAmount : '1050.01' });
}


async function runUpdateDebtTests(app)
{
	app.view.setBlock('Update debt transactions', 2);

	await transactions.debt.update(app, 0, { person : 0, srcAmount : '105' });
	await transactions.debt.update(app, 1, { acc : 1, srcAmount : '105' });
	await transactions.debt.update(app, 2, { debtType : true, srcAmount : '10' });
	await transactions.debt.update(app, 3, { debtType : false, acc : 2, srcAmount : '200.0202' });
	await transactions.debt.update(app, 4, { acc : null, srcAmount : '200' });
	await transactions.debt.update(app, 5, { srcAmount : '1001' });
}


async function runDeleteExpenseTests(app)
{
	app.view.setBlock('Delete expense transactions', 2);

	await transactions.del(app, App.EXPENSE, [0]);
	await transactions.del(app, App.EXPENSE, [0, 1]);
}


async function runDeleteIncomeTests(app)
{
	app.view.setBlock('Delete income transactions', 2);

	await transactions.del(app, App.INCOME, [0]);
	await transactions.del(app, App.INCOME, [0, 1, 2]);
}


async function runDeleteTransferTests(app)
{
	app.view.setBlock('Delete transfer transactions', 2);

	await transactions.del(app, App.TRANSFER, [1]);
	await transactions.del(app, App.TRANSFER, [0, 2]);
}


async function runDeleteDebtTests(app)
{
	app.view.setBlock('Delete debt transactions', 2);

	await transactions.del(app, App.DEBT, [0]);
	await transactions.del(app, App.DEBT, [0, 1]);
}


async function apiTests(app)
{
	await runAPI.run(app);
}


async function transactionsListTests(app)
{
	await runTransList.run(app);
}



let App = new Application;


export { App };
