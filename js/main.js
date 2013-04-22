// Show/hide user menu by click
function onUserClick()
{
	var menupopup;

	menupopup = ge('menupopup');
	if (!menupopup)
		return;

	show(menupopup, !isVisible(menupopup));
}


// Login form submit event handler
function onLoginSubmit(frm)
{
	var login, password;

	login = ge('login');
	password = ge('password');
	if (!frm || !login || !password)
		return false;

	if (!login.value || login.value.length < 1)
	{
		alert('Please type your username.');
		return false;
	}

	if (!password.value || password.value.length < 1)
	{
		alert('Please type your password.');
		return false;
	}

	return true;
}
