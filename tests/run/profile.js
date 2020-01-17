import { LoginView } from '../view/login.js';
import { RegisterView } from '../view/register.js';
import { MainView } from '../view/main.js';


let runProfile =
{
	async relogin(userObj)
	{
		let env = this.environment;
		let test = this.test;

		if (!userObj || !userObj.login || !userObj.password)
			throw new Error('Wrong user object');

		if (this.view.isUserLoggedIn())
		{
			await this.view.logoutUser();
		}

		if (!(this.view instanceof LoginView))
			throw new Error('Wrong page');

		await this.view.loginAs(userObj.login, userObj.password);
		await test('Test user login', () => (this.view instanceof MainView), env);
	},


	async register(userObj)
	{
		let env = this.environment;
		let test = this.test;

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

		await test('Test user resitration', async () =>
		{
			await this.view.registerAs(userObj.login, userObj.name, userObj.password);

			return true;
		}, env);

		await test('Login with new account', async () =>
		{
			await this.view.loginAs(userObj.login, userObj.password);
			if (!(this.view instanceof MainView))
				throw new Error('Fail to login');

			return true;
		}, env);
	},


	async resetAll()
	{
		let env = this.environment;
		let test = this.test;

		await this.view.goToProfile();
		await this.view.resetAll();

		await test('Reset all data', async () =>
		{
			await this.goToMainView();

			return this.checkObjValue(this.transactions, []) &&
						this.checkObjValue(this.accountTiles, []) &&
						this.checkObjValue(this.personTiles, []);
		}, env);
	},


	async changeName()
	{
		let env = this.environment;
		let test = this.test;

		await this.view.goToProfile();

		await test('Change name', async () =>
		{
			let newName = '^^&&>>';

			if (this.view.header.user.name == newName)
				newName += ' 1';

			await this.view.changeName(newName);

			return this.view.header.user.name == newName;
		}, env);

		await test('Change name back', async () =>
		{
			let newName = 'Tester';
			await this.view.changeName(newName);

			return this.view.header.user.name == newName;
		}, env);
	},


	async changePass()
	{
		let env = this.environment;
		let test = this.test;
		let scope = this.run.profile;

		await this.view.goToProfile();

		let newPass = '123';
		await test('Change password', async () =>
		{
			await this.view.changePassword(this.config.testUser.password, newPass);
			await scope.relogin({ login : this.config.testUser.login, password : newPass });
			await this.view.goToProfile();

			return true;
		}, env);

		await test('Change password back', async () =>
		{
			await this.view.changePassword(newPass, this.config.testUser.password);
			await scope.relogin(this.config.testUser);
			await this.view.goToProfile();

			return true;
		}, env);
	},


	async deleteProfile()
	{
		let env = this.environment;
		let test = this.test;

		await this.view.goToProfile();

		await test('Delete profile', async () =>
		{
			await this.view.deleteProfile();

			return true;
		}, env);
	}
};


export { runProfile };
