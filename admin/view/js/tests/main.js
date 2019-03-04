var restbl = null;
var header = null;
var mainPageWidgets = null;
var accTiles = [];
var personTiles = [];
var tileIconClass = [null, 'purse_icon', 'safe_icon', 'card_icon', 'percent_icon', 'bank_icon', 'cash_icon'];



function initTests()
{
	viewframe = ge('viewframe');

	if (!viewframe)
		throw 'View frame not found';

	restbl = ge('restbl');
	if (!restbl)
		throw 'Results table not found';

	var startbtn = ge('startbtn');
	if (!startbtn)
		throw 'Start button not found';
	startbtn.onclick = onStartClick;
}


function onStartClick()
{
	addResult('Test initialization', 'OK');

	navigation(function()
	{
		viewframe.src = 'http://jezve.net/money/';
	})
	.then(startTests);
}


function startTests()
{
	reloginAsTester()
	.then(goToProfilePage)
	.then(resetAll)

	.then(accountTests)
	.then(personTests)
	.then(transactionTests);
}


function setBlock(title, category)
{
	addBlock(title, category);

	return Promise.resolve();
}


function accountTests()
{
	return setBlock('Accounts', 1)
			.then(goToMainPage)
			.then(goToAccounts)
			.then(goToCreateAccount)
			.then(createAccount1)
			.then(checkCreateAccount1)
			.then(goToCreateAccount)
			.then(createAccount2)
			.then(checkCreateAccount2)
			.then(goToUpdateAccount.bind(null, 0))
			.then(editAccount1)
			.then(checkEditAccount1)
			.then(goToCreateAccount)
			.then(createAccountWithParam.bind(null, { name : 'acc_3', curr_id : 1, balance : '500.99', icon : 2 }))
			.then(checkCreateAccount3)
			.then(deleteFirstAndSecondAccounts)
			.then(checkDeleteAccounts)
			.then(goToCreateAccount)
			.then(createAccountWithParam.bind(null, { name : 'acc_1', curr_id : 1, balance : '500.99', icon : 2 }))
			.then(goToCreateAccount)
			.then(createAccountWithParam.bind(null, { name : 'acc_3', curr_id : 1, balance : '10000.99', icon : 3 }));
}


function personTests()
{
	return setBlock('Persons', 1)
			.then(goToMainPage)
			.then(goToPersons)
			.then(goToCreatePerson)
			.then(createPerson.bind(null, 'Alex'))
			.then(goToCreatePerson)
			.then(createPerson.bind(null, 'Maria'))
			.then(goToCreatePerson)
			.then(createPerson.bind(null, 'Johnny'))
			.then(goToCreatePerson)
			.then(createPerson.bind(null, 'Иван'))
			.then(goToUpdatePerson.bind(null, 3))
			.then(updatePerson.bind(null, 3, 'Ivan<'))
			.then(deletePersons1and3);
}


function transactionTests()
{
	return setBlock('Transactions', 1)
			.then(goToMainPage)
			.then(goToNewTransactionByAccount.bind(null, 1))
			.then(expenseTransactionStart);
}


function reloginAsTester()
{
	if (isUserLoggedIn())
		return logoutUser().then(loginAsTester)
	else
		return loginAsTester();
}



// Click on logout link from user menu and return navigation promise
function logoutUser()
{
	clickEmul(header.user.menuBtn);

	return navigation(function()
	{
		clickEmul(header.user.menuItems[1].elem);
	});
}


function loginAsTester()
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
	});
}


function goToProfilePage()
{
	if (!isUserLoggedIn())
		throw 'User is not logged in';

	clickEmul(header.user.menuBtn);		// open user menu

	return navigation(function()
	{
		clickEmul(header.user.menuItems[0].elem);
	});
}


function resetAll()
{
	var elem;

	elem = vge('resetall_form');
	if (!elem)
		throw 'Reset all button not found';

	elem = elem.nextElementSibling;
	elem = elem.querySelector('input');
	if (!elem)
		throw 'Reset all button not found';

	clickEmul(elem);

	elem = vquery('#reset_warning .btn.ok_btn');
	if (!elem)
		throw 'Confirm button not found';

	return navigation(function()
	{
		clickEmul(elem);
	});
}


function goToMainPage()
{
	return navigation(function()
	{
		clickEmul(header.logo.linkElem);
	})
	.then(function()
	{
		mainPageWidgets = parseMainPageWidgets();

		return Promise.resolve();
	});
}


