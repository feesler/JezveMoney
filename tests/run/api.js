import { api } from '../api.js';
import { runAccountAPI } from './api/account.js';
import { runPersonAPI } from './api/person.js';
import { runTransactionAPI } from './api/transaction.js';


var runAPI = (function()
{
	let env = null;
	let app = null;
	let test = null;


	async function runTests(app)
	{
		env = app.view.props.environment;
		test = app.test;

		api.setEnv(env, app);

		env.setBlock('API tests', 1);

		app.run.api = { account : runAccountAPI,
						person : runPersonAPI,
					 	transaction : runTransactionAPI };

		const account = app.run.api.account;
		const person = app.run.api.person;
		const transaction = app.run.api.transaction;

		account.setEnv(env, app);
		person.setEnv(env, app);
		transaction.setEnv(env, app);

		await test('Login user', () => api.user.login(app.config.testUser.login, app.config.testUser.password), env);

		await test('Reset all data', async () => {
			return await api.profile.reset();
		}, env);

		env.setBlock('Accounts', 2);

		await test('Reset accounts', () => api.account.reset(), env);

		await test('Accounts list', async () => {
			let accList = await api.account.list();

			return app.isArray(accList) && accList.length == 0;
		}, env);

		const RUB = 1;
		const USD = 2;
		const EUR = 3;

		let ACC_RUB = await account.createTest({ name : 'acc ru', currency : RUB, balance : 100, icon : 1 });
		let CASH_RUB = await account.createTest({ name : 'cash ru', currency : RUB, balance : 5000, icon : 3 });
		let ACC_USD = await account.createTest({ name : 'acc usd', currency : USD, balance : 10.5, icon : 5 });


		env.setBlock('Persons', 2);

		await test('Persons list', async () => {
			let pList = await api.person.list();

			return app.isArray(pList);
		}, env);

		let PERSON_X = await person.createTest({ name : 'Person X' });
		let PERSON_Y = await person.createTest({ name : 'Y' });


		let now = new Date();
		let monthAgo = app.formatDate(new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()));
		let weekAgo = app.formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7));
		let yesterday = app.formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

		env.setBlock('Transactions', 2);

		await test('Transactions list', async () => {
			let trList = await api.transaction.list();

			return app.isArray(trList) && trList.length == 0;
		}, env);


		/**
		 * Create transactions
		 */
		const TR_EXPENSE_1 = await transaction.createExpenseTest({ src_id : ACC_RUB,
														src_amount : 100 });
		const TR_EXPENSE_2 = await transaction.createExpenseTest({ src_id : ACC_RUB,
														src_amount : 7608,
														dest_amount : 100,
														dest_curr : EUR });
		const TR_EXPENSE_3 = await transaction.createExpenseTest({ src_id : ACC_USD,
														src_amount : 1,
														date : yesterday });

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
												 	src_amount : 500 });
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
										 	date : weekAgo });

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
										 	date : yesterday });

		await transaction.updateTest({ id : TR_DEBT_1,
											debtop : 2 });
		await transaction.updateTest({ id : TR_DEBT_2,
											person_id : PERSON_Y,
											acc_id : 0 });
		await transaction.updateTest({ id : TR_DEBT_3,
											debtop : 1,
											acc_id : ACC_RUB });

		/**
		 * Update accounts
		 */
		await account.updateTest(ACC_RUB, { name : 'acc rub', balance : 101, icon : 2 });


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


		await test('Result transactions list', async () => {
			let trList = await api.transaction.list();

			return app.isArray(trList) && trList.length == 2;
		}, env);
	}


	return { run : runTests };
})();


export { runAPI };