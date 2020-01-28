import { TestView } from './testview.js';
import { LoginView } from './login.js';
import { App } from '../main.js';


// Registration view class
class RegisterView extends TestView
{
	async parseContent()
	{
		let res = { loginInp : await this.query('#login'),
	 				nameInp : await this.query('#name'),
	 				passwordInp : await this.query('#password'),
					submitBtn : await this.query('.login_controls .btn.ok_btn'),
					loginLink : await this.query('.login_controls .alter_link > a') };
		if (!res.loginInp || !res.nameInp || !res.passwordInp || !res.submitBtn || !res.loginLink)
			throw new Error('Unexpected structure of register view');

		return res;
	}


	async registerAs(login, name, password)
	{
		await this.input(this.content.loginInp, login);
		await this.input(this.content.nameInp, name);
	 	await this.input(this.content.passwordInp, password);

		await this.navigation(() => this.click(this.content.submitBtn));

		if (!(App.view instanceof LoginView))
			throw new Error('Unexpected page');

		if (!App.view.msgPopup || !App.view.msgPopup.success || App.view.msgPopup.message != 'You successfully registered.')
			throw new Error('Notification popup not appear');

		await App.view.performAction(() => App.view.msgPopup.close());
	}
}


export { RegisterView };
