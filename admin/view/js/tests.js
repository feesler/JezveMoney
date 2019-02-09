var viewframe = null;
var vdoc = null;
var restbl = null;
var firstAccount_id = null;
var secondAccount_id = null;
var thirdAccount_id = null;
var tileIconClass = [null, 'purse_icon', 'safe_icon', 'card_icon', 'percent_icon', 'bank_icon', 'cash_icon'];


function vge(a)
{
	return (typeof a == 'string') ? vdoc.getElementById(a) : a;
}


function vquery(a)
{
	return (typeof a == 'string') ? vdoc.querySelector(a) : a;
}


function vqueryall(a)
{
	return (typeof a == 'string') ? vdoc.querySelectorAll(a) : a;
}


function clickEmul(elemObj)
{
	if (elemObj.click)
	{
		elemObj.click()
	}
	else if (document.createEvent)
	{
		var evt = document.createEvent("MouseEvents");
		evt.initMouseEvent("click", true, true, viewframe.contentWindow,
		0, 0, 0, 0, 0, false, false, false, false, 0, null);
		var allowDefault = elemObj.dispatchEvent(evt);
	}
}


function continueWith(callback)
{
	viewframe.onload = function()
	{
		vdoc = viewframe.contentWindow.document;
		if (!vdoc)
			throw 'View document not found';

		callback();
	};
}


function initTests()
{
	viewframe = ge('viewframe');

	if (!viewframe)
		throw 'View frame not found';

	restbl = ge('restbl');
	if (!restbl)
		throw 'Results table not found';

	addResult('Test initialization', 'OK');

	viewframe.src = 'http://jezve.net/money/';


	continueWith(startTests);
}


function startTests()
{
// Check user and logout if needed
	if (isUserLoggedIn())
		logoutUser();
	else
		loginAsTester();
}


function isUserLoggedIn()
{
	var userbtn = vge('userbtn');

	return (userbtn != null);
}


function logoutUser()
{
	var userbtn = vge('userbtn');

	clickEmul(userbtn);

	setTimeout(function()
	{
		var menupopup = vge('menupopup');

		continueWith(loginAsTester);

		var el = menupopup.firstElementChild.lastElementChild.firstElementChild;
		clickEmul(el);
	}, 300);
}


function loginAsTester()
{
	var login, password;

	login = vge('login');
	password = vge('password');

	login.value = 'test';
	password.value = 'test';

	continueWith(goToProfileAndReset);

	var el = password.parentNode.nextElementSibling.firstElementChild;

	clickEmul(el);
}


