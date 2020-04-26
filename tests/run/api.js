import { api } from '../api.js';
import * as AccountApiTests from './api/account.js';
import * as PersonApiTests from './api/person.js';
import * as TransactionApiTests from './api/transaction.js';
import { test } from '../common.js';
import { App } from '../app.js';
import { EXPENSE, INCOME, TRANSFER, DEBT, Transaction } from '../model/transaction.js';


export async function run()
{
	let env = App.environment;

	const RUB = 1;
	const USD = 2;
	const EUR = 3;

	let newApiTesterName = 'App tester';

	env.setBlock('API tests', 1);

	const actions = {
		account : AccountApiTests,
		person : PersonApiTests,
		transaction : TransactionApiTests,
	};

	// Register new user
	env.setBlock('User', 2);

	// Remove apiTestUser is exist
	let users = await api.user.list();
	let apiUser = users.find(item => item.login == App.config.apiTestUser.login);
	if (apiUser)
		await api.user.del(apiUser.id);

	// Register new user
	await api.user.logout();
	await test('User registration', () => api.user.register(App.config.apiTestUser));

	await test('Login new user', () => api.user.login(App.config.apiTestUser));
	await App.state.fetch();

	env.setBlock('Profile', 2);

	await test('Change user name', async () =>
	{
		let chnameRes = await api.profile.changeName({ name : newApiTesterName })
		if (!chnameRes)
			throw new Error('Fail to change user name');

		let profileData = await api.profile.read();
		return (profileData && profileData.name == newApiTesterName);
	});

	let newPass = '54321';
	await test('Change user password', async () =>
	{
		let chpassRes = await api.profile.changePassword({ oldPassword: App.config.apiTestUser.password, newPassword: newPass })
		if (!chpassRes)
			throw new Error('Fail to change user password');

		await api.user.logout();
		let loginRes = await api.user.login({
			login : App.config.apiTestUser.login,
			password : newPass
		});

		if (loginRes)
			App.config.apiTestUser.password = newPass;

		return loginRes;
	});

	env.setBlock('Prepare data for security tests', 2);
	await App.state.fetch();

	let apiTestUserData = {
		accounts : [
			{ name : 'RUB', curr_id : RUB, initbalance : 100.1, icon : 5 },
			{ name : 'USD', curr_id : USD, initbalance : 50, icon : 2 },
		],
		persons : [
			{ name : 'API user Person' }
		]
	};

	App.runner.addGroup(actions.account.create, apiTestUserData.accounts);
	App.runner.addGroup(actions.person.create, apiTestUserData.persons);

	const [
		API_USER_ACC_RUB,
		API_USER_ACC_USD,
		API_USER_PERSON,
	] = await App.runner.run();

	apiTestUserData.transactions = [
		{ type : EXPENSE, src_id: API_USER_ACC_RUB, src_amount: 100 }
	].map(item => Transaction.extract(item, App.state));

	const [ API_USER_TRANSACTION ] = await App.runner.runGroup(actions.transaction.create, apiTestUserData.transactions);

	// Login with main test user
	await test('Login main user', () => api.user.login(App.config.testUser));
	await App.state.fetch();

	await test('Reset all data', () => api.profile.reset());
	App.state.resetAll();

	env.setBlock('Accounts', 2);

	await test('Reset accounts', () => api.account.reset());
	App.state.resetAccounts();

	const createAccData = [
		{ name : 'acc ru', curr_id : RUB, initbalance : 100, icon : 1 },
		{ name : 'cash ru', curr_id : RUB, initbalance : 5000, icon : 3 },
		{ name : 'acc usd', curr_id : USD, initbalance : 10.5, icon : 5 },
		// Try to create account with existing name
		{ name : 'acc ru', curr_id : USD, initbalance : 10.5, icon : 0 },
	];

	const [ ACC_RUB, CASH_RUB, ACC_USD ] = await App.runner.runGroup(actions.account.create, createAccData);

	/**
	 * Security tests of accounts
	 */
	env.setBlock('Accounts security', 2);
	await actions.account.update({ id : API_USER_ACC_RUB, name : 'EUR', curr_id : EUR, initbalance : 10, icon : 2 });
	await actions.account.del(API_USER_ACC_RUB);


	env.setBlock('Persons', 2);

	const createPersonData = [
		{ name : 'Person X' },
		{ name : 'Y' },
		// Try to create person with existing name
		{ name : 'Y' },
	];

	const [ PERSON_X, PERSON_Y ] = await App.runner.runGroup(actions.person.create, createPersonData);

	/**
	 * Security tests of persons
	 */
	env.setBlock('Persons security', 2);
	await actions.person.update({ id : API_USER_PERSON, name : 'API Person' });
	await actions.person.del(API_USER_PERSON);


	env.setBlock('Transactions', 2);

	/**
	 * Create transactions
	 */
	env.setBlock('Create', 3);
	const transactionsData = [
		{ type : EXPENSE, src_id : ACC_RUB, src_amount : 100, comment: '11' },
		{ type : EXPENSE, src_id : ACC_RUB, src_amount : 7608, dest_amount : 100, dest_curr : EUR, comment : '22' },
		{ type : EXPENSE, src_id : ACC_USD, src_amount : 1, date : App.dates.yesterday },
		{ type : INCOME, dest_id : ACC_RUB, dest_amount : 1000.50 },
		{ type : INCOME, dest_id : ACC_USD, src_amount : 6500, dest_amount : 100, src_curr : RUB },
		{ type : TRANSFER, src_id : ACC_RUB, dest_id : CASH_RUB, src_amount : 500, dest_amount : 500 },
		{ type : TRANSFER, src_id : ACC_RUB, dest_id : ACC_USD, src_amount : 6500, dest_amount : 100 },
		{ type : DEBT, op : 1, person_id : PERSON_X, acc_id : 0, src_amount : 500, src_curr : RUB },
		{ type : DEBT, op : 2, person_id : PERSON_Y, acc_id : 0, src_amount : 1000, src_curr : USD },
		{ type : DEBT, op : 1, person_id : PERSON_X, acc_id : 0, src_amount : 500, src_curr : RUB },
		{ type : DEBT, op : 2, person_id : PERSON_Y, acc_id : 0, src_amount : 1000, src_curr : USD },
	];
	
	const [
		TR_EXPENSE_1, TR_EXPENSE_2, TR_EXPENSE_3,
		TR_INCOME_1, TR_INCOME_2,
		TR_TRANSFER_1, TR_TRANSFER_2,
		TR_DEBT_1, TR_DEBT_2, TR_DEBT_3
	] = await App.runner.runGroup(actions.transaction.create, transactionsData.map(item => Transaction.extract(item, App.state)));

	/**
	 * Update transactions
	 */
	env.setBlock('Update', 3);

	const updateTransData = [
		{ id : TR_EXPENSE_1, src_id : CASH_RUB },
		{ id : TR_EXPENSE_2, dest_amount : 7608, dest_curr : RUB },
		{ id : TR_EXPENSE_3, dest_amount : 0.89, dest_curr : EUR, date : App.dates.weekAgo },
		{ id : TR_INCOME_1, dest_id : CASH_RUB },
		{ id : TR_INCOME_2, src_amount : 100, src_curr : USD },
		{ id : TR_TRANSFER_1, dest_id : ACC_USD, dest_curr : USD, dest_amount : 8 },
		{ id : TR_TRANSFER_2, dest_id : CASH_RUB, dest_curr : RUB, dest_amount : 6500, date : App.dates.yesterday },
		{ id : TR_DEBT_1, op : 2 },
		{ id : TR_DEBT_2, person_id : PERSON_Y, acc_id : 0 },
		{ id : TR_DEBT_3, op : 1, acc_id : ACC_RUB },
	];

	await App.runner.runGroup(actions.transaction.update, updateTransData);

	/**
	 * Security tests for create transactions
	 */
	env.setBlock('Transaction security', 2);
	env.setBlock('Create', 3);

	const createTransSecurityData = [
		{ type : EXPENSE, src_id : API_USER_ACC_RUB, dest_id : 0, src_curr : RUB, dest_curr : RUB, src_amount : 100, dest_amount : 100 },
		{ type : INCOME, src_id : 0, dest_id : API_USER_ACC_RUB, src_curr : RUB, dest_curr : RUB, src_amount : 100, dest_amount : 100 },
		{ type : TRANSFER, src_id : CASH_RUB, dest_id : API_USER_ACC_RUB, src_curr : RUB, dest_curr : RUB, src_amount : 100, dest_amount : 100 },
		{ type : DEBT, op : 1, person_id : API_USER_PERSON, acc_id : 0, src_curr : RUB, dest_curr : RUB, src_amount : 100, dest_amount : 100 },
	];

	await App.runner.runGroup(actions.transaction.create, createTransSecurityData);

	/**
	 * Security tests for update transactions
	 */
	env.setBlock('Update', 3);

	const updTransSecurityData = [
		{ id : TR_EXPENSE_1, src_id : API_USER_ACC_RUB },
		{ id : TR_INCOME_1, dest_id : API_USER_ACC_RUB },
		{ id : TR_TRANSFER_1, src_id : API_USER_ACC_RUB, dest_id : API_USER_ACC_USD },
		// Trying to update transaction of another user
		{ id: API_USER_TRANSACTION, type : EXPENSE, src_id : CASH_RUB, dest_id : 0, src_curr : RUB, dest_curr : RUB, src_amount : 100, dest_amount : 100 },
		// Trying to set person of another user
		{ id: TR_DEBT_1, person_id : API_USER_PERSON },
		// Trying to set account of another user
		{ id: TR_DEBT_2, acc_id : API_USER_ACC_RUB },
		// Trying to set both person and account of another user
		{ id: TR_DEBT_3, person_id : API_USER_PERSON, acc_id : API_USER_ACC_RUB },
	];

	await App.runner.runGroup(actions.transaction.update, updTransSecurityData);

	/**
	 * Security tests for delete transaction
	 */
	env.setBlock('Delete', 3);
	await actions.transaction.del([ API_USER_TRANSACTION ]);


	/**
	 * Filter transactions
	 */
	env.setBlock('Filter transactions', 2);

	const trasnFilterData = [
		{ type : DEBT },
		{ accounts : ACC_RUB },
		{ type : DEBT, accounts : ACC_RUB },
		{ onPage : 10 },
		{ onPage : 10, page : 2 },
		{ startDate : App.dates.now, endDate : App.dates.weekAfter },
		{ startDate : App.dates.now, endDate : App.dates.weekAfter, search : '1' },
	];

	await App.runner.runGroup(actions.transaction.filter, trasnFilterData);

	/**
	 * Update accounts
	 */
	const updAccData = [
		{ id : ACC_RUB, name : 'acc rub', curr_id : USD, initbalance : 101, icon : 2 },
		// Try to update name of account to an existing one
		{ id : CASH_RUB, name : 'acc rub' },
	];

	await App.runner.runGroup(actions.account.update, updAccData);

	/**
	 * Delete accounts
	 */
	await actions.account.del([ ACC_USD, CASH_RUB ]);

	/**
	 * Update person
	 */
	const updPersonData = [
		{ id : PERSON_X, name : 'XX!' },
		// Try to update name of person to an existing one
		{ id : PERSON_X, name : 'XX!' },
	];

	await App.runner.runGroup(actions.person.update, updPersonData);

	/**
	 * Delete person
	 */
	await actions.person.del(PERSON_Y);

	/**
	 * Delete transaction
	 */
	await actions.transaction.del([ TR_EXPENSE_2, TR_TRANSFER_1, TR_DEBT_3 ]);

	/**
	 * Delete user profile
	 */
	await test('Login new user', () => api.user.login(App.config.apiTestUser));
	await test('Delete user profile', () => api.profile.del());

	await api.user.login(App.config.testUser);
}

