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

	continueWith(startTests);
	viewframe.src = 'http://jezve.net/money/';
}


function startTests()
{
// Check user and logout if needed
	if (isUserLoggedIn())
		logoutUser();
	else
		loginAsTester();
}


function logoutUser()
{
	clickEmul(header.user.menuBtn);

	setTimeout(function()
	{
		continueWith(loginAsTester);
		clickEmul(header.user.menuItems[1].elem);
	}, 300);
}


function loginAsTester()
{
	var login, password;

	login = vge('login');
	password = vge('password');

	login.value = 'test';
	password.value = 'test';

	continueWith(goToProfilePage.bind(null, resetAll));

	var el = password.parentNode.nextElementSibling.firstElementChild;

	clickEmul(el);
}


function goToProfilePage(callback)
{
	if (!isUserLoggedIn())
		throw 'User is not logged in';

	clickEmul(header.user.menuBtn);

	setTimeout(function()
	{
		continueWith(callback);
		clickEmul(header.user.menuItems[0].elem);
	}, 300);
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

	continueWith(goToMainPage.bind(null, goToAccountsAndCreateNew));

	clickEmul(elem);
}


function goToMainPage(callback)
{
	continueWith(function()
	{
		mainPageWidgets = parseMainPageWidgets();
		callback();
	});
	clickEmul(header.logo.linkElem);
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


function goToAccountsAndCreateNew()
{
	var elem;

	elem = vquery('.content_wrap .widget .widget_title > a');
	if (!elem)
		throw 'Link to accounts page not found';

	continueWith(goToCreateAccount);

	clickEmul(elem);
}


function goToCreateAccount()
{
	continueWith(createAccount1);
	clickEmul(vquery('#add_btn > a'));
}


function createAccount1()
{
	var page = AccountPage.parse();

	addResult('New account page loaded', true);

	addResult('Initial account name on tile', (page.tile.name == 'New account'));
	addResult('Initial account balance on tile', (page.tile.balance == '0 ₽'));

	addResult('Initial balance input value', (page.balance.value == '0'))

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

	continueWith(checkCreateAccount1);
	clickEmul(page.submitBtn);
}


function checkCreateAccount1()
{
	accTiles = parseTiles(vquery('.tiles'));

	var submitRes = (accTiles && accTiles.length == 1 &&
						accTiles[0].balance == '1 000.01 ₽' &&
						accTiles[0].name == 'acc_1')

	addResult('First account create result', submitRes);

	continueWith(createAccount2);
	clickEmul(vquery('#add_btn > a'));
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

	continueWith(checkCreateAccount2);
	clickEmul(page.submitBtn);
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

	continueWith(editAccount1);
	clickEmul(vquery('#edit_btn > a'));
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
	continueWith(checkEditAccount1);
	clickEmul(page.submitBtn);
}


function checkEditAccount1()
{
	accTiles = parseTiles(vquery('.tiles'));

	var submitRes = (accTiles && accTiles.length == 2 &&
						accTiles[0].balance == '$ 1 000.01' &&
						accTiles[0].name == 'acc_1' &&
						hasClass(accTiles[0].elem, ['tile_icon', 'purse_icon']))

	addResult('First account update result', submitRes);

	continueWith(createAccountWithParam.bind(null, { name : 'acc_3', curr_id : 1, balance : '500.99', icon : 2 }, checkCreateAccount3));
	clickEmul(vquery('#add_btn > a'));
}


function createAccountWithParam(params, callback)
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
	if (!isFunction(callback))
		throw 'Callback not specified';


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

	continueWith(callback);
	clickEmul(page.submitBtn);
}


function checkCreateAccount3()
{
	accTiles = parseTiles(vquery('.tiles'));

	var submitRes = (accTiles && accTiles.length == 3 &&
						accTiles[2].balance == '500.99 ₽' &&
						accTiles[2].name == 'acc_3' &&
						hasClass(accTiles[2].elem, ['tile_icon', 'safe_icon']))

	addResult('Third account create result', submitRes);

	deleteFirstAndSecondAccounts();
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

	continueWith(checkDeleteAccounts);
	clickEmul(okBtn);
}


