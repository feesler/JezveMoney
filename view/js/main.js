var dwPopup = null;		// delete warning popup
var cnPopup = null;		// change name popup
var rAccPopup = null;	// reset account popup
var rAllPopup = null;	// reset all popup


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


// Create and show change name popup
function showChangeNamePopup()
{
	var frm;

	if (!cnPopup)
	{
		cnPopup = Popup.create({ id : 'chname_popup',
								title : 'Change name',
								content : 'changename',
								additional : 'center_only' });
		frm = firstElementChild(ge('changename'));

		cnPopup.setControls({ okBtn : { onclick : onChangeNameSubmit.bind(null, frm) },
								closeBtn : true });
	}

	cnPopup.show();

	return false;
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


// Change name request callback
function onChangeNameResult(response)
{
	var userbtn, nameEl;

	var res = JSON.parse(response);

	if (!res)
		return;

	if (res.result == 'ok')
	{
		cnPopup.close();

		if (res.msg)
			createMessage(res.msg, 'msg_success');

		p_name = res.data.name;

		nameEl = ge('namestatic');
		if (nameEl)
			nameEl.innerHTML = p_name;

		var userbtn = ge('userbtn');
		var nameEl = nextElementSibling(firstElementChild(userbtn));

		if (nameEl)
			nameEl.innerHTML = p_name;
	}
	else
	{
		if (res.msg)
			createMessage(res.msg, 'msg_error');
	}
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

	ajax.post(baseURL + 'api/profile.php?act=changename',
				urlJoin({ 'name' : newname.value }),
				onChangeNameResult);

	return false;
}



var resetAccMsg = 'Are you sure want to reset all your accounts?<br>All accounts and transactions will be lost.';
var resetAllMsg = 'Are you sure to reset all your data?<br>Everything will be lost.';


// Reset accounts popup callback
function onAccResetPopup(res)
{
	var resetacc_form;

	if (!rAccPopup)
		return;

	rAccPopup.close();

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
	if (!rAccPopup)
	{
		rAccPopup = Popup.create({ id : 'reset_warning',
						title : 'Reset accounts',
						msg : resetAccMsg,
						btn : { okBtn : { onclick : onAccResetPopup.bind(null, true) },
								cancelBtn : { onclick : onAccResetPopup.bind(null, false) } }
						});
	}

	rAccPopup.show();
}


// Reset accounts popup callback
function onResetAllPopup(res)
{
	var resetall_form;

	if (!rAllPopup)
		return;

	rAllPopup.close();

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
	if (!rAllPopup)
	{
		rAllPopup = Popup.create({ id : 'reset_warning',
						title : 'Reset all data',
						msg : resetAllMsg,
						btn : { okBtn : { onclick : onResetAllPopup.bind(null, true) },
								cancelBtn : { onclick : onResetAllPopup.bind(null, false) } }
						});
	}

	rAllPopup.show();
}


// Init statistics widget
function initStatWidget()
{
	Charts.createHistogram({ data : chartData, container : 'chart', height : 200 });
}
