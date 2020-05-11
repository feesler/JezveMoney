import * as TransactionTests from './common.js'
import { test } from '../../common.js'
import { EXPENSE } from '../../model/transaction.js';
import { ExpenseTransactionView } from '../../view/transaction/expense.js'
import { App } from '../../app.js';


export async function submit(params)
{
	if ('srcAcc' in params)
		await TransactionTests.runAction({ action : 'changeSrcAccountByPos', data : params.srcAcc });

	if ('destCurr' in params)
		await TransactionTests.runAction({ action : 'changeDestCurrency', data : params.destCurr });

	if (!('destAmount' in params))
		throw new Error('Destination amount value not specified');

	await TransactionTests.runAction({ action : 'inputDestAmount', data : params.destAmount });

	if ('destCurr' in params && 'srcAmount' in params)
		await TransactionTests.runAction({ action : 'inputSrcAmount', data : params.srcAmount });

	if ('date' in params)
		await TransactionTests.runAction({ action : 'changeDate', data : params.date });

	if ('comment' in params)
		await TransactionTests.runAction({ action : 'inputComment', data : params.comment });

	return TransactionTests.submit();
}


export async function create(params)
{
	await TransactionTests.create(EXPENSE, params, submit);
}


// Update expense transaction and check results
export async function update(params)
{
	await TransactionTests.update(EXPENSE, params, async (params) =>
	{
		let origTransaction = App.view.getExpectedTransaction();
		let isDiff = (origTransaction.src_curr != origTransaction.dest_curr);

		await test('Initial state of update expense view', () => App.view.setExpectedState(isDiff ? 2 : 0), App.view);

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

	// Navigate to create expense view
	if (!(App.view instanceof ExpenseTransactionView))
	{
		await App.goToMainView();
		await App.view.goToNewTransactionByAccount(0);
		if (App.view.content.typeMenu.activeType != EXPENSE)
			await App.view.changeTransactionType(EXPENSE);
	}

	let view = App.view;

	// State 0
	view.setBlock('Expense loop', 2);
	await test('Initial state of new expense view', () => view.setExpectedState(0));

	// Input destination amount
	await test('Destination amount (1) input', () => view.inputDestAmount('1'));
	await test('Destination amount (1.) input', () => view.inputDestAmount('1.'));
	await test('Destination amount (1.0) input', () => view.inputDestAmount('1.0'));
	await test('Destination amount (1.01) input', () => view.inputDestAmount('1.01'));
	await test('Destination amount (1.010) input', () => view.inputDestAmount('1.010'));
	await test('Destination amount (1.0101) input', () => view.inputDestAmount('1.0101'));

	// Transition 2: click on result balance block and move from State 0 to State 1
	await test('(2) Click on source result balance', () => view.clickSrcResultBalance());

	// Input result balance
	await test('Result balance (499.9) input', () => view.inputResBalance('499.9'));
	await test('Result balance (499.90) input', () => view.inputResBalance('499.90'));
	await test('Result balance (499.901) input', () => view.inputResBalance('499.901'));

	// Transition 12: change account to another one with different currency and stay on State 1
	await test('(12) Change account to another one with currency different than current destination currency',
		() => view.changeSrcAccountByPos(ACC_USD));

	// Change account back
	await test('(12) Change account back', () => view.changeSrcAccountByPos(ACC_3));

	// Transition 3: click on destination amount block and move from State 1 to State 0
	await test('(3) Click on destination amount', () => view.clickDestAmount());

	// Transition 4: select different currency for destination and move from State 0 to State 2
	await test('(4) Change destination curency to USD', () => view.changeDestCurrency(USD));

	// Input source amount
	await test('Empty source amount input', () => view.inputSrcAmount(''));
	await test('Source amount (.) input', () => view.inputSrcAmount('.'));
	await test('Source amount (0.) input', () => view.inputSrcAmount('0.'));
	await test('Source amount (.0) input', () => view.inputSrcAmount('.0'));
	await test('Source amount (.01) input', () => view.inputSrcAmount('.01'));
	await test('Source amount (1.01) input', () => view.inputSrcAmount('1.01'));
	await test('Source amount (1.010) input', () => view.inputSrcAmount('1.010'));

	// Transition 8: click on exchange rate block and move from State 2 to State 3
	await test('(8) Click on exchange rate', () => view.clickExchRate());

	// Input exchange rate
	await test('Input exchange rate (1.09)', () => view.inputExchRate('1.09'));
	await test('Input exchange rate (3.09)', () => view.inputExchRate('3.09'));
	await test('Input exchange rate (.)', () => view.inputExchRate('.'));
	await test('Input exchange rate (.0)', () => view.inputExchRate('.0'));
	await test('Input exchange rate (.09)', () => view.inputExchRate('.09'));
	await test('Input exchange rate (.090101)', () => view.inputExchRate('.090101'));

	// Transition 16: click on destination amount block and move from State 3 to State 2
	await test('(16) Click on destination amount', () => view.clickDestAmount());
	// Transition 13: select another currency different from currency of source account and stay on state
	await test('(13) Change destination curency to EUR', () => view.changeDestCurrency(EUR));
	// Transition 9: select same currency as source account and move from State 2 to State 0
	await test('(9) Change destination curency to RUB', () => view.changeDestCurrency(RUB));
	// Transition 1: change account to another one with different currency and stay on State 0
	await test('(1) Change account to another one with different currency', () => view.changeSrcAccountByPos(ACC_USD));

	// Transition 5: change account to another one with currency different than current destination currency and stay on State 2
	await view.changeDestCurrency(EUR);		// move from State 0 to State 2
	await test('(5) Change account to another one with currency different than current destination currency',
		() => view.changeSrcAccountByPos(ACC_3));

	// Transition 6: click on source result balance block and move from State 2 to State 4
	await test('(6) Click on source result block', () => view.clickSrcResultBalance());

	// Transition 10: change account to another one with currency different than current destination currency and stay on State 4
	await test('(10) Change account to another one with currency different than current destination currency',
		() => view.changeSrcAccountByPos(ACC_USD));

	// Transition 7: click on destination amount block and move from State 4 to State 2
	await test('(7) Click on source amount block', () => view.clickDestAmount());

	// Transition 14: select source account with the same currency as destination and move from State 2 to State 0
	await test('(14) Change account to another one with the same currency as current destination currency',
		() => view.changeSrcAccountByPos(ACC_EUR));

	// Transition 17: change account to another one with currency different than current destination currency and stay on State 3
	await view.changeDestCurrency(RUB);		// move from State 0 to State 2
	await view.clickExchRate();				// move from State 2 to State 3
	await test('(17) Change account to another one with currency different than current destination currency',
		() => view.changeSrcAccountByPos(ACC_USD));

	// Transition 15: select source account with the same currency as destination and move from State 2 to State 0
	await test('(15) Change account to another one with the same currency as destination',
		() => view.changeSrcAccountByPos(ACC_RUB));

	// Transition 19: click on exchange rate block and move from State 4 to State 3
	await view.changeDestCurrency(USD);		// move from State 0 to State 2
	await view.clickSrcResultBalance();		// move from State 2 to State 4
	await test('(19) Click on exchange rate block', () => view.clickExchRate());

	// Transition 18: click on source result balance and move from State 3 to State 4
	await test('(18) Click on source result balance rate block', () => view.clickSrcResultBalance());

	// Transition 11: select source account with the same currency as destination and move from State 4 to State 1
	await test('(11) Change account to another one with the same currency as destination',
			() => view.changeSrcAccountByPos(ACC_USD));
}

