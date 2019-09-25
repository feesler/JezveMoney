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
	setBlock('Transaction page states', 1);

	return goToMainPage(page)
			.then(page => page.goToNewTransactionByAccount(0))
			.then(expenseTransactionLoop)
			.then(submitExpenseTests)
			.then(page => page.goToNewTransactionByAccount(0))
			.then(page => page.changeTransactionType(INCOME))
			.then(incomeTransactionLoop)
			.then(submitIncomeTests)
			.then(page => page.goToNewTransactionByAccount(0))
			.then(page => page.changeTransactionType(TRANSFER))
			.then(transferTransactionLoop)
			.then(submitTransferTests)
			.then(page => page.goToNewTransactionByAccount(0))
			.then(page => page.changeTransactionType(DEBT))
			.then(debtTransactionLoop);
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

				return Promise.resolve(page);
			});
}


function submitExpenseTests(page)
{
	setBlock('Submit expense transactions', 1);

	return createExpense(page, 0, 0, { destAmount : '123.7801' })
			.then(page => createExpense(page, 3, 2, { srcAmount : '100', destAmount : '7013.21', destCurr : 1 }))
			.then(page => createExpense(page, 1, 0, { destAmount : '0.01' }))
			.then(page => createExpense(page, 1, 0, { srcAcc : 4, destAmount : '99.99' }))

}


function createExpense(page, accNum, onState, params)
{
	var srcAcc = null;
	var srcAccPos;

	return goToMainPage(page)
			.then(page => page.goToNewTransactionByAccount(accNum))
			.then(page => expenseTransactionLoop(page, onState, page =>
			{
				if ('srcAcc' in params)
				{
					test('Change source account to (' + page.getAccountByPos(params.srcAcc).name + ')',
							() => page.changeSrcAccountByPos(params.srcAcc), page);
				}

				if ('destCurr' in params)
				{
					test('Change destination currency to ' + getCurrency(params.destCurr).name,
							() => page.changeDestCurrency(params.destCurr), page);
				}

				if (!('destAmount' in params))
					throw new Error('Destination amount value not specified');

				test('Destination amount (' + params.destAmount + ') input', () => page.inputDestAmount(params.destAmount), page);

				if ('destCurr' in params && 'srcAmount' in params)
					test('Source amount (' + params.srcAmount + ') input', () => page.inputSrcAmount(params.srcAmount), page);

				if ('date' in params)
					test('Date (' + params.date + ') input', () => page.inputDate(params.date), page);

				if ('comment' in params)
					test('Comment (' + params.comment + ') input', () => page.inputComment(params.comment), page);

				srcAcc = page.model.srcAccount;
				srcAccPos = page.getAccountPos(srcAcc.id);

				return page.submit();
			}))
			.then(page =>
			{
				// Obtain real source amount from props:
				// In case of expense with different currency use source amount value
				// In case of expense with the same currency copy destination amount value
				var sa = ('destCurr' in params && 'srcAmount' in params) ? params.srcAmount : params.destAmount;
				var expBalance = srcAcc.balance - normalize(sa);
				var fmtBal = formatCurrency(expBalance, srcAcc.curr_id);

				// Accounts widget changes
				var accWidget = { tiles : { length : App.accounts.length } };
				accWidget.tiles[srcAccPos] = { balance : fmtBal, name : srcAcc.name };

				// Transactions widget changes
				var fmtAmount = '- ' + formatCurrency(('srcAmount' in params) ? params.srcAmount : params.destAmount, srcAcc.curr_id);
				if ('destCurr' in params && 'srcAmount' in params)
				{
					fmtAmount += ' (- ' + formatCurrency(params.destAmount, params.destCurr) + ')';
				}

				var transWidget = { title : 'Transactions',
									transList : { length : Math.min(App.transactions.length + 1, 5) } };
				transWidget.transList[0] = { accountTitle : srcAcc.name,
												amountText : fmtAmount,
											 	dateFmt : formatDate(('date' in params) ? new Date(params.date) : new Date()),
											 	comment : ('comment' in params) ? params.comment : '' };

				var state = { values : { widgets : { length : 5, 0 : accWidget, 2 : transWidget } } };

				test('Expense transaction submit', () => {}, page, state);

				App.transactions = page.content.widgets[2].transList;
				App.accounts = page.content.widgets[0].tiles;

				return Promise.resolve(page);
			});
}


function submitIncomeTests(page)
{
	setBlock('Submit income transactions', 1);

	return createIncome(page, 0, 0, { srcAmount : '10023.7801' })
			.then(page => createIncome(page, 3, 2, { srcAmount : '7013.21', destAmount : '100', srcCurr : 1 }))
			.then(page => createIncome(page, 1, 0, { srcAmount : '0.01' }))
			.then(page => createIncome(page, 1, 0, { destAcc : 4, srcAmount : '99.99' }))

}


function createIncome(page, accNum, onState, params)
{
	var destAcc = null;
	var destAccPos;

	return goToMainPage(page)
			.then(page => page.goToNewTransactionByAccount(accNum))
			.then(page => page.changeTransactionType(INCOME))
			.then(page => incomeTransactionLoop(page, onState, page =>
			{
				if ('destAcc' in params)
				{
					test('Change destination account to (' + page.getAccountByPos(params.destAcc).name + ')',
							() => page.changeDestAccountByPos(params.destAcc), page);
				}

				if ('srcCurr' in params)
				{
					test('Change source currency to ' + getCurrency(params.srcCurr).name,
							() => page.changeSourceCurrency(params.srcCurr), page);
				}

				if (!('srcAmount' in params))
					throw new Error('Source amount value not specified');

				test('Source amount (' + params.srcAmount + ') input', () => page.inputSrcAmount(params.srcAmount), page);

				if ('srcCurr' in params && 'destAmount' in params)
					test('Destination amount (' + params.destAmount + ') input', () => page.inputDestAmount(params.destAmount), page);

				if ('date' in params)
					test('Date (' + params.date + ') input', () => page.inputDate(params.date), page);

				if ('comment' in params)
					test('Comment (' + params.comment + ') input', () => page.inputComment(params.comment), page);

				destAcc = page.model.destAccount;
				destAccPos = page.getAccountPos(destAcc.id)

				return page.submit();
			}))
			.then(page =>
			{
				// Obtain real destination amount from props:
				// In case of income with different currency use destination amount value
				// In case of income with the same currency copy source amount value
				var da = ('srcCurr' in params && 'destAmount' in params) ? params.destAmount : params.srcAmount;
				var expBalance = destAcc.balance + normalize(da);
				var fmtBal = formatCurrency(expBalance, destAcc.curr_id);

				// Accounts widget changes
				var accWidget = { tiles : { length : App.accounts.length } };
				accWidget.tiles[destAccPos] = { balance : fmtBal, name : destAcc.name };

				// Transactions widget changes
				var fmtAmount = '+ ' + formatCurrency(params.srcAmount, ('srcCurr' in params) ? params.srcCurr : destAcc.curr_id);
				if ('srcCurr' in params && 'destAmount' in params)
				{
					fmtAmount += ' (+ ' + formatCurrency(params.destAmount, destAcc.curr_id) + ')';
				}

				var transWidget = { title : 'Transactions',
									transList : { length : Math.min(App.transactions.length + 1, 5) } };
				transWidget.transList[0] = { accountTitle : destAcc.name,
												amountText : fmtAmount,
											 	dateFmt : formatDate(('date' in params) ? new Date(params.date) : new Date()),
											 	comment : ('comment' in params) ? params.comment : '' };

				var state = { values : { widgets : { length : 5, 0 : accWidget, 2 : transWidget } } };

				test('Income transaction submit', () => {}, page, state);

				App.transactions = page.content.widgets[2].transList;
				App.accounts = page.content.widgets[0].tiles;

				return Promise.resolve(page);
			});
}


