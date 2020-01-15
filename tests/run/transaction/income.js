import { api } from '../../api.js';
import { runTransactionsCommon } from './common.js'
import { TransactionsList } from '../../trlist.js'


var runIncome = (function()
{
	let test = null;


	async function submitIncomeTransaction(app, params)
	{
		let view = app.view;
		test = app.test;

		if ('destAcc' in params)
		{
			let acc = await view.getAccountByPos(params.destAcc);
			if (!acc)
				throw new Error('Account (' + params.destAcc + ') not found');

			await test('Change destination account to (' + acc.name + ')',
					() => view.changeDestAccountByPos(params.destAcc), view);
		}

		if ('srcCurr' in params)
		{
			let curr = app.getCurrency(params.srcCurr, app.currencies);
			if (!curr)
				throw new Error('Currency (' + params.srcCurr + ') not found');

			await test('Change source currency to ' + curr.name,
					() => view.changeSourceCurrency(params.srcCurr), view);
		}

		if (!('srcAmount' in params))
			throw new Error('Source amount value not specified');

		await test('Source amount (' + params.srcAmount + ') input', () => view.inputSrcAmount(params.srcAmount), view);

		if ('srcCurr' in params && 'destAmount' in params)
			await test('Destination amount (' + params.destAmount + ') input', () => view.inputDestAmount(params.destAmount), view);

		if ('date' in params)
			await test('Date (' + params.date + ') input', () => view.changeDate(params.date), view);

		if ('comment' in params)
			await test('Comment (' + params.comment + ') input', () => view.inputComment(params.comment), view);

		let res = view.getExpectedTransaction();

		app.state.accounts = null;
		app.state.persons = null;

		await view.submit();

		return res;
	}


	async function createIncome(app, params)
	{
		await runTransactionsCommon.create(app, app.INCOME, params, submitIncomeTransaction);
	}


	// Update income transaction and check results
	async function updateIncome(app, params)
	{
		test = app.test;

		await runTransactionsCommon.update(app, app.INCOME, params, async (app, params) =>
		{
			let origTransaction = app.view.getExpectedTransaction();
			let isDiff = (origTransaction.src_curr != origTransaction.dest_curr);

			await test('Initial state of update income view', async () => app.view.setExpectedState(isDiff ? 2 : 0), app.view);

			return submitIncomeTransaction(app, params);
		});
	}


	async function incomeTransactionLoop(app)
	{
		let view = app.view;
		test = app.test;

	// State 0
		view.setBlock('Income loop', 2);
		await test('Initial state of new income view', async () => view.setExpectedState(0), view);

	// Input source amount
		await test('Source amount (1) input', () => view.inputSrcAmount('1'), view);
		await test('Source amount (1.) input', () => view.inputSrcAmount('1.'), view);
		await test('Source amount (1.0) input', () => view.inputSrcAmount('1.0'), view);
		await test('Source amount (1.01) input', () => view.inputSrcAmount('1.01'), view);
		await test('Source amount (1.010) input', () => view.inputSrcAmount('1.010'), view);
		await test('Source amount (1.0101) input', () => view.inputSrcAmount('1.0101'), view);

	// Transition 2: Click on destination result balance block and move from State 0 to State 1
		await test('(2) Click on destination result balance', () => view.clickDestResultBalance(), view);

	// Transition 23: Change account to another one with different currency and stay on State 1
		await test('(23) Change destination account', () => view.changeDestAccountByPos(3), view);
		await test('(23) Change destination account back', () => view.changeDestAccountByPos(0), view);

	// Input result balance
		await test('Result balance (502.08) input', () => view.inputDestResBalance('502.08'), view);
		await test('Result balance (502.080) input', () => view.inputDestResBalance('502.080'), view);
		await test('Result balance (502.0801) input', () => view.inputDestResBalance('502.0801'), view);

	// Transition 4: Click on source amount block and move from State 1 to State 0
		await test('(4) Click on source amount', () => view.clickSrcAmount(), view);

	// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
		await test('(3) Change source curency to USD', () => view.changeSourceCurrency(2), view);

	// Transition 5: Change account to another one with currency different than current source currency and stay on State 2
		await test('(5) Change destination account', () => view.changeDestAccountByPos(3), view);
		await test('(5) Change destination account back', () => view.changeDestAccountByPos(0), view);

	// Input destination amount
		await test('Empty destination amount input', () => view.inputDestAmount(''), view);
		await test('Destination amount (.) input', () => view.inputDestAmount('.'), view);
		await test('Destination amount (0.) input', () => view.inputDestAmount('0.'), view);
		await test('Destination amount (.0) input', () => view.inputDestAmount('.0'), view);
		await test('Destination amount (.01) input', () => view.inputDestAmount('.01'), view);
		await test('Destination amount (1.01) input', () => view.inputDestAmount('1.01'), view);
		await test('Destination amount (1.010) input', () => view.inputDestAmount('1.010'), view);

	// Transition 7: Click on result balance block and move from State 2 to State 4
		await test('(7) Click on destination result balance', () => view.clickDestResultBalance(), view);

	// Transition 17: Change account to another one with currency different than current source currency and stay on State 4
		await test('(17) Change destination account', () => view.changeDestAccountByPos(3), view);
		await test('(17) Change destination account back', () => view.changeDestAccountByPos(0), view);

	// Transition 21: Change source currency to different than currency of account and stay on State 4
		await test('(21) Change source curency to EUR', () => view.changeSourceCurrency(3), view);
		await test('(21) Change source curency to USD', () => view.changeSourceCurrency(2), view);

	// Transition 20: Click on exchange rate block and move from State 4 to State 3
		await test('(20) Click on exchange rate', () => view.clickExchRate(), view);

	// Transition 14: Click on exchange rate block and move from State 4 to State 3
		await test('(14) Click on exchange rate', () => view.clickDestResultBalance(), view);

	// Transition 19: Click on destination amount block and move from State 4 to State 3
		await test('(19) Click on destination amount', () => view.clickDestAmount(), view);

	// Transition 8: Click on exchange rate block and move from State 2 to State 3
		await test('(8) Click on exchange rate', () => view.clickExchRate(), view);

	// Input exchange rate
		await test('Input exchange rate (1.09)', () => view.inputExchRate('1.09'), view);
		await test('Input exchange rate (3.09)', () => view.inputExchRate('3.09'), view);
		await test('Input exchange rate (.09)', () => view.inputExchRate('.09'), view);
		await test('Input exchange rate (.090101)', () => view.inputExchRate('.090101'), view);

	// Transition 13: Click on destination amount block and move from State 3 to State 2
		await test('(13) Click on destination amount', () => view.clickDestAmount(), view);

	// Transition 9: change source currency to different than currency of account and stay on State 2
		await test('(9) Change source curency to EUR', () => view.changeSourceCurrency(3), view);

	// Transition 10: Change source currency to the same as currency of account and move from State 2 to State 0
		await test('(10) Change source curency to RUB', () => view.changeSourceCurrency(1), view);

	// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
		await test('(3) Change source curency to USD', () => view.changeSourceCurrency(2), view);

	// Transition 8: Click on exchange rate block and move from State 2 to State 3
		await test('(8) Click on exchange rate', () => view.clickExchRate(), view);

	// Transition 11: Change destination account to another with currency different currest source currency
		await test('(11) Change destination account', () => view.changeDestAccountByPos(3), view);

	// Transition 12: Change destination account to another one with same currency as currest source currency
		await test('(12) Change destination account back', () => view.changeDestAccountByPos(2), view);

	// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
		await test('(3) Change source curency to RUB', () => view.changeSourceCurrency(1), view);

	// Transition 8: Click on exchange rate block and move from State 2 to State 3
		await test('(8) Click on exchange rate', () => view.clickExchRate(), view);

	// Transition 15: Change source currency to different than currency of account and stay on State 3
		await test('(15) Change source curency to EUR', () => view.changeSourceCurrency(3), view);

	// Transition 16: Change source currency to different than currency of account and stay on State 3
		await test('(16) Change source curency to USD', () => view.changeSourceCurrency(2), view);

	// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
		await test('(3) Change source curency to RUB', () => view.changeSourceCurrency(1), view);

	// Transition 7: Click on result balance block and move from State 2 to State 4
		await test('(7) Click on destination result balance', () => view.clickDestResultBalance(), view);

	// Transition 18: Change destination account to another one with same currency as currest source currency and move from State 4 to State 1
		await test('(18) Change destination account', () => view.changeDestAccountByPos(1), view);

	// Transition 4: Click on source amount block and move from State 1 to State 0
		await test('(4) Click on source amount', () => view.clickSrcAmount(), view);

	// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
		await test('(3) Change source curency to USD', () => view.changeSourceCurrency(2), view);

	// Transition 6: Change destination account to another one with same currency as currest source currency
		await test('(6) Change destination account', () => view.changeDestAccountByPos(2), view);

	// Transition 1: Change destination account to another one with same currency as currest source currency
		await test('(1) Change destination account', () => view.changeDestAccountByPos(0), view);

	// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
		await test('(3) Change source curency to USD', () => view.changeSourceCurrency(2), view);

	// Transition 7: Click on result balance block and move from State 2 to State 4
		await test('(7) Click on destination result balance', () => view.clickDestResultBalance(), view);

	// Transition 22: Change source currency to the same as currency of account and move from State 4 to State 1
		await test('(22) Change destination account', () => view.changeSourceCurrency(1), view);
	}


	return { create : createIncome,
				update : updateIncome,
				stateLoop : incomeTransactionLoop };
})();


export { runIncome };
