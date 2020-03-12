var dwPopup = null;		// delete warning popup
var cnPopup = null;		// change name popup
var cpPopup = null;		// change password popup
var rAccPopup = null;	// reset account popup
var rAllPopup = null;	// reset all popup
var delPopup = null;	// delete profile popup


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
								content : ge('changename'),
								additional : 'center_only chname_popup' });
		frm = ge('changename');
		if (frm)
			frm = frm.firstElementChild;

		cnPopup.setControls({ okBtn : { onclick : onChangeNameSubmit.bind(null, frm) },
								closeBtn : true });
	}

	var newname = ge('newname');
	if (newname)
		newname.value = p_name;

	cnPopup.show();

	return false;
}


// Change password request callback
function onChangePasswordResult(response)
{
	var userbtn, nameEl;

	var res = JSON.parse(response);

	if (!res)
		return;

	if (res.result == 'ok')
	{
		cpPopup.close();

		if (res.msg)
			createMessage(res.msg, 'msg_success');
	}
	else
	{
		if (res.msg)
			createMessage(res.msg, 'msg_error');
	}

	var frm = ge('changepass');
	if (frm)
		frm = frm.firstElementChild;
	if (frm)
		frm.reset();
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

	ajax.post(baseURL + 'api/profile/changepass',
				urlJoin({ 'current' : oldpwd.value, 'new' : newpwd.value }),
				onChangePasswordResult);

	return false;
}


// Create and show change password popup
function showChangePasswordPopup()
{
	var frm;

	if (!cpPopup)
	{
		cpPopup = Popup.create({ id : 'chpass_popup',
								title : 'Change password',
								content : ge('changepass'),
								additional : 'center_only chpass_popup' });
		frm = ge('changepass');
		if (frm)
			frm = frm.firstElementChild;

		cpPopup.setControls({ okBtn : { onclick : onChangePassSubmit.bind(null, frm) },
								closeBtn : true });
	}

	cpPopup.show();

	return false;
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
		var nameEl = null;

		if (userbtn.firstElementChild);
			nameEl = userbtn.firstElementChild.nextElementSibling;

		if (nameEl)
			nameEl.innerHTML = p_name;
	}
	else
	{
		if (res.msg)
			createMessage(res.msg, 'msg_error');
	}

	var frm = ge('changename');
	if (frm)
		frm = frm.firstElementChild;
	if (frm)
		frm.reset();
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

	ajax.post(baseURL + 'api/profile/changename',
				urlJoin({ 'name' : newname.value }),
				onChangeNameResult);

	return false;
}



var resetAccMsg = 'Are you sure want to reset all your accounts?<br>All accounts and transactions will be lost.';
var resetAllMsg = 'Are you sure to reset all your data?<br>Everything will be lost.';
var deleteMsg = 'Are you sure to completely delete your profile?<br>This operation can not be undone.';


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
						content : resetAccMsg,
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
		rAllPopup = Popup.create({ id : 'reset_all_warning',
						title : 'Reset all data',
						content : resetAllMsg,
						btn : { okBtn : { onclick : onResetAllPopup.bind(null, true) },
								cancelBtn : { onclick : onResetAllPopup.bind(null, false) } }
						});
	}

	rAllPopup.show();
}


// Reset accounts popup callback
function onDeletePopup(res)
{
	var delete_form;

	if (!delPopup)
		return;

	delPopup.close();

	if (res)
	{
		delete_form = ge('delete_form');
		if (delete_form)
			delete_form.submit();
	}
}


// Create and show delete profile warning popup
function showDeletePopup()
{
	if (!delPopup)
	{
		delPopup = Popup.create({ id : 'delete_warning',
						title : 'Delete profile',
						content : deleteMsg,
						btn : { okBtn : { onclick : onDeletePopup.bind(null, true) },
								cancelBtn : { onclick : onDeletePopup.bind(null, false) } }
						});
	}

	delPopup.show();
}


// Init statistics widget
function initStatWidget()
{
	Charts.createHistogram({ data : chartData, container : 'chart', height : 200 });
}


function initLoginPage()
{
	var loginfrm = ge('loginfrm');

	if (loginfrm)
		loginfrm.onsubmit = onLoginSubmit.bind(null, loginfrm);
}


function initRegisterPage()
{
	var regfrm = ge('regfrm');

	if (regfrm)
		regfrm.onsubmit = onRegisterSubmit.bind(null, regfrm);
}


function initProfilePage()
{
	var changeNameBtn = ge('changeNameBtn');
	if (changeNameBtn)
		changeNameBtn.onclick = showChangeNamePopup;

	var changePassBtn = ge('changePassBtn');
	if (changePassBtn)
		changePassBtn.onclick = showChangePasswordPopup;

	var resetAccBtn = ge('resetAccBtn');
	if (resetAccBtn)
		resetAccBtn.onclick = showResetAccountsPopup;

	var resetAllBtn = ge('resetAllBtn');
	if (resetAllBtn)
		resetAllBtn.onclick = showResetAllPopup;

	var delProfileBtn = ge('delProfileBtn');
	if (delProfileBtn)
		delProfileBtn.onclick = showDeletePopup;

	var frm;
	var changename = ge('changename');
	if (changename)
	{
		frm = changename.firstElementChild;
		if (frm)
			frm.onsubmit = onChangeNameSubmit.bind(null, frm);
	}

	var changepass = ge('changepass');
	if (changepass)
	{
		frm = changepass.firstElementChild;
		if (frm)
			frm.onsubmit = onChangePassSubmit.bind(null, frm);
	}
}
