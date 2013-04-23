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