function parseMainPageWidgets()
{
	var widgetsElem = vqueryall('.content_wrap .widget');
	if (!widgetsElem)
		throw 'Fail to parse main page widgets';

	var res = [];
	for(var i = 0; i < widgetsElem.length; i++)
	{
		var widget = { elem : widgetsElem[i],
						titleElem : widgetsElem[i].querySelector('.widget_title'),
						linkElem : widgetsElem[i].querySelector('.widget_title > a'),
						textElem : widgetsElem[i].querySelector('.widget_title span') };

		if (widget.linkElem)
			widget.link = widget.linkElem.href;
		if (widget.textElem)
			widget.title = widget.textElem.innerHTML;

		var tiles = parseTiles(widget.elem.querySelector('.tiles'));
		if (tiles)
			widget.tiles = tiles;
		tiles = parseInfoTiles(widget.elem.querySelector('.info_tiles'));
		if (tiles)
			widget.infoTiles = tiles;

		res.push(widget);
	}

	return res;
}


function goToAccounts()
{
	var elem;

	elem = vquery('.content_wrap .widget .widget_title > a');
	if (!elem)
		throw 'Link to accounts page not found';

	return navigation(function()
	{
		clickEmul(elem);
	});
}


function goToCreateAccount()
{
	return navigation(function()
	{
		clickEmul(vquery('#add_btn > a'));
	});
}


function createAccount1()
{
	var page = AccountPage.parse();

	addResult('New account page loaded', true);

	addResult('Initial account name on tile', (page.tile.name == 'New account'));
	addResult('Initial account balance on tile', (page.tile.balance == '0 ₽'));

	addResult('Initial balance input value', (page.balance.value == '0'));

	page = AccountPage.inputName('acc_1');

	addResult('Account tile name update', (page.tile.name == 'acc_1'));
	addResult('Account name value input correct', (page.name == 'acc_1'));

// Change currency
	page = AccountPage.changeCurrency(2);		// select USD currency

	addResult('Currency drop down value select', (page.currDropDown.textValue == 'USD'));
	addResult('Tile balance format update result', (page.tile.balance == '$ 0'));

	page = AccountPage.inputBalance('100000.01');

	addResult('Account tile balance on USD 100 000.01 balance input field', (page.tile.balance == '$ 100 000.01'));

// Change currency back
	page = AccountPage.changeCurrency(1);		// select RUB currency

	addResult('Currency drop down value select back', (page.currDropDown.textValue == 'RUB'));
	addResult('Tile balance format after change currency back update result', (page.tile.balance == '100 000.01 ₽'));

// Input empty value for initial balance
	page = AccountPage.inputBalance('');
	addResult('Account tile balance on empty input field', (page.tile.balance == '0 ₽'));

	page = AccountPage.inputBalance('.');
	addResult('Account tile balance on dot(.) input field', (page.tile.balance == '0 ₽'));

	page = AccountPage.inputBalance('.01');
	addResult('Account tile balance on RUB .01 balance input field', (page.tile.balance == '0.01 ₽'));

	page = AccountPage.inputBalance('10000000.01');
	addResult('Account tile balance on RUB 10 000 000.01 balance input field', (page.tile.balance == '10 000 000.01 ₽'));

// Change icon
	page = AccountPage.changeIcon(2);	// select safe icon

	addResult('Icon drop down value select', (page.iconDropDown.textValue == 'Safe'));
	addResult('Tile icon update result', (hasClass(vge('acc_tile'), 'safe_icon')));

	page = AccountPage.inputBalance('1000.01');
	addResult('Account tile balance on RUB 1 000.01 balance input field', (page.tile.balance == '1 000.01 ₽'));

	return navigation(function()
	{
		clickEmul(page.submitBtn);
	});
}


function checkCreateAccount1()
{
	accTiles = parseTiles(vquery('.tiles'));

	var submitRes = (accTiles && accTiles.length == 1 &&
						accTiles[0].balance == '1 000.01 ₽' &&
						accTiles[0].name == 'acc_1')

	addResult('First account create result', submitRes);

	return Promise.resolve();
}


