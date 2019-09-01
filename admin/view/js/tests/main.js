var restbl = null;
var totalRes = null, okRes = null, failRes = null;
var results = {};
var initPersonsLength;



function initTests()
{
	var startbtn = ge('startbtn');
	totalRes = ge('totalRes');
	okRes = ge('okRes');
	failRes = ge('failRes');
	viewframe = ge('viewframe');
	restbl = ge('restbl');
	if (!startbtn || !totalRes || !okRes || !failRes || !viewframe || !restbl)
		throw 'Fail to init tests';

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
	.then(transactionTests);
}


function setBlock(title, category)
{
	addBlock(title, category);
}


function accountTests(page)
{
	setBlock('Accounts', 1);

	return page.goToMainPage()
			.then(page => page.goToAccounts())
			.then(page => page.goToCreateAccount())
			.then(createAccount1)
			.then(checkCreateAccount1)
			.then(page => page.goToCreateAccount())
			.then(createAccount2)
			.then(checkCreateAccount2)
			.then(page => page.goToUpdateAccount(0))
			.then(editAccount1)
			.then(checkEditAccount1)
			.then(page => page.goToCreateAccount())
			.then(page => createAccountWithParam(page, { name : 'acc_3', curr_id : 1, balance : '500.99', icon : 2 }))
			.then(checkCreateAccount3)
			.then(page => page.deleteAccounts([0, 1]))
			.then(checkDeleteAccounts)
			.then(page => page.goToCreateAccount())
			.then(page => createAccountWithParam(page, { name : 'acc RUB', curr_id : 1, balance : '500.99', icon : 5 }))
			.then(page => page.goToCreateAccount())
			.then(page => createAccountWithParam(page, { name : 'acc USD', curr_id : 2, balance : '500.99', icon : 4 }))
			.then(page => page.goToCreateAccount())
			.then(page => createAccountWithParam(page, { name : 'acc EUR', curr_id : 3, balance : '10000.99', icon : 3 }));
}


function personTests(page)
{
	setBlock('Persons', 1);

	return page.goToMainPage()
			.then(page => page.goToPersons())
			.then(checkInitialPersons)
			.then(page => page.goToCreatePerson())
			.then(page => page.createPerson('Alex'))
			.then(page => checkCreatePerson(page, 'Alex'))
			.then(page => page.goToCreatePerson())
			.then(page => page.createPerson('Maria'))
			.then(page => checkCreatePerson(page, 'Maria'))
			.then(page => page.goToCreatePerson())
			.then(page => page.createPerson('Johnny'))
			.then(page => checkCreatePerson(page, 'Johnny'))
			.then(page => page.goToCreatePerson())
			.then(page => page.createPerson('Иван'))
			.then(page => checkCreatePerson(page, 'Иван'))
			.then(page => page.goToUpdatePerson(3))
			.then(page => updatePerson(page, 3, 'Иван', 'Ivan<'))
			.then(page=> page.deletePersons([0, 2]));
}


function transactionTests(page)
{
	setBlock('Transactions', 1);

	return page.goToMainPage()
			.then(page => page.goToNewTransactionByAccount(0))
			.then(expenseTransactionStart)
			.then(page => page.changeTransactionType(INCOME))
			.then(incomeTransactionStart)
			.then(page => page.changeTransactionType(TRANSFER))
			.then(transferTransactionStart)
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


	return navigation(() => clickEmul(page.content.submitBtn), AccountsPage);
}


function checkCreateAccount1(page)
{
	var state = { values : { tiles : { length : 1, 0 : { balance : '1 000.01 ₽', name : 'acc_1' } } } };

	test('First account create', () => {}, page, state);

	return Promise.resolve(page);
}


