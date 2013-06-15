// Handler for click on empty space event
function onEmptyClick(callback, elem)
{
	var e, elem;

	callback = callback || null;
	if (!callback)
		return;
	e = event;
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
	var tile, edit_btn, del_btn;
	var actDiv;

	tile = ge('acc_' + acc_id);
	edit_btn = ge('edit_btn');
	del_btn = ge('del_btn');
	if (!tile || !edit_btn)
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


// Create popup DOM structure and return object
function createPopup(p_id, title, msg)
{
	var popup;

	popup = ce('div', { id : p_id, className : 'popup' },
					[
						ce('div', { className : 'popup_back' }),
						ce('div', { className : 'popup_content' }, 
							[
								ce('div', { className : 'box' },
									[
										ce('h1', { className : 'popup_title', innerHTML : title }),
										ce('div', { className : 'popup_message' }, [ ce('div', { innerHTML : msg }) ]),
										ce('div', { className : 'popup_controls' }, 
											[
												ce('input', { className : 'btn ok_btn', type : 'submit', value : 'ok' }),
												ce('button', { className : 'btn cancel_btn', onclick : hidePopupBox, innerHTML : 'cancel' })
											]),
									])
							])
					]);

	show(popup, false);

	return popup;
}
