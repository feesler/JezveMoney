var transactions = {};

if (typeof module !== 'undefined' && module.exports)
{
	var LoginPage = require('./page/loginpage.js');

	var accounts = require('./run/account.js');
	var persons = require('./run/person.js');
	transactions.expense = require('./run/transaction/expense.js');
	transactions.income = require('./run/transaction/income.js');
	transactions.transfer = require('./run/transaction/transfer.js');
	transactions.debt = require('./run/transaction/debt.js');

	let common = require('./common.js');
	var copyObject = common.copyObject;
	var test = common.test;
	var getPosById = common.getPosById;

	let a = require('../../../../view/js/app.js');
	var EXPENSE = a.EXPENSE;
	var INCOME = a.INCOME;
	var TRANSFER = a.TRANSFER;
	var DEBT = a.DEBT;

	var c = require('../../../../view/js/currency.js');
	var formatCurrency = c.formatCurrency;
}
else
{
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

		if (typeof module !== 'undefined' && module.exports)
			c.init(App.currencies);

		accounts.init(notification);
		persons.init(notification);
		transactions.expense.init(notification);
		transactions.income.init(notification);
		transactions.transfer.init(notification);
		transactions.debt.init(notification);
	},

	goToMainPage : goToMainPage
};


async function startTests(page)
{
	console.log('Starting tests');

	App.notify();

	page = await reloginAsTester(page);
	page = await page.goToProfilePage();
	page = await page.resetAll();
	page = await accountTests(page);
	page = await personTests(page);
	page = await transactionTests(page);
	page = await statisticsTests(page);

	return page;
}


function accountTests(page)
{
	page.setBlock('Accounts', 1);

	return goToMainPage(page)
			.then(page => page.goToAccounts())
			.then(page => page.goToCreateAccount())
			.then(accounts.createAccount1)
			.then(page => page.goToCreateAccount())
			.then(accounts.createAccount2)
			.then(page => page.goToUpdateAccount(0))
			.then(accounts.editAccount1)
			.then(page => page.goToCreateAccount())
			.then(page => accounts.createAccountWithParam(page, { name : 'acc_3', curr_id : 1, balance : '500.99', icon : 2 }))
			.then(page => accounts.deleteAccounts(page, [0, 1]))
			.then(page => page.goToCreateAccount())
			.then(page => accounts.createAccountWithParam(page, { name : 'acc RUB', curr_id : 1, balance : '500.99', icon : 5 }))
			.then(page => page.goToCreateAccount())
			.then(page => accounts.createAccountWithParam(page, { name : 'acc USD', curr_id : 2, balance : '500.99', icon : 4 }))
			.then(page => page.goToCreateAccount())
			.then(page => accounts.createAccountWithParam(page, { name : 'acc EUR', curr_id : 3, balance : '10000.99', icon : 3 }))
			.then(page => page.goToCreateAccount())
			.then(page => accounts.createAccountWithParam(page, { name : 'card RUB', curr_id : 1, balance : '35000.40', icon : 3 }))
}


function personTests(page)
{
	page.setBlock('Persons', 1);

	return goToMainPage(page)
			.then(page => page.goToPersons())
			.then(persons.checkInitialPersons)
			.then(page => persons.createPerson(page, 'Alex'))
			.then(page => persons.createPerson(page, 'Maria'))
			.then(page => persons.createPerson(page, 'Johnny'))
			.then(page => persons.createPerson(page, 'Иван'))
			.then(page => persons.updatePerson(page, 3, 'Ivan<'))
			.then(page => persons.deletePersons(page, [0, 2]));
}


function transactionTests(page)
{
	page.setBlock('Transactions', 1);

	return createTransactionTests(page)
			.then(updateTransactionTests)
			.then(deleteTransactionTests);
}


