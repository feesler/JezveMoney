var viewframe = null;
var vdoc = null;
var restbl = null;
var accTiles = [];
var personTiles = [];
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

		checkPHPerrors();
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

	var startbtn = ge('startbtn');
	if (!startbtn)
		throw 'Start button not found';
	startbtn.onclick = onStartClick;
}


function checkPHPerrors()
{
	var errSignatures = ['<b>Notice</b>', '<b>Parse error</b>', '<b>Fatal error</b>'];

	if (!vdoc || !vdoc.body)
		return true;

	var found = errSignatures.some(function(lookupStr)
	{
		return (vdoc.body.innerHTML.indexOf(lookupStr) !== -1);
	});

	if (found)
		addResult('PHP error signature found', false);
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
	continueWith(goToAccountsAndCreateNew);
	clickEmul(vquery('.page .header .logo > a'));
}


function parseTile(tileEl)
{
	if (!tileEl)
		return null;

	var tileObj = {};

	if (!hasClass(tileEl, 'tile'))
		throw 'Wrong tile structure';

	tileObj.elem = tileEl;

	var pos = tileEl.id.indexOf('_');
	if (pos == -1)
		tileObj.id == tileEl.id;
	else
		tileObj.id = parseInt(tileEl.id.substr(pos + 1));
	if (!tileEl.firstElementChild || !tileEl.firstElementChild.firstElementChild || !tileEl.firstElementChild.firstElementChild.firstElementChild)
		throw 'Wrong tile structure';
	tileObj.balanceEL = tileEl.firstElementChild.firstElementChild.firstElementChild;
	tileObj.balance = tileObj.balanceEL.innerHTML;
	if (!tileObj.balanceEL.nextElementSibling)
		throw 'Wrong tile structure';
	tileObj.nameEL = tileObj.balanceEL.nextElementSibling;
	tileObj.name = tileObj.nameEL.innerHTML;

	return tileObj;
}