function createAccount2()
{
	var page = AccountPage.parse();

// Input account name
	page = AccountPage.inputName('acc_2');
	addResult('Account tile name update', (page.tile.name == 'acc_2'));

// Change currency
	page = AccountPage.changeCurrency(3);		// select EUR currency

	addResult('EUR currency select result', (page.currDropDown.textValue == 'EUR'));
	addResult('Tile balance format update result', (page.tile.balance == '€ 0'));

	page = AccountPage.inputBalance('1000.01')
	addResult('Account tile balance on EUR 1 000.01 balance input field', (page.tile.balance == '€ 1 000.01'));

	return navigation(function()
	{
		clickEmul(page.submitBtn);
	});
}


function checkCreateAccount2()
{
	accTiles = parseTiles(vquery('.tiles'));

	var submitRes = (accTiles && accTiles.length == 2 &&
		 				accTiles[1].balance == '€ 1 000.01' &&
						accTiles[1].name == 'acc_2')

	addResult('Second account create result', submitRes);

	var accTileBtn = accTiles[0].elem.firstElementChild.firstElementChild;

	clickEmul(accTileBtn);

	return Promise.resolve()
}


function goToUpdateAccount(num)
{
	var accTileBtn = accTiles[num].elem.firstElementChild.firstElementChild;

	clickEmul(accTileBtn);

	return navigation(function()
	{
		clickEmul(vquery('#edit_btn > a'));
	});
}


function editAccount1()
{
	var page = AccountPage.parse();

	addResult('Edit account page loaded', 'OK');

	addResult('Edit account name on tile', (page.tile.name == 'acc_1'));
	addResult('Edit account balance on tile', (page.tile.balance == '1 000.01 ₽'));


// Change currency
	page = AccountPage.changeCurrency(2);		// select USD currency
	var fmtBal = formatCurrency(1000.01, 2);
	addResult('USD currency select result', (page.currDropDown.textValue == 'USD'));
	addResult('Tile balance format update result', (page.tile.balance == fmtBal));

// Change icon
	page = AccountPage.changeIcon(1);			// select purse icon
	addResult('Icon drop down value select', (page.iconDropDown.textValue == 'Purse'));
	addResult('Tile icon update result', hasClass(page.tile.elem, 'purse_icon'));

// Submit
	return navigation(function()
	{
		clickEmul(page.submitBtn);
	});
}


function checkEditAccount1()
{
	accTiles = parseTiles(vquery('.tiles'));

	var submitRes = (accTiles && accTiles.length == 2 &&
						accTiles[0].balance == '$ 1 000.01' &&
						accTiles[0].name == 'acc_1' &&
						hasClass(accTiles[0].elem, ['tile_icon', 'purse_icon']))

	addResult('First account update result', submitRes);

	return Promise.resolve();
}


function createAccountWithParam(params)
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


	var page = AccountPage.parse();

// Input account name
	page = AccountPage.inputName(params.name);
	addResult('Account tile name update', (page.name == params.name));

// Change currency
	page = AccountPage.changeCurrency(currObj.id);

	addResult(currObj.name + ' currency select result', (page.currDropDown.textValue == currObj.name));
	var fmtBal = formatCurrency(0, currObj.id);
	addResult('Tile balance format update result', (page.tile.balance == fmtBal));

// Input balance
	page = AccountPage.inputBalance(params.balance);

	fmtBal = formatCurrency(normBalance, currObj.id);
	addResult('Tile balance format update result', (page.tile.balance == fmtBal));

// Change icon
	if (params.icon)
	{
		if (params.icon < 0 || params.icon > icons.length)
			throw 'Icon not found';

		page = AccountPage.changeIcon(params.icon);

		addResult('Icon drop down value select', (page.iconDropDown.textValue == icons[params.icon]));
		var iconClass = tileIconClass[params.icon];
		addResult('Tile icon update result', (hasClass(vge('acc_tile'), iconClass)));
	}

	return navigation(function()
	{
		clickEmul(page.submitBtn);
	});
}


function checkCreateAccount3()
{
	accTiles = parseTiles(vquery('.tiles'));

	var submitRes = (accTiles && accTiles.length == 3 &&
						accTiles[2].balance == '500.99 ₽' &&
						accTiles[2].name == 'acc_3' &&
						hasClass(accTiles[2].elem, ['tile_icon', 'safe_icon']))

	addResult('Third account create result', submitRes);

 	return Promise.resolve();
}