function statisticsTests(page)
{
	page.setBlock('Statistics', 1);

	return goToMainPage(page)
			.then(page => page.goToStatistics())
			.then(async page =>
			{
				var state = { value : { chart : { bars : { length : 1 } } } };
				await test('Initial state of statistics page', async () => {}, page, state);

				return page;
			})
			.then(page => page.filterByType(INCOME))
			.then(async page =>
			{
				var state = { value : { chart : { bars : { length : 0 } } } };
				await test('Income statistics page', async () => {}, page, state);

				return page;
			})
			.then(page => page.filterByType(TRANSFER))
			.then(async page =>
			{
				var state = { value : { chart : { bars : { length : 2 } } } };
				await test('Transfer statistics page', async () => {}, page, state);

				return page;
			})
			.then(page => page.filterByType(DEBT))
			.then(async page =>
			{
				var state = { value : { chart : { bars : { length : 3 } } } };
				await test('Debt statistics page', async () => {}, page, state);

				return page;
			})
			.then(page => page.filterByType(EXPENSE))
			.then(page => page.selectAccountByPos(1))
			.then(async page =>
			{
				var state = { value : { chart : { bars : { length : 0 } } } };
				await test('Filter statistics by account', async () => {}, page, state);

				return page;
			})
			.then(page => page.filterByType(DEBT))
			.then(page => page.groupByDay())
			.then(async page =>
			{
				var state = { value : { chart : { bars : { length : 1 } } } };
				await test('Group statistics by day', async () => {}, page, state);

				return page;
			})
			.then(page => page.groupByWeek())
			.then(async page =>
			{
				var state = { value : { chart : { bars : { length : 1 } } } };
				await test('Group statistics by week', async () => {}, page, state);

				return page;
			})
			.then(page => page.groupByMonth())
			.then(async page =>
			{
				var state = { value : { chart : { bars : { length : 1 } } } };
				await test('Group statistics by month', async () => {}, page, state);

				return page;
			})
			.then(page => page.groupByYear())
			.then(async page =>
			{
				var state = { value : { chart : { bars : { length : 1 } } } };
				await test('Group statistics by year', async () => {}, page, state);

				return page;
			})
			.then(page => page.byCurrencies())
			.then(async page =>
			{
				var state = { value : { chart : { bars : { length : 1 } } } };
				await test('Filter by currencies', async () => {}, page, state);

				return page;
			});
}


function createTransactionTests(page)
{
	page.setBlock('Create transaction', 1);

	return goToMainPage(page)
			.then(page => page.goToNewTransactionByAccount(0))
			.then(transactions.expense.expenseTransactionLoop)
			.then(runCreateExpenseTests)
			.then(page => page.goToNewTransactionByAccount(0))
			.then(page => page.changeTransactionType(INCOME))
			.then(transactions.income.incomeTransactionLoop)
			.then(runCreateIncomeTests)
			.then(page => page.goToNewTransactionByAccount(0))
			.then(page => page.changeTransactionType(TRANSFER))
			.then(transactions.transfer.transferTransactionLoop)
			.then(runCreateTransferTests)
			.then(page => page.goToNewTransactionByAccount(0))
			.then(page => page.changeTransactionType(DEBT))
			.then(transactions.debt.debtTransactionLoop)
			.then(runCreateDebtTests);
}


function updateTransactionTests(page)
{
	page.setBlock('Update transaction', 1);

	return runUpdateExpenseTests(page)
			.then(page => runUpdateIncomeTests(page))
			.then(page => runUpdateTransferTests(page))
			.then(page => runUpdateDebtTests(page));
}


function deleteTransactionTests(page)
{
	page.setBlock('Delete transaction', 1);

	return runDeleteExpenseTests(page)
			.then(page => runDeleteIncomeTests(page))
			.then(page => runDeleteTransferTests(page))
			.then(page => runDeleteDebtTests(page));
}


function goToMainPage(page)
{
	return page.goToMainPage()
			.then(async page =>
			{
				App.transactions = page.content.widgets[2].transList;
				App.accounts = page.content.widgets[0].tiles;
				App.persons = page.content.widgets[3].infoTiles;
				App.currencies = await page.global('currency');

				App.notify();

				return page;
			});
}