function parseTiles(tilesEl)
{
	var res = [], tileObj;

	if (!tilesEl || (tilesEl.children.length == 1 && tilesEl.children[0].tagName == 'SPAN'))
		return res;

	for(var i = 0; i < tilesEl.children.length; i++)
	{
		tileObj = parseTile(tilesEl.children[i]);
		if (!tileObj)
			throw 'Fail to parse tile';

		res.push(tileObj);
	}

	res.sort(function(a, b)
	{
		return (a.id == b.id) ? 0 : ((a.id < b.id) ? -1 : 1);
	});

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

	addResult('New account page loaded', true);

	addResult('Initial account name on tile', (tileName.innerHTML == 'New account'));
	addResult('Initial account balance on tile', (tileBal.innerHTML == '0 ₽'));

	accname.value = 'acc_1';
	accname.oninput();
	addResult('Account tile name update', (accname.value == 'acc_1'));

// Change currency
	var currElem = vge('currency');
	var ddCurrInpCont = currElem.previousElementSibling;

	clickEmul(ddCurrInpCont.previousElementSibling);
	var ddCurrText = ddCurrInpCont.querySelector('.statsel');
	clickEmul(vge('ddlist2_2'));	// select USD currency

	addResult('Currency drop down value select', (ddCurrText.innerHTML == 'USD'));
	addResult('Tile balance format update result', (tileBal.innerHTML == '$ 0'));

	balance.value = '100000.01';
	balance.oninput();
	addResult('Account tile balance on USD 100 000.01 balance input field', (tileBal.innerHTML == '$ 100 000.01'));

// Change currency back
	clickEmul(ddCurrInpCont.previousElementSibling);
	var ddCurrText = ddCurrInpCont.querySelector('.statsel');
	clickEmul(vge('ddlist2_1'));	// select RUB currency

	addResult('Currency drop down value select back', (ddCurrText.innerHTML == 'RUB'));
	addResult('Tile balance format after change currency back update result', (tileBal.innerHTML == '100 000.01 ₽'));

	balance.value = '';
	balance.oninput();
	addResult('Account tile balance on empty input field', (tileBal.innerHTML == '0 ₽'));

	balance.value = '.';
	balance.oninput();
	addResult('Account tile balance on dot(.) input field', (tileBal.innerHTML == '0 ₽'));

	balance.value = '.01';
	balance.oninput();
	addResult('Account tile balance on RUB .01 balance input field', (tileBal.innerHTML == '0.01 ₽'));

	balance.value = '10000000.01';
	balance.oninput();
	addResult('Account tile balance on RUB 10 000 000.01 balance input field', (tileBal.innerHTML == '10 000 000.01 ₽'));

// Change icon
	var iconElem = vge('icon');
	var ddIconInpCont = iconElem.previousElementSibling;

	clickEmul(ddIconInpCont.previousElementSibling);
	var ddIconText = ddIconInpCont.querySelector('.statsel');
	clickEmul(vge('ddlist1_2'));	// select safe icon

	addResult('Icon drop down value select', (ddIconText.innerHTML == 'Safe'));
	addResult('Tile icon update result', (hasClass(vge('acc_tile'), 'safe_icon')));

	balance.value = '1000.01';
	balance.oninput();
	addResult('Account tile balance on RUB 1 000.01 balance input field', (tileBal.innerHTML == '1 000.01 ₽'));

	var submitBtn = vquery('.acc_controls .ok_btn');
	continueWith(checkCreateAccount1);
	clickEmul(submitBtn);

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
	addResult('Account tile name update', (accname.value == 'acc_2'));

// Change currency
	var currElem = vge('currency');
	var ddCurrInpCont = currElem.previousElementSibling;

	clickEmul(ddCurrInpCont.previousElementSibling);
	var ddCurrText = ddCurrInpCont.querySelector('.statsel');
	clickEmul(vge('ddlist2_3'));	// select EUR currency

	addResult('EUR currency select result', (ddCurrText.innerHTML == 'EUR'));
	addResult('Tile balance format update result', (tileBal.innerHTML == '€ 0'));

	balance.value = '1000.01';
	balance.oninput();
	addResult('Account tile balance on EUR 1 000.01 balance input field', (tileBal.innerHTML == '€ 1 000.01'));

	var submitBtn = vquery('.acc_controls .ok_btn');
	continueWith(checkCreateAccount2);
	clickEmul(submitBtn);
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

	addResult('Edit account name on tile', (tileName.innerHTML == 'acc_1'));
	addResult('Edit account balance on tile', (tileBal.innerHTML == '1 000.01 ₽'));


// Change currency
	var currElem = vge('currency');
	var ddCurrInpCont = currElem.previousElementSibling;

	clickEmul(ddCurrInpCont.previousElementSibling);
	var ddCurrText = ddCurrInpCont.querySelector('.statsel');
	clickEmul(vge('ddlist2_2'));	// select USD currency

	var fmtBal = formatCurrency(1000.01, 2);
	addResult('USD currency select result', (ddCurrText.innerHTML == 'USD'));
	addResult('Tile balance format update result', (tileBal.innerHTML == fmtBal));

// Change icon
	var iconElem = vge('icon');
	var ddIconInpCont = iconElem.previousElementSibling;

	clickEmul(ddIconInpCont.previousElementSibling);
	var ddIconText = ddIconInpCont.querySelector('.statsel');
	clickEmul(vge('ddlist1_1'));	// select purse icon

	addResult('Icon drop down value select', (ddIconText.innerHTML == 'Purse'));
	addResult('Tile icon update result', (hasClass(vge('acc_tile'), 'purse_icon')));

// Submit
	continueWith(checkEditAccount1);
	clickEmul(submitBtn);
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

	var tileBal = vquery('#acc_tile .acc_bal');
	var accname = vge('accname');
	var balance = vge('balance');

// Input account name
	accname.value = params.name;
	accname.oninput();
	addResult('Account tile name update', (accname.value == params.name));

// Change currency
	var currElem = vge('currency');
	var ddCurrInpCont = currElem.previousElementSibling;

	clickEmul(ddCurrInpCont.previousElementSibling);
	var ddCurrText = ddCurrInpCont.querySelector('.statsel');
	clickEmul(vge('ddlist2_' + currObj.id));

	addResult(currObj.name + ' currency select result', (ddCurrText.innerHTML == currObj.name));
	var fmtBal = formatCurrency(0, currObj.id);
	addResult('Tile balance format update result', (tileBal.innerHTML == fmtBal));

// Input balance
	balance.value = params.balance;
	balance.oninput();
	fmtBal = formatCurrency(normBalance, currObj.id);
	addResult('Tile balance format update result', (tileBal.innerHTML == fmtBal));

// Change icon
	if (params.icon)
	{
		if (params.icon < 0 || params.icon > icons.length)
			throw 'Icon not found';
		var iconElem = vge('icon');
		var ddIconInpCont = iconElem.previousElementSibling;

		clickEmul(ddIconInpCont.previousElementSibling);
		var ddIconText = ddIconInpCont.querySelector('.statsel');
		clickEmul(vge('ddlist1_' + params.icon));

		addResult('Icon drop down value select', (ddIconText.innerHTML == icons[params.icon]));
		var iconClass = tileIconClass[params.icon];
		addResult('Tile icon update result', (hasClass(vge('acc_tile'), iconClass)));
	}


	var submitBtn = vquery('.acc_controls .ok_btn');
	continueWith(callback);
	clickEmul(submitBtn);
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

	addResult('Edit button visibility on select one account', (edit_btn && edit_btn.style.display != 'none'));
	addResult('Delete button visibility on select one account', (del_btn && del_btn.style.display != 'none'));

	clickEmul(accTiles[2].elem.firstElementChild);

	addResult('Edit button visibility on select one account', (edit_btn && edit_btn.style.display == 'none'));
	addResult('Delete button visibility on select one account', (del_btn && del_btn.style.display != 'none'));

	clickEmul(del_btn.firstElementChild);

	var delete_warning = vge('delete_warning');
	if (!delete_warning)
		throw 'Delete warning not found';

	addResult('Delete account warning popup appear', (delete_warning.style.display != 'none'));

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


function createPerson1()
{
	var pname = vge('pname');

	addResult('Person name input found', pname);

	pname.value = 'Alex';
	if (pname.oninput)
		pname.oninput();

	var ok_btn = vquery('.ok_btn');
	addResult('Submit person button found', ok_btn);

	continueWith(checkCreatePerson1);
	clickEmul(ok_btn);
}


function checkCreatePerson1()
{
	var tilesArr = vqueryall('.tiles .tile');

	addResult('Person tiles structure', (tilesArr && tilesArr.length == 1));

	var tile = tilesArr[0];
	var personName = tile.querySelector('.acc_name');

	addResult('Person create result', (personName && personName.innerHTML == 'Alex'));
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