function submitTransferTests(page)
{
	setBlock('Submit transfer transactions', 1);

	return createTransfer(page, 0, { srcAmount : '1000' })
			.then(page => createTransfer(page, 0, { destAcc : 2, srcAmount : '11.4', destAmount : '10' }))
			.then(page => createTransfer(page, 0, { srcAcc : 1, destAcc : 3, srcAmount : '5.0301', destAmount : '4.7614' }))
			.then(page => createTransfer(page, 0, { srcAcc : 2, srcAmount : '10', destAmount : '9.75' }))
			.then(page => createTransfer(page, 0, { destAcc : 3, srcAmount : '10', destAmount : '9.50' }))
}


function createTransfer(page, onState, params)
{
	var srcAcc = null;
	var srcAccPos;
	var destAcc = null;
	var destAccPos;

	return goToMainPage(page)
			.then(page => page.goToNewTransactionByAccount(0))
			.then(page => page.changeTransactionType(TRANSFER))
			.then(page => transferTransactionLoop(page, onState, page =>
			{
				if ('srcAcc' in params)
				{
					test('Change source account to (' + page.getAccountByPos(params.srcAcc).name + ')',
							() => page.changeSrcAccountByPos(params.srcAcc), page);
				}

				if ('destAcc' in params)
				{
					test('Change destination account to (' + page.getAccountByPos(params.destAcc).name + ')',
							() => page.changeDestAccountByPos(params.destAcc), page);
				}

				if (!('srcAmount' in params))
					throw new Error('Source amount value not specified');

				test('Source amount (' + params.srcAmount + ') input', () => page.inputSrcAmount(params.srcAmount), page);

				if ('destAmount' in params)
					test('Destination amount (' + params.destAmount + ') input', () => page.inputDestAmount(params.destAmount), page);

				if ('date' in params)
					test('Date (' + params.date + ') input', () => page.inputDate(params.date), page);

				if ('comment' in params)
					test('Comment (' + params.comment + ') input', () => page.inputComment(params.comment), page);

				srcAcc = page.model.srcAccount;
				srcAccPos = page.getAccountPos(srcAcc.id);
				destAcc = page.model.destAccount;
				destAccPos = page.getAccountPos(destAcc.id);

				return page.submit();
			}))
			.then(page =>
			{
				// Obtain real source and destination amount from props:
				// Source amount expected to be always set
				// In case of transfer between accounts with different currency use destination amount value
				// In case of transfer between accounts with the same currency copy source amount value
				var sa = params.srcAmount;
				var da = ('destAmount' in params) ? params.destAmount : params.srcAmount;
				var expSrcBalance = srcAcc.balance - normalize(sa);
				var expDestBalance = destAcc.balance + normalize(da);
				var fmtSrcBal = formatCurrency(expSrcBalance, srcAcc.curr_id);
				var fmtDestBal = formatCurrency(expDestBalance, destAcc.curr_id);

				// Accounts widget changes
				var accWidget = { tiles : { length : App.accounts.length } };
				accWidget.tiles[srcAccPos] = { balance : fmtSrcBal, name : srcAcc.name };
				accWidget.tiles[destAccPos] = { balance : fmtDestBal, name : destAcc.name };

				// Transactions widget changes
				var fmtAmount = formatCurrency(sa, srcAcc.curr_id);
				if ('destAmount' in params)
				{
					fmtAmount += ' (' + formatCurrency(da, destAcc.curr_id) + ')';
				}

				var transWidget = { title : 'Transactions',
									transList : { length : Math.min(App.transactions.length + 1, 5) } };
				transWidget.transList[0] = { accountTitle : srcAcc.name + ' → ' + destAcc.name,
												amountText : fmtAmount,
											 	dateFmt : formatDate(('date' in params) ? new Date(params.date) : new Date()),
											 	comment : ('comment' in params) ? params.comment : '' };

				var state = { values : { widgets : { length : 5, 0 : accWidget, 2 : transWidget } } };

				test('Transfer transaction submit', () => {}, page, state);

				App.transactions = page.content.widgets[2].transList;
				App.accounts = page.content.widgets[0].tiles;

				return Promise.resolve(page);
			});
}


function reloginAsTester(page)
{
	var loginPagePromise = (page.isUserLoggedIn()) ? page.logoutUser() : Promise.resolve(new LoginPage());

	return loginPagePromise.then(page => page.loginAs('test', 'test'));
}


function createAccount1(page)
{
	var state = { visibility : { heading : true, iconDropDown : true, name : true, currDropDown : true },
					values : { tile : { name : 'New account', balance : '0 ₽' },
							name : '', balance : '0' } };

	test('Initial state of new account page', () => {}, page, state);

	setParam(state.values, { tile : { name : 'acc_1' }, name : 'acc_1' });
	test('Account name input', () => page.inputName('acc_1'), page, state);

// Change currency to USD
	setParam(state.values, { currDropDown : { textValue : 'USD' }, tile : { balance : '$ 0' } });
	test('Change currency', () => page.changeCurrency(2), page, state);

	setParam(state.values, { tile : { balance : '$ 100 000.01' }, balance : '100000.01' });
	test('Input balance (100 000.01)', () => page.inputBalance('100000.01'), page, state);

// Change currency back to RUB
	setParam(state.values, { currDropDown : { textValue : 'RUB' }, tile : { balance : '100 000.01 ₽' } });
	test('Change currency back', () => page.changeCurrency(1), page, state);

// Input empty value for initial balance
	setParam(state.values, { tile : { balance : '0 ₽' }, balance : '' });
	test('Input empty balance', () => page.inputBalance(''), page, state);

	state.values.balance = '.';
	test('Input dot (.) balance', () => page.inputBalance('.'), page, state);

	setParam(state.values, { tile : { balance : '0.01 ₽' }, balance : '.01' });
	test('Input (.01) balance', () => page.inputBalance('.01'), page, state);

	setParam(state.values, { tile : { balance : '10 000 000.01 ₽' }, balance : '10000000.01' });
	test('Input (10000000.01) balance', () => page.inputBalance('10000000.01'), page, state);

// Change icon to safe
	setParam(state.values,  { iconDropDown : { textValue : 'Safe' },
							tile : { icon : tileIcons[2] } });
	test('Change icon', () => page.changeIcon(2), page, state);

	setParam(state.values, { tile : { balance : '1 000.01 ₽' }, balance : '1000.01' });
	test('Input (1000.01) balance', () => page.inputBalance('1000.01'), page, state);


	return navigation(() => clickEmul(page.content.submitBtn), AccountsPage)
			.then(page => checkCreateAccount(page, { name : 'acc_1', balance : 1000.01, curr_id : 1 }));
}


function checkCreateAccount(page, params)
{
	var state = { value : { tiles : { length : App.accounts.length + 1 } } };
	var fmtBal = formatCurrency(normalize(params.balance), params.curr_id);

	state.value.tiles[App.accounts.length] = { balance : fmtBal, name : params.name, icon : params.icon };

	test('Account create', () => {}, page, state);

	App.accounts = page.content.tiles;

	return Promise.resolve(page);
}


