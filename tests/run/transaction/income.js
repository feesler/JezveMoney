import { api } from '../../api.js';
import * as TransactionTests from './common.js'
import { Currency } from '../../model/currency.js';
import { test } from '../../common.js'
import { INCOME } from '../../model/transaction.js';
import { IncomeTransactionView } from '../../view/transaction/income.js'
import { App } from '../../app.js';


export async function submit(params)
{
	let view = App.view;

	if ('destAcc' in params)
	{
		let acc = App.state.accounts.getItemByIndex(params.destAcc);
		if (!acc)
			throw new Error('Account (' + params.destAcc + ') not found');

		await test('Change destination account to (' + acc.name + ')',
				() => view.changeDestAccountByPos(params.destAcc));
	}

	if ('srcCurr' in params)
	{
		let curr = Currency.getById(params.srcCurr);
		if (!curr)
			throw new Error('Currency (' + params.srcCurr + ') not found');

		await test('Change source currency to ' + curr.name,
				() => view.changeSourceCurrency(params.srcCurr));
	}

	if (!('srcAmount' in params))
		throw new Error('Source amount value not specified');

	await test('Source amount (' + params.srcAmount + ') input', () => view.inputSrcAmount(params.srcAmount));

	if ('srcCurr' in params && 'destAmount' in params)
		await test('Destination amount (' + params.destAmount + ') input', () => view.inputDestAmount(params.destAmount));

	if ('date' in params)
		await test('Date (' + params.date + ') input', () => view.changeDate(params.date));

	if ('comment' in params)
		await test('Comment (' + params.comment + ') input', () => view.inputComment(params.comment));

	let res = view.getExpectedTransaction();

	await view.submit();

	return res;
}


export async function create(params)
{
	await TransactionTests.create(INCOME, params, params => submit(params));
}


// Update income transaction and check results
export async function update(params)
{
	await TransactionTests.update(INCOME, params, async (params) =>
	{
		let origTransaction = App.view.getExpectedTransaction();
		let isDiff = (origTransaction.src_curr != origTransaction.dest_curr);

		await test('Initial state of update income view', () => App.view.setExpectedState(isDiff ? 2 : 0), App.view);

		return submit(params);
	});
}