function createAccount2(page)
{
	var state = { values : { tile : { name : 'acc_2', balance : '0 ₽' }, currDropDown : { textValue : 'RUB' } } };

// Input account name
	page.inputName('acc_2');
	test('Account tile name update', () => {}, page, state);

// Change currency to EUR
	setParam(state.values, { tile : { balance : '€ 0' }, currDropDown : { textValue : 'EUR' } });
	test('EUR currency select', () => page.changeCurrency(3), page, state);

	state.values.tile.balance = '€ 1 000.01';
	test('Account tile balance on EUR 1 000.01 balance input field', () => page.inputBalance('1000.01'), page, state);

	return navigation(() => clickEmul(page.content.submitBtn), AccountsPage);
}


function checkCreateAccount2(page)
{
	var state = { value : { tiles : { length : 2, 1 : { balance : '€ 1 000.01', name : 'acc_2' } } } };
	test('Second account create', () => {}, page, state);

	return Promise.resolve(page);
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
	return navigation(() => clickEmul(page.content.submitBtn), AccountsPage);
}


function checkEditAccount1(page)
{
	var state = { value : { tiles : { length : 2, 1 : { balance : '$ 1 000.01', name : 'acc_1', icon : tileIcons[1] } } } };
	test('First account update', () => {}, page, state);

	return Promise.resolve(page);
}


function createAccountWithParam(page, params)
{
	if (!params)
		throw 'No params specified';
	if (!params.name || !params.name.length)
		throw 'Name not specified';
	var currObj = getCurrency(params.curr_id);
	if (!currObj)
		throw 'Wrong currency specified';
	var normBalance = normalize(params.balance);
	if (isNaN(normBalance))
		throw 'Balance not specified';

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
			throw 'Icon not found';

		setParam(state.values, { iconDropDown : { textValue : tileIcons[params.icon].title }, tile : { icon : tileIcons[params.icon] } });
		test('Tile icon update', () => page.changeIcon(params.icon), page, state);
	}

	return navigation(() => clickEmul(page.content.submitBtn), AccountsPage);
}


function checkCreateAccount3(page)
{
	var state = { value : { tiles : { length : 3, 2 : { balance : '500.99 ₽', name : 'acc_3', icon : tileIcons[2] } } } };
	test('Third account create', () => {}, page, state);

 	return Promise.resolve(page);
}


function checkDeleteAccounts(page)
{
	var state = { values : { tiles : { length : 1 } } };
	test('Accounts delete', () => {}, page, state);

	return Promise.resolve(page);
}


function checkInitialPersons(page)
{
	var state = { value : { tiles : { length : initPersonsLength + 1 } } };
	test('Initial persons structure', () => {}, page, state);

	initPersonsLength = page.content.tiles.length;

	return Promise.resolve(page);
}


// From persons list page go to new person page, input name and submit
// Next check name result and callback
function checkCreatePerson(page, personName)
{
	var state = { value : { tiles : { length : initPersonsLength + 1 } } };
	state.value.tiles[initPersonsLength] = { name : personName };

	test('Person create', () => {}, page, state);

	initPersonsLength = page.content.tiles.length;

	return Promise.resolve(page);
}


function updatePerson(page, num, currentName, personName)
{
	var state = { visibility : { name : true },
 					values : { name : currentName } };

	test('Update person page state', () => {}, page, state);

	page.inputName(personName);

	return navigation(() => clickEmul(page.content.submitBtn), PersonsPage)
	.then(function(page)
	{
		var state = { values : { tiles : { length : initPersonsLength } }};
		state.values.tiles[num] = { name : personName };

		test('Person update', () => {}, page, state);

		return Promise.resolve(page);
	});
}