function createAccount2(page)
{
	var state = { values : { tile : { name : 'acc_2', balance : '0 ₽' }, currDropDown : { textValue : 'RUB' } } };

// Input account name
	test('Account tile name update', () => page.inputName('acc_2'), page, state);

// Change currency to EUR
	setParam(state.values, { tile : { balance : '€ 0' }, currDropDown : { textValue : 'EUR' } });
	test('EUR currency select', () => page.changeCurrency(3), page, state);

	state.values.tile.balance = '€ 1 000.01';
	test('Account tile balance on EUR 1 000.01 balance input field', () => page.inputBalance('1000.01'), page, state);

	return navigation(() => clickEmul(page.content.submitBtn), AccountsPage)
			.then(page => checkCreateAccount(page, { name : 'acc_2', balance : 1000.01, curr_id : 3 }));
}


function editAccount1(page)
{
	var state = { values : { tile : { name : 'acc_1', balance : '1 000.01 ₽', icon : tileIcons[2] }, currDropDown : { textValue : 'RUB' } } };

	test('Initial state of edit account page', () => {}, page, state);

// Change currency to USD
	var fmtBal = formatCurrency(1000.01, 2);
	setParam(state.values, { tile : { balance : fmtBal }, currDropDown : { textValue : 'USD' } });
	test('USD currency select', () => page.changeCurrency(2), page, state);

// Change icon to purse
	state.values.tile.icon = tileIcons[1];
	test('Icon change', () => page.changeIcon(1), page, state);

// Submit
	return navigation(() => clickEmul(page.content.submitBtn), AccountsPage)
			.then(checkUpdateAccount.bind(null, { updatePos : 0, name : 'acc_1', balance : 1000.01, curr_id : 2, icon : tileIcons[1] }));
}


function checkUpdateAccount(params, page)
{
	var state = { value : { tiles : { length : App.accounts.length } } };
	var fmtBal = formatCurrency(normalize(params.balance), params.curr_id);

	state.value.tiles[params.updatePos] = { balance : fmtBal, name : params.name, icon : params.icon };

	test('Account update', () => {}, page, state);

	App.accounts = page.content.tiles;

	return Promise.resolve(page);
}


function createAccountWithParam(page, params)
{
	if (!params)
		throw new Error('No params specified');
	if (!params.name || !params.name.length)
		throw new Error('Name not specified');
	var currObj = getCurrency(params.curr_id);
	if (!currObj)
		throw new Error('Wrong currency specified');
	var normBalance = normalize(params.balance);
	if (isNaN(normBalance))
		throw new Error('Balance not specified');

	var state = { values : { tile : { name : params.name }, name : params.name } };

// Input account name
	test('Account tile name update', () => page.inputName(params.name), page, state);

// Change currency
	var fmtBal = formatCurrency(0, currObj.id);
	setParam(state.values, { currDropDown : { textValue : currObj.name }, tile : { balance : fmtBal } });
	test(currObj.name + ' currency select', () => page.changeCurrency(currObj.id), page, state);

// Input balance
	fmtBal = formatCurrency(normBalance, currObj.id);
	setParam(state.values, { tile : { balance : fmtBal } });
	test('Tile balance format update', () => page.inputBalance(params.balance), page, state);

// Change icon
	if (params.icon)
	{
		if (params.icon < 0 || params.icon > tileIcons.length)
			throw new Error('Icon not found');

		setParam(state.values, { iconDropDown : { textValue : tileIcons[params.icon].title }, tile : { icon : tileIcons[params.icon] } });
		test('Tile icon update', () => page.changeIcon(params.icon), page, state);
	}

	return navigation(() => clickEmul(page.content.submitBtn), AccountsPage)
			.then(page => checkCreateAccount(page, params));
}


function deleteAccounts(page, accounts)
{
	return page.deleteAccounts(accounts)
			.then(page =>
			{
				var state = { value : { tiles : { length : App.accounts.length - accounts.length } } };

				test('Delete accounts [' + accounts.join() + ']', () => {}, page, state);

				App.accounts = page.content.tiles;

				return Promise.resolve(page);
			});
}


function checkInitialPersons(page)
{
	var state = { value : { tiles : { length : 0 } } };
	test('Initial persons structure', () => {}, page, state);

	return Promise.resolve(page);
}


// From persons list page go to new person page, input name and submit
// Next check name result and callback
function createPerson(page, personName)
{
	return page.goToCreatePerson()
			.then(page => page.createPerson(personName))
			.then(page =>
			{
				var state = { value : { tiles : { length : App.persons.length + 1 } } };
				state.value.tiles[App.persons.length] = { name : personName };

				test('Create person', () => {}, page, state);

				App.persons = page.content.tiles;

				return Promise.resolve(page);
			});
}


function updatePerson(page, num, personName)
{
	return page.goToUpdatePerson(num)
			.then(page =>
			{
				var state = { visibility : { name : true },
			 					values : { name : App.persons[num].name } };

				test('Update person page state', () => {}, page, state);

				page.inputName(personName);

				return navigation(() => clickEmul(page.content.submitBtn), PersonsPage)
			})
			.then(page =>
			{
				var state = { values : { tiles : { length : App.persons.length } }};
				state.values.tiles[num] = { name : personName };

				test('Update person', () => {}, page, state);

				App.persons = page.content.tiles;

				return Promise.resolve(page);
			});
}


function deletePersons(page, persons)
{
	return page.deletePersons(persons)
			.then(function(page)
			{
				var state = { values : { tiles : { length : App.persons.length - persons.length } } };

				test('Delete persons [' + persons.join() + ']', () => {}, page, state);

				return Promise.resolve(page);
			});
}


