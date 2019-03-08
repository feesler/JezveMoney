var restbl = null;
var totalRes = null, okRes = null, failRes = null;
var results = {};
var initPersonsLength;
var tileIconClass = [null, 'purse_icon', 'safe_icon', 'card_icon', 'percent_icon', 'bank_icon', 'cash_icon'];



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
			.then(deleteFirstAndSecondAccounts)
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
			.then(page => updatePerson(page, 3, 'Ivan<'))
			.then(deletePersons1and3);
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
	if (page.isUserLoggedIn())
		return page.logoutUser().then(loginAsTester)
	else
		return loginAsTester(page);
}


function loginAsTester(page)
{
	var login, password;

	login = vge('login');
	password = vge('password');

	login.value = 'test';
	password.value = 'test';

	var el = password.parentNode.nextElementSibling.firstElementChild;
	return navigation(function()
	{
		clickEmul(el)
	}, MainPage);
}


function createAccount1(page)
{
	addResult('New account page loaded', true);

	addResult('Initial account name on tile', (page.content.tile.name == 'New account'));
	addResult('Initial account balance on tile', (page.content.tile.balance == '0 ₽'));

	addResult('Initial balance input value', (page.content.balance.value == '0'));

	page.inputName('acc_1');

	addResult('Account tile name update', (page.content.tile.name == 'acc_1'));
	addResult('Account name value input correct', (page.content.name == 'acc_1'));

// Change currency
	page.changeCurrency(2);		// select USD currency

	addResult('Currency drop down value select', (page.content.currDropDown.textValue == 'USD'));
	addResult('Tile balance format update result', (page.content.tile.balance == '$ 0'));

	page.inputBalance('100000.01');

	addResult('Account tile balance on USD 100 000.01 balance input field', (page.content.tile.balance == '$ 100 000.01'));

// Change currency back
	page.changeCurrency(1);		// select RUB currency

	addResult('Currency drop down value select back', (page.content.currDropDown.textValue == 'RUB'));
	addResult('Tile balance format after change currency back update result', (page.content.tile.balance == '100 000.01 ₽'));

// Input empty value for initial balance
	page.inputBalance('');
	addResult('Account tile balance on empty input field', (page.content.tile.balance == '0 ₽'));

	page.inputBalance('.');
	addResult('Account tile balance on dot(.) input field', (page.content.tile.balance == '0 ₽'));

	page.inputBalance('.01');
	addResult('Account tile balance on RUB .01 balance input field', (page.content.tile.balance == '0.01 ₽'));

	page.inputBalance('10000000.01');
	addResult('Account tile balance on RUB 10 000 000.01 balance input field', (page.content.tile.balance == '10 000 000.01 ₽'));

// Change icon
	page.changeIcon(2);	// select safe icon

	addResult('Icon drop down value select', (page.content.iconDropDown.textValue == 'Safe'));
	addResult('Tile icon update result', (hasClass(vge('acc_tile'), 'safe_icon')));

	page.inputBalance('1000.01');
	addResult('Account tile balance on RUB 1 000.01 balance input field', (page.content.tile.balance == '1 000.01 ₽'));

	return navigation(() => clickEmul(page.content.submitBtn), AccountsPage);
}


function checkCreateAccount1(page)
{
	var accTiles = page.parseTiles(vquery('.tiles'));

	var submitRes = (accTiles && accTiles.length == 1 &&
						accTiles[0].balance == '1 000.01 ₽' &&
						accTiles[0].name == 'acc_1')

	addResult('First account create result', submitRes);

	return Promise.resolve(page);
}


function createAccount2(page)
{
// Input account name
	page.inputName('acc_2');
	addResult('Account tile name update', (page.content.tile.name == 'acc_2'));

// Change currency
	page.changeCurrency(3);		// select EUR currency

	addResult('EUR currency select result', (page.content.currDropDown.textValue == 'EUR'));
	addResult('Tile balance format update result', (page.content.tile.balance == '€ 0'));

	page.inputBalance('1000.01')
	addResult('Account tile balance on EUR 1 000.01 balance input field', (page.content.tile.balance == '€ 1 000.01'));

	return navigation(() => clickEmul(page.content.submitBtn), AccountsPage);
}


function checkCreateAccount2(page)
{
	var submitRes = (page.content.tiles && page.content.tiles.length == 2 &&
		 				page.content.tiles[1].balance == '€ 1 000.01' &&
						page.content.tiles[1].name == 'acc_2')

	addResult('Second account create result', submitRes);

	return Promise.resolve(page);
}


function editAccount1(page)
{
	addResult('Edit account page loaded', 'OK');

	addResult('Edit account name on tile', (page.content.tile.name == 'acc_1'));
	addResult('Edit account balance on tile', (page.content.tile.balance == '1 000.01 ₽'));


// Change currency
	page.changeCurrency(2);		// select USD currency
	var fmtBal = formatCurrency(1000.01, 2);
	addResult('USD currency select result', (page.content.currDropDown.textValue == 'USD'));
	addResult('Tile balance format update result', (page.content.tile.balance == fmtBal));

// Change icon
	page.changeIcon(1);			// select purse icon
	addResult('Icon drop down value select', (page.content.iconDropDown.textValue == 'Purse'));
	addResult('Tile icon update result', hasClass(page.content.tile.elem, 'purse_icon'));

// Submit
	return navigation(() => clickEmul(page.content.submitBtn), AccountsPage);
}


