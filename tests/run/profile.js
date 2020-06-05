import { LoginView } from '../view/login.js';
import { MainView } from '../view/main.js';
import { test } from '../common.js';
import { api } from '../model/api.js';
import { App } from '../app.js';


export async function relogin(userObj)
{
	if (!userObj || !userObj.login || !userObj.password)
		throw new Error('Wrong user object');

	if (App.view.isUserLoggedIn())
	{
		await App.view.logoutUser();
	}

	if (!(App.view instanceof LoginView))
		throw new Error('Wrong page');

	await App.view.loginAs(userObj.login, userObj.password);
	App.view.expectedState = { msgPopup : null };
	await test('Test user login', () => App.view.checkState());

	await App.state.fetch();
}


export async function register(userObj)
{
	if (!userObj || !userObj.login || !userObj.name || !userObj.password)
		throw new Error('Wrong user object');

	// Check user not exist
	let users = await api.user.list();
	let apiUser = users.find(item => item.login == userObj.login);
	if (apiUser)
		await api.user.del(apiUser.id);

	if (App.view.isUserLoggedIn())
	{
		await App.view.logoutUser();
	}

	if (!(App.view instanceof LoginView))
		throw new Error('Unexpected page');

	await App.view.goToRegistration();

	await App.view.registerAs(userObj.login, userObj.name, userObj.password);
	App.view.expectedState = { msgPopup : { success : true, message : 'You successfully registered.' } };

	await test('User registration', () => App.view.checkState());
	await App.view.closeNotification();

	await App.view.loginAs(userObj.login, userObj.password);
	App.view.expectedState = { msgPopup : null };
	await test('Login with new account', () => App.view.checkState());

	await App.state.fetch();
}


export async function resetAccounts()
{
	App.state.resetAccounts();

	await App.view.goToProfile();
	await App.view.resetAccounts();

	App.view.expectedState = { msgPopup : { success : true, message : 'Accounts successfully reseted' } };
	await test('Reset accounts data', () => App.view.checkState());

	await App.view.closeNotification();
	await App.goToMainView();

	App.view.expectedState = MainView.render(App.state);
	await test('Main view update', () => App.view.checkState());
}


export async function resetAll()
{
	App.state.resetAll();

	await App.view.goToProfile();
	await App.view.resetAll();

	App.view.expectedState = { msgPopup : { success : true, message : 'All data successfully reseted.' } };
	await test('Reset all data', () => App.view.checkState());

	await App.view.closeNotification();
	await App.goToMainView();

	App.view.expectedState = MainView.render(App.state);
	await test('Main view update', () => App.view.checkState());
}


export async function changeName()
{
	await App.view.goToProfile();

	await test('Change name', async () =>
	{
		let newName = '^^&&>>';

		if (App.view.header.user.name == newName)
			newName += ' 1';

		await App.view.changeName(newName);

		App.view.expectedState = {
			msgPopup : { success : true, message : 'User name successfully updated.' },
			header : { user : { name : newName } }
		};

		return App.view.checkState();
	});
	await App.view.closeNotification();

	await test('Change name back', async () =>
	{
		let newName = 'Tester';
		await App.view.changeName(newName);

		App.view.expectedState = {
			msgPopup : { success : true, message : 'User name successfully updated.' },
			header : { user : { name : newName } }
		};

		return App.view.checkState();
	});
	await App.view.closeNotification();
}


export async function changePass()
{
	await App.view.goToProfile();

	let newPass = '123';
	await test('Change password', async () =>
	{
		await App.view.changePassword(App.config.testUser.password, newPass);
		App.view.expectedState = { msgPopup : { success : true, message : 'Password successfully updated.' } };

		return App.view.checkState();
	});
	await App.view.closeNotification();

	await test('Login with new password', async () =>
	{
		await relogin({ login : App.config.testUser.login, password : newPass });
		await App.view.goToProfile();

		return true;
	});

	await test('Change password back', async () =>
	{
		await App.view.changePassword(newPass, App.config.testUser.password);
		App.view.expectedState = { msgPopup : { success : true, message : 'Password successfully updated.' } };

		return App.view.checkState();
	});
	await App.view.closeNotification();

	await relogin(App.config.testUser);
	await App.view.goToProfile();
}


export async function deleteProfile()
{
	await App.view.goToProfile();

	await App.view.deleteProfile();
	App.view.expectedState = { msgPopup : { success : true, message : 'Your profile is successfully deleted.' } };
	await test('Delete profile', () => App.view.checkState());

	await App.view.closeNotification();
}
