// Log in form submit event handler
function onLoginSubmit(frm)
{

	var login = ge('login');
	var password = ge('password');
	if (!frm || !login || !password)
		return false;

	var valid = true;

	if (!login.value || login.value.length < 1)
	{
		invalidateBlock('login-inp-block');
		valid = false;
	}

	if (!password.value || password.value.length < 1)
	{
		invalidateBlock('pwd-inp-block');
		valid = false;
	}

	return valid;
}


// Registration form submit event handler
function onRegisterSubmit(frm)
{
	var login = ge('login');
	var password = ge('password');
	var name = ge('name');
	if (!frm || !login || !password || !name)
		return false;

	var valid = true;

	if (!login.value || login.value.length < 1)
	{
		invalidateBlock('login-inp-block');
		valid = false;
	}

	if (!name.value || name.value.length < 1)
	{
		invalidateBlock('name-inp-block');
		valid = false;
	}

	if (!password.value || password.value.length < 1)
	{
		invalidateBlock('pwd-inp-block');
		valid = false;
	}

	return valid;
}


// Init statistics widget
function initStatWidget()
{
	Charts.createHistogram({ data : chartData, container : 'chart', height : 200 });
}


function onInputLogin()
{
	clearBlockValidation('login-inp-block');
}


function onInputPassword()
{
	clearBlockValidation('pwd-inp-block');
}


function onInputName()
{
	clearBlockValidation('name-inp-block');
}


function initLoginPage()
{
	var loginInp = ge('login');
	if (loginInp)
		loginInp.addEventListener('input', onInputLogin);

	var pwdInp = ge('password');
	if (pwdInp)
		pwdInp.addEventListener('input', onInputPassword);

	var loginfrm = ge('loginfrm');
	if (loginfrm)
		loginfrm.onsubmit = onLoginSubmit.bind(null, loginfrm);
}


function initRegisterPage()
{
	var loginInp = ge('login');
	if (loginInp)
		loginInp.addEventListener('input', onInputLogin);

	var pwdInp = ge('password');
	if (pwdInp)
		pwdInp.addEventListener('input', onInputPassword);

	var nameInp = ge('name');
	if (nameInp)
		nameInp.addEventListener('input', onInputName);

	var regfrm = ge('regfrm');
	if (regfrm)
		regfrm.onsubmit = onRegisterSubmit.bind(null, regfrm);
}

