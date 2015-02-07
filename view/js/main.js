var accounts = new Selection();
var dwPopup;		// delete warning popup


// Log in form submit event handler
function onLoginSubmit(frm)
{
	var login, password;

	login = ge('login');
	password = ge('password');
	if (!frm || !login || !password)
		return false;

	if (!login.value || login.value.length < 1)
	{
		alert('Please type your account name.');
		return false;
	}

	if (!password.value || password.value.length < 1)
	{
		alert('Please type your password.');
		return false;
	}

	return true;
}


// Registration form submit event handler
function onRegisterSubmit(frm)
{
	var login, password, name;

	login = ge('login');
	password = ge('password');
	name = ge('name');
	if (!frm || !login || !password || !name)
		return false;

	if (!login.value || login.value.length < 1)
	{
		alert('Please type your account name.');
		return false;
	}

	if (!name.value || name.value.length < 1)
	{
		alert('Please type your name.');
		return false;
	}

	if (!password.value || password.value.length < 1)
	{
		alert('Please type your password.');
		return false;
	}

	return true;
}


// Change password submit event handler
function onChangePassSubmit(frm)
{
	var oldpwd, newpwd;

	oldpwd = ge('oldpwd');
	newpwd = ge('newpwd');
	if (!frm || !oldpwd || !newpwd)
		return false;

	if (!oldpwd.value || oldpwd.value.length < 1)
	{
		alert('Please type your current password.');
		return false;
	}

	if (!newpwd.value || newpwd.value.length < 1)
	{
		alert('Please type new password.');
		return false;
	}

	if (newpwd.value == oldpwd.value)
	{
		alert('New password must be different from the old.');
		return false;
	}

	return true;
}


// Change name submit event handler
function onChangeNameSubmit(frm)
{
	var newname;

	newname = ge('newname');
	if (!frm || !newname)
		return false;

	if (!newname.value || newname.value.length < 1)
	{
		alert('Please type new name.');
		return false;
	}

	if (newname.value == p_name)
	{
		alert('New name must be different from the old.');
		return false;
	}

	return true;
}


// Icon select callback
function onIconSel(obj)
{
	var iconSel;

	if (!obj)
		return;
	iconSel = ge('icon');
	if (!iconSel)
		return;

	selectByValue(iconSel, obj.id);

	this.setText(obj.str);

	onChangeIcon(iconSel);
}


// Currency select callback
function onCurrencySel(obj)
{
	var currSel;

	if (!obj)
		return;
	currSel = ge('currency');
	if (!currSel)
		return;

	selectByValue(currSel, obj.id);

	this.setText(obj.str);

	onChangeAccountCurrency(currSel);
}


// Initialization of page controls
function initControls()
{
	var isMobile;
	var currDDList, iconDDList;

	isMobile = (document.documentElement.clientWidth < 700);

	iconDDList = new DDList();
	if (!iconDDList.create({ input_id : 'icon', itemPrefix : 'icon', selCB : onIconSel, editable : false, mobile : isMobile }))
		iconDDList = null;

	currDDList = new DDList();
	if (!currDDList.create({ input_id : 'currency', itemPrefix : 'curr', selCB : onCurrencySel, editable : false, mobile : isMobile }))
		currDDList = null;
}


// Tile click event handler
function onTileClick(acc_id)
{
	var tile, edit_btn, del_btn, delaccounts, export_btn;
	var actDiv;
	var selArr;
	var baseURL = 'http://jezve.net/money/';

	tile = ge('acc_' + acc_id);
	edit_btn = ge('edit_btn');
	del_btn = ge('del_btn');
	delaccounts = ge('delaccounts');
	export_btn = ge('export_btn');
	if (!tile || !edit_btn || !delaccounts || !export_btn)
		return;

	if (accounts.isSelected(acc_id))
	{
		accounts.deselect(acc_id);

		actDiv = ge('act_' + acc_id);
		if (actDiv)
			tile.removeChild(actDiv);
	}
	else
	{
		accounts.select(acc_id);

		actDiv = ce('div', { id : 'act_' + acc_id, className : 'act', onclick : onTileClick.bind(null, acc_id) });

		tile.appendChild(actDiv);
	}

	show(edit_btn, (accounts.count() == 1));
	show(export_btn, (accounts.count() == 1));
	show(del_btn, (accounts.count() > 0));

	selArr = accounts.getIdArray();
	delaccounts.value = selArr.join();

	if (accounts.count() == 1)
	{
		if (firstElementChild(edit_btn) && firstElementChild(edit_btn).tagName.toLowerCase() == 'a')
			firstElementChild(edit_btn).href = baseURL + 'accounts/edit/' + selArr[0];
		if (firstElementChild(export_btn) && firstElementChild(export_btn).tagName.toLowerCase() == 'a')
			firstElementChild(export_btn).href = './csvexport.php?id=' + selArr[0];
	}

	show('toolbar', (accounts.count() > 0));
	if (accounts.count() > 0)
	{
		onScroll();
	}
}


// Set currency sign
function setSign(signobj, curr_id)
{
	var curr;

	if (!signobj)
		return;

	curr = getCurrency(curr_id);
	if (!curr)
		return;

	signobj.innerHTML = curr.sign;
}


