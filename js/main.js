var dwPopup;


// Handler for click on empty space event
function onEmptyClick(callback, elem)
{
	var e, elem;

	callback = callback || null;
	if (!callback)
		return;
	e = fixEvent(event);
	elem = ge(elem) || null;

	if ((elem && (e.target != elem && e.target.parentNode != elem)) || !elem)
		callback();
}


// Set or unset event handler for 
function setEmptyClick(callback, elem)
{
	callback = callback || null;
	elem = elem || null;

	if (document.documentElement)
	{
		document.documentElement.onclick = ((callback) ? bind(onEmptyClick, null, callback, elem) : null);
	}
}


// Hide usem menu popup
function hidePopup()
{
	show('menupopup', false);
	setEmptyClick();
}


// Show/hide user menu by click
function onUserClick()
{
	if (isVisible('menupopup'))
	{
		hidePopup();
	}
	else
	{
		show('menupopup', true);
		setEmptyClick(hidePopup, 'userbtn');
	}
}


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
	var tile, edit_btn, del_btn, delaccounts;
	var actDiv;

	tile = ge('acc_' + acc_id);
	edit_btn = ge('edit_btn');
	del_btn = ge('del_btn');
	delaccounts = ge('delaccounts');
	if (!tile || !edit_btn || !delaccounts)
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
	show(del_btn, (accounts.selectedCount() > 0));

	delaccounts.value = accounts.selectedArr.join();

	if (accounts.selectedCount() == 1)
	{
		if (edit_btn.firstElementChild && edit_btn.firstElementChild.tagName.toLowerCase() == 'a')
			edit_btn.firstElementChild.href = './editaccount.php?id=' + accounts.selectedArr[0];
	}
}


// Retunr sign of specified currency
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
	var currsign, curr_id;

	currsign = ge('currsign');
	if (!obj || !currsign)
		return;

	curr_id = selectedValue(obj);

	setSign(currsign, curr_id);
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


var multiAccDeleteMsg = 'Are you sure want to delete selected accounts?<br>All income and expense transactions history will be lost. Transfer to this accounts will be changed to expense. Transfer from this accounts will be changed to income.';
var singleAccDeleteMsg = 'Are you sure want to delete selected account?<br>All income and expense transactions history will be lost. Transfer to this account will be changed to expense. Transfer from this account will be changed to income.';
var resetAccMsg = 'Are you sure want to reset all your accounts?<br>All accounts and transactions will be lost.';


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
	if (accounts.selectedCount() == 0)
		return;

	// check popup already created
	if (dwPopup)
		return;

	dwPopup = new Popup();
	if (!dwPopup)
		return;

	if (!dwPopup.create({ id : 'delete_warning',
						title : 'Delete account',
						msg : (accounts.selectedCount() > 1) ? multiAccDeleteMsg : singleAccDeleteMsg,
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
