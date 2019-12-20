import { TestView } from './testview.js';
import { LoginView } from './login.js';


// Registration view class
class RegisterView extends TestView
{
	async parseContent()
	{
		var res = { loginInp : await this.query('#login'),
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
	}
}


export { RegisterView };
