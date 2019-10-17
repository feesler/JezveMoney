var restbl = null;
var totalRes = null, okRes = null, failRes = null;
var results = {};
var App = { accounts : [], persons : [], transactions : []};


// Run action, check state and add result to the list
function test(descr, action, page, state)
{
	var res = false;
	var errorMessage = '';
	var expState;

	try
	{
		console.log('Test: ' + descr);
		action();
		expState = (typeof state === 'undefined') ? page.expectedState : state;
		res = page.checkState(expState)
	}
	catch(e)
	{
		errorMessage = e.message;
	}

	addResult(descr, res, errorMessage);
}


function addResult(descr, res, message)
{
	message = message || '';

	totalRes.innerHTML = ++results.total;
	okRes.innerHTML = (res) ? ++results.ok : results.ok;
	failRes.innerHTML = (res) ? results.fail : ++results.fail;

	restbl.appendChild(ce('tr', {}, [ ce('td', { innerHTML : descr }),
										ce('td', { innerHTML : (res ? 'OK' : 'FAIL') }),
									 	ce('td', { innerHTML : message }) ]));
}


function initTests()
{
	var startbtn = ge('startbtn');
	totalRes = ge('totalRes');
	okRes = ge('okRes');
	failRes = ge('failRes');
	viewframe = ge('viewframe');
	restbl = ge('restbl');
	if (!startbtn || !totalRes || !okRes || !failRes || !viewframe || !restbl)
		throw new Error('Fail to init tests');

	startbtn.onclick = onStartClick;
}


function onStartClick()
{
	results = { total : 0, ok : 0, fail : 0 };
	addResult('Test initialization', 'OK');

	navigation(function()
	{
		viewframe.src = 'https://jezve.net/money/';
	}, MainPage)
	.then(startTests);
}


function startTests(page)
{
	reloginAsTester(page)
	.then(page => page.goToProfilePage())
	.then(page => page.resetAll())
	.then(accountTests)
	.then(personTests)
	.then(transactionTests)
	.catch(msg => addResult(msg, false));
}


function setBlock(title, category)
{
	restbl.appendChild(ce('tr', { className : 'res-block-' + category }, ce('td', { colSpan : 3, innerHTML : title }) ));
}


function accountTests(page)
{
	setBlock('Accounts', 1);

	return goToMainPage(page)
			.then(page => page.goToAccounts())
			.then(page => page.goToCreateAccount())
			.then(createAccount1)
			.then(page => page.goToCreateAccount())
			.then(createAccount2)
			.then(page => page.goToUpdateAccount(0))
			.then(editAccount1)
			.then(page => page.goToCreateAccount())
			.then(page => createAccountWithParam(page, { name : 'acc_3', curr_id : 1, balance : '500.99', icon : 2 }))
			.then(page => deleteAccounts(page, [0, 1]))
			.then(page => page.goToCreateAccount())
			.then(page => createAccountWithParam(page, { name : 'acc RUB', curr_id : 1, balance : '500.99', icon : 5 }))
			.then(page => page.goToCreateAccount())
			.then(page => createAccountWithParam(page, { name : 'acc USD', curr_id : 2, balance : '500.99', icon : 4 }))
			.then(page => page.goToCreateAccount())
			.then(page => createAccountWithParam(page, { name : 'acc EUR', curr_id : 3, balance : '10000.99', icon : 3 }))
			.then(page => page.goToCreateAccount())
			.then(page => createAccountWithParam(page, { name : 'card RUB', curr_id : 1, balance : '35000.40', icon : 3 }))
}


function personTests(page)
{
	setBlock('Persons', 1);

	return goToMainPage(page)
			.then(page => page.goToPersons())
			.then(checkInitialPersons)
			.then(page => createPerson(page, 'Alex'))
			.then(page => createPerson(page, 'Maria'))
			.then(page => createPerson(page, 'Johnny'))
			.then(page => createPerson(page, 'Иван'))
			.then(page => updatePerson(page, 3, 'Ivan<'))
			.then(page => deletePersons(page, [0, 2]));
}


function transactionTests(page)
{
	return createTransactionTests(page)
			.then(updateTransactionTests)
			.then(deleteTransactionTests);
}


