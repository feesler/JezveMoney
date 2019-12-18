if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var extend = common.extend;

	var TestView = require('./testview.js');
}


// Log in view class
class LoginView extends TestView
{
	async parseContent()
	{
		var res = { loginInp : await this.query('#login'),
	 				passwordInp : await this.query('#password'),
					submitBtn : await this.query('.login_controls .btn.ok_btn'),
					registerLink : await this.query('.login_controls .alter_link > a') };
		if (!res.loginInp || !res.passwordInp || !res.submitBtn || !res.registerLink)
			throw new Error('Wrong login view structure');

		return res;
	}


	async loginAs(login, password)
	{
		await this.input(this.content.loginInp, login);
	 	await this.input(this.content.passwordInp, password);
		await this.navigation(() => this.click(this.content.submitBtn));
	}


	async goToRegistration()
	{
		await this.navigation(() => this.click(this.content.registerLink));
	}
}



if (typeof module !== 'undefined' && module.exports)
	module.exports = LoginView;
