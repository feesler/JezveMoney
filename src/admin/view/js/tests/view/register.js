if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var extend = common.extend;

	var TestView = require('./testview.js');
	var LoginView = require('./login.js');
}


// Log in view class
function RegisterView()
{
	RegisterView.parent.constructor.apply(this, arguments);
}


extend(RegisterView, TestView);


RegisterView.prototype.parseContent = async function()
{
	var res = { loginInp : await this.query('#login'),
 				nameInp : await this.query('#name'),
 				passwordInp : await this.query('#password'),
				submitBtn : await this.query('.login_controls .btn.ok_btn'),
				loginLink : await this.query('.login_controls .alter_link > a') };
	if (!res.loginInp || !res.nameInp || !res.passwordInp || !res.submitBtn || !res.loginLink)
		throw new Error('Unexpected structure of register view');

	return res;
};


RegisterView.prototype.registerAs = async function(login, name, password)
{
	let app = this.app;

	await this.input(this.content.loginInp, login);
	await this.input(this.content.nameInp, name);
 	await this.input(this.content.passwordInp, password);

	await this.navigation(() => this.click(this.content.submitBtn));

	let view = app.view;
	if (!(view instanceof LoginView))
		throw new Error('Unexpected page');

	if (!view.msgPopup || !view.msgPopup.success || view.msgPopup.message != 'You successfully registered.')
		throw new Error('Notification popup not appear');

	await view.performAction(() => view.msgPopup.close());
};


if (typeof module !== 'undefined' && module.exports)
	module.exports = RegisterView;
