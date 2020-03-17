import { LoginView } from '../view/login.js';
import { RegisterView } from '../view/register.js';
import { MainView } from '../view/main.js';
import { setParam, test, formatDate, checkObjValue } from '../common.js';


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
		this.view.expectedState = { msgPopup : null };
		await test('Test user login', () => {}, this.view);
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

		await this.view.registerAs(userObj.login, userObj.name, userObj.password);
		this.view.expectedState = { msgPopup : { success : true, message : 'You successfully registered.' } };

		await test('User registration', () => {}, this.view);
		await this.view.closeNotification();

		await this.view.loginAs(userObj.login, userObj.password);
		this.view.expectedState = { msgPopup : null };
		await test('Login with new account', () => {}, this.view);
	},


	async resetAccounts()
	{
		let persons = await this.state.getPersonsList();

		this.state.cleanCache();

		await this.view.goToProfile();
		await this.view.resetAccounts();

		this.view.expectedState = { msgPopup : { success : true, message : 'Accounts successfully reseted' } };
		await test('Reset accounts data', () => {}, this.view);

		await this.view.closeNotification();
		await this.goToMainView();

		this.view.expectedState = await this.state.render([], persons, []);
		await test('Main view update', () => {}, this.view);
	},


	async resetAll()
	{
		this.state.cleanCache();

		await this.view.goToProfile();
		await this.view.resetAll();

		this.view.expectedState = { msgPopup : { success : true, message : 'All data successfully reseted.' } };
		await test('Reset all data', () => {}, this.view);

		await this.view.closeNotification();
		await this.goToMainView();

		this.view.expectedState = await this.state.render([], [], []);
		await test('Main view update', () => {}, this.view);
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

			this.view.expectedState = {
				msgPopup : { success : true, message : 'User name successfully updated.' },
				header : { user : { name : newName } }
			};
		}, this.view);
		await this.view.closeNotification();

		await test('Change name back', async () =>
		{
			let newName = 'Tester';
			await this.view.changeName(newName);

			this.view.expectedState = {
				msgPopup : { success : true, message : 'User name successfully updated.' },
				header : { user : { name : newName } }
			};
		}, this.view);
		await this.view.closeNotification();
	},


	async changePass()
	{
		let scope = this.run.profile;

		await this.view.goToProfile();

		let newPass = '123';
		await test('Change password', async () =>
		{
			await this.view.changePassword(this.config.testUser.password, newPass);
			this.view.expectedState = { msgPopup : { success : true, message : 'Password successfully updated.' } };
		}, this.view);
		await this.view.closeNotification();

		await test('Login with new password', async () =>
		{
			await scope.relogin({ login : this.config.testUser.login, password : newPass });
			await this.view.goToProfile();

			return true;
		}, this.environment);

		await test('Change password back', async () =>
		{
			await this.view.changePassword(newPass, this.config.testUser.password);
			this.view.expectedState = { msgPopup : { success : true, message : 'Password successfully updated.' } };
		}, this.view);
		await this.view.closeNotification();

		await scope.relogin(this.config.testUser);
		await this.view.goToProfile();
	},


	async deleteProfile()
	{
		await this.view.goToProfile();

		await this.view.deleteProfile();
		this.view.expectedState = { msgPopup : { success : true, message : 'Your profile is successfully deleted.' } };
		await test('Delete profile', () => {}, this.view);

		await this.view.closeNotification();
	}
};


export { runProfile };
