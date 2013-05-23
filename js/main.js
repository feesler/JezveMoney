// Hide usem menu popup
function hidePopup()
{
	var e, userbtn;

	e = event;

	userbtn = ge('userbtn');
	if (!userbtn)
		return;

	if (e.target != userbtn && e.target.parentNode != userbtn)
	{
		show(menupopup, false);
		document.documentElement.onclick = null;
	}
}


// Show/hide user menu by click
function onUserClick()
{
	var menupopup, popupVisible;

	menupopup = ge('menupopup');
	if (!menupopup)
		return;

	popupVisible = isVisible(menupopup);

	show(menupopup, !popupVisible);

	if (document.documentElement)
	{
		document.documentElement.onclick = (popupVisible) ? null : hidePopup;
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
}