function expenseTransactionLoop(page, actionState, action)
{
// State 0
	setBlock('Expense', 2);
	test('Initial state of new expense page', () => page.setExpectedState(0), page);

	actionState = parseInt(actionState);
	var actionRequested = !isNaN(actionState);
	if (actionState === 0)
		return action(page);

	if (!actionRequested)
	{
		// Input destination amount
		test('Destination amount (1) input', () => page.inputDestAmount('1'), page);
		test('Destination amount (1.) input', () => page.inputDestAmount('1.'), page);
		test('Destination amount (1.0) input', () => page.inputDestAmount('1.0'), page);
		test('Destination amount (1.01) input', () => page.inputDestAmount('1.01'), page);
		test('Destination amount (1.010) input', () => page.inputDestAmount('1.010'), page);
		test('Destination amount (1.0101) input', () => page.inputDestAmount('1.0101'), page);
	}

// Transition 2: click on result balance block and move from State 0 to State 1
	test('(2) Click on source result balance', () => page.clickSrcResultBalance(), page);

	if (actionState === 1)
		return action(page);

	if (!actionRequested)
	{
		// Input result balance
		test('Result balance (499.9) input', () => page.inputResBalance('499.9'), page);
		test('Result balance (499.90) input', () => page.inputResBalance('499.90'), page);
		test('Result balance (499.901) input', () => page.inputResBalance('499.901'), page);
	}

	if (!actionRequested)
	{
		// Transition 12: change account to another one with different currency and stay on State 1
		test('(12) Change account to another one with currency different than current destination currency',
				() => page.changeSrcAccountByPos(2), page);

		// Change account back
		test('(12) Change account back', () => page.changeSrcAccountByPos(0), page);
	}

// Transition 3: click on destination amount block and move from State 1 to State 0
	test('(3) Click on destination amount', () => page.clickDestAmount(), page);

// Transition 4: select different currency for destination and move from State 0 to State 2
	test('(4) Change destination curency to USD', () => page.changeDestCurrency(2), page);

	if (actionState === 2)
		return action(page);

	if (!actionRequested)
	{
		// Input source amount
		test('Empty source amount input', () => page.inputSrcAmount(''), page);
		test('Source amount (.) input', () => page.inputSrcAmount('.'), page);
		test('Source amount (0.) input', () => page.inputSrcAmount('0.'), page);
		test('Source amount (.0) input', () => page.inputSrcAmount('.0'), page);
		test('Source amount (.01) input', () => page.inputSrcAmount('.01'), page);
		test('Source amount (1.01) input', () => page.inputSrcAmount('1.01'), page);
		test('Source amount (1.010) input', () => page.inputSrcAmount('1.010'), page);
	}

// Transition 8: click on exchange rate block and move from State 2 to State 3
	test('(8) Click on exchange rate', () => page.clickExchRate(), page);

	if (actionState === 3)
		return action(page);

	if (!actionRequested)
	{
		// Input exchange rate
		test('Input exchange rate (1.09)', () => page.inputExchRate('1.09'), page);
		test('Input exchange rate (3.09)', () => page.inputExchRate('3.09'), page);
		test('Input exchange rate (.)', () => page.inputExchRate('.'), page);
		test('Input exchange rate (.0)', () => page.inputExchRate('.0'), page);
		test('Input exchange rate (.09)', () => page.inputExchRate('.09'), page);
		test('Input exchange rate (.090101)', () => page.inputExchRate('.090101'), page);
	}

	// Transition 16: click on destination amount block and move from State 3 to State 2
	test('(16) Click on destination amount', () => page.clickDestAmount(), page);

	if (!actionRequested)
	{
		// Transition 13: select another currency different from currency of source account and stay on state
		test('(13) Change destination curency to EUR', () => page.changeDestCurrency(3), page);

		// Transition 9: select same currency as source account and move from State 2 to State 0
		test('(9) Change destination curency to RUB', () => page.changeDestCurrency(1), page);

		// Transition 1: change account to another one with different currency and stay on State 0
		test('(1) Change account to another one with different currency', () => page.changeSrcAccountByPos(2), page);

		// Transition 4: select different currency for destination and move from State 0 to State 2
		test('(4) Select different currency for destination', () => page.changeDestCurrency(3), page);

		// Transition 5: change account to another one with currency different than current destination currency and stay on State 2
		test('(5) Change account to another one with currency different than current destination currency',
				() => page.changeSrcAccountByPos(0), page);
	}

// Transition 6: click on source result balance block and move from State 2 to State 4
	test('(6) Click on source result block', () => page.clickSrcResultBalance(), page);

	if (actionState === 4)
		return action(page);

// Transition 10: change account to another one with currency different than current destination currency and stay on State 4
	test('(10) Change account to another one with currency different than current destination currency',
			() => page.changeSrcAccountByPos(2), page);

// Transition 7: click on destination amount block and move from State 4 to State 2
	test('(7) Click on source amount block', () => page.clickDestAmount(), page);

// Transition 14: select source account with the same currency as destination and move from State 2 to State 0
	test('(14) Change account to another one with the same currency as current destination currency',
			() => page.changeSrcAccountByPos(3), page);

// Transition 4: select different currency for destination and move from State 0 to State 2
	test('(4) Select different currency for destination', () => page.changeDestCurrency(1), page);

// Transition 8: click on exchange rate block and move from State 2 to State 3
	test('(8) Click on exchange rate', () => page.clickExchRate(), page);

// Transition 17: change account to another one with currency different than current destination currency and stay on State 3
	test('(17) Change account to another one with currency different than current destination currency',
			() => page.changeSrcAccountByPos(2), page);

// Transition 15: select source account with the same currency as destination and move from State 2 to State 0
	test('(15) Change account to another one with the same currency as destination',
			() => page.changeSrcAccountByPos(1), page);

// Transition 4: select different currency for destination and move from State 0 to State 2
	test('(4) Select different currency for destination', () => page.changeDestCurrency(2), page);

// Transition 6: click on source result balance block and move from State 2 to State 4
	test('(6) Click on source result balance block', () => page.clickSrcResultBalance(), page);

// Transition 19: click on exchange rate block and move from State 4 to State 3
	test('(19) Click on exchange rate block', () => page.clickExchRate(), page);

// Transition 18: click on source result balance and move from State 3 to State 4
	test('(18) Click on source result balance rate block', () => page.clickSrcResultBalance(), page);

// Transition 11: select source account with the same currency as destination and move from State 4 to State 1
	test('(11) Change account to another one with the same currency as destination',
			() => page.changeSrcAccountByPos(2), page);


	return Promise.resolve(page);
}