function createTransactionTests(page)
{
	setBlock('Create transaction', 1);

	return goToMainPage(page)
			.then(page => page.goToNewTransactionByAccount(0))
			.then(expenseTransactionLoop)
			.then(runCreateExpenseTests)
			.then(page => page.goToNewTransactionByAccount(0))
			.then(page => page.changeTransactionType(INCOME))
			.then(incomeTransactionLoop)
			.then(runCreateIncomeTests)
			.then(page => page.goToNewTransactionByAccount(0))
			.then(page => page.changeTransactionType(TRANSFER))
			.then(transferTransactionLoop)
			.then(runCreateTransferTests)
			.then(page => page.goToNewTransactionByAccount(0))
			.then(page => page.changeTransactionType(DEBT))
			.then(debtTransactionLoop)
			.then(runCreateDebtTests);
}


function updateTransactionTests(page)
{
	setBlock('Update transaction', 1);

	return runUpdateExpenseTests(page)
			.then(page => runUpdateIncomeTests(page))
			.then(page => runUpdateTransferTests(page))
			.then(page => runUpdateDebtTests(page));
}


function deleteTransactionTests(page)
{
	setBlock('Delete transaction', 1);

	return runDeleteExpenseTests(page)
			.then(page => runDeleteIncomeTests(page))
			.then(page => runDeleteTransferTests(page))
			.then(page => runDeleteDebtTests(page));
}


// Format date as DD.MM.YYYY
function formatDate(date, month, year)
{
	if (isDate(date) && !month && !year)
	{
		month = date.getMonth();
		year = date.getFullYear();
		date = date.getDate();
	}

	return ((date > 9) ? '' : '0') + date + '.' + ((month + 1 > 9) ? '' : '0') + (month + 1) + '.' + year;
}


function goToMainPage(page)
{
	return page.goToMainPage()
			.then(page =>
			{
				App.transactions = page.content.widgets[2].transList;
				App.accounts = page.content.widgets[0].tiles;
				App.persons = page.content.widgets[3].infoTiles;

				return Promise.resolve(page);
			});
}


function runCreateExpenseTests(page)
{
	setBlock('Create expense transactions', 1);

	return createExpense(page, 0, 0, { destAmount : '123.7801' })
			.then(page => createExpense(page, 3, 2, { srcAmount : '100', destAmount : '7013.21', destCurr : 1 }))
			.then(page => createExpense(page, 1, 0, { destAmount : '0.01' }))
			.then(page => createExpense(page, 1, 0, { srcAcc : 4, destAmount : '99.99' }));
}


function runCreateIncomeTests(page)
{
	setBlock('Create income transactions', 1);

	return createIncome(page, 0, 0, { srcAmount : '10023.7801' })
			.then(page => createIncome(page, 3, 2, { srcAmount : '7013.21', destAmount : '100', srcCurr : 1 }))
			.then(page => createIncome(page, 1, 0, { srcAmount : '0.01' }))
			.then(page => createIncome(page, 1, 0, { destAcc : 4, srcAmount : '99.99' }));

}


function runCreateTransferTests(page)
{
	setBlock('Create transfer transactions', 1);

	return createTransfer(page, 0, { srcAmount : '1000' })
			.then(page => createTransfer(page, 0, { destAcc : 2, srcAmount : '11.4', destAmount : '10' }))
			.then(page => createTransfer(page, 0, { srcAcc : 1, destAcc : 3, srcAmount : '5.0301', destAmount : '4.7614' }))
			.then(page => createTransfer(page, 0, { srcAcc : 2, srcAmount : '10', destAmount : '9.75' }))
			.then(page => createTransfer(page, 0, { destAcc : 3, srcAmount : '10', destAmount : '9.50' }));
}


function runCreateDebtTests(page)
{
	setBlock('Submit debt transactions', 1);

	return createDebt(page, 0, { srcAmount : '1000' })
			.then(page => createDebt(page, 0, { debtType : false, acc : 2, srcAmount : '200' }))
			.then(page => createDebt(page, 0, { debtType : true, acc : 3, srcAmount : '100.0101' }))
			.then(page => createDebt(page, 0, { debtType : false, person : 1, acc : 3, srcAmount : '10' }))
			.then(page => createDebt(page, 0, { acc : null, srcAmount : '105' }))
			.then(page => createDebt(page, 0, { debtType : false, person : 1, acc : null, srcAmount : '105' }));
}


function runUpdateExpenseTests(page)
{
	setBlock('Update expense transactions', 2);

	return updateExpense(page, 3, { destAmount : '124.7701' })
			.then(page => updateExpense(page, 2, { srcAmount : '101', destAmount : '7065.30', destCurr : 1 }))
			.then(page => updateExpense(page, 1, { destAmount : '0.02' }))
			.then(page => updateExpense(page, 0, { srcAcc : 3, destAmount : '99.9' }));
}