function deleteFirstAndSecondAccounts()
{
	clickEmul(accTiles[0].elem.firstElementChild);

	var edit_btn = vge('edit_btn');
	var del_btn = vge('del_btn')

	addResult('Edit button visibility on select one account', isVisible(edit_btn));
	addResult('Delete button visibility on select one account', isVisible(del_btn));

	clickEmul(accTiles[2].elem.firstElementChild);

	addResult('Edit button visibility on select two accounts', !isVisible(edit_btn));
	addResult('Delete button visibility on select two accounts', isVisible(del_btn));

	clickEmul(del_btn.firstElementChild);

	var delete_warning = vge('delete_warning');
	addResult('Delete account warning popup appear', isVisible(delete_warning));

	var okBtn = delete_warning.querySelector('.ok_btn');
	if (!okBtn)
		throw 'OK button not found';

	return navigation(function()
	{
		clickEmul(okBtn);
	});
}


function checkDeleteAccounts()
{
	accTiles = parseTiles(vquery('.tiles'));

	addResult('Accounts delete result', (accTiles && accTiles.length == 1));

	return Promise.resolve();
}


function goToPersons()
{
	var widgets = vqueryall('.content_wrap .widget');

	if (!widgets || widgets.length != 5)
		throw 'Fail to parse main page widgets';

	var personsWidget = widgets[3];

	return navigation(function()
	{
		clickEmul(personsWidget.firstElementChild.firstElementChild);
	});
}


function goToCreatePerson()
{
	var add_btn = vge('add_btn');
	if (!add_btn)
		throw 'New person button not found';

	personTiles = parseTiles(vquery('.tiles'));

	addResult('Initial persons structure', (personTiles && personTiles.length == 0));

	return navigation(function()
	{
		clickEmul(add_btn.firstElementChild);
	});
}


// From persons list page go to new person page, input name and submit
// Next check name result and callback
function createPerson(personName)
{
	var initLength = personTiles.length;
	var pname = vge('pname');

	addResult('Person name input found', pname);

	inputEmul(pname, personName);

	var ok_btn = vquery('.ok_btn');
	addResult('Submit person button found', ok_btn);

	return navigation(function()
	{
		clickEmul(ok_btn);
	})
	.then(function()
	{
		personTiles = parseTiles(vquery('.tiles'));

		addResult('Person create result', (personTiles && personTiles.length == initLength + 1 &&
											personTiles[initLength] &&
											personTiles[initLength].name == personName));

		return Promise.resolve();
	});
}


function goToUpdatePerson(num)
{
	if (num < 0 || num >= personTiles.length)
		throw 'Wrong person number';

	clickEmul(personTiles[num].elem.firstElementChild);

	var edit_btn = vge('edit_btn');
	var del_btn = vge('del_btn')

	addResult('Edit button visibility on select one person', isVisible(edit_btn));
	addResult('Delete button visibility on select one person', isVisible(del_btn));

	return navigation(function()
	{
		clickEmul(edit_btn.firstElementChild);
	});
}


function updatePerson(num, personName)
{
	var initLength = personTiles.length;
	var pname = vge('pname');

	addResult('Person name input found', pname);

	inputEmul(pname, personName);

	var ok_btn = vquery('.ok_btn');
	addResult('Submit person button found', ok_btn);

	return navigation(function()
	{
		clickEmul(ok_btn);
	})
	.then(function()
	{
		personTiles = parseTiles(vquery('.tiles'));

		addResult('Person update result', (personTiles && personTiles.length == initLength &&
											personTiles[num] &&
											personTiles[num].name == personName));

		return Promise.resolve();
	});
}


function deletePersons1and3()
{
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
	.then(function()
	{
		personTiles = parseTiles(vquery('.tiles'));

		addResult('Accounts delete result', (personTiles && personTiles.length == 2));

		return Promise.resolve();
	});
}


function goToNewTransactionByAccount(accNum)
{
	if (!mainPageWidgets || !mainPageWidgets[0])
		throw 'Wrong state of main page';

	var accWidget = mainPageWidgets[0];
	if (accWidget.title != 'Accounts')
		throw 'Wrong state of accounts widget';

	 if (!accWidget.tiles || accWidget.tiles.length <= accNum)
		throw 'Tile ' + accNum + ' not found';

	var tile = accWidget.tiles[accNum];

	return navigation(function()
	{
		clickEmul(tile.linkElem);
	});
}