export async function stateLoop()
{
	const RUB = 1;
	const USD = 2;
	const EUR = 3;
	const ACC_3 = 0;
	const ACC_RUB = 1;
	const ACC_USD = 2;
	const ACC_EUR = 3;

	await App.state.fetch();

	// Navigate to create income view
	if (!(App.view instanceof IncomeTransactionView))
	{
		await App.goToMainView();
		await App.view.goToNewTransactionByAccount(0);
		if (App.view.content.typeMenu.activeType != INCOME)
			await App.view.changeTransactionType(INCOME);
	}

	let view = App.view;

	// State 0
	view.setBlock('Income loop', 2);
	await test('Initial state of new income view', async () => view.setExpectedState(0));

	// Input source amount
	await test('Source amount (1) input', () => view.inputSrcAmount('1'));
	await test('Source amount (1.) input', () => view.inputSrcAmount('1.'));
	await test('Source amount (1.0) input', () => view.inputSrcAmount('1.0'));
	await test('Source amount (1.01) input', () => view.inputSrcAmount('1.01'));
	await test('Source amount (1.010) input', () => view.inputSrcAmount('1.010'));
	await test('Source amount (1.0101) input', () => view.inputSrcAmount('1.0101'));

	// Transition 2: Click on destination result balance block and move from State 0 to State 1
	await test('(2) Click on destination result balance', () => view.clickDestResultBalance());

	// Transition 23: Change account to another one with different currency and stay on State 1
	await view.changeDestAccountByPos(ACC_EUR);
	await test('(23) Change destination account', () => view.changeDestAccountByPos(ACC_3));

	// Input result balance
	await test('Result balance (502.08) input', () => view.inputDestResBalance('502.08'));
	await test('Result balance (502.080) input', () => view.inputDestResBalance('502.080'));
	await test('Result balance (502.0801) input', () => view.inputDestResBalance('502.0801'));

	// Transition 4: Click on source amount block and move from State 1 to State 0
	await test('(4) Click on source amount', () => view.clickSrcAmount());

	// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
	await test('(3) Change source curency to USD', () => view.changeSourceCurrency(USD));

	// Transition 5: Change account to another one with currency different than current source currency and stay on State 2
	await test('(5) Change destination account', () => view.changeDestAccountByPos(ACC_EUR));
	await test('(5) Change destination account back', () => view.changeDestAccountByPos(ACC_3));

	// Input destination amount
	await test('Empty destination amount input', () => view.inputDestAmount(''));
	await test('Destination amount (.) input', () => view.inputDestAmount('.'));
	await test('Destination amount (0.) input', () => view.inputDestAmount('0.'));
	await test('Destination amount (.0) input', () => view.inputDestAmount('.0'));
	await test('Destination amount (.01) input', () => view.inputDestAmount('.01'));
	await test('Destination amount (1.01) input', () => view.inputDestAmount('1.01'));
	await test('Destination amount (1.010) input', () => view.inputDestAmount('1.010'));

	// Transition 7: Click on result balance block and move from State 2 to State 4
	await test('(7) Click on destination result balance', () => view.clickDestResultBalance());

	// Transition 17: Change account to another one with currency different than current source currency and stay on State 4
	await test('(17) Change destination account', () => view.changeDestAccountByPos(ACC_EUR));
	await test('(17) Change destination account back', () => view.changeDestAccountByPos(ACC_3));

	// Transition 21: Change source currency to different than currency of account and stay on State 4
	await test('(21) Change source curency to EUR', () => view.changeSourceCurrency(EUR));
	await test('(21) Change source curency to USD', () => view.changeSourceCurrency(USD));

	// Transition 20: Click on exchange rate block and move from State 4 to State 3
	await test('(20) Click on exchange rate', () => view.clickExchRate());
	// Transition 14: Click on exchange rate block and move from State 4 to State 3
	await test('(14) Click on exchange rate', () => view.clickDestResultBalance());
	// Transition 19: Click on destination amount block and move from State 4 to State 3
	await test('(19) Click on destination amount', () => view.clickDestAmount());
	// Transition 8: Click on exchange rate block and move from State 2 to State 3
	await test('(8) Click on exchange rate', () => view.clickExchRate());

	// Input exchange rate
	await test('Input exchange rate (1.09)', () => view.inputExchRate('1.09'));
	await test('Input exchange rate (3.09)', () => view.inputExchRate('3.09'));
	await test('Input exchange rate (.09)', () => view.inputExchRate('.09'));
	await test('Input exchange rate (.090101)', () => view.inputExchRate('.090101'));

	// Transition 13: Click on destination amount block and move from State 3 to State 2
	await test('(13) Click on destination amount', () => view.clickDestAmount());

	// Transition 9: change source currency to different than currency of account and stay on State 2
	await test('(9) Change source curency to EUR', () => view.changeSourceCurrency(EUR));

	// Transition 10: Change source currency to the same as currency of account and move from State 2 to State 0
	await test('(10) Change source curency to RUB', () => view.changeSourceCurrency(RUB));

	// Transition 11: Change destination account to another with currency different currest source currency
	await view.changeSourceCurrency(USD);			// move from State 0 to State 2
	await view.clickExchRate();						// move from State 2 to State 3
	await test('(11) Change destination account', () => view.changeDestAccountByPos(ACC_EUR));

	// Transition 12: Change destination account to another one with same currency as currest source currency
	await test('(12) Change destination account back', () => view.changeDestAccountByPos(ACC_USD));

	// Transition 15: Change source currency to different than currency of account and stay on State 3
	await view.changeSourceCurrency(RUB);			// move from State 0 to State 2
	await view.clickExchRate();						// move from State 2 to State 3
	await test('(15) Change source curency to EUR', () => view.changeSourceCurrency(EUR));

	// Transition 16: Change source currency to different than currency of account and stay on State 3
	await test('(16) Change source curency to USD', () => view.changeSourceCurrency(USD));

	// Transition 18: Change destination account to another one with same currency as currest source currency and move from State 4 to State 1
	await view.changeSourceCurrency(RUB);				// move from State 0 to State 2
	await view.clickDestResultBalance();				// move from State 2 to State 4
	await test('(18) Change destination account', () => view.changeDestAccountByPos(ACC_RUB));

	// Transition 6: Change destination account to another one with same currency as currest source currency
	await view.clickSrcAmount();						// move from State 1 to State 0
	await view.changeSourceCurrency(USD);				// move from State 0 to State 2
	await test('(6) Change destination account', () => view.changeDestAccountByPos(ACC_USD));

	// Transition 1: Change destination account to another one with same currency as currest source currency
	await test('(1) Change destination account', () => view.changeDestAccountByPos(ACC_3));

	// Transition 22: Change source currency to the same as currency of account and move from State 4 to State 1
	await view.changeSourceCurrency(USD);			// move from State 0 to State 2
	await view.clickDestResultBalance();			// move from State 2 to State 4
	await test('(22) Change source currency to RUB', () => view.changeSourceCurrency(RUB));
}
