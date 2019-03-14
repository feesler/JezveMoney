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
		viewframe.src = 'http://jezve.net/money/';
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
			.then(page => createAccountWithParam(page, { name : 'acc_1', curr_id : 1, balance : '500.99', icon : 2 }))
			.then(page => page.goToCreateAccount())
			.then(page => createAccountWithParam(page, { name : 'acc_3', curr_id : 1, balance : '10000.99', icon : 3 }));
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
			.then(page => page.goToNewTransactionByAccount(1))
			.then(expenseTransactionStart);
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

	addResult('Initial state of new account page', page.checkState(state));

	setParam(state.values, { tile : { name : 'acc_1' }, name : 'acc_1' });
	page.inputName('acc_1');
	addResult('Account name input result', page.checkState(state));

// Change currency
	setParam(state.values, { currDropDown : { textValue : 'USD' }, tile : { balance : '$ 0' } });
	page.changeCurrency(2);		// select USD currency
	addResult('Change currency result', page.checkState(state));


	setParam(state.values, { tile : { balance : '$ 100 000.01' }, balance : '100000.01' });
	page.inputBalance('100000.01');
	addResult('Input balance (100 000.01) result', page.checkState(state));

// Change currency back
	setParam(state.values, { currDropDown : { textValue : 'RUB' }, tile : { balance : '100 000.01 ₽' } });
	page.changeCurrency(1);		// select RUB currency
	addResult('Change currency back result', page.checkState(state));

// Input empty value for initial balance
	setParam(state.values, { tile : { balance : '0 ₽' }, balance : '' });
	page.inputBalance('');
	addResult('Input empty balance result', page.checkState(state));

	state.values.balance = '.';
	page.inputBalance('.');
	addResult('Input dot (.) balance result', page.checkState(state));

	setParam(state.values, { tile : { balance : '0.01 ₽' }, balance : '.01' });
	page.inputBalance('.01');
	addResult('Input (.01) balance result', page.checkState(state));

	setParam(state.values, { tile : { balance : '10 000 000.01 ₽' }, balance : '10000000.01' });
	page.inputBalance('10000000.01');
	addResult('Input (10000000.01) balance result', page.checkState(state));

// Change icon
	setParam(state.values,  { iconDropDown : { textValue : 'Safe' },
							tile : { icon : tileIcons[2] } });
	page.changeIcon(2);	// select safe icon
	addResult('Change icon result', page.checkState(state));

	setParam(state.values, { tile : { balance : '1 000.01 ₽' }, balance : '1000.01' });
	page.inputBalance('1000.01');
	addResult('Input (1000.01) balance result', page.checkState(state));


	return navigation(() => clickEmul(page.content.submitBtn), AccountsPage);
}


function checkCreateAccount1(page)
{
	var state = { values : { tiles : { length : 1, 0 : { balance : '1 000.01 ₽', name : 'acc_1' } } } };

	addResult('First account create result', page.checkState(state));

	return Promise.resolve(page);
}


function createAccount2(page)
{
	var state = { values : { tile : { name : 'acc_2', balance : '0 ₽' }, currDropDown : { textValue : 'RUB' } } };

// Input account name
	page.inputName('acc_2');
	addResult('Account tile name update', page.checkState(state));

// Change currency
	page.changeCurrency(3);		// select EUR currency

	setParam(state.values, { tile : { balance : '€ 0' }, currDropDown : { textValue : 'EUR' } });
	addResult('EUR currency select result', page.checkState(state));

	state.values.tile.balance = '€ 1 000.01';
	page.inputBalance('1000.01')
	addResult('Account tile balance on EUR 1 000.01 balance input field', page.checkState(state));

	return navigation(() => clickEmul(page.content.submitBtn), AccountsPage);
}


function checkCreateAccount2(page)
{
	var state = { value : { tiles : { length : 2, 1 : { balance : '€ 1 000.01', name : 'acc_2' } } } };
	addResult('Second account create result', page.checkState(state));

	return Promise.resolve(page);
}


function editAccount1(page)
{
	var state = { values : { tile : { name : 'acc_1', balance : '1 000.01 ₽', icon : tileIcons[2] }, currDropDown : { textValue : 'RUB' } } };

	addResult('Initial state of edit account page', page.checkState(state));

// Change currency
	var fmtBal = formatCurrency(1000.01, 2);
	setParam(state.values, { tile : { balance : fmtBal }, currDropDown : { textValue : 'USD' } });
	page.changeCurrency(2);		// select USD currency
	addResult('USD currency select result', page.checkState(state));

// Change icon
	state.values.tile.icon = tileIcons[1];
	page.changeIcon(1);			// select purse icon
	addResult('Icon change result', page.checkState(state));

// Submit
	return navigation(() => clickEmul(page.content.submitBtn), AccountsPage);
}