function checkEditAccount1(page)
{
	var accTiles = page.parseTiles(vquery('.tiles'));

	var submitRes = (accTiles && accTiles.length == 2 &&
						accTiles[0].balance == '$ 1 000.01' &&
						accTiles[0].name == 'acc_1' &&
						hasClass(accTiles[0].elem, ['tile_icon', 'purse_icon']))

	addResult('First account update result', submitRes);

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

// Input account name
	page.inputName(params.name);
	addResult('Account tile name update', (page.content.name == params.name));

// Change currency
	page.changeCurrency(currObj.id);

	addResult(currObj.name + ' currency select result', (page.content.currDropDown.textValue == currObj.name));
	var fmtBal = formatCurrency(0, currObj.id);
	addResult('Tile balance format update result', (page.content.tile.balance == fmtBal));

// Input balance
	page.inputBalance(params.balance);

	fmtBal = formatCurrency(normBalance, currObj.id);
	addResult('Tile balance format update result', (page.content.tile.balance == fmtBal));

// Change icon
	if (params.icon)
	{
		if (params.icon < 0 || params.icon > icons.length)
			throw 'Icon not found';

		page.changeIcon(params.icon);

		addResult('Icon drop down value select', (page.content.iconDropDown.textValue == icons[params.icon]));
		var iconClass = tileIconClass[params.icon];
		addResult('Tile icon update result', (hasClass(vge('acc_tile'), iconClass)));
	}

	return navigation(() => clickEmul(page.content.submitBtn), AccountsPage);
}


function checkCreateAccount3(page)
{
	var submitRes = (page.content.tiles && page.content.tiles.length == 3 &&
						page.content.tiles[2].balance == '500.99 ₽' &&
						page.content.tiles[2].name == 'acc_3' &&
						hasClass(page.content.tiles[2].elem, ['tile_icon', 'safe_icon']))

	addResult('Third account create result', submitRes);

 	return Promise.resolve(page);
}


function deleteFirstAndSecondAccounts(page)
{
	clickEmul(page.content.tiles[0].elem.firstElementChild);

	addResult('Edit button visibility on select one account', isVisible(page.content.toolbar.editBtnElem));
	addResult('Delete button visibility on select one account', isVisible(page.content.toolbar.delBtnElem));

	clickEmul(page.content.tiles[2].elem.firstElementChild);
	page.parse();

	addResult('Edit button visibility on select two accounts', !isVisible(page.content.toolbar.editBtnElem));
	addResult('Delete button visibility on select two accounts', isVisible(page.content.toolbar.delBtnElem));

	clickEmul(page.content.delBtn);
	page.parse();

	addResult('Delete account warning popup appear', isVisible(page.content.delete_warning.elem));

	if (!page.content.delete_warning.okBtn)
		throw 'OK button not found';

	return navigation(() => clickEmul(page.content.delete_warning.okBtn), AccountsPage);
}


function checkDeleteAccounts(page)
{
	addResult('Accounts delete result', (page.content.tiles && page.content.tiles.length == 1));

	return Promise.resolve(page);
}


function checkInitialPersons(page)
{
	var personTiles = page.parseTiles(vquery('.tiles'));

	addResult('Initial persons structure', (personTiles && personTiles.length == 0));

	initPersonsLength = personTiles.length;

	return Promise.resolve(page);
}


// From persons list page go to new person page, input name and submit
// Next check name result and callback
function checkCreatePerson(page, personName)
{
	addResult('Person create result', (page.content.tiles && page.content.tiles.length == (initPersonsLength + 1) &&
										page.content.tiles[initPersonsLength] &&
										page.content.tiles[initPersonsLength].name == personName));

	initPersonsLength = page.content.tiles.length;

	return Promise.resolve(page);
}


function updatePerson(page, num, personName)
{
	addResult('Person name input found', page.content.nameInp);

	page.inputName(personName);

	addResult('Submit person button found', page.content.submitBtn);

	return navigation(function()
	{
		clickEmul(page.content.submitBtn);
	}, PersonsPage)
	.then(function(page)
	{
		addResult('Person update result', (page.content.tiles && page.content.tiles.length == initPersonsLength &&
											page.content.tiles[num] &&
											page.content.tiles[num].name == personName));

		return Promise.resolve(page);
	});
}


function deletePersons1and3(page)
{
	var personTiles = page.parseTiles(vquery('.tiles'));

	if (personTiles.length != 4)
		throw 'Wrong person number';

	clickEmul(personTiles[0].elem.firstElementChild);

	var edit_btn = vge('edit_btn');
	var del_btn = vge('del_btn')

	addResult('Edit button visibility on select one person', isVisible(edit_btn));
	addResult('Delete button visibility on select one person', isVisible(del_btn));

	clickEmul(personTiles[2].elem.firstElementChild);

	addResult('Edit button visibility on select two persons', !isVisible(edit_btn));
	addResult('Delete button visibility on select two persons', isVisible(del_btn));

	clickEmul(del_btn.firstElementChild);

	var delete_warning = vge('delete_warning');
	if (!delete_warning)
		throw 'Delete warning not found';

	addResult('Delete persons warning popup appear', isVisible(delete_warning));

	var okBtn = delete_warning.querySelector('.ok_btn');
	if (!okBtn)
		throw 'OK button not found';

	return navigation(function()
	{
		clickEmul(okBtn);
	})
	.then(function(page)
	{
		var personTiles = page.parseTiles(vquery('.tiles'));

		addResult('Accounts delete result', (personTiles && personTiles.length == 2));

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
	setParam(state.values, { exch_left : '1 $/₽', src_amount_row : { currSign : '₽' }, dest_amount_left : '$ 1.09', dest_amount_row : { currSign : '$' } });
	page.changeDestCurrency(2);
	addResult('Change destination curency result', page.checkState(state));
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
