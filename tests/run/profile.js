import { LoginView } from '../view/login.js';
import { RegisterView } from '../view/register.js';
import { MainView } from '../view/main.js';
import { test, formatDate, checkObjValue } from '../common.js';


let runProfile =
{
	async relogin(userObj)
	{
		if (!userObj || !userObj.login || !userObj.password)
			throw new Error('Wrong user object');

		if (this.view.isUserLoggedIn())
		{
			await this.view.logoutUser();
		}

		if (!(this.view instanceof LoginView))
			throw new Error('Wrong page');

		await this.view.loginAs(userObj.login, userObj.password);
		await test('Test user login', () => (this.view instanceof MainView), this.environment);
	},


	async register(userObj)
	{
		if (!userObj || !userObj.login || !userObj.name || !userObj.password)
			throw new Error('Wrong user object');

		if (this.view.isUserLoggedIn())
		{
			await this.view.logoutUser();
		}

		if (!(this.view instanceof LoginView))
			throw new Error('Unexpected page');

		await this.view.goToRegistration();
		if (!(this.view instanceof RegisterView))
			throw new Error('Unexpected page');

		await test('Test user regitration', async () =>
		{
			await this.view.registerAs(userObj.login, userObj.name, userObj.password);

			return true;
		}, this.environment);

		await test('Login with new account', async () =>
		{
			await this.view.loginAs(userObj.login, userObj.password);
			if (!(this.view instanceof MainView))
				throw new Error('Fail to login');

			return true;
		}, this.environment);
	},


	async resetAll()
	{
		await this.view.goToProfile();
		await this.view.resetAll();

		await this.goToMainView();

		this.view.expectedState = await this.state.render([], [], []);
		await test('Reset all data', () => {}, this.view);
	},


	async changeName()
	{
		await this.view.goToProfile();

		await test('Change name', async () =>
		{
			let newName = '^^&&>>';

			if (this.view.header.user.name == newName)
				newName += ' 1';

			await this.view.changeName(newName);

			return this.view.header.user.name == newName;
		}, this.environment);

		await test('Change name back', async () =>
		{
			let newName = 'Tester';
			await this.view.changeName(newName);

			return this.view.header.user.name == newName;
		}, this.environment);
	},


	async changePass()
	{
		let scope = this.run.profile;

		await this.view.goToProfile();

		let newPass = '123';
		await test('Change password', async () =>
		{
			await this.view.changePassword(this.config.testUser.password, newPass);
			await scope.relogin({ login : this.config.testUser.login, password : newPass });
			await this.view.goToProfile();

			return true;
		}, this.environment);

		await test('Change password back', async () =>
		{
			await this.view.changePassword(newPass, this.config.testUser.password);
			await scope.relogin(this.config.testUser);
			await this.view.goToProfile();

			return true;
		}, this.environment);
	},


	async deleteProfile()
	{
		await this.view.goToProfile();

		await test('Delete profile', async () =>
		{
			await this.view.deleteProfile();

			return true;
		}, this.environment);
	}
};


export { runProfile };
