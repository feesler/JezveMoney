if (typeof module !== 'undefined' && module.exports)
{
	var LoginView = require('./view/login.js');

	var runAccounts = require('./run/account.js');
	var runPersons = require('./run/person.js');

	var runTransactions = require('./run/transactions.js');
	var runExpense = require('./run/transaction/expense.js');
	var runIncome = require('./run/transaction/income.js');
	var runTransfer = require('./run/transaction/transfer.js');
	var runDebt = require('./run/transaction/debt.js');

	var runStatistics = require('./run/statistics.js');

	var common = require('./common.js');
	var copyObject = common.copyObject;
	var test = common.test;
	var getPosById = common.getPosById;

	var EXPENSE = common.EXPENSE;
	var INCOME = common.INCOME;
	var TRANSFER = common.TRANSFER;
	var DEBT = common.DEBT;

	var formatCurrency = common.formatCurrency;
}
else
{
	var common = commonModule;
}


var accounts = runAccounts;
var persons = runPersons;

var transactions = {
	common : runTransactions,
	expense : runExpense,
	income : runIncome,
	transfer : runTransfer,
	debt : runDebt
};

// Shortcuts
transactions.del = transactions.common.del;

var statistics = runStatistics;



var App = {
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
	},

	goToMainView : goToMainView
};


async function startTests(view)
{
	console.log('Starting tests');

	App.notify();

	view = await reloginAsTester(view);
	view = await view.goToProfile();
	view = await view.resetAll();
	view = await accountTests(view);
	view = await personTests(view);
	view = await transactionTests(view);
	view = await statistics.run(view);

	return view;
}


function accountTests(view)
{
	view.setBlock('Accounts', 1);

	return goToMainView(view)
			.then(view => view.goToAccounts())
			.then(view => view.goToCreateAccount())
			.then(accounts.createAccount1)
			.then(view => view.goToCreateAccount())
			.then(accounts.createAccount2)
			.then(view => view.goToUpdateAccount(0))
			.then(accounts.editAccount1)
			.then(view => view.goToCreateAccount())
			.then(view => accounts.create(view, { name : 'acc_3', curr_id : 1, balance : '500.99', icon : 2 }))
			.then(view => accounts.del(view, [0, 1]))
			.then(view => view.goToCreateAccount())
			.then(view => accounts.create(view, { name : 'acc RUB', curr_id : 1, balance : '500.99', icon : 5 }))
			.then(view => view.goToCreateAccount())
			.then(view => accounts.create(view, { name : 'acc USD', curr_id : 2, balance : '500.99', icon : 4 }))
			.then(view => view.goToCreateAccount())
			.then(view => accounts.create(view, { name : 'acc EUR', curr_id : 3, balance : '10000.99', icon : 3 }))
			.then(view => view.goToCreateAccount())
			.then(view => accounts.create(view, { name : 'card RUB', curr_id : 1, balance : '35000.40', icon : 3 }))
}


function personTests(view)
{
	view.setBlock('Persons', 1);

	return goToMainView(view)
			.then(view => view.goToPersons())
			.then(persons.checkInitial)
			.then(view => persons.create(view, 'Alex'))
			.then(view => persons.create(view, 'Maria'))
			.then(view => persons.create(view, 'Johnny'))
			.then(view => persons.create(view, 'Иван'))
			.then(view => persons.update(view, 3, 'Ivan<'))
			.then(view => persons.del(view, [0, 2]));
}


function transactionTests(view)
{
	view.setBlock('Transactions', 1);

	return createTransactionTests(view)
			.then(updateTransactionTests)
			.then(deleteTransactionTests);
}


function createTransactionTests(view)
{
	view.setBlock('Create transaction', 1);

	return goToMainView(view)
			.then(view => view.goToNewTransactionByAccount(0))
			.then(transactions.expense.stateLoop)
			.then(runCreateExpenseTests)
			.then(view => view.goToNewTransactionByAccount(0))
			.then(view => view.changeTransactionType(INCOME))
			.then(transactions.income.stateLoop)
			.then(runCreateIncomeTests)
			.then(view => view.goToNewTransactionByAccount(0))
			.then(view => view.changeTransactionType(TRANSFER))
			.then(transactions.transfer.stateLoop)
			.then(runCreateTransferTests)
			.then(view => view.goToNewTransactionByAccount(0))
			.then(view => view.changeTransactionType(DEBT))
			.then(transactions.debt.stateLoop)
			.then(runCreateDebtTests);
}


function updateTransactionTests(view)
{
	view.setBlock('Update transaction', 1);

	return runUpdateExpenseTests(view)
			.then(view => runUpdateIncomeTests(view))
			.then(view => runUpdateTransferTests(view))
			.then(view => runUpdateDebtTests(view));
}


function deleteTransactionTests(view)
{
	view.setBlock('Delete transaction', 1);

	return runDeleteExpenseTests(view)
			.then(view => runDeleteIncomeTests(view))
			.then(view => runDeleteTransferTests(view))
			.then(view => runDeleteDebtTests(view));
}


function goToMainView(view)
{
	return view.goToMainView()
			.then(async view =>
			{
				App.transactions = view.content.widgets[2].transList.items;
				App.accounts = view.content.widgets[0].tiles.items;
				App.persons = view.content.widgets[3].infoTiles.items;
				App.currencies = await view.global('currency');

				App.notify();

				return view;
			});
}


function runCreateExpenseTests(view)
{
	view.setBlock('Create expense transactions', 1);

	return transactions.expense.create(view, 0, 0, { destAmount : '123.7801' })
			.then(view => transactions.expense.create(view, 3, 2, { srcAmount : '100', destAmount : '7013.21', destCurr : 1 }))
			.then(view => transactions.expense.create(view, 1, 0, { destAmount : '0.01' }))
			.then(view => transactions.expense.create(view, 1, 0, { srcAcc : 4, destAmount : '99.99' }));
}