function expenseTransactionStart()
{
	addResult('Parse expense transaction result', TransactionPage.parse());

	var state = { visibility : { source : true, destination : false, src_amount_left : false, dest_amount_left : false,
								src_res_balance_left : true, dest_res_balance_left : false, exch_left : false,
								src_amount_row : false, dest_amount_row : true, exchange_row : false, result_balance_row : false,
								result_balance_dest_row : false },
				values : { source : { tile : { name : 'acc_1', balance : '500.99 ₽' } },
							dest_amount_row : { currSign : '₽', isCurrActive : true },
							src_res_balance_left : '500.99 ₽' } };

	addResult('Initial state', TransactionPage.checkState(state));

	setParam(state.values, { dest_amount_row : { value : '1' },
								src_res_balance_left : '499.99 ₽' });
	TransactionPage.inputDestAmount(state.values.dest_amount_row.value);
	addResult('Destination amount (1) input result', TransactionPage.checkState(state));

	state.values.dest_amount_row.value = '1.';
	TransactionPage.inputDestAmount(state.values.dest_amount_row.value);
	addResult('Destination amount (1.) input result', TransactionPage.checkState(state));

	state.values.dest_amount_row.value = '1.0';
	TransactionPage.inputDestAmount(state.values.dest_amount_row.value);
	addResult('Destination amount (1.0) input result', TransactionPage.checkState(state));

	setParam(state.values, { dest_amount_row : { value : '1.01' },
								src_res_balance_left : '499.98 ₽' });
	TransactionPage.inputDestAmount(state.values.dest_amount_row.value);
	addResult('Destination amount (1.01) input result', TransactionPage.checkState(state));

	state.values.dest_amount_row.value = '1.010';
	TransactionPage.inputDestAmount(state.values.dest_amount_row.value);
	addResult('Destination amount (1.010) input result', TransactionPage.checkState(state));

	state.values.dest_amount_row.value = '1.0101';
	TransactionPage.inputDestAmount(state.values.dest_amount_row.value);
	addResult('Destination amount (1.0101) input result', TransactionPage.checkState(state));

	setParam(state.visibility, { dest_amount_left : true, src_res_balance_left : false, dest_amount_row : false, result_balance_row : true });
	setParam(state.values, { dest_amount_left : '1.01 ₽',
							result_balance_row : { value : '499.98', isCurrActive : false } });
	TransactionPage.clickSrcResultBalance();
	addResult('Click on source result balance result', TransactionPage.checkState(state));

	setParam(state.values, { result_balance_row : { value : '499.9' }, src_res_balance_left : '499.90 ₽',
								dest_amount_left : '1.09 ₽', dest_amount_row : { value : '1.09' } });
	TransactionPage.inputResBalance(state.values.result_balance_row.value);
	addResult('Result balance (499.9) input result', TransactionPage.checkState(state));

	setParam(state.values, { result_balance_row : { value : '499.90' }, src_res_balance_left : '499.90 ₽' });
	TransactionPage.inputResBalance(state.values.result_balance_row.value);
	addResult('Result balance (499.90) input result', TransactionPage.checkState(state));

	setParam(state.values, { result_balance_row : { value : '499.901' }, src_res_balance_left : '499.90 ₽' });
	TransactionPage.inputResBalance(state.values.result_balance_row.value);
	addResult('Result balance (499.901) input result', TransactionPage.checkState(state));

	setParam(state.visibility, { dest_amount_left : false, src_res_balance_left : true, dest_amount_row : true, result_balance_row : false });
	TransactionPage.clickDestAmount();
	addResult('Click on destination amount result', TransactionPage.checkState(state));

	setParam(state.visibility, { exch_left : true, src_amount_row : true });
	setParam(state.values, { exch_left : '1 $/₽', src_amount_row : { currSign : '₽' }, dest_amount_left : '$ 1.09', dest_amount_row : { currSign : '$' } });
	TransactionPage.changeDestCurrency(2);
	addResult('Change destination curency result', TransactionPage.checkState(state));
}


function addResult(descr, res)
{
	restbl.appendChild(ce('tr', {}, [ ce('td', { innerHTML : descr }),
										ce('td', { innerHTML : (res ? 'OK' : 'FAIL' ) }) ]));
}


function addBlock(descr, category)
{
	restbl.appendChild(ce('tr', { className : 'res-block-' + category }, ce('td', { colSpan : 2, innerHTML : descr }) ));
}
