var transactions = {};

if (typeof module !== 'undefined' && module.exports)
{
	var LoginView = require('./view/login.js');

	var accounts = require('./run/account.js');
	var persons = require('./run/person.js');
	transactions.expense = require('./run/transaction/expense.js');
	transactions.income = require('./run/transaction/income.js');
	transactions.transfer = require('./run/transaction/transfer.js');
	transactions.debt = require('./run/transaction/debt.js');

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
	var accounts = runAccounts;
	var persons = runPersons;
	transactions.expense = runExpense;
	transactions.income = runIncome;
	transactions.transfer = runTransfer;
	transactions.debt = runDebt;
}

var results = {};
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
		transactions.expense.onAppUpdate(notification);
		transactions.income.onAppUpdate(notification);
		transactions.transfer.onAppUpdate(notification);
		transactions.debt.onAppUpdate(notification);
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
	view = await statisticsTests(view);

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
			.then(view => accounts.createAccountWithParam(view, { name : 'acc_3', curr_id : 1, balance : '500.99', icon : 2 }))
			.then(view => accounts.deleteAccounts(view, [0, 1]))
			.then(view => view.goToCreateAccount())
			.then(view => accounts.createAccountWithParam(view, { name : 'acc RUB', curr_id : 1, balance : '500.99', icon : 5 }))
			.then(view => view.goToCreateAccount())
			.then(view => accounts.createAccountWithParam(view, { name : 'acc USD', curr_id : 2, balance : '500.99', icon : 4 }))
			.then(view => view.goToCreateAccount())
			.then(view => accounts.createAccountWithParam(view, { name : 'acc EUR', curr_id : 3, balance : '10000.99', icon : 3 }))
			.then(view => view.goToCreateAccount())
			.then(view => accounts.createAccountWithParam(view, { name : 'card RUB', curr_id : 1, balance : '35000.40', icon : 3 }))
}


function personTests(view)
{
	view.setBlock('Persons', 1);

	return goToMainView(view)
			.then(view => view.goToPersons())
			.then(persons.checkInitialPersons)
			.then(view => persons.createPerson(view, 'Alex'))
			.then(view => persons.createPerson(view, 'Maria'))
			.then(view => persons.createPerson(view, 'Johnny'))
			.then(view => persons.createPerson(view, 'Иван'))
			.then(view => persons.updatePerson(view, 3, 'Ivan<'))
			.then(view => persons.deletePersons(view, [0, 2]));
}


function transactionTests(view)
{
	view.setBlock('Transactions', 1);

	return createTransactionTests(view)
			.then(updateTransactionTests)
			.then(deleteTransactionTests);
}


function statisticsTests(view)
{
	view.setBlock('Statistics', 1);

	return goToMainView(view)
			.then(view => view.goToStatistics())
			.then(async view =>
			{
				var state = { value : { chart : { bars : { length : 1 } } } };
				await test('Initial state of statistics view', async () => {}, view, state);

				return view;
			})
			.then(view => view.filterByType(INCOME))
			.then(async view =>
			{
				var state = { value : { chart : { bars : { length : 0 } } } };
				await test('Income statistics view', async () => {}, view, state);

				return view;
			})
			.then(view => view.filterByType(TRANSFER))
			.then(async view =>
			{
				var state = { value : { chart : { bars : { length : 2 } } } };
				await test('Transfer statistics view', async () => {}, view, state);

				return view;
			})
			.then(view => view.filterByType(DEBT))
			.then(async view =>
			{
				var state = { value : { chart : { bars : { length : 3 } } } };
				await test('Debt statistics view', async () => {}, view, state);

				return view;
			})
			.then(view => view.filterByType(EXPENSE))
			.then(view => view.selectAccountByPos(1))
			.then(async view =>
			{
				var state = { value : { chart : { bars : { length : 0 } } } };
				await test('Filter statistics by account', async () => {}, view, state);

				return view;
			})
			.then(view => view.filterByType(DEBT))
			.then(view => view.groupByDay())
			.then(async view =>
			{
				var state = { value : { chart : { bars : { length : 1 } } } };
				await test('Group statistics by day', async () => {}, view, state);

				return view;
			})
			.then(view => view.groupByWeek())
			.then(async view =>
			{
				var state = { value : { chart : { bars : { length : 1 } } } };
				await test('Group statistics by week', async () => {}, view, state);

				return view;
			})
			.then(view => view.groupByMonth())
			.then(async view =>
			{
				var state = { value : { chart : { bars : { length : 1 } } } };
				await test('Group statistics by month', async () => {}, view, state);

				return view;
			})
			.then(view => view.groupByYear())
			.then(async view =>
			{
				var state = { value : { chart : { bars : { length : 1 } } } };
				await test('Group statistics by year', async () => {}, view, state);

				return view;
			})
			.then(view => view.byCurrencies())
			.then(async view =>
			{
				var state = { value : { chart : { bars : { length : 1 } } } };
				await test('Filter by currencies', async () => {}, view, state);

				return view;
			});
}


