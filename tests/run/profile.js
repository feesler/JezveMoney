import { LoginView } from '../view/login.js';
import { MainView } from '../view/main.js';
import { test } from '../common.js';
import { api } from '../model/api.js';
import { App } from '../app.js';
import { RegisterView } from '../view/register.js';
import { ProfileView } from '../view/profile.js';


async function checkLoginNavigation()
{
	if (App.view.isUserLoggedIn())
	{
		await App.view.logoutUser();
	}

	if (!(App.view instanceof LoginView))
		throw new Error('Wrong page');
}


async function checkProfileNavigation()
{
	await App.view.goToProfile();
	if (!(App.view instanceof ProfileView))
		throw new Error('Wrong page');
}


export async function relogin({ login, password })
{
	await checkLoginNavigation();

	await App.view.inputLogin(login);
	await App.view.inputPassword(password);

	let validInput = App.view.isValid();
	await App.view.submit();

	if (validInput)
	{
		App.view.expectedState = { msgPopup : null };
		await test('Test user login', () => App.view.checkState());

		await App.state.fetch();
	}
	else
	{
		await test('User login with invalid data', () => App.view instanceof LoginView);
	}
}


export async function register({ login, name, password })
{
	await checkLoginNavigation();
	await App.view.goToRegistration();

	await App.view.inputLogin(login);
	await App.view.inputName(name);
	await App.view.inputPassword(password);

	let validInput = App.view.isValid();
	await App.view.submit();

	if (validInput)
	{
		App.view.expectedState = { msgPopup : { success : true, message : 'You successfully registered.' } };

		await test('User registration', () => App.view.checkState());
		await App.view.closeNotification();

		await App.view.inputLogin(login);
		await App.view.inputPassword(password);
		await App.view.submit();
		App.view.expectedState = { msgPopup : null };
		await test('Login with new account', () => App.view.checkState());

		await App.state.fetch();
	}
	else
	{
		await test('User registration with invalid data', () => App.view instanceof RegisterView);
		await App.view.goToLogin();
	}
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


export async function changeName(newName)
{
	await test(`Change user name ('${newName}')`, async () =>
	{
		await checkProfileNavigation();

		let validInput = newName && newName.length > 0 && newName != App.state.profile.name;

		await App.view.changeName(newName);

		if (validInput)
		{
			App.state.changeName(newName);

			App.view.expectedState = {
				msgPopup : { success : true, message : 'User name successfully updated.' },
				header : { user : { name : newName } }
			};

			await App.view.checkState();
			await App.view.closeNotification();
		}

		return App.state.fetchAndTest();
	});
}


export async function changePass({ oldPassword, newPassword })
{
	await test(`Change password ('${oldPassword}' > '${newPassword}')`, async () =>
	{
		await checkProfileNavigation();

		let validInput = oldPassword && oldPassword.length > 0 &&
							newPassword && newPassword.length > 0 &&
							oldPassword != newPassword;

		await App.view.changePassword(oldPassword, newPassword);
		if (validInput)
		{
			App.view.expectedState = { msgPopup : { success : true, message : 'Password successfully updated.' } };

			await App.view.checkState();
			await App.view.closeNotification();

			await App.view.logoutUser();
			await App.view.inputLogin(App.state.profile.login);
			await App.view.inputPassword(newPassword);
			await App.view.submit();
			App.view.expectedState = { msgPopup : null };
			return App.view.checkState();
		}
		else
		{
			return App.view instanceof ProfileView;
		}
	});
}


export async function deleteProfile()
{
	await App.view.goToProfile();

	await App.view.deleteProfile();
	App.view.expectedState = { msgPopup : { success : true, message : 'Your profile is successfully deleted.' } };
	await test('Delete profile', () => App.view.checkState());

	await App.view.closeNotification();
}