function checkEditAccount1(page)
{
	var state = { value : { tiles : { length : 2, 1 : { balance : '$ 1 000.01', name : 'acc_1', icon : tileIcons[1] } } } };
	addResult('First account update result', page.checkState(state));

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
	page.inputName(params.name);
	addResult('Account tile name update', page.checkState(state));

// Change currency
	var fmtBal = formatCurrency(0, currObj.id);
	setParam(state.values, { currDropDown : { textValue : currObj.name }, tile : { balance : fmtBal } });
	page.changeCurrency(currObj.id);

	addResult(currObj.name + ' currency select result', page.checkState(state));

// Input balance
	fmtBal = formatCurrency(normBalance, currObj.id);
	setParam(state.values, { tile : { balance : fmtBal } });
	page.inputBalance(params.balance);

	addResult('Tile balance format update result', page.checkState(state));

// Change icon
	if (params.icon)
	{
		if (params.icon < 0 || params.icon > tileIcons.length)
			throw 'Icon not found';

		setParam(state.values, { iconDropDown : { textValue : tileIcons[params.icon].title }, tile : { icon : tileIcons[params.icon] } });
		page.changeIcon(params.icon);

		addResult('Tile icon update result', page.checkState(state));
	}

	return navigation(() => clickEmul(page.content.submitBtn), AccountsPage);
}


function checkCreateAccount3(page)
{
	var state = { value : { tiles : { length : 3, 2 : { balance : '500.99 ₽', name : 'acc_3', icon : tileIcons[2] } } } };
	addResult('Third account create result', page.checkState(state));

 	return Promise.resolve(page);
}


function checkDeleteAccounts(page)
{
	var state = { values : { tiles : { length : 1 } } };
	addResult('Accounts delete result', page.checkState(state));

	return Promise.resolve(page);
}


function checkInitialPersons(page)
{
	var state = { value : { tiles : { length : initPersonsLength + 1 } } };
	addResult('Initial persons structure', page.checkState(state));

	initPersonsLength = page.content.tiles.length;

	return Promise.resolve(page);
}


// From persons list page go to new person page, input name and submit
// Next check name result and callback
function checkCreatePerson(page, personName)
{
	var state = { value : { tiles : { length : initPersonsLength + 1 } } };
	state.value.tiles[initPersonsLength] = { name : personName };

	addResult('Person create result', page.checkState(state));

	initPersonsLength = page.content.tiles.length;

	return Promise.resolve(page);
}


function updatePerson(page, num, currentName, personName)
{
	var state = { visibility : { name : true },
 					values : { name : currentName } };

	addResult('Update person page state', page.checkState(state));

	page.inputName(personName);

	return navigation(() => clickEmul(page.content.submitBtn), PersonsPage)
	.then(function(page)
	{
		var state = { values : { tiles : { length : initPersonsLength } }};
		state.values.tiles[num] = { name : personName };

		addResult('Person update result', page.checkState(state));

		return Promise.resolve(page);
	});
}


