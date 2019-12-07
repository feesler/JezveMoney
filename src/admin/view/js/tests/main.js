if (typeof module !== 'undefined' && module.exports)
{
	var LoginView = require('./view/login.js');

	var runAccounts = require('./run/account.js');
	var runPersons = require('./run/person.js');

	var runTransactionsCommon = require('./run/transaction/common.js');
	var runExpense = require('./run/transaction/expense.js');
	var runIncome = require('./run/transaction/income.js');
	var runTransfer = require('./run/transaction/transfer.js');
	var runDebt = require('./run/transaction/debt.js');

	var runTransList = require('./run/transactions.js');
	var runStatistics = require('./run/statistics.js');

	var runAPI = require('./run/api.js');

	var common = require('./common.js');
	var config = require('./config.js');
}
else
{
	var common = commonModule;
}


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



var App = {

	config,

	user_id : 2,

	run : {},

	accounts : [],
	persons : [],
	transactions : [],
	currencies : [],

	notify : function()
	{
		let notification = { App : this };

		common.onAppUpdate(notification);

		accounts.onAppUpdate(notification);
		persons.onAppUpdate(notification);

		transactions.common.onAppUpdate(notification);
		transactions.expense.onAppUpdate(notification);
		transactions.income.onAppUpdate(notification);
		transactions.transfer.onAppUpdate(notification);
		transactions.debt.onAppUpdate(notification);

		statistics.onAppUpdate(notification);

		runAPI.onAppUpdate(notification);
	},

	goToMainView : goToMainView
};


async function startTests(view)
{
	console.log('Starting tests');

	for(let key in common)
	{
		App[key] = common[key];
	}

	App.notify();

	view = await apiTests(view);
	view = await reloginAsTester(view);
	view = await view.goToProfile();
	view = await view.resetAll();
	view = await accountTests(view);
	view = await personTests(view);
	view = await transactionTests(view);
	view = await statistics.run(view);
	view = await transactionsListTests(view);

	return view;
}


async function accountTests(view)
{
	view.setBlock('Accounts', 1);

	view = await goToMainView(view);
	view = await view.goToAccounts();
	view = await view.goToCreateAccount();
	view = await accounts.createAccount1(view);
	view = await view.goToCreateAccount();
	view = await accounts.createAccount2(view);
	view = await view.goToUpdateAccount(0);
	view = await accounts.editAccount1(view);
	view = await view.goToCreateAccount();
	view = await accounts.create(view, { name : 'acc_3', curr_id : 1, balance : '500.99', icon : 2 });
	view = await accounts.del(view, [0, 1]);
	view = await view.goToCreateAccount();
	view = await accounts.create(view, { name : 'acc RUB', curr_id : 1, balance : '500.99', icon : 5 });
	view = await view.goToCreateAccount();
	view = await accounts.create(view, { name : 'acc USD', curr_id : 2, balance : '500.99', icon : 4 });
	view = await view.goToCreateAccount();
	view = await accounts.create(view, { name : 'acc EUR', curr_id : 3, balance : '10000.99', icon : 3 });
	view = await view.goToCreateAccount();
	view = await accounts.create(view, { name : 'card RUB', curr_id : 1, balance : '35000.40', icon : 3 });

	return view;
}


async function personTests(view)
{
	view.setBlock('Persons', 1);

	view = await goToMainView(view);
	view = await view.goToPersons();
	view = await persons.checkInitial(view);
	view = await persons.create(view, 'Alex');
	view = await persons.create(view, 'Maria');
	view = await persons.create(view, 'Johnny');
	view = await persons.create(view, 'Иван');
	view = await persons.update(view, 3, 'Ivan<');
	view = await persons.del(view, [0, 2]);

	return view;
}


async function transactionTests(view)
{
	view.setBlock('Transactions', 1);

	view = await createTransactionTests(view);
	view = await updateTransactionTests(view);
	view = await deleteTransactionTests(view);

	return view;
}


