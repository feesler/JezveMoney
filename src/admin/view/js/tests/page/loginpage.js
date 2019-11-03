if (typeof module !== 'undefined' && module.exports)
{
	const _ = require('../../../../../view/js/common.js');
	var extend = _.extend;

	var TestPage = require('./page.js');
}


// Log in page class
function LoginPage()
{
	LoginPage.parent.constructor.apply(this, arguments);
}


extend(LoginPage, TestPage);


LoginPage.prototype.parseContent = async function()
{
	var res = { loginInp : await this.query('#login'),
 				passwordInp : await this.query('#password'),
				submitBtn : await this.query('.login_controls .btn.ok_btn'),
				registerLink : await this.query('.login_controls .alter_link > a') };
	if (!res.loginInp || !res.passwordInp || !res.submitBtn || !res.registerLink)
		throw new Error('Wrong login page structure');

	return res;
};


LoginPage.prototype.loginAs = async function(login, password)
{
	await this.input(this.content.loginInp, login);
 	await this.input(this.content.passwordInp, password);
	return this.navigation(() => this.click(this.content.submitBtn));
};


if (typeof module !== 'undefined' && module.exports)
	module.exports = LoginPage;
