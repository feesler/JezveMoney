import { TestView } from './testview.js';
import { MainView } from './main.js';
import { RegisterView } from './register.js';
import { App } from '../app.js';


// Log in view class
export class LoginView extends TestView
{
	async parseContent()
	{
		let res = {
			loginInp : await this.query('#login'),
			passwordInp : await this.query('#password'),
			submitBtn : await this.query('.login_controls .btn.ok_btn'),
			registerLink : await this.query('.login_controls .alter_link > a')
		};

		if (!res.loginInp || !res.passwordInp || !res.submitBtn || !res.registerLink)
			throw new Error('Wrong login view structure');

		return res;
	}


	async loginAs(login, password)
	{
		await this.input(this.content.loginInp, login);
	 	await this.input(this.content.passwordInp, password);
		await this.navigation(() => this.click(this.content.submitBtn));

		if (!(App.view instanceof MainView))
			throw new Error('Fail to login');
	}


	async goToRegistration()
	{
		await this.navigation(() => this.click(this.content.registerLink));

		if (!(App.view instanceof RegisterView))
			throw new Error('Unexpected page');
	}
}