function goToProfileAndReset()
{
	var userbtn = vge('userbtn');

	clickEmul(userbtn);

	setTimeout(function()
	{
		var menupopup = vge('menupopup');

		continueWith(resetAll);

		var el = menupopup.firstElementChild.firstElementChild.firstElementChild;
		clickEmul(el);
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

	continueWith(goToMainPage);

	clickEmul(elem);
}


function goToMainPage()
{
	var elem;

	elem = vquery('.page .header .logo > a');
	if (!elem)
		throw 'Link to main page not found';

	continueWith(goToAccountsAndCreateNew);

	clickEmul(elem);
}


function parseTiles(tilesEl)
{
	var res = [];

	if (!tilesEl)
		return res;

	for(var i = 0; i < tilesEl.childNodes.length; i++)
	{
		var tileObj = {};
		var tileEl = tilesEl.childNodes[i];

		tileObj.elem = tileEl;
		tileObj.id = parseInt(tileEl.id.substr(4));
		if (!tileEl.firstElementChild || !tileEl.firstElementChild.firstElementChild || !tileEl.firstElementChild.firstElementChild.firstElementChild)
			throw 'Wrong tile structure';
		tileObj.balanceEL = tileEl.firstElementChild.firstElementChild.firstElementChild;
		tileObj.balance = tileObj.balanceEL.innerHTML;
		if (!tileObj.balanceEL.nextElementSibling)
			throw 'Wrong tile structure';
		tileObj.nameEL = tileObj.balanceEL.nextElementSibling;
		tileObj.name = tileObj.nameEL.innerHTML;

		res.push(tileObj);
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
	var elem;

	elem = vquery('#add_btn > a');
	if (!elem)
		throw 'Link to new account page not found';

	continueWith(createAccount1);

	clickEmul(elem);
}


function createAccount1()
{
	var accname = vge('accname');
	var balance = vge('balance');
	var tileBal = vquery('#acc_tile .acc_bal');
	var tileName = vquery('#acc_tile .acc_name');

	if (!accname)
		throw 'Account name field not found';
	if (!balance)
		throw 'Initial balance field not found';
	if (!tileBal)
		throw 'On-tile balance element not found';
	if (!tileName)
		throw 'On-tile name element not found';

	addResult('New account page loaded', 'OK');

	addResult('Initial account name on tile', (tileName.innerHTML == 'New account') ? 'OK' : 'FAIL');
	addResult('Initial account balance on tile', (tileBal.innerHTML == '0 ₽') ? 'OK' : 'FAIL');

	accname.value = 'acc_1';
	accname.oninput();
	addResult('Account tile name update', (accname.value == 'acc_1') ? 'OK' : 'FAIL');

// Change currency
	var currElem = vge('currency');
	var ddCurrInpCont = currElem.previousElementSibling;

	clickEmul(ddCurrInpCont.previousElementSibling);
	var ddCurrText = ddCurrInpCont.querySelector('.statsel');
	clickEmul(vge('ddlist2_2'));	// select USD currency

	addResult('Currency drop down value select', (ddCurrText.innerHTML == 'USD') ? 'OK' : 'FAIL');
	addResult('Tile balance format update result', (tileBal.innerHTML == '$ 0') ? 'OK' : 'FAIL');

	balance.value = '100000.01';
	balance.oninput();
	addResult('Account tile balance on USD 100 000.01 balance input field', (tileBal.innerHTML == '$ 100 000.01') ? 'OK' : 'FAIL');

// Change currency back
	clickEmul(ddCurrInpCont.previousElementSibling);
	var ddCurrText = ddCurrInpCont.querySelector('.statsel');
	clickEmul(vge('ddlist2_1'));	// select RUB currency

	addResult('Currency drop down value select back', (ddCurrText.innerHTML == 'RUB') ? 'OK' : 'FAIL');
	addResult('Tile balance format after change currency back update result', (tileBal.innerHTML == '100 000.01 ₽') ? 'OK' : 'FAIL');

	balance.value = '';
	balance.oninput();
	addResult('Account tile balance on empty input field', (tileBal.innerHTML == '0 ₽') ? 'OK' : 'FAIL');

	balance.value = '.';
	balance.oninput();
	addResult('Account tile balance on dot(.) input field', (tileBal.innerHTML == '0 ₽') ? 'OK' : 'FAIL');

	balance.value = '.01';
	balance.oninput();
	addResult('Account tile balance on RUB .01 balance input field', (tileBal.innerHTML == '0.01 ₽') ? 'OK' : 'FAIL');

	balance.value = '10000000.01';
	balance.oninput();
	addResult('Account tile balance on RUB 10 000 000.01 balance input field', (tileBal.innerHTML == '10 000 000.01 ₽') ? 'OK' : 'FAIL');

// Change icon
	var iconElem = vge('icon');
	var ddIconInpCont = iconElem.previousElementSibling;

	clickEmul(ddIconInpCont.previousElementSibling);
	var ddIconText = ddIconInpCont.querySelector('.statsel');
	clickEmul(vge('ddlist1_2'));	// select safe icon

	addResult('Icon drop down value select', (ddIconText.innerHTML == 'Safe') ? 'OK' : 'FAIL');
	addResult('Tile icon update result', (hasClass(vge('acc_tile'), 'safe_icon')) ? 'OK' : 'FAIL');

	balance.value = '1000.01';
	balance.oninput();
	addResult('Account tile balance on RUB 1 000.01 balance input field', (tileBal.innerHTML == '1 000.01 ₽') ? 'OK' : 'FAIL');

	var submitBtn = vquery('.acc_controls .ok_btn');
	continueWith(checkCreateAccount1);
	clickEmul(submitBtn);

}


function checkCreateAccount1()
{
	var tiles = vquery('.tiles');
	if (!tiles)
		throw 'Tiles not found';

	var tilesArr = parseTiles(tiles);

	var submitRes = (tilesArr && tilesArr.length == 1 &&
						tilesArr[0].balance == '1 000.01 ₽' &&
						tilesArr[0].name == 'acc_1')

	addResult('First account create result', (submitRes) ? 'OK' : 'FAIL');

	firstAccount_id = tilesArr[0].id;

	var addBtn = vquery('#add_btn > a');

	continueWith(createAccount2);
	clickEmul(addBtn);
}


function createAccount2()
{
	var accname = vge('accname');
	var balance = vge('balance');
	var tileBal = vquery('#acc_tile .acc_bal');
	var tileName = vquery('#acc_tile .acc_name');

	if (!accname)
		throw 'Account name field not found';
	if (!balance)
		throw 'Initial balance field not found';
	if (!tileBal)
		throw 'On-tile balance element not found';
	if (!tileName)
		throw 'On-tile name element not found';

// Input account name
	accname.value = 'acc_2';
	accname.oninput();
	addResult('Account tile name update', (accname.value == 'acc_2') ? 'OK' : 'FAIL');

// Change currency
	var currElem = vge('currency');
	var ddCurrInpCont = currElem.previousElementSibling;

	clickEmul(ddCurrInpCont.previousElementSibling);
	var ddCurrText = ddCurrInpCont.querySelector('.statsel');
	clickEmul(vge('ddlist2_3'));	// select EUR currency

	addResult('EUR currency select result', (ddCurrText.innerHTML == 'EUR') ? 'OK' : 'FAIL');
	addResult('Tile balance format update result', (tileBal.innerHTML == '€ 0') ? 'OK' : 'FAIL');

	balance.value = '1000.01';
	balance.oninput();
	addResult('Account tile balance on EUR 1 000.01 balance input field', (tileBal.innerHTML == '€ 1 000.01') ? 'OK' : 'FAIL');

	var submitBtn = vquery('.acc_controls .ok_btn');
	continueWith(checkCreateAccount2);
	clickEmul(submitBtn);
}


function checkCreateAccount2()
{
	var tiles = vquery('.tiles');
	if (!tiles)
		throw 'Tiles not found';

	var tilesArr = parseTiles(tiles);

	if (!tilesArr || tilesArr.length != 2)
		throw 'Tile not found';

	if (tilesArr[0].id == firstAccount_id)
		tile = tilesArr[1];
	else
		tile = tilesArr[0];

	secondAccount_id = tile.id;

	var submitRes = (tile.balance == '€ 1 000.01' &&
						tile.name == 'acc_2')

	addResult('Second account create result', (submitRes) ? 'OK' : 'FAIL');

	var accTileBtn = tiles.firstElementChild.firstElementChild;

	clickEmul(accTileBtn);

	var edit_btn = vge('edit_btn');

	continueWith(editAccount1);
	clickEmul(edit_btn.firstElementChild);
}



function editAccount1()
{
	var accname = vge('accname');
	var balance = vge('balance');
	var tileBal = vquery('#acc_tile .acc_bal');
	var tileName = vquery('#acc_tile .acc_name');
	var submitBtn = vquery('.acc_controls .ok_btn');

	if (!accname)
		throw 'Account name field not found';
	if (!balance)
		throw 'Initial balance field not found';
	if (!tileBal)
		throw 'On-tile balance element not found';
	if (!tileName)
		throw 'On-tile name element not found';
	if (!submitBtn)
		throw 'Submit button not found';

	addResult('Edit account page loaded', 'OK');

	addResult('Edit account name on tile', (tileName.innerHTML == 'acc_1') ? 'OK' : 'FAIL');
	addResult('Edit account balance on tile', (tileBal.innerHTML == '1 000.01 ₽') ? 'OK' : 'FAIL');


// Change currency
	var currElem = vge('currency');
	var ddCurrInpCont = currElem.previousElementSibling;

	clickEmul(ddCurrInpCont.previousElementSibling);
	var ddCurrText = ddCurrInpCont.querySelector('.statsel');
	clickEmul(vge('ddlist2_2'));	// select USD currency

	var fmtBal = formatCurrency(1000.01, 2);
	addResult('USD currency select result', (ddCurrText.innerHTML == 'USD') ? 'OK' : 'FAIL');
	addResult('Tile balance format update result', (tileBal.innerHTML == fmtBal) ? 'OK' : 'FAIL');

// Change icon
	var iconElem = vge('icon');
	var ddIconInpCont = iconElem.previousElementSibling;

	clickEmul(ddIconInpCont.previousElementSibling);
	var ddIconText = ddIconInpCont.querySelector('.statsel');
	clickEmul(vge('ddlist1_1'));	// select purse icon

	addResult('Icon drop down value select', (ddIconText.innerHTML == 'Purse') ? 'OK' : 'FAIL');
	addResult('Tile icon update result', (hasClass(vge('acc_tile'), 'purse_icon')) ? 'OK' : 'FAIL');

// Submit
	continueWith(checkEditAccount1);
	clickEmul(submitBtn);
}


function checkEditAccount1()
{
	var tiles = vquery('.tiles');
	if (!tiles)
		throw 'Tiles not found';

	var tilesArr = parseTiles(tiles);

	if (!tilesArr || tilesArr.length != 2)
		throw 'Tile not found';

	var firstTile, secondTile;
	if (tilesArr[0].id == firstAccount_id)
	{
		firstTile = tilesArr[0];
		secondTile = tilesArr[1];
	}
	else
	{
		firstTile = tilesArr[1];
		secondTile = tilesArr[0];
	}

	var submitRes = (firstTile.balance == '$ 1 000.01' &&
						firstTile.name == 'acc_1' &&
						hasClass(firstTile.elem, ['tile_icon', 'purse_icon']))

	addResult('First account update result', (submitRes) ? 'OK' : 'FAIL');

	var addBtn = vquery('#add_btn > a');

	continueWith(createAccountWithParam.bind(null, { name : 'acc_3', curr_id : 1, balance : '500.99', icon : 2 }, checkCreateAccount3));
	clickEmul(addBtn);
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

	var tileBal = vquery('#acc_tile .acc_bal');
	var accname = vge('accname');
	var balance = vge('balance');

// Input account name
	accname.value = params.name;
	accname.oninput();
	addResult('Account tile name update', (accname.value == params.name) ? 'OK' : 'FAIL');

// Change currency
	var currElem = vge('currency');
	var ddCurrInpCont = currElem.previousElementSibling;

	clickEmul(ddCurrInpCont.previousElementSibling);
	var ddCurrText = ddCurrInpCont.querySelector('.statsel');
	clickEmul(vge('ddlist2_' + currObj.id));

	addResult(currObj.name + ' currency select result', (ddCurrText.innerHTML == currObj.name) ? 'OK' : 'FAIL');
	var fmtBal = formatCurrency(0, currObj.id);
	addResult('Tile balance format update result', (tileBal.innerHTML == fmtBal) ? 'OK' : 'FAIL');

// Input balance
	balance.value = params.balance;
	balance.oninput();
	fmtBal = formatCurrency(normBalance, currObj.id);
	addResult('Tile balance format update result', (tileBal.innerHTML == fmtBal) ? 'OK' : 'FAIL');

// Change icon
	if (params.icon)
	{
		if (params.icon < 0 || params.icon > icons.length)
			throw 'Icon not found';
		var iconElem = vge('icon');
		var ddIconInpCont = iconElem.previousElementSibling;

		clickEmul(ddIconInpCont.previousElementSibling);
		var ddIconText = ddIconInpCont.querySelector('.statsel');
		clickEmul(vge('ddlist1_' + params.icon));	// select purse icon

		addResult('Icon drop down value select', (ddIconText.innerHTML == icons[params.icon]) ? 'OK' : 'FAIL');
		var iconClass = tileIconClass[params.icon];
		addResult('Tile icon update result', (hasClass(vge('acc_tile'), iconClass)) ? 'OK' : 'FAIL');
	}


	var submitBtn = vquery('.acc_controls .ok_btn');
	continueWith(callback);
	clickEmul(submitBtn);
}


function checkCreateAccount3()
{
	var tiles = vquery('.tiles');
	if (!tiles)
		throw 'Tiles list not found';

	var tilesArr = parseTiles(tiles);

	if (!tilesArr || tilesArr.length != 3)
		throw 'Wrong structure of tiles list';

	var firstTile = null;
	var secondTile = null;
	var thirdTile = null;

	firstTile = idSearch(tilesArr, firstAccount_id);
	secondTile = idSearch(tilesArr, secondAccount_id);

	for(var i = 0; i < tilesArr.length; i++)
	{
		var tile = tilesArr[i];
		if (tile.id != firstAccount_id && tile.id != secondAccount_id)
		{
			thirdTile = tile;
			thirdAccount_id = tile.id;
			break;
		}
	}
	if (!thirdTile)
		throw 'Third tile not found';

	var submitRes = (thirdTile.balance == '500.99 ₽' &&
						thirdTile.name == 'acc_3' &&
						hasClass(thirdTile.elem, ['tile_icon', 'safe_icon']))

	addResult('Third account create result', (submitRes) ? 'OK' : 'FAIL');

	deleteFirstAndSecondAccounts();
}


function deleteFirstAndSecondAccounts()
{
	var firstTile = vge('acc_' + firstAccount_id);
	if (!firstTile)
		throw 'First tile not found';

	var thirdTile = vge('acc_' + thirdAccount_id);
	if (!thirdTile)
		throw 'Third tile not found';

	clickEmul(firstTile.firstElementChild);
	var edit_btn = vge('edit_btn');
	if (!edit_btn)
		throw 'Edit button not found';
	var del_btn = vge('del_btn');
	if (!del_btn)
		throw 'Edit button not found';

	addResult('Edit button visibility on select one account', (edit_btn.style.display != 'none') ? 'OK' : 'FAIL');
	addResult('Delete button visibility on select one account', (del_btn.style.display != 'none') ? 'OK' : 'FAIL');

	clickEmul(thirdTile.firstElementChild);

	addResult('Edit button visibility on select one account', (edit_btn.style.display == 'none') ? 'OK' : 'FAIL');
	addResult('Delete button visibility on select one account', (del_btn.style.display != 'none') ? 'OK' : 'FAIL');

	clickEmul(del_btn.firstElementChild);

	var delete_warning = vge('delete_warning');
	if (!delete_warning)
		throw 'Delete warning not found';

	addResult('Delete account warning popup appear', (delete_warning.style.display != 'none') ? 'OK' : 'FAIL');

	var okBtn = delete_warning.querySelector('.ok_btn');
	if (!okBtn)
		throw 'OK button not found';

	continueWith(checkDeleteAccounts);
	clickEmul(okBtn);
}


function checkDeleteAccounts()
{
	var tiles = vquery('.tiles');
	if (!tiles)
		throw 'Tiles list not found';

	var tilesArr = parseTiles(tiles);

	addResult('Accounts delete result', (tilesArr && tilesArr.length == 1) ? 'OK' : 'FAIL');


	var addBtn = vquery('#add_btn > a');

	continueWith(createAccountWithParam.bind(null, { name : 'acc_1', curr_id : 1, balance : '500.99', icon : 2 }, checkCreateAccount1_2));
	clickEmul(addBtn);
}


function checkCreateAccount1_2()
{
	var addBtn = vquery('#add_btn > a');

	continueWith(createAccountWithParam.bind(null, { name : 'acc_3', curr_id : 1, balance : '10000.99', icon : 3 }, checkCreateAccount3_2));
	clickEmul(addBtn);
}


function checkCreateAccount3_2()
{
	var elem = vquery('.page .header .logo > a');
	if (!elem)
		throw 'Link to main page not found';

	continueWith(goToPersonsAndCreateNew);

	clickEmul(elem);
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

	var tilesArr = vqueryall('.tiles .tile');

	addResult('Initial persons structure', (tilesArr && tilesArr.length == 0) ? 'OK' : 'FAIL');

	continueWith(createPerson1);
	clickEmul(add_btn.firstElementChild);
}


function createPerson1()
{
	var pname = vge('pname');

	addResult('Person name input found', (pname) ? 'OK' : 'FAIL');

	pname.value = 'Alex';
	if (pname.oninput)
		pname.oninput();

	var ok_btn = vquery('.ok_btn');
	addResult('Submit person button found', (ok_btn) ? 'OK' : 'FAIL');

	continueWith(checkCreatePerson1);
	clickEmul(ok_btn);
}


function checkCreatePerson1()
{
	var tilesArr = vqueryall('.tiles .tile');

	addResult('Person tiles structure', (tilesArr && tilesArr.length == 1) ? 'OK' : 'FAIL');

	var tile = tilesArr[0];

	var personName = tile.querySelector('.acc_name');

	addResult('Person create result', (personName && personName.innerHTML == 'Alex') ? 'OK' : 'FAIL');
}


function expenseTransactionStart()
{
	var destAmountInp = vge('dest_amount');

	destAmountInp.value = '1';
	destAmountInp.oninput();
}


function addResult(descr, res)
{
	restbl.appendChild(ce('tr', {}, [ ce('td', { innerHTML : descr }),
										ce('td', { innerHTML : res }) ]));
}
