import { LoginView } from '../view/login.js';
import { RegisterView } from '../view/register.js';
import { MainView } from '../view/main.js';


var runProfile = (function()
{
	let test = null;
	let env = null;


	async function reloginAs(app, userObj)
	{
		env = app.view.props.environment;
		test = app.test;

		if (!userObj || !userObj.login || !userObj.password)
			throw new Error('Wrong user object');

		if (app.view.isUserLoggedIn())
		{
			await app.view.logoutUser();
		}

		if (!(app.view instanceof LoginView))
			throw new Error('Wrong page');

		await app.view.loginAs(userObj.login, userObj.password);
		await test('Test user login', () => (app.view instanceof MainView), env);
	}


	async function registrationTest(app, userObj)
	{
		env = app.view.props.environment;
		test = app.test;

		if (!userObj || !userObj.login || !userObj.name || !userObj.password)
			throw new Error('Wrong user object');

		if (app.view.isUserLoggedIn())
		{
			await app.view.logoutUser();
		}

		if (!(app.view instanceof LoginView))
			throw new Error('Unexpected page');

		await app.view.goToRegistration();
		if (!(app.view instanceof RegisterView))
			throw new Error('Unexpected page');

		await test('Test user resitration', async () =>
		{
			await app.view.registerAs(userObj.login, userObj.name, userObj.password);

			return true;
		}, env);

		await test('Login with new account', async () =>
		{
			await app.view.loginAs(userObj.login, userObj.password);
			if (!(app.view instanceof MainView))
				throw new Error('Fail to login');

			return true;
		}, env);
	}


	async function resetAllTest(app)
	{
		env = app.view.props.environment;
		test = app.test;

		await app.view.goToProfile();
		await app.view.resetAll();

		await test('Reset all data', async () =>
		{
			await app.goToMainView();

			return app.checkObjValue(app.transactions, []) &&
						app.checkObjValue(app.accountTiles, []) &&
						app.checkObjValue(app.personTiles, []);
		}, env);
	}


	async function changeNameTest(app)
	{
		env = app.view.props.environment;
		test = app.test;

		await app.view.goToProfile();

		await test('Change name', async () =>
		{
			let newName = '^^&&>>';

			if (app.view.header.user.name == newName)
				newName += ' 1';

			await app.view.changeName(newName);

			return app.view.header.user.name == newName;
		}, env);

		await test('Change name back', async () =>
		{
			let newName = 'Tester';
			await app.view.changeName(newName);

			return app.view.header.user.name == newName;
		}, env);
	}


	async function changePasswordTest(app)
	{
		env = app.view.props.environment;
		test = app.test;

		await app.view.goToProfile();

		let newPass = '123';
		await test('Change password', async () =>
		{
			await app.view.changePassword(app.config.testUser.password, newPass);
			await reloginAs(app, { login : app.config.testUser.login, password : newPass });
			await app.view.goToProfile();

			return true;
		}, env);

		await test('Change password back', async () =>
		{
			await app.view.changePassword(newPass, app.config.testUser.password);
			await reloginAs(app, app.config.testUser);
			await app.view.goToProfile();

			return true;
		}, env);
	}


	async function deleteProfileTest(app)
	{
		env = app.view.props.environment;
		test = app.test;

		await app.view.goToProfile();

		await test('Delete profile', async () =>
		{
			await app.view.deleteProfile();

			return true;
		}, env);
	}


	return { relogin : reloginAs,
				register : registrationTest,
			 	resetAll : resetAllTest,
			 	changeName : changeNameTest,
				changePass : changePasswordTest,
				deleteProfile : deleteProfileTest };
})();


export { runProfile };