function checkDeleteAccounts()
{
	accTiles = parseTiles(vquery('.tiles'));

	addResult('Accounts delete result', (accTiles && accTiles.length == 1));

	continueWith(createAccountWithParam.bind(null, { name : 'acc_1', curr_id : 1, balance : '500.99', icon : 2 }, checkCreateAccount1_2));
	clickEmul(vquery('#add_btn > a'));
}


function checkCreateAccount1_2()
{
	continueWith(createAccountWithParam.bind(null, { name : 'acc_3', curr_id : 1, balance : '10000.99', icon : 3 },
					function()
					{
						continueWith(goToPersonsAndCreateNew);
						clickEmul(vquery('.page .header .logo > a'));
					}));
	clickEmul(vquery('#add_btn > a'));
}


function goToPersonsAndCreateNew()
{
	var widgets = vqueryall('.content_wrap .widget');

	if (!widgets || widgets.length != 5)
		throw 'Fail to parse main page widgets';

	var personsWidget = widgets[3];

	continueWith(goToCreatePerson1);
	clickEmul(personsWidget.firstElementChild.firstElementChild);
}


function goToCreatePerson1()
{
	var add_btn = vge('add_btn');
	if (!add_btn)
		throw 'New person button not found';

	personTiles = parseTiles(vquery('.tiles'));

	addResult('Initial persons structure', (personTiles && personTiles.length == 0));

	continueWith(createPerson1);
	clickEmul(add_btn.firstElementChild);
}


// From persons list page go to new person page, input name and submit
// Next check name result and callback
function createPersonAndCheck(personName, callback)
{
	var initLength = personTiles.length;
	var pname = vge('pname');

	addResult('Person name input found', pname);

	inputEmul(pname, personName);

	var ok_btn = vquery('.ok_btn');
	addResult('Submit person button found', ok_btn);

	continueWith(function()
	{
		personTiles = parseTiles(vquery('.tiles'));

		addResult('Person create result', (personTiles && personTiles.length == initLength + 1 &&
											personTiles[initLength] &&
											personTiles[initLength].name == personName));

		if (isFunction(callback))
			callback();
	});
	clickEmul(ok_btn);
}


function createPerson1()
{
	createPersonAndCheck('Alex', function()
	{
		continueWith(createPerson2);
		clickEmul(vquery('#add_btn > a'));
	});
}


function createPerson2()
{
	createPersonAndCheck('Maria', function()
	{
		continueWith(createPerson3);
		clickEmul(vquery('#add_btn > a'));
	});
}


function createPerson3()
{
	createPersonAndCheck('Johnny', function()
	{
		continueWith(createPerson4);
		clickEmul(vquery('#add_btn > a'));
	});
}


function createPerson4()
{
	createPersonAndCheck('Иван', updatePerson3);
}


function updatePersonAndCheck(num, personName, callback)
{
	var initLength = personTiles.length;

	if (num < 0 || num >= personTiles.length)
		throw 'Wrong person number';

	clickEmul(personTiles[num].elem.firstElementChild);

	var edit_btn = vge('edit_btn');
	var del_btn = vge('del_btn')

	addResult('Edit button visibility on select one person', isVisible(edit_btn));
	addResult('Delete button visibility on select one person', isVisible(del_btn));

	continueWith(function()
	{
		var pname = vge('pname');

		addResult('Person name input found', pname);

		inputEmul(pname, personName);

		var ok_btn = vquery('.ok_btn');
		addResult('Submit person button found', ok_btn);

		continueWith(function()
		{
			personTiles = parseTiles(vquery('.tiles'));

			addResult('Person update result', (personTiles && personTiles.length == initLength &&
												personTiles[num] &&
												personTiles[num].name == personName));

			if (isFunction(callback))
				callback();
		});
		clickEmul(ok_btn);
	});
	clickEmul(edit_btn.firstElementChild);
}


function updatePerson3()
{
	updatePersonAndCheck(3, 'Ivan<', deletePersons1and3);
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

	continueWith(function()
	{
		personTiles = parseTiles(vquery('.tiles'));

		addResult('Accounts delete result', (personTiles && personTiles.length == 2));

		goToMainPage(goToNewTransactionByAccount.bind(null, 1, expenseTransactionStart));
	});
	clickEmul(okBtn);
}


