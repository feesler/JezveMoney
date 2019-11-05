if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var extend = common.extend;

	var TestView = require('./testview.js');
}


// Log in view class
function LoginView()
{
	LoginView.parent.constructor.apply(this, arguments);
}


extend(LoginView, TestView);


LoginView.prototype.parseContent = async function()
{
	var res = { loginInp : await this.query('#login'),
 				passwordInp : await this.query('#password'),
				submitBtn : await this.query('.login_controls .btn.ok_btn'),
				registerLink : await this.query('.login_controls .alter_link > a') };
	if (!res.loginInp || !res.passwordInp || !res.submitBtn || !res.registerLink)
		throw new Error('Wrong login view structure');

	return res;
};


LoginView.prototype.loginAs = async function(login, password)
{
	await this.input(this.content.loginInp, login);
 	await this.input(this.content.passwordInp, password);
	return this.navigation(() => this.click(this.content.submitBtn));
};


if (typeof module !== 'undefined' && module.exports)
	module.exports = LoginView;