function runUpdateIncomeTests(page)
{
	setBlock('Update income transactions', 2);

	return updateIncome(page, 0, { srcAmount : '100.001' })
			.then(page => updateIncome(page, 1, { srcAmount : '0.02' }))
			.then(page => updateIncome(page, 2, { srcAmount : '7065.30', destAmount : '101', srcCurr : 1 }))
			.then(page => updateIncome(page, 3, { destAcc : 3, srcAmount : '99.9' }));
}


function runUpdateTransferTests(page)
{
	setBlock('Update transfer transactions', 2);

	return updateTransfer(page, 0, { destAcc : 0, srcAmount : '11' })
			.then(page => updateTransfer(page, 1, { srcAcc : 2, srcAmount : '100', destAmount : '97.55' }))
			.then(page => updateTransfer(page, 2, { srcAcc : 3, srcAmount : '5.0301' }))
			.then(page => updateTransfer(page, 3, { srcAcc : 0, srcAmount : '50', destAmount : '0.82' }))
			.then(page => updateTransfer(page, 4, { srcAmount : '1050.01' }));
}


function runUpdateDebtTests(page)
{
	setBlock('Update debt transactions', 2);

	return updateDebt(page, 0, { person : 0, srcAmount : '105' })
			.then(page => updateDebt(page, 1, { acc : 1, srcAmount : '105' }))
			.then(page => updateDebt(page, 2, { debtType : true, srcAmount : '10' }))
			.then(page => updateDebt(page, 3, { debtType : false, acc : 2, srcAmount : '200.0202' }))
			.then(page => updateDebt(page, 4, { acc : null, srcAmount : '200' }))
			.then(page => updateDebt(page, 5, { srcAmount : '1001' }));
}


function runDeleteExpenseTests(page)
{
	setBlock('Delete expense transactions', 2);

	return deleteTransactions(page, EXPENSE, [0])
			.then(page => deleteTransactions(page, EXPENSE, [0, 1]));
}


function runDeleteIncomeTests(page)
{
	setBlock('Delete income transactions', 2);

	return deleteTransactions(page, INCOME, [0])
			.then(page => deleteTransactions(page, INCOME, [0, 1, 2]));
}


function runDeleteTransferTests(page)
{
	setBlock('Delete transfer transactions', 2);

	return deleteTransactions(page, TRANSFER, [1])
			.then(page => deleteTransactions(page, TRANSFER, [0, 2]));
}


function runDeleteDebtTests(page)
{
	setBlock('Delete debt transactions', 2);

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
			.then(page =>
			{
				App.beforeDeleteTransaction = {};

				App.beforeDeleteTransaction.accounts = copyObject(viewframe.contentWindow.accounts);
				App.beforeDeleteTransaction.persons = copyObject(viewframe.contentWindow.persons);

				return page.goToTransactions();
			})
			.then(page => page.filterByType(type))
			.then(page =>
			{
				let trCount = page.content.transactions ? page.content.transactions.length : 0;
				App.beforeDeleteTransaction.trCount = trCount;
				App.beforeDeleteTransaction.deleteList = transactions.map(trPos =>
				{
					if (trPos < 0 || trPos >= trCount)
						throw new Error('Wrong transaction position: ' + trPos);

					let trObj = page.getTransactionObject(page.content.transactions[trPos].id);
					if (!trObj)
						throw new Error('Transaction not found');

					return trObj;
				});

				return page.deleteTransactions(transactions);
			})
			.then(page =>
			{
				var state = { value : { transactions : { length : App.transactions.length - transactions.length } } };

				test('Delete transactions [' + transactions.join() + ']', () => {}, page, state);

				App.transactions = page.content.transactions;

				return Promise.resolve(page);
			})
			.then(goToMainPage)
			.then(page =>
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

				test('Delete transactions [' + transactions.join() + ']', () => {}, page, state);

				App.transactions = page.content.widgets[2].transList;
				App.accounts = page.content.widgets[0].tiles;
				App.persons = page.content.widgets[3].infoTiles;

				return Promise.resolve(page);
			});
}


function reloginAsTester(page)
{
	var loginPagePromise = (page.isUserLoggedIn()) ? page.logoutUser() : Promise.resolve(new LoginPage());

	return loginPagePromise.then(page => page.loginAs('test', 'test'));
}