function runCreateExpenseTests(page)
{
	page.setBlock('Create expense transactions', 1);

	return transactions.expense.createExpense(page, 0, 0, { destAmount : '123.7801' })
			.then(page => transactions.expense.createExpense(page, 3, 2, { srcAmount : '100', destAmount : '7013.21', destCurr : 1 }))
			.then(page => transactions.expense.createExpense(page, 1, 0, { destAmount : '0.01' }))
			.then(page => transactions.expense.createExpense(page, 1, 0, { srcAcc : 4, destAmount : '99.99' }));
}


function runCreateIncomeTests(page)
{
	page.setBlock('Create income transactions', 1);

	return transactions.income.createIncome(page, 0, 0, { srcAmount : '10023.7801' })
			.then(page => transactions.income.createIncome(page, 3, 2, { srcAmount : '7013.21', destAmount : '100', srcCurr : 1 }))
			.then(page => transactions.income.createIncome(page, 1, 0, { srcAmount : '0.01' }))
			.then(page => transactions.income.createIncome(page, 1, 0, { destAcc : 4, srcAmount : '99.99' }));

}


function runCreateTransferTests(page)
{
	page.setBlock('Create transfer transactions', 1);

	return transactions.transfer.createTransfer(page, 0, { srcAmount : '1000' })
			.then(page => transactions.transfer.createTransfer(page, 0, { destAcc : 2, srcAmount : '11.4', destAmount : '10' }))
			.then(page => transactions.transfer.createTransfer(page, 0, { srcAcc : 1, destAcc : 3, srcAmount : '5.0301', destAmount : '4.7614' }))
			.then(page => transactions.transfer.createTransfer(page, 0, { srcAcc : 2, srcAmount : '10', destAmount : '9.75' }))
			.then(page => transactions.transfer.createTransfer(page, 0, { destAcc : 3, srcAmount : '10', destAmount : '9.50' }));
}


function runCreateDebtTests(page)
{
	page.setBlock('Submit debt transactions', 1);

	return transactions.debt.createDebt(page, 0, { srcAmount : '1000' })
			.then(page => transactions.debt.createDebt(page, 0, { debtType : false, acc : 2, srcAmount : '200' }))
			.then(page => transactions.debt.createDebt(page, 0, { debtType : true, acc : 3, srcAmount : '100.0101' }))
			.then(page => transactions.debt.createDebt(page, 0, { debtType : false, person : 1, acc : 3, srcAmount : '10' }))
			.then(page => transactions.debt.createDebt(page, 0, { acc : null, srcAmount : '105' }))
			.then(page => transactions.debt.createDebt(page, 0, { debtType : false, person : 1, acc : null, srcAmount : '105' }));
}


function runUpdateExpenseTests(page)
{
	page.setBlock('Update expense transactions', 2);

	return transactions.expense.updateExpense(page, 3, { destAmount : '124.7701' })
			.then(page => transactions.expense.updateExpense(page, 2, { srcAmount : '101', destAmount : '7065.30', destCurr : 1 }))
			.then(page => transactions.expense.updateExpense(page, 1, { destAmount : '0.02' }))
			.then(page => transactions.expense.updateExpense(page, 0, { srcAcc : 3, destAmount : '99.9' }));
}


function runUpdateIncomeTests(page)
{
	page.setBlock('Update income transactions', 2);

	return transactions.income.updateIncome(page, 0, { srcAmount : '100.001' })
			.then(page => transactions.income.updateIncome(page, 1, { srcAmount : '0.02' }))
			.then(page => transactions.income.updateIncome(page, 2, { srcAmount : '7065.30', destAmount : '101', srcCurr : 1 }))
			.then(page => transactions.income.updateIncome(page, 3, { destAcc : 3, srcAmount : '99.9' }));
}


function runUpdateTransferTests(page)
{
	page.setBlock('Update transfer transactions', 2);

	return transactions.transfer.updateTransfer(page, 0, { destAcc : 0, srcAmount : '11' })
			.then(page => transactions.transfer.updateTransfer(page, 1, { srcAcc : 2, srcAmount : '100', destAmount : '97.55' }))
			.then(page => transactions.transfer.updateTransfer(page, 2, { srcAcc : 3, srcAmount : '5.0301' }))
			.then(page => transactions.transfer.updateTransfer(page, 3, { srcAcc : 0, srcAmount : '50', destAmount : '0.82' }))
			.then(page => transactions.transfer.updateTransfer(page, 4, { srcAmount : '1050.01' }));
}