function incomeTransactionLoop(page, actionState, action)
{
// State 0
	setBlock('Income', 2);
	test('Initial state of new income page', () => page.setExpectedState(0), page);

	actionState = parseInt(actionState);
	var actionRequested = !isNaN(actionState);
	if (actionState === 0)
		return action(page);

	if (!actionRequested)
	{
		// Input source amount
		test('Source amount (1) input', () => page.inputSrcAmount('1'), page);
		test('Source amount (1.) input', () => page.inputSrcAmount('1.'), page);
		test('Source amount (1.0) input', () => page.inputSrcAmount('1.0'), page);
		test('Source amount (1.01) input', () => page.inputSrcAmount('1.01'), page);
		test('Source amount (1.010) input', () => page.inputSrcAmount('1.010'), page);
		test('Source amount (1.0101) input', () => page.inputSrcAmount('1.0101'), page);
	}

// Transition 2: Click on destination result balance block and move from State 0 to State 1
	test('(2) Click on destination result balance', () => page.clickDestResultBalance(), page);

	if (actionState === 1)
		return action(page);

	if (!actionRequested)
	{
		// Transition 23: Change account to another one with different currency and stay on State 1
		test('(23) Change destination account', () => page.changeDestAccountByPos(3), page);
		test('(23) Change destination account back', () => page.changeDestAccountByPos(0), page);

		// Input result balance
		test('Result balance (502.08) input', () => page.inputDestResBalance('502.08'), page);
		test('Result balance (502.080) input', () => page.inputDestResBalance('502.080'), page);
		test('Result balance (502.0801) input', () => page.inputDestResBalance('502.0801'), page);
	}

// Transition 4: Click on source amount block and move from State 1 to State 0
	test('(4) Click on source amount', () => page.clickSrcAmount(), page);

// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
	test('(3) Change source curency to USD', () => page.changeSourceCurrency(2), page);

	if (actionState === 2)
		return action(page);

	if (!actionRequested)
	{
		// Transition 5: Change account to another one with currency different than current source currency and stay on State 2
		test('(5) Change destination account', () => page.changeDestAccountByPos(3), page);
		test('(5) Change destination account back', () => page.changeDestAccountByPos(0), page);

		// Input destination amount
		test('Empty destination amount input', () => page.inputDestAmount(''), page);
		test('Destination amount (.) input', () => page.inputDestAmount('.'), page);
		test('Destination amount (0.) input', () => page.inputDestAmount('0.'), page);
		test('Destination amount (.0) input', () => page.inputDestAmount('.0'), page);
		test('Destination amount (.01) input', () => page.inputDestAmount('.01'), page);
		test('Destination amount (1.01) input', () => page.inputDestAmount('1.01'), page);
		test('Destination amount (1.010) input', () => page.inputDestAmount('1.010'), page);
	}

// Transition 7: Click on result balance block and move from State 2 to State 4
	test('(7) Click on destination result balance', () => page.clickDestResultBalance(), page);

	if (actionState === 4)
		return action(page);

	if (!actionRequested)
	{
		// Transition 17: Change account to another one with currency different than current source currency and stay on State 4
		test('(17) Change destination account', () => page.changeDestAccountByPos(3), page);
		test('(17) Change destination account back', () => page.changeDestAccountByPos(0), page);

		// Transition 21: Change source currency to different than currency of account and stay on State 4
		test('(21) Change source curency to EUR', () => page.changeSourceCurrency(3), page);
		test('(21) Change source curency to USD', () => page.changeSourceCurrency(2), page);
	}

// Transition 20: Click on exchange rate block and move from State 4 to State 3
	test('(20) Click on exchange rate', () => page.clickExchRate(), page);

	if (actionState === 4)
		return action(page);

// Transition 14: Click on exchange rate block and move from State 4 to State 3
	test('(14) Click on exchange rate', () => page.clickDestResultBalance(), page);

// Transition 19: Click on destination amount block and move from State 4 to State 3
	test('(19) Click on destination amount', () => page.clickDestAmount(), page);

// Transition 8: Click on exchange rate block and move from State 2 to State 3
	test('(8) Click on exchange rate', () => page.clickExchRate(), page);

// Input exchange rate
	test('Input exchange rate (1.09)', () => page.inputExchRate('1.09'), page);
	test('Input exchange rate (3.09)', () => page.inputExchRate('3.09'), page);
	test('Input exchange rate (.09)', () => page.inputExchRate('.09'), page);
	test('Input exchange rate (.090101)', () => page.inputExchRate('.090101'), page);

// Transition 13: Click on destination amount block and move from State 3 to State 2
	test('(13) Click on destination amount', () => page.clickDestAmount(), page);

// Transition 9: change source currency to different than currency of account and stay on State 2
	test('(9) Change source curency to EUR', () => page.changeSourceCurrency(3), page);

// Transition 10: Change source currency to the same as currency of account and move from State 2 to State 0
	test('(10) Change source curency to RUB', () => page.changeSourceCurrency(1), page);

// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
	test('(3) Change source curency to USD', () => page.changeSourceCurrency(2), page);

// Transition 8: Click on exchange rate block and move from State 2 to State 3
	test('(8) Click on exchange rate', () => page.clickExchRate(), page);

// Transition 11: Change destination account to another with currency different currest source currency
	test('(11) Change destination account', () => page.changeDestAccountByPos(3), page);

// Transition 12: Change destination account to another one with same currency as currest source currency
	test('(12) Change destination account back', () => page.changeDestAccountByPos(2), page);

// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
	test('(3) Change source curency to RUB', () => page.changeSourceCurrency(1), page);

// Transition 8: Click on exchange rate block and move from State 2 to State 3
	test('(8) Click on exchange rate', () => page.clickExchRate(), page);

// Transition 15: Change source currency to different than currency of account and stay on State 3
	test('(15) Change source curency to EUR', () => page.changeSourceCurrency(3), page);

// Transition 16: Change source currency to different than currency of account and stay on State 3
	test('(16) Change source curency to USD', () => page.changeSourceCurrency(2), page);

// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
	test('(3) Change source curency to RUB', () => page.changeSourceCurrency(1), page);

// Transition 7: Click on result balance block and move from State 2 to State 4
	test('(7) Click on destination result balance', () => page.clickDestResultBalance(), page);

// Transition 18: Change destination account to another one with same currency as currest source currency and move from State 4 to State 1
	test('(18) Change destination account', () => page.changeDestAccountByPos(1), page);

// Transition 4: Click on source amount block and move from State 1 to State 0
	test('(4) Click on source amount', () => page.clickSrcAmount(), page);

// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
	test('(3) Change source curency to USD', () => page.changeSourceCurrency(2), page);

// Transition 6: Change destination account to another one with same currency as currest source currency
	test('(6) Change destination account', () => page.changeDestAccountByPos(2), page);

// Transition 1: Change destination account to another one with same currency as currest source currency
	test('(1) Change destination account', () => page.changeDestAccountByPos(0), page);

// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
	test('(3) Change source curency to USD', () => page.changeSourceCurrency(2), page);

// Transition 7: Click on result balance block and move from State 2 to State 4
	test('(7) Click on destination result balance', () => page.clickDestResultBalance(), page);

// Transition 22: Change source currency to the same as currency of account and move from State 4 to State 1
	test('(22) Change destination account', () => page.changeSourceCurrency(1), page);

	return Promise.resolve(page);
}