function createTransactionTests(view)
{
	view.setBlock('Create transaction', 1);

	return goToMainView(view)
			.then(view => view.goToNewTransactionByAccount(0))
			.then(transactions.expense.expenseTransactionLoop)
			.then(runCreateExpenseTests)
			.then(view => view.goToNewTransactionByAccount(0))
			.then(view => view.changeTransactionType(INCOME))
			.then(transactions.income.incomeTransactionLoop)
			.then(runCreateIncomeTests)
			.then(view => view.goToNewTransactionByAccount(0))
			.then(view => view.changeTransactionType(TRANSFER))
			.then(transactions.transfer.transferTransactionLoop)
			.then(runCreateTransferTests)
			.then(view => view.goToNewTransactionByAccount(0))
			.then(view => view.changeTransactionType(DEBT))
			.then(transactions.debt.debtTransactionLoop)
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
				App.transactions = view.content.widgets[2].transList;
				App.accounts = view.content.widgets[0].tiles;
				App.persons = view.content.widgets[3].infoTiles;
				App.currencies = await view.global('currency');

				App.notify();

				return view;
			});
}


function runCreateExpenseTests(view)
{
	view.setBlock('Create expense transactions', 1);

	return transactions.expense.createExpense(view, 0, 0, { destAmount : '123.7801' })
			.then(view => transactions.expense.createExpense(view, 3, 2, { srcAmount : '100', destAmount : '7013.21', destCurr : 1 }))
			.then(view => transactions.expense.createExpense(view, 1, 0, { destAmount : '0.01' }))
			.then(view => transactions.expense.createExpense(view, 1, 0, { srcAcc : 4, destAmount : '99.99' }));
}


function runCreateIncomeTests(view)
{
	view.setBlock('Create income transactions', 1);

	return transactions.income.createIncome(view, 0, 0, { srcAmount : '10023.7801' })
			.then(view => transactions.income.createIncome(view, 3, 2, { srcAmount : '7013.21', destAmount : '100', srcCurr : 1 }))
			.then(view => transactions.income.createIncome(view, 1, 0, { srcAmount : '0.01' }))
			.then(view => transactions.income.createIncome(view, 1, 0, { destAcc : 4, srcAmount : '99.99' }));

}


function runCreateTransferTests(view)
{
	view.setBlock('Create transfer transactions', 1);

	return transactions.transfer.createTransfer(view, 0, { srcAmount : '1000' })
			.then(view => transactions.transfer.createTransfer(view, 0, { destAcc : 2, srcAmount : '11.4', destAmount : '10' }))
			.then(view => transactions.transfer.createTransfer(view, 0, { srcAcc : 1, destAcc : 3, srcAmount : '5.0301', destAmount : '4.7614' }))
			.then(view => transactions.transfer.createTransfer(view, 0, { srcAcc : 2, srcAmount : '10', destAmount : '9.75' }))
			.then(view => transactions.transfer.createTransfer(view, 0, { destAcc : 3, srcAmount : '10', destAmount : '9.50' }));
}


function runCreateDebtTests(view)
{
	view.setBlock('Submit debt transactions', 1);

	return transactions.debt.createDebt(view, 0, { srcAmount : '1000' })
			.then(view => transactions.debt.createDebt(view, 0, { debtType : false, acc : 2, srcAmount : '200' }))
			.then(view => transactions.debt.createDebt(view, 0, { debtType : true, acc : 3, srcAmount : '100.0101' }))
			.then(view => transactions.debt.createDebt(view, 0, { debtType : false, person : 1, acc : 3, srcAmount : '10' }))
			.then(view => transactions.debt.createDebt(view, 0, { acc : null, srcAmount : '105' }))
			.then(view => transactions.debt.createDebt(view, 0, { debtType : false, person : 1, acc : null, srcAmount : '105' }));
}


function runUpdateExpenseTests(view)
{
	view.setBlock('Update expense transactions', 2);

	return transactions.expense.updateExpense(view, 3, { destAmount : '124.7701' })
			.then(view => transactions.expense.updateExpense(view, 2, { srcAmount : '101', destAmount : '7065.30', destCurr : 1 }))
			.then(view => transactions.expense.updateExpense(view, 1, { destAmount : '0.02' }))
			.then(view => transactions.expense.updateExpense(view, 0, { srcAcc : 3, destAmount : '99.9' }));
}


function runUpdateIncomeTests(view)
{
	view.setBlock('Update income transactions', 2);

	return transactions.income.updateIncome(view, 0, { srcAmount : '100.001' })
			.then(view => transactions.income.updateIncome(view, 1, { srcAmount : '0.02' }))
			.then(view => transactions.income.updateIncome(view, 2, { srcAmount : '7065.30', destAmount : '101', srcCurr : 1 }))
			.then(view => transactions.income.updateIncome(view, 3, { destAcc : 3, srcAmount : '99.9' }));
}


