
if (typeof module !== 'undefined' && module.exports)
{
	var LoginView = require('../view/login.js');
	var RegisterView = require('../view/register.js');
	var MainView = require('../view/main.js');
}


var runProfile = (function()
{
	let App = null;
	let test = null;
	let env = null;


	function onAppUpdate(props)
	{
		props = props || {};

		if ('App' in props)
		{
			App = props.App;
			test = App.test;
		}
	}


	async function reloginAs(view, userObj)
	{
		env = view.props.environment;

		if (!userObj || !userObj.login || !userObj.password)
			throw new Error('Wrong user object');

		if (view.isUserLoggedIn())
		{
			view = await view.logoutUser();
		}

		if (!(view instanceof LoginView))
			throw new Error('Wrong page');

		view = await view.loginAs(userObj.login, userObj.password);
		await test('Test user login', () => (view instanceof MainView), env);

		return view;
	}


	async function registrationTest(view, userObj)
	{
		env = view.props.environment;

		if (!userObj || !userObj.login || !userObj.name || !userObj.password)
			throw new Error('Wrong user object');

		if (view.isUserLoggedIn())
		{
			view = await view.logoutUser();
		}

		if (!(view instanceof LoginView))
			throw new Error('Unexpected page');

		view = await view.goToRegistration();
		if (!(view instanceof RegisterView))
			throw new Error('Unexpected page');

		await test('Test user resitration', async () =>
		{
			view = await view.registerAs(userObj.login, userObj.name, userObj.password);

			return true;
		}, env);

		await test('Login with new account', async () =>
		{
			view = await view.loginAs(userObj.login, userObj.password);
			if (!(view instanceof MainView))
				throw new Error('Fail to login');

			return true;
		}, env);

		return view;
	}


	async function resetAllTest(view)
	{
		env = view.props.environment;

		view = await view.goToProfile();
		view = await view.resetAll();

		await test('Reset all data', async () =>
		{
			view = await App.goToMainView(view);

			return App.checkObjValue(App.transactions, []) &&
						App.checkObjValue(App.accounts, []) &&
						App.checkObjValue(App.persons, []);
		}, env);


		return view;
	}


	async function changeNameTest(view)
	{
		env = view.props.environment;

		view = await view.goToProfile();

		await test('Change name', async () =>
		{
			let newName = '^^&&>>';

			if (view.header.user.name == newName)
				newName += ' 1';

			view = await view.changeName(newName);

			return view.header.user.name == newName;
		}, env);

		await test('Change name back', async () =>
		{
			let newName = 'Tester';
			view = await view.changeName(newName);

			return view.header.user.name == newName;
		}, env);

		return view;
	}


	async function changePasswordTest(view)
	{
		env = view.props.environment;

		view = await view.goToProfile();

		let newPass = '123';
		await test('Change password', async () =>
		{
			view = await view.changePassword(App.config.testUser.password, newPass);
			view = await reloginAs(view, { login : App.config.testUser.login, password : newPass });
			view = await view.goToProfile();

			return true;
		}, env);

		await test('Change password back', async () =>
		{
			view = await view.changePassword(newPass, App.config.testUser.password);
			view = await reloginAs(view, App.config.testUser);
			view = await view.goToProfile();

			return true;
		}, env);

		return view;
	}


	async function deleteProfileTest(view)
	{
		env = view.props.environment;

		view = await view.goToProfile();

		await test('Delete profile', async () =>
		{
			view = await view.deleteProfile();

			return true;
		}, env);

		return view;
	}

	return { onAppUpdate : onAppUpdate,
				relogin : reloginAs,
				register : registrationTest,
			 	resetAll : resetAllTest,
			 	changeName : changeNameTest,
				changePass : changePasswordTest,
				deleteProfile : deleteProfileTest };
})();


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runProfile;
}
