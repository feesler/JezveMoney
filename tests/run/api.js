import { api } from '../api.js';
import * as AccountApiTests from './api/account.js';
import * as PersonApiTests from './api/person.js';
import * as TransactionApiTests from './api/transaction.js';
import { test } from '../common.js';
import { App } from '../app.js';
import { Transaction } from '../model/transaction.js';


export async function deleteUserIfExist({ login })
{
	let users = await api.user.list();
	let user = users.find(item => item.login == login);
	if (user)
		await api.user.del(user.id);
}


// Register new user and try to login
// Expected userData: { login, password, name }
export async function registerAndLogin(userData)
{
	await test('User registration', async () =>
	{
		await api.user.logout();

		if (!await api.user.register(userData))
			throw new Error('Fail to register user');

		if (!await api.user.login(userData))
			throw new Error('Fail to register user');

		App.state.deleteProfile();
		return App.state.fetchAndTest();
	});
}


// Try to login user
// UserData expected: { login, password }
export async function login(userData)
{
	await test('Login main user', () => api.user.login(userData));
	await App.state.fetch();
}


// Change user name and check update in profile
export async function changeName(name)
{
	await test('Change user name', async () =>
	{
		let chnameRes = await api.profile.changeName({ name })
		if (!chnameRes)
			throw new Error('Fail to change user name');

		App.state.changeName(name);
		return App.state.fetchAndTest();
	});
}


export async function changePassword({ user, newPassword })
{
	await test('Change user password', async () =>
	{
		await api.profile.changePassword({ oldPassword: user.password, newPassword })

		await api.user.logout();
		await api.user.login({
			login : user.login,
			password : newPassword
		});

		return api.profile.changePassword({ oldPassword: newPassword, newPassword : user.password })
	});
}


export async function resetAccounts()
{
	await test('Reset accounts', async () => 
	{
		await api.account.reset();

		App.state.resetAccounts();
		return true;
	});
}


export async function resetAll()
{
	await test('Reset all', async () => 
	{
		await api.profile.reset();

		App.state.resetAll();
		return true;
	});
}


export async function deleteProfile()
{
	await test('Delete user profile', async () =>
	{
		await api.profile.del();

		App.state.deleteProfile();
		return true;
	});
}


export async function createAccount(data)
{
	return AccountApiTests.create(data);
}


export async function updateAccount(data)
{
	return AccountApiTests.update(data);
}


export async function deleteAccounts(ids)
{
	return AccountApiTests.del(ids);
}


export async function createPerson(data)
{
	return PersonApiTests.create(data);
}


export async function updatePerson(data)
{
	return PersonApiTests.update(data);
}


export async function deletePersons(ids)
{
	return PersonApiTests.del(ids);
}


export async function createTransaction(data)
{
	return TransactionApiTests.create(data);
}


export async function extractAndCreateTransaction(data)
{
	let extracted = Transaction.extract(data, App.state);

	return createTransaction(extracted);
}


export async function updateTransaction(data)
{
	return TransactionApiTests.update(data);
}


export async function deleteTransactions(ids)
{
	return TransactionApiTests.del(ids);
}


export async function filterTransactions(data)
{
	return TransactionApiTests.filter(data);
}