function runUpdateTransferTests(view)
{
	view.setBlock('Update transfer transactions', 2);

	return transactions.transfer.updateTransfer(view, 0, { destAcc : 0, srcAmount : '11' })
			.then(view => transactions.transfer.updateTransfer(view, 1, { srcAcc : 2, srcAmount : '100', destAmount : '97.55' }))
			.then(view => transactions.transfer.updateTransfer(view, 2, { srcAcc : 3, srcAmount : '5.0301' }))
			.then(view => transactions.transfer.updateTransfer(view, 3, { srcAcc : 0, srcAmount : '50', destAmount : '0.82' }))
			.then(view => transactions.transfer.updateTransfer(view, 4, { srcAmount : '1050.01' }));
}


function runUpdateDebtTests(view)
{
	view.setBlock('Update debt transactions', 2);

	return transactions.debt.updateDebt(view, 0, { person : 0, srcAmount : '105' })
			.then(view => transactions.debt.updateDebt(view, 1, { acc : 1, srcAmount : '105' }))
			.then(view => transactions.debt.updateDebt(view, 2, { debtType : true, srcAmount : '10' }))
			.then(view => transactions.debt.updateDebt(view, 3, { debtType : false, acc : 2, srcAmount : '200.0202' }))
			.then(view => transactions.debt.updateDebt(view, 4, { acc : null, srcAmount : '200' }))
			.then(view => transactions.debt.updateDebt(view, 5, { srcAmount : '1001' }));
}


function runDeleteExpenseTests(view)
{
	view.setBlock('Delete expense transactions', 2);

	return deleteTransactions(view, EXPENSE, [0])
			.then(view => deleteTransactions(view, EXPENSE, [0, 1]));
}


function runDeleteIncomeTests(view)
{
	view.setBlock('Delete income transactions', 2);

	return deleteTransactions(view, INCOME, [0])
			.then(view => deleteTransactions(view, INCOME, [0, 1, 2]));
}


function runDeleteTransferTests(view)
{
	view.setBlock('Delete transfer transactions', 2);

	return deleteTransactions(view, TRANSFER, [1])
			.then(view => deleteTransactions(view, TRANSFER, [0, 2]));
}


function runDeleteDebtTests(view)
{
	view.setBlock('Delete debt transactions', 2);

	return deleteTransactions(view, DEBT, [0])
			.then(view => deleteTransactions(view, DEBT, [0, 1]));
}



function getPersonByAcc(persons, acc_id)
{
	return persons.find(p =>
	{
		return p.accounts && p.accounts.some(a => a.id == acc_id);
	});
}