// Update account tile with the current values
function updateAccountTile()
{
	var formatBalance, icon, iconType;

	icon = ge('icon');
	if (!icon)
		return;

	formatBalance = formatCurrency(acc_balance, acc_currency);
	iconType = parseInt(selectedValue(icon));

	setTileInfo('acc_tile', acc_name, formatBalance, iconType);
}


// Currency change event handler
function onChangeAccountCurrency(obj)
{
	var currsign;

	currsign = ge('currsign');
	if (!obj || !currsign)
		return;

	acc_currency = selectedValue(obj);
	setSign(currsign, acc_currency);

	updateAccountTile();
}


// Account name input event handler
function onAccNameInput(obj)
{
	if (!obj)
		return;

	acc_name = obj.value;

	updateAccountTile();
}


// Account initial balance input event handler
function onAccBalanceInput(obj)
{
	if (!obj)
		return;

	acc_balance = obj.value;

	updateAccountTile();
}


// Icon change event handler
function onChangeIcon(obj)
{
	if (!obj)
		return;

	updateAccountTile();
}


// New account submit event handler
function onNewAccountSubmit(frm)
{
	var accname, balance;

	accname = ge('accname');
	balance = ge('balance');
	if (!frm || !accname || !balance)
		return false;

	if (!accname.value || accname.value.length < 1)
	{
		alert('Please type name of account.');
		return false;
	}

	if (!balance.value || balance.value.length < 1 || !isNum(balance.value))
	{
		alert('Please type correct initial balance.');
		return false;
	}

	return true;
}


var singleAccDeleteTitle = 'Delete account';
var multiAccDeleteTitle = 'Delete accounts';
var multiAccDeleteMsg = 'Are you sure want to delete selected accounts?<br>All income and expense transactions history will be lost. Transfer to this accounts will be changed to expense. Transfer from this accounts will be changed to income.';
var singleAccDeleteMsg = 'Are you sure want to delete selected account?<br>All income and expense transactions history will be lost. Transfer to this account will be changed to expense. Transfer from this account will be changed to income.';
var resetAccMsg = 'Are you sure want to reset all your accounts?<br>All accounts and transactions will be lost.';
var resetAllMsg = 'Are you sure to reset all your data?<br>Everything will be lost.';


// Delete account iconlink click event handler
function onDelete()
{
	accounts.select(account_id);

	showDeletePopup();
}


// Delete popup callback
function onDeletePopup(res)
{
	var delform;

	if (!dwPopup)
		return;

	dwPopup.close();
	dwPopup = null;

	if (res)
	{
		delform = ge('delform');
		if (delform)
			delform.submit();
	}
}


// Create and show account delete warning popup
function showDeletePopup()
{
	var multi;

	if (accounts.count() == 0)
		return;

	// check popup already created
	if (dwPopup)
		return;

	dwPopup = new Popup();
	if (!dwPopup)
		return;

	multi = (accounts.count() > 1);
	if (!dwPopup.create({ id : 'delete_warning',
						title : (multi) ? multiAccDeleteTitle : singleAccDeleteTitle,
						msg : (multi) ? multiAccDeleteMsg : singleAccDeleteMsg,
						btn : { okBtn : { onclick : onDeletePopup.bind(null, true) },
								cancelBtn : { onclick : onDeletePopup.bind(null, false) } }
						}))
	{
		dwPopup = null;
		return;
	}

	dwPopup.show();
}


// Reset accounts popup callback
function onAccResetPopup(res)
{
	var resetacc_form;

	if (!dwPopup)
		return;

	dwPopup.close();
	dwPopup = null;

	if (res)
	{
		resetacc_form = ge('resetacc_form');
		if (resetacc_form)
			resetacc_form.submit();
	}
}


// Create and show accounts reset warning popup
function showResetAccountsPopup()
{
	// check popup already created
	if (dwPopup)
		return;

	dwPopup = new Popup();
	if (!dwPopup)
		return;

	if (!dwPopup.create({ id : 'reset_warning',
						title : 'Reset accounts',
						msg : resetAccMsg,
						btn : { okBtn : { onclick : onAccResetPopup.bind(null, true) },
								cancelBtn : { onclick : onAccResetPopup.bind(null, false) } }
						}))
	{
		dwPopup = null;
		return;
	}

	dwPopup.show();
}


// Reset accounts popup callback
function onResetAllPopup(res)
{
	var resetall_form;

	if (!dwPopup)
		return;

	dwPopup.close();
	dwPopup = null;

	if (res)
	{
		resetall_form = ge('resetall_form');
		if (resetall_form)
			resetall_form.submit();
	}
}


// Create and show reset data all warning popup
function showResetAllPopup()
{
	// check popup already created
	if (dwPopup)
		return;

	dwPopup = new Popup();
	if (!dwPopup)
		return;

	if (!dwPopup.create({ id : 'reset_warning',
						title : 'Reset all data',
						msg : resetAllMsg,
						btn : { okBtn : { onclick : onResetAllPopup.bind(null, true) },
								cancelBtn : { onclick : onResetAllPopup.bind(null, false) } }
						}))
	{
		dwPopup = null;
		return;
	}

	dwPopup.show();
}


// Init statistics widget
function initStatWidget()
{
	Charts.createHistogram({ data : chartData, container : 'chart', height : 200 });
}
