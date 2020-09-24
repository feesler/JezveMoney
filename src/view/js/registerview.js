/**
 * User registration view
 */
function RegisterView()
{
	RegisterView.parent.constructor.apply(this, arguments);

	this.model = {};
}


extend(RegisterView, View);


/**
 * View initialization
 */
RegisterView.prototype.onStart = function()
{
	this.loginInp = ge('login');
	this.passwordInp = ge('password');
	this.nameInp = ge('name');
	this.form = ge('regfrm');
	if (!this.loginInp || !this.passwordInp || !this.nameInp || !this.form)
		throw new Error('Failed to initialize Login view');

	this.loginInp.addEventListener('input', this.onLoginInput.bind(this));
	this.passwordInp.addEventListener('input', this.onPasswordInput.bind(this));
	this.nameInp.addEventListener('input', this.onNameInput.bind(this));

	this.form.onsubmit = this.onSubmit.bind(this);
};


/**
 * Login field input event handler
 */
RegisterView.prototype.onLoginInput = function()
{
	clearBlockValidation('login-inp-block');
};


/**
 * Password field input event handler
 */
RegisterView.prototype.onPasswordInput = function()
{
	clearBlockValidation('pwd-inp-block');
};


/**
 * Password field input event handler
 */
RegisterView.prototype.onNameInput = function()
{
	clearBlockValidation('name-inp-block');
};


/**
 * Log in form submit event handler
 */
RegisterView.prototype.onSubmit = function()
{
	var valid = true;

	if (!this.loginInp.value || this.loginInp.value.length < 1)
	{
		invalidateBlock('login-inp-block');
		valid = false;
	}

	if (!this.nameInp.value || this.nameInp.value.length < 1)
	{
		invalidateBlock('name-inp-block');
		valid = false;
	}

	if (!this.passwordInp.value || this.passwordInp.value.length < 1)
	{
		invalidateBlock('pwd-inp-block');
		valid = false;
	}

	return valid;
};