function expenseTransactionStart(page)
{
	var state = { visibility : { source : true, destination : false, src_amount_left : false, dest_amount_left : false,
								src_res_balance_left : true, dest_res_balance_left : false, exch_left : false,
								src_amount_row : false, dest_amount_row : true, exchange_row : false, result_balance_row : false,
								result_balance_dest_row : false },
				values : { source : { tile : { name : 'acc_1', balance : '500.99 ₽' } },
							dest_amount_row : { currSign : '₽', isCurrActive : true },
							src_res_balance_left : '500.99 ₽' } };

	addResult('Initial state', page.checkState(state));

	setParam(state.values, { dest_amount_row : { value : '1' },
								src_res_balance_left : '499.99 ₽' });
	page.inputDestAmount(state.values.dest_amount_row.value);
	addResult('Destination amount (1) input result', page.checkState(state));

	state.values.dest_amount_row.value = '1.';
	page.inputDestAmount(state.values.dest_amount_row.value);
	addResult('Destination amount (1.) input result', page.checkState(state));

	state.values.dest_amount_row.value = '1.0';
	page.inputDestAmount(state.values.dest_amount_row.value);
	addResult('Destination amount (1.0) input result', page.checkState(state));

	setParam(state.values, { dest_amount_row : { value : '1.01' },
								src_res_balance_left : '499.98 ₽' });
	page.inputDestAmount(state.values.dest_amount_row.value);
	addResult('Destination amount (1.01) input result', page.checkState(state));

	state.values.dest_amount_row.value = '1.010';
	page.inputDestAmount(state.values.dest_amount_row.value);
	addResult('Destination amount (1.010) input result', page.checkState(state));

	state.values.dest_amount_row.value = '1.0101';
	page.inputDestAmount(state.values.dest_amount_row.value);
	addResult('Destination amount (1.0101) input result', page.checkState(state));

	setParam(state.visibility, { dest_amount_left : true, src_res_balance_left : false, dest_amount_row : false, result_balance_row : true });
	setParam(state.values, { dest_amount_left : '1.01 ₽',
							result_balance_row : { value : '499.98', isCurrActive : false } });
	page.clickSrcResultBalance();
	addResult('Click on source result balance result', page.checkState(state));

	setParam(state.values, { result_balance_row : { value : '499.9' }, src_res_balance_left : '499.90 ₽',
								dest_amount_left : '1.09 ₽', dest_amount_row : { value : '1.09' } });
	page.inputResBalance(state.values.result_balance_row.value);
	addResult('Result balance (499.9) input result', page.checkState(state));

	setParam(state.values, { result_balance_row : { value : '499.90' }, src_res_balance_left : '499.90 ₽' });
	page.inputResBalance(state.values.result_balance_row.value);
	addResult('Result balance (499.90) input result', page.checkState(state));

	setParam(state.values, { result_balance_row : { value : '499.901' }, src_res_balance_left : '499.90 ₽' });
	page.inputResBalance(state.values.result_balance_row.value);
	addResult('Result balance (499.901) input result', page.checkState(state));

	setParam(state.visibility, { dest_amount_left : false, src_res_balance_left : true, dest_amount_row : true, result_balance_row : false });
	page.clickDestAmount();
	addResult('Click on destination amount result', page.checkState(state));

	setParam(state.visibility, { exch_left : true, src_amount_row : true });
	setParam(state.values, { exch_left : '1 $/₽', src_amount_row : { value : '1.09', currSign : '₽' },
								dest_amount_left : '$ 1.09', dest_amount_row : { currSign : '$' } });
	page.changeDestCurrency(2);
	addResult('Change destination curency result', page.checkState(state));

	setParam(state.values, { exch_left : '0 $/₽' });
	page.inputSrcAmount('');
	addResult('Empty source amount input result', page.checkState(state));

	page.inputSrcAmount('.');
	addResult('Source amount (.) input result', page.checkState(state));

	page.inputSrcAmount('0.');
	addResult('Source amount (0.) input result', page.checkState(state));

	page.inputSrcAmount('.0');
	addResult('Source amount (.0) input result', page.checkState(state));

	setParam(state.values, { src_amount_row : { value : '.01' },
							result_balance_row : { value : '500.98' }, src_res_balance_left : '500.98 ₽', exch_left : '109 $/₽ (0.00917 ₽/$)' });
	page.inputSrcAmount(state.values.src_amount_row.value);
	addResult('Source amount (.01) input result', page.checkState(state));

	setParam(state.values, { src_amount_row : { value : '1.01' },
							result_balance_row : { value : '499.98' }, src_res_balance_left : '499.98 ₽', exch_left : '1.07921 $/₽ (0.9266 ₽/$)' });
	page.inputSrcAmount(state.values.src_amount_row.value);
	addResult('Source amount (1.01) input result', page.checkState(state));


	setParam(state.values, { src_amount_row : { value : '1.010' },
							result_balance_row : { value : '499.98' }, src_res_balance_left : '499.98 ₽', exch_left : '1.07921 $/₽ (0.9266 ₽/$)' });
	page.inputSrcAmount(state.values.src_amount_row.value);
	addResult('Source amount (1.010) input result', page.checkState(state));
}


function addResult(descr, res)
{
	totalRes.innerHTML = ++results.total;
	okRes.innerHTML = (res) ? ++results.ok : results.ok;
	failRes.innerHTML = (res) ? results.fail : ++results.fail;

	restbl.appendChild(ce('tr', {}, [ ce('td', { innerHTML : descr }),
										ce('td', { innerHTML : (res ? 'OK' : 'FAIL' ) }) ]));
}


function addBlock(descr, category)
{
	restbl.appendChild(ce('tr', { className : 'res-block-' + category }, ce('td', { colSpan : 2, innerHTML : descr }) ));
}