function goToNewTransactionByAccount(accNum, callback)
{
	if (!mainPageWidgets || !mainPageWidgets[0])
		throw 'Wrong state of main page';

	var accWidget = mainPageWidgets[0];
	if (accWidget.title != 'Accounts')
		throw 'Wrong state of accounts widget';

	 if (!accWidget.tiles || accWidget.tiles.length <= accNum)
		throw 'Tile ' + accNum + ' not found';

	var tile = accWidget.tiles[accNum];

	continueWith(callback);
	clickEmul(tile.linkElem);
}


function getTransactionType(str)
{
	var strToType = { 'EXPENSE' : EXPENSE, 'INCOME' : INCOME, 'TRANSFER' : TRANSFER, 'DEBT' : DEBT };

	if (!str)
		return null;

	var key = str.toUpperCase();
	return (strToType[key] !== undefined) ? strToType[key] : null;
}


function parseTileRightItem(elem)
{
	if (!elem || !elem.firstElementChild || !elem.firstElementChild.nextElementSibling || !elem.firstElementChild.nextElementSibling.firstElementChild)
		return null;

	var res = { elem : elem };
	res.titleElem = elem.firstElementChild;
	res.title = res.titleElem.innerHTML;
	res.buttonElem = res.titleElem.nextElementSibling.firstElementChild;
	res.buttonValue = res.buttonElem.firstElementChild.innerHTML;

	return res;
}


function parseTileBlock(elem)
{
	if (!elem || !elem.firstElementChild || !elem.firstElementChild.firstElementChild || !elem.firstElementChild.nextElementSibling)
		return null;

	var res = { elem : elem };

	res.label = elem.firstElementChild.firstElementChild.innerHTML;
	res.tile = parseTile(elem.querySelector('.tile'));

	return res;
}


function parseTransactionPage()
{
	var res = {};

	var menuItems = vqueryall('#trtype_menu > span');
	res.typeMenu = [];
	for(var i = 0; i < menuItems.length; i++)
	{
		var menuItem = menuItems[i].firstElementChild;

		res.type = getTransactionType(menuItem.innerHTML);

		var menuItemObj = { text : menuItem.innerHTML, type : getTransactionType(menuItem.innerHTML) };

		if (menuItem.tagName == 'B')
		{
			res.activeType = menuItemObj.type;
			menuItemObj.isActive = true;
		}
		else if (menuItem.tagName == 'A')
		{
			menuItemObj.link = menuItem.href;
			menuItemObj.isActive = false;
		}
		res.typeMenu.push(menuItemObj);
	}

	res.source = parseTileBlock(vge('source'));
	res.destination = parseTileBlock(vge('destination'));

	res.src_amount_left = parseTileRightItem(vge('src_amount_left'));
	res.dest_amount_left = parseTileRightItem(vge('dest_amount_left'));
	res.src_res_balance_left = parseTileRightItem(vge('src_res_balance_left'));
	res.dest_res_balance_left = parseTileRightItem(vge('dest_res_balance_left'));
	res.exch_left = parseTileRightItem(vge('exch_left'));

	res.src_amount_row = parseInputRow(vge('src_amount_row'));
	res.dest_amount_row = parseInputRow(vge('dest_amount_row'));
	res.exchanget_row = parseInputRow(vge('exchange'));
	res.result_balance_row = parseInputRow(vge('result_balance'));
	res.result_balance_dest_row = parseInputRow(vge('result_balance_dest'));

	return res;
}


