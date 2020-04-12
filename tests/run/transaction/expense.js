import { api } from '../../api.js';
import { runTransactionsCommon } from './common.js'
import { TransactionsList } from '../../model/transactionslist.js'
import { Currency } from '../../model/currency.js';
import { test } from '../../common.js'
import { EXPENSE } from '../../model/transaction.js';
import { ExpenseTransactionView } from '../../view/transaction/expense.js'
import { App } from '../../app.js';


export const runExpense =
{
	async submit(params)
	{
		let view = this.view;

		if ('srcAcc' in params)
		{
			let acc = this.state.accounts.getItemByIndex(params.srcAcc);
			if (!acc)
				throw new Error('Account (' + params.srcAcc + ') not found');

			await test('Change source account to (' + acc.name + ')',
					() => view.changeSrcAccountByPos(params.srcAcc), view);
		}

		if ('destCurr' in params)
		{
			let curr = Currency.getById(params.destCurr);
			if (!curr)
				throw new Error('Currency (' + params.destCurr + ') not found');

			await test('Change destination currency to ' + curr.name,
					() => view.changeDestCurrency(params.destCurr), view);
		}

		if (!('destAmount' in params))
			throw new Error('Destination amount value not specified');

		await test('Destination amount (' + params.destAmount + ') input', () => view.inputDestAmount(params.destAmount), view);

		if ('destCurr' in params && 'srcAmount' in params)
			await test('Source amount (' + params.srcAmount + ') input', () => view.inputSrcAmount(params.srcAmount), view);

		if ('date' in params)
			await test('Date (' + params.date + ') input', () => view.changeDate(params.date), view);

		if ('comment' in params)
			await test('Comment (' + params.comment + ') input', () => view.inputComment(params.comment), view);

		let res = view.getExpectedTransaction();

		await view.submit();

		return res;
	},


	async create(params)
	{
		let scope = this.run.transactions;

		await scope.create(EXPENSE, params, scope.expense.submit);
	},


	// Update expense transaction and check results
	async update(params)
	{
		let scope = this.run.transactions;

		await scope.update(EXPENSE, params, async (params) =>
		{
			let origTransaction = this.view.getExpectedTransaction();
			let isDiff = (origTransaction.src_curr != origTransaction.dest_curr);

			await test('Initial state of update expense view', () => this.view.setExpectedState(isDiff ? 2 : 0), this.view);

			return scope.expense.submit(params);
		});
	},


	async stateLoop()
	{
		const RUB = 1;
		const USD = 2;
		const EUR = 3;
		const ACC_3 = 0;
		const ACC_RUB = 1;
		const ACC_USD = 2;
		const ACC_EUR = 3;

		await App.state.fetch();

	// Navigate to create expense view
		if (!(this.view instanceof ExpenseTransactionView))
		{
			await this.goToMainView();
			await this.view.goToNewTransactionByAccount(0);
			if (this.view.content.typeMenu.activeType != EXPENSE)
				await this.view.changeTransactionType(EXPENSE);
		}

		let view = this.view;

	// State 0
		view.setBlock('Expense loop', 2);
		await test('Initial state of new expense view', () => view.setExpectedState(0), view);

	// Input destination amount
		await test('Destination amount (1) input', () => view.inputDestAmount('1'), view);
		await test('Destination amount (1.) input', () => view.inputDestAmount('1.'), view);
		await test('Destination amount (1.0) input', () => view.inputDestAmount('1.0'), view);
		await test('Destination amount (1.01) input', () => view.inputDestAmount('1.01'), view);
		await test('Destination amount (1.010) input', () => view.inputDestAmount('1.010'), view);
		await test('Destination amount (1.0101) input', () => view.inputDestAmount('1.0101'), view);

	// Transition 2: click on result balance block and move from State 0 to State 1
		await test('(2) Click on source result balance', () => view.clickSrcResultBalance(), view);

	// Input result balance
		await test('Result balance (499.9) input', () => view.inputResBalance('499.9'), view);
		await test('Result balance (499.90) input', () => view.inputResBalance('499.90'), view);
		await test('Result balance (499.901) input', () => view.inputResBalance('499.901'), view);

	// Transition 12: change account to another one with different currency and stay on State 1
		await test('(12) Change account to another one with currency different than current destination currency',
			() => view.changeSrcAccountByPos(ACC_USD), view);

	// Change account back
		await test('(12) Change account back', () => view.changeSrcAccountByPos(ACC_3), view);

	// Transition 3: click on destination amount block and move from State 1 to State 0
		await test('(3) Click on destination amount', () => view.clickDestAmount(), view);

	// Transition 4: select different currency for destination and move from State 0 to State 2
		await test('(4) Change destination curency to USD', () => view.changeDestCurrency(USD), view);

	// Input source amount
		await test('Empty source amount input', () => view.inputSrcAmount(''), view);
		await test('Source amount (.) input', () => view.inputSrcAmount('.'), view);
		await test('Source amount (0.) input', () => view.inputSrcAmount('0.'), view);
		await test('Source amount (.0) input', () => view.inputSrcAmount('.0'), view);
		await test('Source amount (.01) input', () => view.inputSrcAmount('.01'), view);
		await test('Source amount (1.01) input', () => view.inputSrcAmount('1.01'), view);
		await test('Source amount (1.010) input', () => view.inputSrcAmount('1.010'), view);

	// Transition 8: click on exchange rate block and move from State 2 to State 3
		await test('(8) Click on exchange rate', () => view.clickExchRate(), view);

	// Input exchange rate
		await test('Input exchange rate (1.09)', () => view.inputExchRate('1.09'), view);
		await test('Input exchange rate (3.09)', () => view.inputExchRate('3.09'), view);
		await test('Input exchange rate (.)', () => view.inputExchRate('.'), view);
		await test('Input exchange rate (.0)', () => view.inputExchRate('.0'), view);
		await test('Input exchange rate (.09)', () => view.inputExchRate('.09'), view);
		await test('Input exchange rate (.090101)', () => view.inputExchRate('.090101'), view);

	// Transition 16: click on destination amount block and move from State 3 to State 2
		await test('(16) Click on destination amount', () => view.clickDestAmount(), view);
	// Transition 13: select another currency different from currency of source account and stay on state
		await test('(13) Change destination curency to EUR', () => view.changeDestCurrency(EUR), view);
	// Transition 9: select same currency as source account and move from State 2 to State 0
		await test('(9) Change destination curency to RUB', () => view.changeDestCurrency(RUB), view);
	// Transition 1: change account to another one with different currency and stay on State 0
		await test('(1) Change account to another one with different currency', () => view.changeSrcAccountByPos(ACC_USD), view);

	// Transition 5: change account to another one with currency different than current destination currency and stay on State 2
		await view.changeDestCurrency(EUR);		// move from State 0 to State 2
		await test('(5) Change account to another one with currency different than current destination currency',
			() => view.changeSrcAccountByPos(ACC_3), view);

	// Transition 6: click on source result balance block and move from State 2 to State 4
		await test('(6) Click on source result block', () => view.clickSrcResultBalance(), view);

	// Transition 10: change account to another one with currency different than current destination currency and stay on State 4
		await test('(10) Change account to another one with currency different than current destination currency',
			() => view.changeSrcAccountByPos(ACC_USD), view);

	// Transition 7: click on destination amount block and move from State 4 to State 2
		await test('(7) Click on source amount block', () => view.clickDestAmount(), view);

	// Transition 14: select source account with the same currency as destination and move from State 2 to State 0
		await test('(14) Change account to another one with the same currency as current destination currency',
			() => view.changeSrcAccountByPos(ACC_EUR), view);

	// Transition 17: change account to another one with currency different than current destination currency and stay on State 3
		await view.changeDestCurrency(RUB);		// move from State 0 to State 2
		await view.clickExchRate();				// move from State 2 to State 3
		await test('(17) Change account to another one with currency different than current destination currency',
			() => view.changeSrcAccountByPos(ACC_USD), view);

	// Transition 15: select source account with the same currency as destination and move from State 2 to State 0
		await test('(15) Change account to another one with the same currency as destination',
			() => view.changeSrcAccountByPos(ACC_RUB), view);

	// Transition 19: click on exchange rate block and move from State 4 to State 3
		await view.changeDestCurrency(USD);		// move from State 0 to State 2
		await view.clickSrcResultBalance();		// move from State 2 to State 4
		await test('(19) Click on exchange rate block', () => view.clickExchRate(), view);

	// Transition 18: click on source result balance and move from State 3 to State 4
		await test('(18) Click on source result balance rate block', () => view.clickSrcResultBalance(), view);

	// Transition 11: select source account with the same currency as destination and move from State 4 to State 1
		await test('(11) Change account to another one with the same currency as destination',
				() => view.changeSrcAccountByPos(ACC_USD), view);
	}
};