function deleteTransactions(view, type, transactions)
{
	return goToMainView(view)
			.then(async view =>
			{
				App.beforeDeleteTransaction = {};

				App.beforeDeleteTransaction.accounts = copyObject(await view.global('accounts'));
				App.beforeDeleteTransaction.persons = copyObject(await view.global('persons'));
				App.notify();

				return view.goToTransactions();
			})
			.then(view => view.filterByType(type))
			.then(async view =>
			{
				let trCount = view.content.transactions ? view.content.transactions.length : 0;
				App.beforeDeleteTransaction.trCount = trCount;
				App.beforeDeleteTransaction.deleteList = await Promise.all(transactions.map(trPos =>
				{
					if (trPos < 0 || trPos >= trCount)
						throw new Error('Wrong transaction position: ' + trPos);

					return view.getTransactionObject(view.content.transactions[trPos].id);
				}));

				App.beforeDeleteTransaction.deleteList.forEach(trObj =>
				{
					if (!trObj)
						throw new Error('Transaction not found');
				});
				App.notify();

				return view.deleteTransactions(transactions);
			})
			.then(async view =>
			{
				var state = { value : { transactions : { length : App.transactions.length - transactions.length } } };

				await test('Delete transactions [' + transactions.join() + ']', async () => {}, view, state);

				App.transactions = view.content.transactions;
				App.notify();

				return view;
			})
			.then(goToMainView)
			.then(async view =>
			{
				let origAccounts = App.beforeDeleteTransaction.accounts;
				let origPersons = App.beforeDeleteTransaction.persons;

				// Widget changes
				var personsWidget = { infoTiles : { length : App.persons.length } };
				var accWidget = { tiles : { length : App.accounts.length } };

				let affectedAccounts = [];
				let affectedPersons = [];

				App.beforeDeleteTransaction.deleteList.forEach(tr =>
				{
					let srcAccPos, destAccPos;

					if (tr.type == EXPENSE)
					{
						let srcAccPos = getPosById(origAccounts, tr.src_id);
						if (srcAccPos === -1)
							throw new Error('Account ' + tr.src_id + ' not found');

						if (!(srcAccPos in affectedAccounts))
						{
							let acc = origAccounts[srcAccPos];

							affectedAccounts[srcAccPos] = { balance : acc.balance,
															name : acc.name,
															curr_id : acc.curr_id };
						}

						affectedAccounts[srcAccPos].balance += tr.src_amount;
					}
					else if (tr.type == INCOME)
					{
						let destAccPos = getPosById(origAccounts, tr.dest_id);
						if (destAccPos === -1)
							throw new Error('Account ' + tr.dest_id + ' not found');

						if (!(destAccPos in affectedAccounts))
						{
							let acc = origAccounts[destAccPos];

							affectedAccounts[destAccPos] = { balance : acc.balance,
															name : acc.name,
															curr_id : acc.curr_id };
						}

						affectedAccounts[destAccPos].balance -= tr.dest_amount;
					}
					else if (tr.type == TRANSFER)
					{
						let srcAccPos = getPosById(origAccounts, tr.src_id);
						if (srcAccPos === -1)
							throw new Error('Account ' + tr.src_id + ' not found');

						if (!(srcAccPos in affectedAccounts))
						{
							let acc = origAccounts[srcAccPos];

							affectedAccounts[srcAccPos] = { balance : acc.balance,
															name : acc.name,
															curr_id : acc.curr_id };
						}

						let destAccPos = getPosById(origAccounts, tr.dest_id);
						if (destAccPos === -1)
							throw new Error('Account ' + tr.dest_id + ' not found');

						if (!(destAccPos in affectedAccounts))
						{
							let acc = origAccounts[destAccPos];

							affectedAccounts[destAccPos] = { balance : acc.balance,
															name : acc.name,
															curr_id : acc.curr_id };
						}

						affectedAccounts[srcAccPos].balance += tr.src_amount;
						affectedAccounts[destAccPos].balance -= tr.dest_amount;
					}
					else if (tr.type == DEBT)
					{
						let personAcc_id = (tr.debtType == 1) ? tr.src_id : tr.dest_id;
						let person = getPersonByAcc(origPersons, personAcc_id);
						if (!person)
							throw new Error('Not found person with account ' + personAcc_id);

						if (!person.accounts)
							person.accounts = [];

						let personPos = getPosById(origPersons, person.id);

						if (!(personPos in affectedPersons))
						{
							affectedPersons[personPos] = { name : person.name,
															accounts : copyObject(person.accounts) };
						}

						let personAcc = affectedPersons[personPos].accounts.find(a => a.id == personAcc_id);
						if (!personAcc)
							throw new Error('Not found account of person');

						personAcc.balance += (tr.debtType == 1) ? tr.src_amount : -tr.dest_amount;

						let acc_id = (tr.debtType == 1) ? tr.dest_id : tr.src_id;
						if (acc_id)
						{
							let accPos = getPosById(origAccounts, acc_id);
							if (accPos === -1)
								throw new Error('Account ' + acc_id + ' not found');

							if (!(accPos in affectedAccounts))
							{
								let acc = origAccounts[accPos];

								affectedAccounts[accPos] = { balance : acc.balance,
																name : acc.name,
																curr_id : acc.curr_id };
							}

							affectedAccounts[accPos].balance += (tr.debtType == 1) ? -tr.dest_amount : tr.src_amount;
						}
					}
				});


				for(let accPos in affectedAccounts)
				{
					let acc = affectedAccounts[accPos];
					fmtBal = formatCurrency(acc.balance, acc.curr_id);

					accWidget.tiles[accPos] = { balance : fmtBal, name : acc.name };
				}

				for(let personPos in affectedPersons)
				{
					let person = affectedPersons[personPos];

					let debtAccounts = person.accounts.reduce((val, pacc) =>
					{
						if (pacc.balance == 0)
							return val;

						let fmtBal = formatCurrency(pacc.balance, pacc.curr_id);
						return val.concat(fmtBal);
					}, []);

					let debtSubtitle = debtAccounts.length ? debtAccounts.join('\n') : 'No debts';

					personsWidget.infoTiles[personPos] = { title : person.name, subtitle : debtSubtitle };
				}

				var state = { values : { widgets : { length : 5, 0 : accWidget, 3 : personsWidget } } };

				await test('Delete transactions [' + transactions.join() + ']', async () => {}, view, state);

				App.transactions = view.content.widgets[2].transList;
				App.accounts = view.content.widgets[0].tiles;
				App.persons = view.content.widgets[3].infoTiles;
				App.notify();

				return view;
			});
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


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = { testURL : 'https://jezve.net/money/',
						startTests : startTests };
}
else
{
	var testURL = 'https://jezve.net/money/';
}
