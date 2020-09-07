import { TestView } from './testview.js';
import { MainView } from './main.js';
import { RegisterView } from './register.js';
import { App } from '../app.js';
import { InputRow } from './component/inputrow.js';


// Log in view class
export class LoginView extends TestView
{
	async parseContent()
	{
		let res = {
			loginInp : await InputRow.create(this, await this.query('#login-inp-block')),
			passwordInp : await InputRow.create(this, await this.query('#pwd-inp-block')),
			submitBtn : await this.query('.login_controls .btn.ok_btn'),
			registerLink : await this.query('.login_controls .alter_link > a')
		};

		if (!res.loginInp || !res.passwordInp || !res.submitBtn || !res.registerLink)
			throw new Error('Wrong login view structure');

		return res;
	}


	async buildModel(cont)
	{
		let res = {};

		res.login = cont.loginInp.value;
		res.password = cont.passwordInp.value;

		return res;
	}


	isValid()
	{
		return (typeof this.model.login === 'string' && this.model.login.length > 0 &&
				typeof this.model.password === 'string' && this.model.password.length > 0);
	}


	async inputLogin(val)
	{
		await this.performAction(() => this.content.loginInp.input(val));
	}


	async inputPassword(val)
	{
		await this.performAction(() => this.content.passwordInp.input(val));
	}


	async submit()
	{
		let action = () => this.click(this.content.submitBtn);

		if (this.isValid())
		{
			await this.navigation(action);
			if (!(App.view instanceof MainView))
				throw new Error('Fail to login');
		}
		else
		{
			await this.performAction(action);
		}
	}


	async goToRegistration()
	{
		await this.navigation(() => this.click(this.content.registerLink));

		if (!(App.view instanceof RegisterView))
			throw new Error('Unexpected page');
	}
}