async function createTransactionTests(view)
{
	view.setBlock('Create transaction', 1);

	view = await goToMainView(view);
	view = await view.goToNewTransactionByAccount(0);
	view = await transactions.expense.stateLoop(view);
	view = await runCreateExpenseTests(view);

	view = await view.goToNewTransactionByAccount(0);
	view = await view.changeTransactionType(App.INCOME);
	view = await transactions.income.stateLoop(view);
	view = await runCreateIncomeTests(view);

	view = await view.goToNewTransactionByAccount(0);
	view = await view.changeTransactionType(App.TRANSFER);
	view = await transactions.transfer.stateLoop(view);
	view = await runCreateTransferTests(view);

	view = await view.goToNewTransactionByAccount(0);
	view = await view.changeTransactionType(App.DEBT);
	view = await transactions.debt.stateLoop(view);
	view = await runCreateDebtTests(view);

	return view;
}


async function updateTransactionTests(view)
{
	view.setBlock('Update transaction', 1);

	view = await runUpdateExpenseTests(view);
	view = await runUpdateIncomeTests(view);
	view = await runUpdateTransferTests(view);
	view = await runUpdateDebtTests(view);

	return view;
}


async function deleteTransactionTests(view)
{
	view.setBlock('Delete transaction', 1);

	view = await runDeleteExpenseTests(view);
	view = await runDeleteIncomeTests(view);
	view = await runDeleteTransferTests(view);
	view = await runDeleteDebtTests(view);

	return view;
}


async function goToMainView(view)
{
	view = await view.goToMainView();

	App.transactions = view.content.widgets[2].transList.items;
	App.accounts = view.content.widgets[0].tiles.items;
	App.persons = view.content.widgets[3].infoTiles.items;
	App.currencies = await view.global('currency');

	App.notify();

	return view;
}


async function runCreateExpenseTests(view)
{
	view.setBlock('Create expense transactions', 1);

	view = await transactions.expense.create(view, 0, 0, { destAmount : '123.7801' })
	view = await transactions.expense.create(view, 3, 2, { srcAmount : '100', destAmount : '7013.21', destCurr : 1 });
	view = await transactions.expense.create(view, 1, 0, { destAmount : '0.01' });
	view = await transactions.expense.create(view, 1, 0, { srcAcc : 4, destAmount : '99.99' });

	return view;
}


async function runCreateIncomeTests(view)
{
	view.setBlock('Create income transactions', 1);

	view = await transactions.income.create(view, 0, 0, { srcAmount : '10023.7801' });
	view = await transactions.income.create(view, 3, 2, { srcAmount : '7013.21', destAmount : '100', srcCurr : 1 });
	view = await transactions.income.create(view, 1, 0, { srcAmount : '0.01' });
	view = await transactions.income.create(view, 1, 0, { destAcc : 4, srcAmount : '99.99' });

	return view;
}


async function runCreateTransferTests(view)
{
	view.setBlock('Create transfer transactions', 1);

	view = await transactions.transfer.create(view, 0, { srcAmount : '1000' })
	view = await transactions.transfer.create(view, 0, { destAcc : 2, srcAmount : '11.4', destAmount : '10' });
	view = await transactions.transfer.create(view, 0, { srcAcc : 1, destAcc : 3, srcAmount : '5.0301', destAmount : '4.7614' });
	view = await transactions.transfer.create(view, 0, { srcAcc : 2, srcAmount : '10', destAmount : '9.75' });
	view = await transactions.transfer.create(view, 0, { destAcc : 3, srcAmount : '10', destAmount : '9.50' });

	return view;
}


async function runCreateDebtTests(view)
{
	view.setBlock('Submit debt transactions', 1);

	view = await transactions.debt.create(view, 0, { srcAmount : '1000' });
	view = await transactions.debt.create(view, 0, { debtType : false, acc : 2, srcAmount : '200' });
	view = await transactions.debt.create(view, 0, { debtType : true, acc : 3, srcAmount : '100.0101' });
	view = await transactions.debt.create(view, 0, { debtType : false, person : 1, acc : 3, srcAmount : '10' });
	view = await transactions.debt.create(view, 0, { acc : null, srcAmount : '105' });
	view = await transactions.debt.create(view, 0, { debtType : false, person : 1, acc : null, srcAmount : '105' });

	return view;
}


