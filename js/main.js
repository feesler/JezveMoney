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


var accounts =
{
	selectedArr : [],

	// Return position of account in selectedArr
	getPos : function(acc_id)
	{
		return this.selectedArr.indexOf(acc_id);
	},


	isSelected : function(acc_id)
	{
		return this.selectedArr.some(function(account_id){ return account_id == acc_id; });
	},


	selectAccount : function(acc_id)
	{
		if (!acc_id || this.isSelected(acc_id))
			return false;

		this.selectedArr.push(acc_id);
		return true;
	},


	deselectAccount : function(acc_id)
	{
		var acc_pos = this.getPos(acc_id);

		if (acc_pos == -1)
			return false;

		this.selectedArr.splice(acc_pos, 1);
		return true;
	},


	selectedCount : function()
	{
		return this.selectedArr.length;
	}
};



// Tile click event handler
function onTileClick(acc_id)
{
	var tile, edit_btn, del_btn, delaccounts, export_btn;
	var actDiv;

	tile = ge('acc_' + acc_id);
	edit_btn = ge('edit_btn');
	del_btn = ge('del_btn');
	delaccounts = ge('delaccounts');
	export_btn = ge('export_btn');
	if (!tile || !edit_btn || !delaccounts || !export_btn)
		return;

	if (accounts.isSelected(acc_id))
	{
		accounts.deselectAccount(acc_id);

		actDiv = ge('act_' + acc_id);
		if (actDiv)
			tile.removeChild(actDiv);
	}
	else
	{
		accounts.selectAccount(acc_id);

		actDiv = ce('div', { id : 'act_' + acc_id, className : 'act', onclick : bind(onTileClick, null, acc_id) });

		tile.appendChild(actDiv);
	}

	show(edit_btn, (accounts.selectedCount() == 1));
	show(export_btn, (accounts.selectedCount() == 1));
	show(del_btn, (accounts.selectedCount() > 0));

	delaccounts.value = accounts.selectedArr.join();

	if (accounts.selectedCount() == 1)
	{
		if (edit_btn.firstElementChild && edit_btn.firstElementChild.tagName.toLowerCase() == 'a')
			edit_btn.firstElementChild.href = './editaccount.php?id=' + accounts.selectedArr[0];
		if (export_btn.firstElementChild && export_btn.firstElementChild.tagName.toLowerCase() == 'a')
			export_btn.firstElementChild.href = './csvexport.php?id=' + accounts.selectedArr[0];
	}
}


// Return sign of specified currency
function getCurrencySign(curr_id)
{
	var currSign = '';

	if (!currency)
		return currSign;

	currency.some(function(curr)
	{
		if (curr[0] == curr_id)
			currSign = curr[2];

		return (curr[0] == curr_id);
	});

	return currSign;
}


// Set currency sign
function setSign(signobj, curr_id)
{
	if (!signobj)
		return;

	signobj.innerHTML = getCurrencySign(curr_id);
}


// Currency change event handler
function onChangeAccountCurrency(obj)
{
	var currsign, formatBalance;

	currsign = ge('currsign');
	if (!obj || !currsign)
		return;

	acc_currency = selectedValue(obj);
	formatBalance = formatCurrency(acc_balance, acc_currency);

	setSign(currsign, acc_currency);
	setTileInfo('acc_tile', acc_name, formatBalance);
}


//
function formatValue(val)
{
	return val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}


// Return sign of specified currency
function getCurrencySign(curr_id)
{
	var currSign = '';

	currency.some(function(curr)
	{
		if (curr[0] == curr_id)
			currSign = curr[2];

		return (curr[0] == curr_id);
	});

	return currSign;
}


// Return sign format of specified currency(before or after value)
function getCurrencyFormat(curr_id)
{
	var currFmt = false;

	currency.some(function(curr)
	{
		if (curr[0] == curr_id)
			currFmt = curr[3];

		return (curr[0] == curr_id);
	});

	return currFmt;
}


// Format value with rules of specified currency
function formatCurrency(val, curr_id)
{
	var isBefore = getCurrencyFormat(curr_id);
	var sign = getCurrencySign(curr_id);

	if (isBefore)
		return sign + ' ' + formatValue(val);
	else
		return formatValue(val) + ' ' + sign;
}


// Update tile information
function setTileInfo(tile_id, title, subTitle, iconType)
{
	var tileObj, titleObj, subTitleObj, tileClass;

	tileObj = ge(tile_id);
	if (!tileObj)
		return;

	subTitleObj = tileObj.firstElementChild.firstElementChild.firstElementChild;
	if (subTitleObj)
		subTitleObj.innerHTML = subTitle;

	titleObj = subTitleObj.nextElementSibling;
	if (titleObj)
		titleObj.innerHTML = title;

	iconType = iconType | 0;
	tileClass = "tile";
	if (iconType == 1)
		tileClass += " purse_icon";
	else if (iconType == 2)
		tileClass += " safe_icon";
	else if (iconType == 3)
		tileClass += " card_icon";
	else if (iconType == 4)
		tileClass += " percent_icon";
	else if (iconType == 5)
		tileClass += " bank_icon";
	else if (iconType == 6)
		tileClass += " cash_icon";
	tileObj.className = tileClass;
}


// Account name input event handler
function onAccNameInput(obj)
{
	var formatBalance;

	if (!obj)
		return;

	acc_name = obj.value;
	formatBalance = formatCurrency(acc_balance, acc_currency);

	setTileInfo('acc_tile', acc_name, formatBalance);
}


// Account initial balance input event handler
function onAccBalanceInput(obj)
{
	var formatBalance;

	if (!obj)
		return;

	acc_balance = obj.value;
	formatBalance = formatCurrency(acc_balance, acc_currency);

	setTileInfo('acc_tile', acc_name, formatBalance);
}


// Icon change event handler
function onChangeIcon(obj)
{
	var formatBalance, iconType;

	if (!obj)
		return;

	formatBalance = formatCurrency(acc_balance, acc_currency);
	iconType = parseInt(selectedValue(obj));

	setTileInfo('acc_tile', acc_name, formatBalance, iconType);
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
	accounts.selectAccount(account_id);

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

	if (accounts.selectedCount() == 0)
		return;

	// check popup already created
	if (dwPopup)
		return;

	dwPopup = new Popup();
	if (!dwPopup)
		return;

	multi = (accounts.selectedCount() > 1);
	if (!dwPopup.create({ id : 'delete_warning',
						title : (multi) ? multiAccDeleteTitle : singleAccDeleteTitle,
						msg : (multi) ? multiAccDeleteMsg : singleAccDeleteMsg,
						btn : { okBtn : { onclick : bind(onDeletePopup, null, true) },
								cancelBtn : { onclick : bind(onDeletePopup, null, false) } }
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
						btn : { okBtn : { onclick : bind(onAccResetPopup, null, true) },
								cancelBtn : { onclick : bind(onAccResetPopup, null, false) } }
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
						btn : { okBtn : { onclick : bind(onResetAllPopup, null, true) },
								cancelBtn : { onclick : bind(onResetAllPopup, null, false) } }
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
	initBarChart();
}
