import { api } from '../api.js';
import { runAccountAPI } from './api/account.js';
import { runPersonAPI } from './api/person.js';
import { runTransactionAPI } from './api/transaction.js';
import { EXPENSE, INCOME, TRANSFER, DEBT, test, formatDate } from '../common.js';


let runAPI =
{
	async run()
	{
		let env = this.environment;

		const RUB = 1;
		const USD = 2;
		const EUR = 3;

		let newApiTesterName = 'App tester';

		env.setBlock('API tests', 1);

		this.run.api.account = this.bindRunner(runAccountAPI);
		this.run.api.person = this.bindRunner(runPersonAPI);
		this.run.api.transaction = this.bindRunner(runTransactionAPI);

		const account = this.run.api.account;
		const person = this.run.api.person;
		const transaction = this.run.api.transaction;

		// Register new user
		env.setBlock('User', 2);

		// Remove apiTestUser is exist
		let users = await api.user.list();
		let apiUser = users.find(item => item.login == this.config.apiTestUser.login);
		if (apiUser)
			await api.user.del(apiUser.id);

		// Register new user
		await api.user.logout();
		await test('User registration', () => api.user.register(this.config.apiTestUser), env);

		await test('Login new user', () => api.user.login(this.config.apiTestUser), env);

		env.setBlock('Profile', 2);

		await test('Change user name', async () =>
		{
			let chnameRes = await api.profile.changeName({ name : newApiTesterName })
			if (!chnameRes)
				throw new Error('Fail to change user name');

			let profileData = await api.profile.read();
			return (profileData && profileData.name == newApiTesterName);
		}, env);

		let newPass = '54321';
		await test('Change user password', async () =>
		{
			let chpassRes = await api.profile.changePassword({ oldPassword: this.config.apiTestUser.password, newPassword: newPass })
			if (!chpassRes)
				throw new Error('Fail to change user password');

			await api.user.logout();
			let loginRes = await api.user.login({
				login : this.config.apiTestUser.login,
				password : newPass
			});

			if (loginRes)
				this.config.apiTestUser.password = newPass;

			return loginRes;
		}, env);

		env.setBlock('Prepare data for security tests', 2);

		const API_USER_ACC_RUB = await account.createTest({ name : 'RUB', curr_id : RUB, balance : 100.1, icon : 5 });
		const API_USER_ACC_USD = await account.createTest({ name : 'USD', curr_id : USD, balance : 50, icon : 2 });
		const API_USER_PERSON = await person.createTest({ name : 'API user Person' });
		const API_USER_TRANSACTION = await transaction.createExpenseTest({
			src_id: API_USER_ACC_RUB,
			src_amount: 100
		});

		this.state.cleanCache();

		// Login with main test user
		await test('Login main user', () => api.user.login(this.config.testUser), env);

		await test('Reset all data', () => api.profile.reset(), env);

		env.setBlock('Accounts', 2);

		await test('Reset accounts', () => api.account.reset(), env);

		let ACC_RUB = await account.createTest({ name : 'acc ru', curr_id : RUB, balance : 100, icon : 1 });
		let CASH_RUB = await account.createTest({ name : 'cash ru', curr_id : RUB, balance : 5000, icon : 3 });
		let ACC_USD = await account.createTest({ name : 'acc usd', curr_id : USD, balance : 10.5, icon : 5 });

		// Try to create account with existing name
		await account.createTest({ name : 'acc ru', curr_id : USD, balance : 10.5, icon : 0 });

		/**
		 * Security tests of accounts
		 */
		env.setBlock('Accounts security', 2);
		await account.updateTest(API_USER_ACC_RUB, { name : 'EUR', curr_id : EUR, balance : 10, icon : 2 });
		await account.deleteTest(API_USER_ACC_RUB);


		env.setBlock('Persons', 2);

		let PERSON_X = await person.createTest({ name : 'Person X' });
		let PERSON_Y = await person.createTest({ name : 'Y' });

		// Try to create person with existing name
		await person.createTest({ name : 'Y' });

		/**
		 * Security tests of persons
		 */
		env.setBlock('Persons security', 2);
		await person.updateTest(API_USER_PERSON, { name : 'API Person' });
		await person.deleteTest(API_USER_PERSON);


		env.setBlock('Transactions', 2);


		/**
		 * Create transactions
		 */
		env.setBlock('Create', 3);

		const TR_EXPENSE_1 = await transaction.createExpenseTest({ src_id : ACC_RUB,
														src_amount : 100,
													 	comment: '11' });
		const TR_EXPENSE_2 = await transaction.createExpenseTest({ src_id : ACC_RUB,
														src_amount : 7608,
														dest_amount : 100,
														dest_curr : EUR,
													 	comment: '22' });
		const TR_EXPENSE_3 = await transaction.createExpenseTest({ src_id : ACC_USD,
														src_amount : 1,
														date : this.dates.yesterday });

		const TR_INCOME_1 = await transaction.createIncomeTest({ dest_id : ACC_RUB,
														dest_amount : 1000.50 });
		const TR_INCOME_2 = await transaction.createIncomeTest({ dest_id : ACC_USD,
													 	src_amount : 6500,
													 	dest_amount : 100,
														src_curr : RUB });

		const TR_TRANSFER_1 = await transaction.createTransferTest({ src_id : ACC_RUB,
															dest_id : CASH_RUB,
														 	src_amount : 500,
														 	dest_amount : 500 });
		const TR_TRANSFER_2 = await transaction.createTransferTest({ src_id : ACC_RUB,
															dest_id : ACC_USD,
														 	src_amount : 6500,
														 	dest_amount : 100 });

		const TR_DEBT_1 = await transaction.createDebtTest({ op : 1,
													person_id : PERSON_X,
													acc_id : CASH_RUB,
												 	src_amount : 500,
												 	comment: 'x41' });
		const TR_DEBT_2 = await transaction.createDebtTest({ op : 2,
													person_id : PERSON_Y,
													acc_id : CASH_RUB,
												 	src_amount : 1000 });
		const TR_DEBT_3 = await transaction.createDebtTest({ op : 1,
													person_id : PERSON_X,
													acc_id : 0,
												 	src_amount : 500,
													src_curr : RUB });
		const TR_DEBT_4 = await transaction.createDebtTest({ op : 2,
													person_id : PERSON_Y,
													acc_id : 0,
												 	src_amount : 1000,
													src_curr : USD });

		/**
		 * Update transactions
		 */
		env.setBlock('Update', 3);

		await transaction.updateTest({ id : TR_EXPENSE_1,
											src_id : CASH_RUB });
		await transaction.updateTest({ id : TR_EXPENSE_2,
											dest_amount : 7608,
											dest_curr : RUB });
		await transaction.updateTest({ id : TR_EXPENSE_3,
											dest_amount : 0.89,
											dest_curr : EUR,
										 	date : this.dates.weekAgo });

		await transaction.updateTest({ id : TR_INCOME_1,
											dest_id : CASH_RUB });
		await transaction.updateTest({ id : TR_INCOME_2,
											src_amount : 100,
										 	src_curr : USD });

		await transaction.updateTest({ id : TR_TRANSFER_1,
											dest_id : ACC_USD,
											dest_curr : USD,
										 	dest_amount : 8 });
		await transaction.updateTest({ id : TR_TRANSFER_2,
											dest_id : CASH_RUB,
											dest_curr : RUB,
										 	dest_amount : 6500,
										 	date : this.dates.yesterday });

		await transaction.updateTest({ id : TR_DEBT_1,
											op : 2 });
		await transaction.updateTest({ id : TR_DEBT_2,
											person_id : PERSON_Y,
											acc_id : 0 });
		await transaction.updateTest({ id : TR_DEBT_3,
											op : 1,
											acc_id : ACC_RUB });


		/**
		 * Security tests for create transactions
		 */
		env.setBlock('Transaction security', 2);
		env.setBlock('Create', 3);

		await transaction.createTest({ type : EXPENSE, src_id : API_USER_ACC_RUB, dest_id : 0, src_curr : RUB, dest_curr : RUB, src_amount : 100, dest_amount : 100 });
		await transaction.createTest({ type : INCOME, src_id : 0, dest_id : API_USER_ACC_RUB, src_curr : RUB, dest_curr : RUB, src_amount : 100, dest_amount : 100 });
		await transaction.createTest({ type : TRANSFER, src_id : CASH_RUB, dest_id : API_USER_ACC_RUB, src_curr : RUB, dest_curr : RUB, src_amount : 100, dest_amount : 100 });
		await transaction.createDebtTest({ type : DEBT, op : 1, person_id : API_USER_PERSON, acc_id : 0, src_curr : RUB, dest_curr : RUB, src_amount : 100, dest_amount : 100 });

		/**
		 * Security tests for update transactions
		 */
		env.setBlock('Update', 3);

		await transaction.updateTest({ id : TR_EXPENSE_1, src_id : API_USER_ACC_RUB });
		await transaction.updateTest({ id : TR_INCOME_1, dest_id : API_USER_ACC_RUB });
		await transaction.updateTest({ id : TR_TRANSFER_1, src_id : API_USER_ACC_RUB, dest_id : API_USER_ACC_USD });
		// Trying to update transaction of another user
		await transaction.updateTest({ id: API_USER_TRANSACTION, type : EXPENSE, src_id : CASH_RUB, dest_id : 0, src_curr : RUB, dest_curr : RUB, src_amount : 100, dest_amount : 100 });
		// Trying to set person of another user
		await transaction.updateTest({ id: TR_DEBT_1, person_id : API_USER_PERSON });
		// Trying to set account of another user
		await transaction.updateTest({ id: TR_DEBT_2, acc_id : API_USER_ACC_RUB });
		// Trying to set both person and account of another user
		await transaction.updateTest({ id: TR_DEBT_3, person_id : API_USER_PERSON, acc_id : API_USER_ACC_RUB });

		/**
		 * Security tests for delete transaction
		 */
		env.setBlock('Delete', 3);
		await transaction.deleteTest([ API_USER_TRANSACTION ]);


		/**
		 * Filter transactions
		 */
		env.setBlock('Filter transactions', 2);

		await transaction.filterTest({ type : DEBT });

		await transaction.filterTest({ accounts : ACC_RUB });

		await transaction.filterTest({ type : DEBT,
			 							accounts : ACC_RUB });

		await transaction.filterTest({ onPage : 10 });

		await transaction.filterTest({ onPage : 10,
			 							page : 2 });

		await transaction.filterTest({ startDate : this.dates.now,
			 							endDate : this.dates.weekAfter });

		await transaction.filterTest({ startDate : this.dates.now,
			 							endDate : this.dates.weekAfter,
									 	search : '1' });

		/**
		 * Update accounts
		 */
		await account.updateTest(ACC_RUB, { name : 'acc rub', curr_id : USD, balance : 101, icon : 2 });

		// Try to update name of account to an existing one
		await account.updateTest(CASH_RUB, { name : 'acc rub' });

		/**
		 * Delete accounts
		 */
		await account.deleteTest([ ACC_USD, CASH_RUB ]);

		/**
		 * Update person
		 */
		await person.updateTest(PERSON_X, { name : 'XX!' });
		// Try to update name of person to an existing one
		await person.updateTest(PERSON_X, { name : 'XX!' });

		/**
		 * Delete person
		 */
		await person.deleteTest(PERSON_Y);


		/**
		 * Delete transaction
		 */
		await transaction.deleteTest([ TR_EXPENSE_2, TR_TRANSFER_1, TR_DEBT_3 ]);


		/**
		 * Delete user profile
		 */
		await test('Login new user', () => api.user.login(this.config.apiTestUser), env);
		await test('Delete user profile', () => api.profile.del(), env);

		await api.user.login(this.config.testUser);
	}

};


export { runAPI };