async function runUpdateExpenseTests(view)
{
	view.setBlock('Update expense transactions', 2);

	view = await transactions.expense.update(view, 3, { destAmount : '124.7701' });
	view = await transactions.expense.update(view, 2, { srcAmount : '101', destAmount : '7065.30', destCurr : 1 });
	view = await transactions.expense.update(view, 1, { destAmount : '0.02' });
	view = await transactions.expense.update(view, 0, { srcAcc : 3, destAmount : '99.9' });

	return view;
}


async function runUpdateIncomeTests(view)
{
	view.setBlock('Update income transactions', 2);

	view = await transactions.income.update(view, 0, { srcAmount : '100.001' });
	view = await transactions.income.update(view, 1, { srcAmount : '0.02' });
	view = await transactions.income.update(view, 2, { srcAmount : '7065.30', destAmount : '101', srcCurr : 1 });
	view = await transactions.income.update(view, 3, { destAcc : 3, srcAmount : '99.9' });

	return view;
}


async function runUpdateTransferTests(view)
{
	view.setBlock('Update transfer transactions', 2);

	view = await transactions.transfer.update(view, 0, { destAcc : 0, srcAmount : '11' });
	view = await transactions.transfer.update(view, 1, { srcAcc : 2, srcAmount : '100', destAmount : '97.55' });
	view = await transactions.transfer.update(view, 2, { srcAcc : 3, srcAmount : '5.0301' });
	view = await transactions.transfer.update(view, 3, { srcAcc : 0, srcAmount : '50', destAmount : '0.82' });
	view = await transactions.transfer.update(view, 4, { srcAmount : '1050.01' });

	return view;
}


async function runUpdateDebtTests(view)
{
	view.setBlock('Update debt transactions', 2);

	view = await transactions.debt.update(view, 0, { person : 0, srcAmount : '105' });
	view = await transactions.debt.update(view, 1, { acc : 1, srcAmount : '105' });
	view = await transactions.debt.update(view, 2, { debtType : true, srcAmount : '10' });
	view = await transactions.debt.update(view, 3, { debtType : false, acc : 2, srcAmount : '200.0202' });
	view = await transactions.debt.update(view, 4, { acc : null, srcAmount : '200' });
	view = await transactions.debt.update(view, 5, { srcAmount : '1001' });

	return view;
}


async function runDeleteExpenseTests(view)
{
	view.setBlock('Delete expense transactions', 2);

	view = await transactions.del(view, App.EXPENSE, [0]);
	view = await transactions.del(view, App.EXPENSE, [0, 1]);

	return view;
}


async function runDeleteIncomeTests(view)
{
	view.setBlock('Delete income transactions', 2);

	view = await transactions.del(view, App.INCOME, [0]);
	view = await transactions.del(view, App.INCOME, [0, 1, 2]);

	return view;
}


async function runDeleteTransferTests(view)
{
	view.setBlock('Delete transfer transactions', 2);

	view = await transactions.del(view, App.TRANSFER, [1]);
	view = await transactions.del(view, App.TRANSFER, [0, 2]);

	return view;
}


async function runDeleteDebtTests(view)
{
	view.setBlock('Delete debt transactions', 2);

	view = await transactions.del(view, App.DEBT, [0]);
	view = await transactions.del(view, App.DEBT, [0, 1]);

	return view;
}


async function apiTests(view)
{
	await runAPI.run(view, App);

	return view;
}


async function transactionsListTests(view)
{
	view = await runTransList.run(view, App);

	return view;
}


async function reloginAsTester(view)
{
	if (view.isUserLoggedIn())
	{
		view = await view.logoutUser();
	}

	if (!(view instanceof LoginView))
		throw new Error('Wrong page');

	return view.loginAs('test', 'test');
}


var main = { config : App.config,
				startTests : startTests };


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = main;
}