function expenseTransactionStart()
{
	var trPage = parseTransactionPage();

	addResult('Parse expense transaction result', trPage != null);

	addResult('Source tile block is visible', trPage.source && isVisible(trPage.source.elem));
	addResult('Source tile account name', trPage.source.tile && trPage.source.tile.name == 'acc_1');
	addResult('Source tile account balance', trPage.source.tile && trPage.source.tile.balance == '500.99 ₽');

	addResult('Destination tile block is invisible', (!trPage.destination || !isVisible(trPage.destination.elem)));

	addResult('Right to the tile source result balance block is visible',
				(trPage.src_res_balance_left && trPage.src_res_balance_left.elem && isVisible(trPage.src_res_balance_left.elem)));
	addResult('Right to the tile source result balance value', (trPage.src_res_balance_left && trPage.src_res_balance_left.buttonValue == '500.99 ₽'));


	addResult('Source amount input is invisible', (trPage.src_amount_row && trPage.src_amount_row.elem && !isVisible(trPage.src_amount_row.elem)));
	addResult('Destination amount input is visible', (trPage.dest_amount_row && trPage.dest_amount_row.elem && isVisible(trPage.dest_amount_row.elem)));
	addResult('Destination amount currency select is active', (trPage.dest_amount_row && trPage.dest_amount_row.isCurrActive));
	addResult('Destination amount currency sign', (trPage.dest_amount_row && trPage.dest_amount_row.currSign == '₽'));

	addResult('Exchange rate input is invisible', (trPage.exchanget_row && trPage.exchanget_row.elem && !isVisible(trPage.exchanget_row.elem)));
	addResult('Source result balance input is invisible', (trPage.result_balance_row && trPage.result_balance_row.elem && !isVisible(trPage.result_balance_row.elem)));
	addResult('Destination result balance input is invisible', (!trPage.result_balance_dest_row || !isVisible(trPage.result_balance_dest_row.elem)));

	inputEmul(trPage.dest_amount_row.valueInput, '1');
	trPage = parseTransactionPage();

	addResult('Destination amount (1) input result', (trPage.dest_amount_row.value == '1'));
	addResult('Result balance value update result', (trPage.src_res_balance_left && trPage.src_res_balance_left.buttonValue == '499.99 ₽'));
	addResult('Source tile balance not changed', trPage.source.tile && trPage.source.tile.balance == '500.99 ₽');

	inputEmul(trPage.dest_amount_row.valueInput, '1.');
	trPage = parseTransactionPage();

	addResult('Destination amount (1.) input result', (trPage.dest_amount_row.value == '1.'));
	addResult('Result balance value update result', (trPage.src_res_balance_left && trPage.src_res_balance_left.buttonValue == '499.99 ₽'));
	addResult('Source tile balance not changed', trPage.source.tile && trPage.source.tile.balance == '500.99 ₽');

	inputEmul(trPage.dest_amount_row.valueInput, '1.0');
	trPage = parseTransactionPage();

	addResult('Destination amount (1.0) input result', (trPage.dest_amount_row.value == '1.0'));
	addResult('Result balance value update result', (trPage.src_res_balance_left && trPage.src_res_balance_left.buttonValue == '499.99 ₽'));
	addResult('Source tile balance not changed', trPage.source.tile && trPage.source.tile.balance == '500.99 ₽');

	inputEmul(trPage.dest_amount_row.valueInput, '1.01');
	trPage = parseTransactionPage();

	addResult('Destination amount (1.01) input result', (trPage.dest_amount_row.value == '1.01'));
	addResult('Result balance value update result', (trPage.src_res_balance_left && trPage.src_res_balance_left.buttonValue == '499.98 ₽'));
	addResult('Source tile balance not changed', trPage.source.tile && trPage.source.tile.balance == '500.99 ₽');

	inputEmul(trPage.dest_amount_row.valueInput, '1.010');
	trPage = parseTransactionPage();

	addResult('Destination amount (1.010) input result', (trPage.dest_amount_row.value == '1.010'));
	addResult('Result balance value update result', (trPage.src_res_balance_left && trPage.src_res_balance_left.buttonValue == '499.98 ₽'));
	addResult('Source tile balance not changed', trPage.source.tile && trPage.source.tile.balance == '500.99 ₽');

	inputEmul(trPage.dest_amount_row.valueInput, '1.0101');
	trPage = parseTransactionPage();

	addResult('Destination amount (1.0101) input result', (trPage.dest_amount_row.value == '1.0101'));
	addResult('Result balance value update result', (trPage.src_res_balance_left && trPage.src_res_balance_left.buttonValue == '499.98 ₽'));
	addResult('Source tile balance not changed', trPage.source.tile && trPage.source.tile.balance == '500.99 ₽');
}


function addResult(descr, res)
{
	restbl.appendChild(ce('tr', {}, [ ce('td', { innerHTML : descr }),
										ce('td', { innerHTML : (res ? 'OK' : 'FAIL' ) }) ]));
}


function addBlock(descr, res)
{
	restbl.appendChild(ce('tr', {}, ce('td', { innerHTML : descr }) ));
}