function expenseTransactionStart(page)
{
// State 0
	setBlock('Expense', 2);
	test('Initial state of new expense page', () => page.setExpectedState(0), page);


// Input destination amount
	test('Destination amount (1) input', () => page.inputDestAmount('1'), page);
	test('Destination amount (1.) input', () => page.inputDestAmount('1.'), page);
	test('Destination amount (1.0) input', () => page.inputDestAmount('1.0'), page);
	test('Destination amount (1.01) input', () => page.inputDestAmount('1.01'), page);
	test('Destination amount (1.010) input', () => page.inputDestAmount('1.010'), page);
	test('Destination amount (1.0101) input', () => page.inputDestAmount('1.0101'), page);

// Transition 2: click on result balance block and move from State 0 to State 1
	test('(2) Click on source result balance', () => page.clickSrcResultBalance(), page);

// Input result balance
	test('Result balance (499.9) input', () => page.inputResBalance('499.9'), page);
	test('Result balance (499.90) input', () => page.inputResBalance('499.90'), page);
	test('Result balance (499.901) input', () => page.inputResBalance('499.901'), page);

// Transition 12: change account to another one with different currency and stay on State 1
	test('(12) Change account to another one with currency different than current destination currency',
			() => page.changeSrcAccountByPos(2), page);

// Change account back
	test('(12) Change account back',
			() => page.changeSrcAccountByPos(0), page);

// Transition 3: click on destination amount block and move from State 1 to State 0
	test('(3) Click on destination amount', () => page.clickDestAmount(), page);

// Transition 4: select different currency for destination and move from State 0 to State 2
	test('(4) Change destination curency to USD', () => page.changeDestCurrency(2), page);

// Input source amount
	test('Empty source amount input', () => page.inputSrcAmount(''), page);
	test('Source amount (.) input', () => page.inputSrcAmount('.'), page);
	test('Source amount (0.) input', () => page.inputSrcAmount('0.'), page);
	test('Source amount (.0) input', () => page.inputSrcAmount('.0'), page);
	test('Source amount (.01) input', () => page.inputSrcAmount('.01'), page);
	test('Source amount (1.01) input', () => page.inputSrcAmount('1.01'), page);
	test('Source amount (1.010) input', () => page.inputSrcAmount('1.010'), page);

// Transition 8: click on exchange rate block and move from State 2 to State 3
	test('(8) Click on exchange rate', () => page.clickExchRate(), page);

// Input exchange rate
	test('Input exchange rate (1.09)', () => page.inputExchRate('1.09'), page);
	test('Input exchange rate (3.09)', () => page.inputExchRate('3.09'), page);
	test('Input exchange rate (.)', () => page.inputExchRate('.'), page);
	test('Input exchange rate (.0)', () => page.inputExchRate('.0'), page);
	test('Input exchange rate (.09)', () => page.inputExchRate('.09'), page);
	test('Input exchange rate (.090101)', () => page.inputExchRate('.090101'), page);

// Transition 16: click on destination amount block and move from State 3 to State 2
	test('(16) Click on destination amount', () => page.clickDestAmount(), page);

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

// Transition 6: click on source result balance block and move from State 2 to State 4
	test('(6) Click on source result block', () => page.clickSrcResultBalance(), page);

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


function incomeTransactionStart(page)
{
// State 0
	setBlock('Income', 2);
	test('Initial state of new income page', () => page.setExpectedState(0), page);

// Input source amount
	test('Source amount (1) input', () => page.inputSrcAmount('1'), page);
	test('Source amount (1.) input', () => page.inputSrcAmount('1.'), page);
	test('Source amount (1.0) input', () => page.inputSrcAmount('1.0'), page);
	test('Source amount (1.01) input', () => page.inputSrcAmount('1.01'), page);
	test('Source amount (1.010) input', () => page.inputSrcAmount('1.010'), page);
	test('Source amount (1.0101) input', () => page.inputSrcAmount('1.0101'), page);

// Transition 2: Click on destination result balance block and move from State 0 to State 1
	test('(2) Click on destination result balance', () => page.clickDestResultBalance(), page);

// Transition 23: Change account to another one with different currency and stay on State 1
	test('(23) Change destination account', () => page.changeDestAccountByPos(3), page);
	test('(23) Change destination account back', () => page.changeDestAccountByPos(0), page);

// Input result balance
	test('Result balance (502.08) input', () => page.inputDestResBalance('502.08'), page);
	test('Result balance (502.080) input', () => page.inputDestResBalance('502.080'), page);
	test('Result balance (502.0801) input', () => page.inputDestResBalance('502.0801'), page);

// Transition 4: Click on source amount block and move from State 1 to State 0
	test('(4) Click on source amount', () => page.clickSrcAmount(), page);

// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
	test('(3) Change source curency to USD', () => page.changeSourceCurrency(2), page);

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

// Transition 7: Click on result balance block and move from State 2 to State 4
	test('(7) Click on destination result balance', () => page.clickDestResultBalance(), page);

// Transition 17: Change account to another one with currency different than current source currency and stay on State 4
	test('(17) Change destination account', () => page.changeDestAccountByPos(3), page);
	test('(17) Change destination account back', () => page.changeDestAccountByPos(0), page);

// Transition 21: Change source currency to different than currency of account and stay on State 4
	test('(21) Change source curency to EUR', () => page.changeSourceCurrency(3), page);
	test('(21) Change source curency to USD', () => page.changeSourceCurrency(2), page);

// Transition 20: Click on exchange rate block and move from State 4 to State 3
	test('(20) Click on exchange rate', () => page.clickExchRate(), page);

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


function transferTransactionStart(page)
{
	var state = { visibility : { source : true, destination : true, src_amount_left : false, dest_amount_left : false,
								src_res_balance_left : true, dest_res_balance_left : true, exch_left : false,
								src_amount_row : true, dest_amount_row : false, exchange_row : false, result_balance_row : false,
								result_balance_dest_row : false },
				values : { typeMenu : { 3 : { isActive : true } }, /* TRANSFER */
							source : { tile : { name : 'acc_3', balance : '500.99 ₽' } },
							destination : { tile : { name : 'acc RUB', balance : '500.99 ₽' } },
							src_amount_row : { label : 'Amount', value : '', currSign : '₽', isCurrActive : false },
							src_res_balance_left : '500.99 ₽',
							result_balance_row : { value : '500.9', value : '', currSign : '₽', isCurrActive : false },
							dest_res_balance_left : '500.99 ₽',
							result_balance_dest_row : { value : '500.09', value : '', currSign : '₽', isCurrActive : false }, } };

	setBlock('Transfer', 2);
	test('Initial state of new transfer page', () => {}, page, state);

// Input source amount
	setParam(state.values, { src_amount_row : { value : '1' }, src_amount_left : '1 ₽',
								src_res_balance_left : '499.99 ₽', result_balance_row : { value : '499.99' },
								dest_res_balance_left : '501.99 ₽', result_balance_dest_row : { value : '501.99' } });
	test('Source amount (1) input', () => page.inputSrcAmount(state.values.src_amount_row.value), page, state);

	state.values.src_amount_row.value = '1.';
	test('Source amount (1.) input', () => page.inputSrcAmount(state.values.src_amount_row.value), page, state);

	state.values.src_amount_row.value = '1.0';
	test('Source amount (1.0) input', () => page.inputSrcAmount(state.values.src_amount_row.value), page, state);

	setParam(state.values, { src_amount_row : { value : '1.01' }, src_amount_left : '1.01 ₽',
								src_res_balance_left : '499.98 ₽', result_balance_row : { value : '499.98' },
								dest_res_balance_left : '502 ₽', result_balance_dest_row : { value : '502' } });
	test('Source amount (1.01) input', () => page.inputSrcAmount(state.values.src_amount_row.value), page, state);

	state.values.src_amount_row.value = '1.010';
	test('Source amount (1.010) input', () => page.inputSrcAmount(state.values.src_amount_row.value), page, state);

	state.values.src_amount_row.value = '1.0101';
	test('Source amount (1.0101) input', () => page.inputSrcAmount(state.values.src_amount_row.value), page, state);

	setParam(state.values, { src_amount_row : { value : '' }, src_amount_left : '0 ₽',
								src_res_balance_left : '500.99 ₽', result_balance_row : { value : '500.99' },
								dest_res_balance_left : '500.99 ₽', result_balance_dest_row : { value : '500.99' } });
	test('Emptry source amount input', () => page.inputSrcAmount(state.values.src_amount_row.value), page, state);

	state.values.src_amount_row.value = '.';
	test('Source amount (.) input', () => page.inputSrcAmount(state.values.src_amount_row.value), page, state);

	state.values.src_amount_row.value = '.0';
	test('Source amount (.0) input', () => page.inputSrcAmount(state.values.src_amount_row.value), page, state);

	setParam(state.values, { src_amount_row : { value : '.09' }, src_amount_left : '0.09 ₽',
								src_res_balance_left : '500.90 ₽', result_balance_row : { value : '500.9' },
								dest_res_balance_left : '501.08 ₽', result_balance_dest_row : { value : '501.08' } });
	test('Source amount (.09) input', () => page.inputSrcAmount(state.values.src_amount_row.value), page, state);

// Click by source balance
	setParam(state.visibility, { src_res_balance_left : false, result_balance_row : true, src_amount_left : true, src_amount_row : false });
	test('Click on destination result balance', () => page.clickSrcResultBalance(), page, state);

// Input source result balance
	setParam(state.values, { result_balance_row : { value : '400' }, src_res_balance_left : '400 ₽',
								result_balance_dest_row : { value : '601.98' }, dest_res_balance_left : '601.98 ₽',
								src_amount_left : '100.99 ₽', src_amount_row : { value : '100.99' } });
	test('Result balance (400) input', () => page.inputResBalance(state.values.result_balance_row.value), page, state);

	state.values.result_balance_row.value = '400.';
	test('Result balance (400.) input', () => page.inputResBalance(state.values.result_balance_row.value), page, state);

	setParam(state.values, { result_balance_row : { value : '400.9' }, src_res_balance_left : '400.90 ₽',
								result_balance_dest_row : { value : '601.08' }, dest_res_balance_left : '601.08 ₽',
								src_amount_left : '100.09 ₽', src_amount_row : { value : '100.09' } });
	test('Result balance (400.9) input', () => page.inputResBalance(state.values.result_balance_row.value), page, state);

	setParam(state.values, { result_balance_row : { value : '400.99' }, src_res_balance_left : '400.99 ₽',
								result_balance_dest_row : { value : '600.99' }, dest_res_balance_left : '600.99 ₽',
								src_amount_left : '100 ₽', src_amount_row : { value : '100' } });
	test('Result balance (400.99) input', () => page.inputResBalance(state.values.result_balance_row.value), page, state);

	state.values.result_balance_row.value = '400.990';
	test('Result balance (400.990) input', () => page.inputResBalance(state.values.result_balance_row.value), page, state);

	state.values.result_balance_row.value = '400.9901';
	test('Result balance (400.9901) input', () => page.inputResBalance(state.values.result_balance_row.value), page, state);

	setParam(state.values, { result_balance_row : { value : '' }, src_res_balance_left : '0 ₽',
								result_balance_dest_row : { value : '1001.98' }, dest_res_balance_left : '1 001.98 ₽',
								src_amount_left : '500.99 ₽', src_amount_row : { value : '500.99' } });
	test('Empty result balance input', () => page.inputResBalance(state.values.result_balance_row.value), page, state);

	state.values.result_balance_row.value = '.';
	test('Result balance (.) input', () => page.inputResBalance(state.values.result_balance_row.value), page, state);

	state.values.result_balance_row.value = '.0';
	test('Result balance (.0) input', () => page.inputResBalance(state.values.result_balance_row.value), page, state);

	setParam(state.values, { result_balance_row : { value : '.01' }, src_res_balance_left : '0.01 ₽',
								result_balance_dest_row : { value : '1001.97' }, dest_res_balance_left : '1 001.97 ₽',
								src_amount_left : '500.98 ₽', src_amount_row : { value : '500.98' } });
	test('Result balance (.01) input', () => page.inputResBalance(state.values.result_balance_row.value), page, state);

// CLick on destination amount
	setParam(state.visibility, { dest_res_balance_left : false, result_balance_dest_row : true, src_res_balance_left : true, result_balance_row : false });
	test('Click on destination result balance', () => page.clickDestResultBalance(), page, state);

// Input destination result balance
	setParam(state.values, { result_balance_dest_row : { value : '600' }, dest_res_balance_left : '600 ₽',
								result_balance_row : { value : '401.98' }, src_res_balance_left : '401.98 ₽',
								src_amount_left : '99.01 ₽', src_amount_row : { value : '99.01' } });
	test('Result balance (600) input', () => page.inputDestResBalance(state.values.result_balance_dest_row.value), page, state);

	state.values.result_balance_dest_row.value = '600.';
	test('Result balance (600.) input', () => page.inputDestResBalance(state.values.result_balance_dest_row.value), page, state);

	setParam(state.values, { result_balance_dest_row : { value : '600.9' }, dest_res_balance_left : '600.90 ₽',
								result_balance_row : { value : '401.08' }, src_res_balance_left : '401.08 ₽',
								src_amount_left : '99.91 ₽', src_amount_row : { value : '99.91' } });
	test('Result balance (600.9) input', () => page.inputDestResBalance(state.values.result_balance_dest_row.value), page, state);

	state.values.result_balance_dest_row.value = '600.90';
	test('Result balance (600.90) input', () => page.inputDestResBalance(state.values.result_balance_dest_row.value), page, state);

	state.values.result_balance_dest_row.value = '600.901';
	test('Result balance (600.901) input', () => page.inputDestResBalance(state.values.result_balance_dest_row.value), page, state);

	state.values.result_balance_dest_row.value = '600.9010';
	test('Result balance (600.9010) input', () => page.inputDestResBalance(state.values.result_balance_dest_row.value), page, state);

	state.values.result_balance_dest_row.value = '600.90101';
	test('Result balance (600.90101) input', () => page.inputDestResBalance(state.values.result_balance_dest_row.value), page, state);

	setParam(state.values, { result_balance_dest_row : { value : '' }, dest_res_balance_left : '0 ₽',
								result_balance_row : { value : '1001.98' }, src_res_balance_left : '1 001.98 ₽',
								src_amount_left : '-500.99 ₽', src_amount_row : { value : '-500.99' } });
	test('Empty destination result balance input', () => page.inputDestResBalance(state.values.result_balance_dest_row.value), page, state);

	state.values.result_balance_dest_row.value = '.';
	test('Result balance (.) input', () => page.inputDestResBalance(state.values.result_balance_dest_row.value), page, state);

	state.values.result_balance_dest_row.value = '.0';
	test('Result balance (.0) input', () => page.inputDestResBalance(state.values.result_balance_dest_row.value), page, state);

// Change source account to another one with different currency (USD)
	setParam(state.visibility, { src_amount_row : true, src_amount_left : false, exch_left : true,
								dest_amount_left : true });
	setParam(state.values, { source : { tile : { name : 'acc USD', balance : '$ 500.99' } },
								result_balance_row : { currSign : '$', value : '1001.98' }, src_res_balance_left : '$ 1 001.98',
								src_amount_left : '$ -500.99', src_amount_row : { currSign : '$', label : 'Source amount', value : '-500.99' },
								dest_amount_left : '-500.99 ₽', dest_amount_row : { label : 'Destination amount', value : '-500.99' } });
	test('Change source account', () => page.changeSrcAccountByPos(2), page, state);

	return Promise.resolve(page);
}


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


function addBlock(descr, category)
{
	restbl.appendChild(ce('tr', { className : 'res-block-' + category }, ce('td', { colSpan : 3, innerHTML : descr }) ));
}
