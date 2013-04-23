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

	frm.submit();

	return true;
}