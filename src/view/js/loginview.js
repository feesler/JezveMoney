/**
 * User log in view
 */
function LoginView()
{
	LoginView.parent.constructor.apply(this, arguments);

	this.model = {};
}


extend(LoginView, View);


/**
 * View initialization
 */
LoginView.prototype.onStart = function()
{
	this.loginInp = ge('login');
	this.passwordInp = ge('password');
	this.form = ge('loginfrm');
	if (!this.loginInp || !this.passwordInp || !this.form)
		throw new Error('Failed to initialize Login view');

	this.loginInp.addEventListener('input', this.onLoginInput.bind(this));
	this.passwordInp.addEventListener('input', this.onPasswordInput.bind(this));

	this.form.onsubmit = this.onSubmit.bind(this);
};


/**
 * Login field input event handler
 */
LoginView.prototype.onLoginInput = function()
{
	this.clearBlockValidation('login-inp-block');
};


/**
 * Password field input event handler
 */
LoginView.prototype.onPasswordInput = function()
{
	this.clearBlockValidation('pwd-inp-block');
};


/**
 * Log in form submit event handler
 */
LoginView.prototype.onSubmit = function()
{
	var valid = true;

	if (!this.loginInp.value || this.loginInp.value.length < 1)
	{
		this.invalidateBlock('login-inp-block');
		valid = false;
	}

	if (!this.passwordInp.value || this.passwordInp.value.length < 1)
	{
		this.invalidateBlock('pwd-inp-block');
		valid = false;
	}

	return valid;
};