function transferTransactionLoop(page, actionState, action)
{
	setBlock('Transfer', 2);
	test('Initial state of new transfer page', () => page.setExpectedState(0), page);

	actionState = parseInt(actionState);
	var actionRequested = !isNaN(actionState);
	if (actionState === 0)
		return action(page);

	if (!actionRequested)
	{
		// Input source amount
		test('Source amount (1) input', () => page.inputSrcAmount('1'), page);
		test('Source amount (1.) input', () => page.inputSrcAmount('1.'), page);
		test('Source amount (1.0) input', () => page.inputSrcAmount('1.0'), page);
		test('Source amount (1.01) input', () => page.inputSrcAmount('1.01'), page);
		test('Source amount (1.010) input', () => page.inputSrcAmount('1.010'), page);
		test('Source amount (1.0101) input', () => page.inputSrcAmount('1.0101'), page);
		test('Emptry source amount input', () => page.inputSrcAmount(''), page);
		test('Source amount (.) input', () => page.inputSrcAmount('.'), page);
		test('Source amount (.0) input', () => page.inputSrcAmount('.0'), page);
		test('Source amount (.09) input', () => page.inputSrcAmount('.09'), page);
	}

// Transition 7: Change destination account to another one with same currency as source (EUR)
	test('(7) Change destination account', () => page.changeDestAccountByPos(0), page);
// Transition 5: Change source account to another one with same currency as destination (USD)
	test('(5) Change source account', () => page.changeSrcAccountByPos(0), page);
// Transition 1: Click by source balance and move from State 0 to State 1
	test('(1) Click on source result balance', () => page.clickSrcResultBalance(), page);

	if (actionState === 1)
		return action(page);

	if (!actionRequested)
	{
		// Input source result balance
		test('Source result balance (400) input', () => page.inputResBalance('400'), page);
		test('Source result balance (400.) input', () => page.inputResBalance('400.'), page);
		test('Source result balance (400.9) input', () => page.inputResBalance('400.9'), page);
		test('Source result balance (400.99) input', () => page.inputResBalance('400.99'), page);
		test('Source result balance (400.990) input', () => page.inputResBalance('400.990'), page);
		test('Source result balance (400.9901) input', () => page.inputResBalance('400.9901'), page);
		test('Empty result balance input', () => page.inputResBalance(''), page);
		test('Source result balance (.) input', () => page.inputResBalance('.'), page);
		test('Source result balance (.0) input', () => page.inputResBalance('.0'), page);
		test('Source result balance (.01) input', () => page.inputResBalance('.01'), page);
	}

	// Transition 11: Change source account to another one with same currency as destination and stay on State 1
	test('(11) Change source account', () => page.changeSrcAccountByPos(4), page);
	// Transition 13: Change destination account to another one with same currency as source and stay on State 1
	test('(13) Change destination account', () => page.changeDestAccountByPos(4), page);
	// Transition 9: Click by destination balance and move from State 1 to State 2
	test('(9) Click on destination result balance', () => page.clickDestResultBalance(), page);

	if (actionState === 2)
		return action(page);

	if (!actionRequested)
	{
		// Input destination result balance
		test('Destination result balance (600) input', () => page.inputDestResBalance('600'), page);
		test('Destination result balance (600.) input', () => page.inputDestResBalance('600.'), page);
		test('Destination result balance (600.9) input', () => page.inputDestResBalance('600.9'), page);
		test('Destination result balance (600.90) input', () => page.inputDestResBalance('600.90'), page);
		test('Destination result balance (600.901) input', () => page.inputDestResBalance('600.901'), page);
		test('Destination result balance (600.9010) input', () => page.inputDestResBalance('600.9010'), page);
		test('Destination result balance (600.90101) input', () => page.inputDestResBalance('600.90101'), page);
		test('Empty destination result balance input', () => page.inputDestResBalance(''), page);
		test('Destination result balance (.) input', () => page.inputDestResBalance('.'), page);
		test('Destination result balance (.0) input', () => page.inputDestResBalance('.0'), page);
	}

// Transition 15: Change source account to another one with same currency and stay on State 2
	test('(15) Change source account', () => page.changeSrcAccountByPos(4), page);
// Transition 17: Change destination account to another one with same currency and stay on State 2
	test('(17) Change destination account', () => page.changeDestAccount(4), page);
// Transition 16: Change source account to another one with different currency (USD) and move from State 2 to State 5

	if (actionState === 5)
		return action(page);

	test('(16) Change source account', () => page.changeSrcAccountByPos(2), page);
// Transition 26: Change source account to another one with different currency (EUR) and stay on State 5
	test('(26) Change source account', () => page.changeSrcAccountByPos(3), page);
// Transition 28: Change destination account to another one with different currency and stay on State 5
	test('(28) Change destination account', () => page.changeDestAccountByPos(0), page);
// Transition 27: Change source account to another one with same currency as destination (RUB) and move from State 5 to State 2
	test('(27) Change source account', () => page.changeSrcAccountByPos(1), page);
// Transition 18: Change destination account to another one with different currency than source (USD) and move from State 2 to State 5
	test('(18) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 29: Change destination account to another one with same currency as source and move from State 5 to State 2
	test('(29) Change destination account', () => page.changeDestAccountByPos(0), page);
// Transition 10: Click by source balance and move from State 1 to State 2
	test('(10) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 2: Click by source amount and move from State 1 to State 0
	test('(2) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 6: Change source account to another one with different currency than destination (USD) and move from State 0 to State 3

	if (actionState === 3)
		return action(page);

	test('(6) Change source account', () => page.changeSrcAccountByPos(2), page);
// Transition 43: Change source account to another one with different currency than destination (RUB) and stay on State 3
	test('(43) Change source account', () => page.changeSrcAccountByPos(1), page);
// Transition 41: Change destination account to another one with same currency as source (EUR) and stay on State 3
	test('(41) Change destination account', () => page.changeDestAccountByPos(3), page);
// Transition 44: Change source account to another one with same currency as destination (EUR > RUB) and move from State 3 to State 0
	test('(44) Change source account', () => {
		page.changeSrcAccountByPos(3);
		page.changeSrcAccountByPos(0);
	}, page);

// Transition 8: Change destination account to another one with different currency than source (USD) and move from State 0 to State 3
	test('(8) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 42: Change destination account to another one with same currency as source (RUB) and move from State 3 to State 0
	test('(42) Change destination account', () => page.changeDestAccountByPos(1), page);
// Transition 1: Click by source balance and move from State 0 to State 1
	test('(1) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 12: Change source account to another one with different currency than destination (EUR) and move from State 1 to State 4
	test('(12) Change source account', () => page.changeSrcAccountByPos(3), page);
// Transition 36: Change source account to another one with different currency than destination (USD) and stay on State 4
	test('(36) Change source account', () => page.changeSrcAccountByPos(1), page);
// Transition 38: Change destination account to another one with different currency than source (RUB) and stay on State 4
	test('(38) Change destination account', () => page.changeDestAccountByPos(3), page);
// Transition 39: Change destination account to another one with same currency as source (RUB) and move from State 4 to State 1
	test('(39) Change destination account', () => page.changeDestAccountByPos(3), page);
// Transition 14: Change destination account to another one with different currency than source (USD) and move from State 1 to State 4
	test('(14) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 32: Click by destination result balance and move from State 4 to State 6
	test('(32) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 49: Change source account to another one with different currency than destination (EUR) and stay on State 6
	test('(49) Change source account', () => page.changeSrcAccountByPos(3), page);
// Transition 47: Change destination account to another one with different currency than source (RUB) and stay on State 6
	test('(47) Change destination account', () => page.changeDestAccountByPos(0), page);
// Transition 20: Click by source amount and move from State 6 to State 5
	test('(20) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 19: Click by source result balance and move from State 5 to State 6
	test('(19) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 45: Click by exchange rate and move from State 6 to State 8
	test('(45) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 51: Change source account to another one with different currency than destination (USD) and stay on State 6
	test('(51) Change source account', () => page.changeSrcAccountByPos(2), page);
// Transition 53: Change destination account to another one with different currency than source (EUR) and stay on State 6
	test('(53) Change destination account', () => page.changeDestAccountByPos(3), page);
// Transition 23: Click by source amount and move from State 8 to State 7
	test('(23) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 57: Change source account to another one with different currency than destination (RUB) and stay on State 7
	test('(57) Change source account', () => page.changeSrcAccountByPos(0), page);
// Transition 59: Change destination account to another one with different currency than source (USD) and stay on State 7
	test('(59) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 22: Click by source result balance and move from State 7 to State 8
	test('(22) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 46: Click by destination result balance and move from State 8 to State 6
	test('(46) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 33: Click by destination amount and move from State 6 to State 4
	test('(33) Click on destination amount', () => page.clickDestAmount(), page);
// Transition 37: Change source account to another one with same currency as destination (RUB) and from State 4 to State 1
	test('(37) Change source account', () => {
		page.changeSrcAccountByPos(3);		// change source to EUR first
		page.changeDestAccountByPos(4)		// change destination to RUB
		page.changeSrcAccountByPos(0);		// change source to RUB
	}, page);

// Transition 2: Click by source amount and move from State 1 to State 0
	test('(2) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 3: Click by destination result balance and move from State 0 to State 2
	test('(3) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 4: Click by source amount and move from State 2 to State 0
	test('(4) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 3: Click by destination result balance and move from State 0 to State 2
	test('(3) Click on destination result balance', () => page.clickDestResultBalance(), page);

// Transition 18: Change destination account to another one with different currency than source (USD) and move from State 2 to State 5
	test('(18) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 21: Click by exchange rate and move from State 5 to State 7
	test('(21) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 55: Click by destination amount and move from State 7 to State 3
	test('(55) Click on destination amount', () => page.clickDestAmount(), page);
// Transition 25: Click by destination result balance and move from State 3 to State 5
	test('(25) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 21: Click by exchange rate and move from State 5 to State 7
	test('(21) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 56: Click by destination result balance and move from State 7 to State 5
	test('(56) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 24: Click by destination amount and move from State 5 to State 3
	test('(24) Click on destination amount', () => page.clickDestAmount(), page);
// Transition 40: Click by exchange rate and move from State 3 to State 7
	test('(40) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 60: Change destination account to another one with same currency as source (RUB) and move from State 7 to State 0
	test('(60) Change destination account', () => page.changeDestAccountByPos(1), page);
// Transition 3: Click by destination result balance and move from State 0 to State 2
	test('(3) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 16: Change source account to another one with different currency (USD) and move from State 2 to State 5
	test('(16) Change source account', () => page.changeSrcAccountByPos(2), page);
// Transition 21: Click by exchange rate and move from State 5 to State 7
	test('(21) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 58: Change source account to another one with same currency as destination (RUB) and from State 7 to State 0
	test('(58) Change source account', () => page.changeSrcAccountByPos(0), page);
// Transition 1: Click by source result balance and move from State 7 to State 8
	test('(1) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 12: Change source account to another one with different currency than destination (EUR) and move from State 1 to State 4
	test('(12) Change source account', () => page.changeSrcAccountByPos(3), page);
// Transition 30: Click by source amount and move from State 4 to State 3
	test('(30) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 31: Click by source result balance and move from State 3 to State 4
	test('(31) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 34: Click by exchange rate and move from State 4 to State 8
	test('(34) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 35: Click by destination amount and move from State 8 to State 4
	test('(35) Click on destination amount', () => page.clickDestAmount(), page);
// Transition 34: Click by exchange rate and move from State 4 to State 8
	test('(34) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 52: Change source account to another one with same currency as destination (RUB) and from State 8 to State 1
	test('(52) Change source account', () => page.changeSrcAccountByPos(0), page);
// Transition 14: Change destination account to another one with different currency than source (USD) and move from State 1 to State 4
	test('(14) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 34: Click by exchange rate and move from State 4 to State 8
	test('(34) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 54: Change destination account to another one with same currency as source (RUB) and move from State 8 to State 1
	test('(54) Change destination account', () => page.changeDestAccountByPos(1), page);
// Transition 12: Change source account to another one with different currency than source (USD) and move from State 1 to State 4
	test('(12) Change source account', () => page.changeSrcAccountByPos(2), page);
// Transition 32: Click by destination result balance and move from State 4 to State 6
	test('(32) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 50: Change source account to another one with same currency as destination (RUB) and from State 6 to State 1
	test('(50) Change source account', () => page.changeSrcAccountByPos(0), page);
// Transition 14: Change destination account to another one with different currency than source (USD) and move from State 1 to State 4
	test('(14) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 32: Click by destination result balance and move from State 4 to State 6
	test('(32) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 48: Change destination account to another one with same currency as source (RUB) and move from State 1 to State 2
	test('(48) Change destination account', () => page.changeDestAccountByPos(1), page);

	return Promise.resolve(page);
}


function debtTransactionLoop(page)
{
	setBlock('Debt', 2);
	test('Initial state of new debt page', () => page.setExpectedState(0), page);

// Input source amount
	test('Source amount (1) input', () => page.inputSrcAmount('1'), page);
	test('Source amount (1.) input', () => page.inputSrcAmount('1.'), page);
	test('Source amount (1.0) input', () => page.inputSrcAmount('1.0'), page);
	test('Source amount (1.01) input', () => page.inputSrcAmount('1.01'), page);
	test('Source amount (1.010) input', () => page.inputSrcAmount('1.010'), page);
	test('Source amount (1.0101) input', () => page.inputSrcAmount('1.0101'), page);
	test('Emptry source amount input', () => page.inputSrcAmount(''), page);
	test('Source amount (.) input', () => page.inputSrcAmount('.'), page);
	test('Source amount (.0) input', () => page.inputSrcAmount('.0'), page);
	test('Source amount (.09) input', () => page.inputSrcAmount('.09'), page);

// Transition 1: Click by source result balance and move from State 0 to State 1
	test('(1) Click on source result balance', () => page.clickSrcResultBalance(), page);

// Transition 47: Change to another one and stay on State 1
	test('(47) Change account', () => page.changeAccountByPos(1), page);

// Input source result balance
	test('Source result balance (400) input', () => page.inputResBalance('400'), page);
	test('Source result balance (400.) input', () => page.inputResBalance('400.'), page);
	test('Source result balance (400.9) input', () => page.inputResBalance('400.9'), page);
	test('Source result balance (400.99) input', () => page.inputResBalance('400.99'), page);
	test('Source result balance (400.990) input', () => page.inputResBalance('400.990'), page);
	test('Source result balance (400.9901) input', () => page.inputResBalance('400.9901'), page);
	test('Empty result balance input', () => page.inputResBalance(''), page);
	test('Source result balance (.) input', () => page.inputResBalance('.'), page);
	test('Source result balance (.0) input', () => page.inputResBalance('.0'), page);
	test('Source result balance (.01) input', () => page.inputResBalance('.01'), page);

// Transition 2: Click by source amount and move from State 1 to State 0
	test('(2) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 3: Click by destination result balance and move from State 0 to State 2
	test('(3) Click on destination result balance', () => page.clickDestResultBalance(), page);

// Transition 42: Change to another one and stay on State 2
	test('(42) Change account', () => page.changeAccountByPos(2), page);

// Input destination result balance
	test('Destination result balance (600) input', () => page.inputDestResBalance('600'), page);
	test('Destination result balance (600.) input', () => page.inputDestResBalance('600.'), page);
	test('Destination result balance (600.9) input', () => page.inputDestResBalance('600.9'), page);
	test('Destination result balance (600.90) input', () => page.inputDestResBalance('600.90'), page);
	test('Destination result balance (600.901) input', () => page.inputDestResBalance('600.901'), page);
	test('Destination result balance (600.9010) input', () => page.inputDestResBalance('600.9010'), page);
	test('Destination result balance (600.90101) input', () => page.inputDestResBalance('600.90101'), page);
	test('Empty destination result balance input', () => page.inputDestResBalance(''), page);
	test('Destination result balance (.) input', () => page.inputDestResBalance('.'), page);
	test('Destination result balance (.0) input', () => page.inputDestResBalance('.0'), page);

// Transition 4: Click by source result balance and move from State 2 to State 1
	test('(4) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 5: Click by destination result balance and move from State 1 to State 2
	test('(5) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 6: Click by source amount and move from State 2 to State 0
	test('(6) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 7: Change debt type to "take" and move from State 0 to State 3
	test('(7) Change debt type', () => page.toggleDebtType(), page);
// Transition 8: Change debt type back to "give" and move from State 3 to State 0
	test('(8) Change debt type', () => page.toggleDebtType(), page);

// Transition 7: Change debt type to "take" and move from State 0 to State 3
	test('(7) Change debt type', () => page.toggleDebtType(), page);

// Transition 49: Change to another one and stay on State 3
	test('(49) Change account', () => page.changeAccountByPos(3), page);

// Transition 9: Click by destination result balance and move from State 3 to State 4
	test('(9) Click on destination result balance', () => page.clickDestResultBalance(), page);

// Transition 51: Change to another one and stay on State 4
	test('(51) Change account', () => page.changeAccountByPos(4), page);

// Transition 10: Click by source amount and move from State 4 to State 3
	test('(10) Click on source amount', () => page.clickSrcAmount(), page);

// Transition 9: Click by destination result balance and move from State 3 to State 4
	test('(9) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 11: Click by source result balance and move from State 4 to State 5
	test('(11) Click on source result balance', () => page.clickSrcResultBalance(), page);

// Transition 48: Change to another one and stay on State 5
	test('(48) Change account', () => page.changeAccountByPos(0), page);

// Transition 12: Click by source amount and move from State 5 to State 3
	test('(12) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 13: Click by source result balance and move from State 3 to State 5
	test('(13) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 14: Click by destination result balance and move from State 5 to State 4
	test('(14) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 15: Change debt type to "give" and move from State 4 to State 1
	test('(15) Change debt type', () => page.toggleDebtType(), page);
// Transition 16: Change debt type to "take" and move from State 1 to State 4
	test('(16) Change debt type', () => page.toggleDebtType(), page);

// Transition 11: Click by source result balance and move from State 4 to State 5
	test('(11) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 17: Change debt type to "give" and move from State 5 to State 2
	test('(17) Change debt type', () => page.toggleDebtType(), page);
// Transition 18: Change debt type to "take" and move from State 2 to State 5
	test('(18) Change debt type', () => page.toggleDebtType(), page);

// Transition 12: Click by source amount and move from State 5 to State 3
	test('(12) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 8: Change debt type back to "give" and move from State 3 to State 0
	test('(8) Change debt type', () => page.toggleDebtType(), page);
// Transition 19: Change person to another one and stay on State 0
	test('(19) Change person', () => page.changePersonByPos(1), page);

// Transition 1: Click by source result balance and move from State 0 to State 1
	test('(1) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 20: Change person to another one and stay on State 1
	test('(20) Change person', () => page.changePersonByPos(0), page);

// Transition 5: Click by destination result balance and move from State 1 to State 2
	test('(5) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 21: Change person to another one and stay on State 2
	test('(21) Change person', () => page.changePersonByPos(1), page);

// Transition 18: Change debt type to "take" and move from State 2 to State 5
	test('(18) Change debt type', () => page.toggleDebtType(), page);
// Transition 22: Change person to another one and stay on State 5
	test('(22) Change person', () => page.changePersonByPos(0), page);

// Transition 14: Click by destination result balance and move from State 5 to State 4
	test('(14) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 23: Change person to another one and stay on State 4
	test('(23) Change person', () => page.changePersonByPos(1), page);

// Transition 10: Click by source amount and move from State 4 to State 3
	test('(10) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 24: Change person to another one and stay on State 3
	test('(24) Change person', () => page.changePersonByPos(0), page);

// Transition 8: Change debt type back to "give" and move from State 3 to State 0
	test('(8) Change debt type', () => page.toggleDebtType(), page);
// Transition 25: Disable account and move from State 0 to State 6
	test('(25) Disable account', () => page.toggleAccount(), page);

// Transition 43: Change person to another one and stay on State 6
	test('(43) Change person', () => page.changePersonByPos(1), page);

// Transition 26: Enable account and move from State 6 to State 0
	test('(26) Enable account', () => page.toggleAccount(), page);

// Transition 25: Disable account and move from State 0 to State 6
	test('(25) Disable account', () => page.toggleAccount(), page);
// Transition 27: Change debt type to "take" and move from State 6 to State 7
	test('(27) Change debt type', () => page.toggleDebtType(), page);

// Transition 44: Change person to another one and stay on State 7
	test('(44) Change person', () => page.changePersonByPos(0), page);

// Transition 28: Change debt type to "give" and move from State 7 to State 6
	test('(28) Change debt type', () => page.toggleDebtType(), page);

// Transition 27: Change debt type to "take" and move from State 6 to State 7
	test('(27) Change debt type', () => page.toggleDebtType(), page);
// Transition 29: Enable account and move from State 7 to State 3
	test('(29) Enable account', () => page.toggleAccount(), page);

// Transition 8: Change debt type back to "give" and move from State 3 to State 0
	test('(8) Change debt type', () => page.toggleDebtType(), page);
// Transition 25: Disable account and move from State 0 to State 6
	test('(25) Disable account', () => page.toggleAccount(), page);

// Transition 27: Change debt type to "take" and move from State 6 to State 7
	test('(27) Change debt type', () => page.toggleDebtType(), page);
// Transition 30: Click by destination result balance and move from State 7 to State 8
	test('(30) Click on destination result balance', () => page.clickDestResultBalance(), page);

// Transition 45: Change person to another one and stay on State 8
	test('(45) Change person', () => page.changePersonByPos(1), page);

// Transition 31: Click by source amount and move from State 8 to State 7
	test('(31) Click on source amount', () => page.clickSrcAmount(), page);

// Transition 30: Click by destination result balance and move from State 7 to State 8
	test('(30) Click on destination result balance', () => page.clickDestResultBalance(), page);

// Transition 32: Enable account and move from State 8 to State 4
	test('(32) Enable account', () => page.toggleAccount(), page);

// Transition 39: Disable account and move from State 4 to State 8
	test('(39) Disable account', () => page.toggleAccount(), page);
// Transition 33: Change debt type to "give" and move from State 8 to State 9
	test('(33) Change debt type', () => page.toggleDebtType(), page);

// Transition 46: Change person to another one and stay on State 9
	test('(46) Change person', () => page.changePersonByPos(0), page);

// Transition 34: Change debt type to "take" and move from State 9 to State 8
	test('(34) Change debt type', () => page.toggleDebtType(), page);

// Transition 44: Change person to another one and stay on State 8
	test('(44) Change person', () => page.changePersonByPos(1), page);

// Transition 33: Change debt type to "give" and move from State 8 to State 9
	test('(33) Change debt type', () => page.toggleDebtType(), page);
// Transition 35: Click by source amount and move from State 9 to State 6
	test('(35) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 36: Click by source result balance and move from State 6 to State 9
	test('(36) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 37: Enable account and move from State 9 to State 1
	test('(37) Enable account', () => page.toggleAccount(), page);
// Transition 38: Disable account and move from State 1 to State 9
	test('(38) Disable account', () => page.toggleAccount(), page);

// Transition 35: Click by source amount and move from State 9 to State 6
	test('(35) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 26: Enable account and move from State 6 to State 0
	test('(26) Enable account', () => page.toggleAccount(), page);
// Transition 7: Change debt type to "take" and move from State 0 to State 3
	test('(7) Change debt type', () => page.toggleDebtType(), page);
// Transition 40: Disable account and move from State 3 to State 7
	test('(40) Disable account', () => page.toggleAccount(), page);


// Transition 28: Change debt type to "give" and move from State 7 to State 6
	test('(28) Change debt type', () => page.toggleDebtType(), page);
// Transition 26: Enable account and move from State 6 to State 0
	test('(26) Enable account', () => page.toggleAccount(), page);
// Transition 3: Click by destination result balance and move from State 0 to State 2
	test('(3) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 41: Disable account and move from State 2 to State 6
	test('(41) Disable account', () => page.toggleAccount(), page);

// Transition 26: Enable account and move from State 6 to State 0
	test('(26) Enable account', () => page.toggleAccount(), page);

// Transition 52: Change to another one and stay on State 0
	test('(52) Change account', () => page.changeAccountByPos(2), page);

// Transition 3: Click by destination result balance and move from State 0 to State 2
	test('(3) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 18: Change debt type to "take" and move from State 2 to State 5
	test('(18) Change debt type', () => page.toggleDebtType(), page);
// Transition 50: Disable account and move from State 5 to State 7
	test('(50) Disable account', () => page.toggleAccount(), page);

	return Promise.resolve(page);
}