function runUpdateDebtTests(page)
{
	page.setBlock('Update debt transactions', 2);

	return transactions.debt.updateDebt(page, 0, { person : 0, srcAmount : '105' })
			.then(page => transactions.debt.updateDebt(page, 1, { acc : 1, srcAmount : '105' }))
			.then(page => transactions.debt.updateDebt(page, 2, { debtType : true, srcAmount : '10' }))
			.then(page => transactions.debt.updateDebt(page, 3, { debtType : false, acc : 2, srcAmount : '200.0202' }))
			.then(page => transactions.debt.updateDebt(page, 4, { acc : null, srcAmount : '200' }))
			.then(page => transactions.debt.updateDebt(page, 5, { srcAmount : '1001' }));
}


function runDeleteExpenseTests(page)
{
	page.setBlock('Delete expense transactions', 2);

	return deleteTransactions(page, EXPENSE, [0])
			.then(page => deleteTransactions(page, EXPENSE, [0, 1]));
}


function runDeleteIncomeTests(page)
{
	page.setBlock('Delete income transactions', 2);

	return deleteTransactions(page, INCOME, [0])
			.then(page => deleteTransactions(page, INCOME, [0, 1, 2]));
}


function runDeleteTransferTests(page)
{
	page.setBlock('Delete transfer transactions', 2);

	return deleteTransactions(page, TRANSFER, [1])
			.then(page => deleteTransactions(page, TRANSFER, [0, 2]));
}


function runDeleteDebtTests(page)
{
	page.setBlock('Delete debt transactions', 2);

	return deleteTransactions(page, DEBT, [0])
			.then(page => deleteTransactions(page, DEBT, [0, 1]));
}



function getPersonByAcc(persons, acc_id)
{
	return persons.find(p =>
	{
		return p.accounts && p.accounts.some(a => a.id == acc_id);
	});
}


function deleteTransactions(page, type, transactions)
{
	return goToMainPage(page)
			.then(async page =>
			{
				App.beforeDeleteTransaction = {};

				App.beforeDeleteTransaction.accounts = copyObject(await page.global('accounts'));
				App.beforeDeleteTransaction.persons = copyObject(await page.global('persons'));
				App.notify();

				return page.goToTransactions();
			})
			.then(page => page.filterByType(type))
			.then(async page =>
			{
				let trCount = page.content.transactions ? page.content.transactions.length : 0;
				App.beforeDeleteTransaction.trCount = trCount;
				App.beforeDeleteTransaction.deleteList = await Promise.all(transactions.map(trPos =>
				{
					if (trPos < 0 || trPos >= trCount)
						throw new Error('Wrong transaction position: ' + trPos);

					return page.getTransactionObject(page.content.transactions[trPos].id);
				}));

				App.beforeDeleteTransaction.deleteList.forEach(trObj =>
				{
					if (!trObj)
						throw new Error('Transaction not found');
				});
				App.notify();

				return page.deleteTransactions(transactions);
			})
			.then(async page =>
			{
				var state = { value : { transactions : { length : App.transactions.length - transactions.length } } };

				await test('Delete transactions [' + transactions.join() + ']', async () => {}, page, state);

				App.transactions = page.content.transactions;
				App.notify();

				return page;
			})
			.then(goToMainPage)
			.then(async page =>
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

				await test('Delete transactions [' + transactions.join() + ']', async () => {}, page, state);

				App.transactions = page.content.widgets[2].transList;
				App.accounts = page.content.widgets[0].tiles;
				App.persons = page.content.widgets[3].infoTiles;
				App.notify();

				return page;
			});
}


async function reloginAsTester(page)
{
	if (page.isUserLoggedIn())
	{
		page = await page.logoutUser();
	}

	if (!(page instanceof LoginPage))
		throw new Error('Wrong page');

	return page.loginAs('test', 'test');
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
