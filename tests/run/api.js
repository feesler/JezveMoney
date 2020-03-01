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

		api.setEnv(this);

		env.setBlock('API tests', 1);

		this.run.api.account = this.bindRunner(runAccountAPI);
		this.run.api.person = this.bindRunner(runPersonAPI);
		this.run.api.transaction = this.bindRunner(runTransactionAPI);

		const account = this.run.api.account;
		const person = this.run.api.person;
		const transaction = this.run.api.transaction;

		// Register new user
		env.setBlock('User', 2);

		await api.user.logout();
		await test('User registration', () => api.user.register(this.config.apiTestUser), env);

		await test('Login new user', () => api.user.login(this.config.apiTestUser), env);

		env.setBlock('Profile', 2);

		let newName = 'App tester';
		await test('Change user name', async () => 
		{
			let chnameRes = await api.profile.changeName({ name : newName })
			if (!chnameRes)
				throw new Error('Fail to change user name');

			let profileData = await api.profile.read();
			return (profileData && profileData.name == newName);
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

		this.state.accounts = null;
		this.state.persons = null;
		this.state.transactions = null;

		// Login with main test user
		await test('Login main user', () => api.user.login(this.config.testUser), env);

		await test('Reset all data', () => api.profile.reset(), env);

		env.setBlock('Accounts', 2);

		await test('Reset accounts', () => api.account.reset(), env);

		let ACC_RUB = await account.createTest({ name : 'acc ru', currency : RUB, balance : 100, icon : 1 });
		let CASH_RUB = await account.createTest({ name : 'cash ru', currency : RUB, balance : 5000, icon : 3 });
		let ACC_USD = await account.createTest({ name : 'acc usd', currency : USD, balance : 10.5, icon : 5 });


		env.setBlock('Persons', 2);

		let PERSON_X = await person.createTest({ name : 'Person X' });
		let PERSON_Y = await person.createTest({ name : 'Y' });

		env.setBlock('Transactions', 2);


		/**
		 * Create transactions
		 */
		const TR_EXPENSE_1 = await transaction.createExpenseTest({ src_id : ACC_RUB,
														src_amount : 100,
													 	comm : '11' });
		const TR_EXPENSE_2 = await transaction.createExpenseTest({ src_id : ACC_RUB,
														src_amount : 7608,
														dest_amount : 100,
														dest_curr : EUR,
													 	comm : '22' });
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

		const TR_DEBT_1 = await transaction.createDebtTest({ debtop : 1,
													person_id : PERSON_X,
													acc_id : CASH_RUB,
												 	src_amount : 500,
												 	comm : 'x41' });
		const TR_DEBT_2 = await transaction.createDebtTest({ debtop : 2,
													person_id : PERSON_Y,
													acc_id : CASH_RUB,
												 	src_amount : 1000 });
		const TR_DEBT_3 = await transaction.createDebtTest({ debtop : 1,
													person_id : PERSON_X,
													acc_id : 0,
												 	src_amount : 500,
													src_curr : RUB });
		const TR_DEBT_4 = await transaction.createDebtTest({ debtop : 2,
													person_id : PERSON_Y,
													acc_id : 0,
												 	src_amount : 1000,
													src_curr : USD });

		/**
		 * Update transactions
		 */
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
										 	dest_amount : 8 });
		await transaction.updateTest({ id : TR_TRANSFER_2,
											dest_id : CASH_RUB,
										 	dest_amount : 6500,
										 	date : this.dates.yesterday });

		await transaction.updateTest({ id : TR_DEBT_1,
											debtop : 2 });
		await transaction.updateTest({ id : TR_DEBT_2,
											person_id : PERSON_Y,
											acc_id : 0 });
		await transaction.updateTest({ id : TR_DEBT_3,
											debtop : 1,
											acc_id : ACC_RUB });

		/**
		 * Filter transactions
		 */
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
		await account.updateTest(ACC_RUB, { name : 'acc rub', currency : USD, balance : 101, icon : 2 });


		/**
		 * Delete accounts
		 */
		await account.deleteTest([ ACC_USD, CASH_RUB ]);

		/**
		 * Update person
		 */
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