function runCreateIncomeTests(view)
{
	view.setBlock('Create income transactions', 1);

	return transactions.income.create(view, 0, 0, { srcAmount : '10023.7801' })
			.then(view => transactions.income.create(view, 3, 2, { srcAmount : '7013.21', destAmount : '100', srcCurr : 1 }))
			.then(view => transactions.income.create(view, 1, 0, { srcAmount : '0.01' }))
			.then(view => transactions.income.create(view, 1, 0, { destAcc : 4, srcAmount : '99.99' }));

}


function runCreateTransferTests(view)
{
	view.setBlock('Create transfer transactions', 1);

	return transactions.transfer.create(view, 0, { srcAmount : '1000' })
			.then(view => transactions.transfer.create(view, 0, { destAcc : 2, srcAmount : '11.4', destAmount : '10' }))
			.then(view => transactions.transfer.create(view, 0, { srcAcc : 1, destAcc : 3, srcAmount : '5.0301', destAmount : '4.7614' }))
			.then(view => transactions.transfer.create(view, 0, { srcAcc : 2, srcAmount : '10', destAmount : '9.75' }))
			.then(view => transactions.transfer.create(view, 0, { destAcc : 3, srcAmount : '10', destAmount : '9.50' }));
}


function runCreateDebtTests(view)
{
	view.setBlock('Submit debt transactions', 1);

	return transactions.debt.create(view, 0, { srcAmount : '1000' })
			.then(view => transactions.debt.create(view, 0, { debtType : false, acc : 2, srcAmount : '200' }))
			.then(view => transactions.debt.create(view, 0, { debtType : true, acc : 3, srcAmount : '100.0101' }))
			.then(view => transactions.debt.create(view, 0, { debtType : false, person : 1, acc : 3, srcAmount : '10' }))
			.then(view => transactions.debt.create(view, 0, { acc : null, srcAmount : '105' }))
			.then(view => transactions.debt.create(view, 0, { debtType : false, person : 1, acc : null, srcAmount : '105' }));
}


function runUpdateExpenseTests(view)
{
	view.setBlock('Update expense transactions', 2);

	return transactions.expense.update(view, 3, { destAmount : '124.7701' })
			.then(view => transactions.expense.update(view, 2, { srcAmount : '101', destAmount : '7065.30', destCurr : 1 }))
			.then(view => transactions.expense.update(view, 1, { destAmount : '0.02' }))
			.then(view => transactions.expense.update(view, 0, { srcAcc : 3, destAmount : '99.9' }));
}


function runUpdateIncomeTests(view)
{
	view.setBlock('Update income transactions', 2);

	return transactions.income.update(view, 0, { srcAmount : '100.001' })
			.then(view => transactions.income.update(view, 1, { srcAmount : '0.02' }))
			.then(view => transactions.income.update(view, 2, { srcAmount : '7065.30', destAmount : '101', srcCurr : 1 }))
			.then(view => transactions.income.update(view, 3, { destAcc : 3, srcAmount : '99.9' }));
}


function runUpdateTransferTests(view)
{
	view.setBlock('Update transfer transactions', 2);

	return transactions.transfer.update(view, 0, { destAcc : 0, srcAmount : '11' })
			.then(view => transactions.transfer.update(view, 1, { srcAcc : 2, srcAmount : '100', destAmount : '97.55' }))
			.then(view => transactions.transfer.update(view, 2, { srcAcc : 3, srcAmount : '5.0301' }))
			.then(view => transactions.transfer.update(view, 3, { srcAcc : 0, srcAmount : '50', destAmount : '0.82' }))
			.then(view => transactions.transfer.update(view, 4, { srcAmount : '1050.01' }));
}


function runUpdateDebtTests(view)
{
	view.setBlock('Update debt transactions', 2);

	return transactions.debt.update(view, 0, { person : 0, srcAmount : '105' })
			.then(view => transactions.debt.update(view, 1, { acc : 1, srcAmount : '105' }))
			.then(view => transactions.debt.update(view, 2, { debtType : true, srcAmount : '10' }))
			.then(view => transactions.debt.update(view, 3, { debtType : false, acc : 2, srcAmount : '200.0202' }))
			.then(view => transactions.debt.update(view, 4, { acc : null, srcAmount : '200' }))
			.then(view => transactions.debt.update(view, 5, { srcAmount : '1001' }));
}


function runDeleteExpenseTests(view)
{
	view.setBlock('Delete expense transactions', 2);

	return transactions.del(view, EXPENSE, [0])
			.then(view => transactions.del(view, EXPENSE, [0, 1]));
}


function runDeleteIncomeTests(view)
{
	view.setBlock('Delete income transactions', 2);

	return transactions.del(view, INCOME, [0])
			.then(view => transactions.del(view, INCOME, [0, 1, 2]));
}


function runDeleteTransferTests(view)
{
	view.setBlock('Delete transfer transactions', 2);

	return transactions.del(view, TRANSFER, [1])
			.then(view => transactions.del(view, TRANSFER, [0, 2]));
}


function runDeleteDebtTests(view)
{
	view.setBlock('Delete debt transactions', 2);

	return transactions.del(view, DEBT, [0])
			.then(view => transactions.del(view, DEBT, [0, 1]));
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


var config = {
/*	url : 'https://jezve.net/money/'	*/
	url : 'http://jezvemoney:8096/',
	testsExpected : 589
};


var main = { config : config,
				startTests : startTests };


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = main;
}
