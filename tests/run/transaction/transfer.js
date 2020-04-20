import * as TransactionTests from './common.js'
import { test } from '../../common.js'
import { TRANSFER } from '../../model/transaction.js';
import { TransferTransactionView } from '../../view/transaction/transfer.js'
import { App } from '../../app.js';


export async function submit(params)
{
	let view = App.view;

	if ('srcAcc' in params)
	{
		let acc = App.state.accounts.getItemByIndex(params.srcAcc);
		if (!acc)
			throw new Error('Account (' + params.srcAcc + ') not found');

		await test('Change source account to (' + acc.name + ')',
				() => view.changeSrcAccountByPos(params.srcAcc), view);
	}

	if ('destAcc' in params)
	{
		let acc = App.state.accounts.getItemByIndex(params.destAcc);
		if (!acc)
			throw new Error('Account (' + params.destAcc + ') not found');

		await test('Change destination account to (' + acc.name + ')',
				() => view.changeDestAccountByPos(params.destAcc), view);
	}

	if (!('srcAmount' in params))
		throw new Error('Source amount value not specified');

	await test('Source amount (' + params.srcAmount + ') input', () => view.inputSrcAmount(params.srcAmount), view);

	if ('destAmount' in params)
		await test('Destination amount (' + params.destAmount + ') input', () => view.inputDestAmount(params.destAmount), view);

	if ('date' in params)
		await test('Date (' + params.date + ') input', () => view.changeDate(params.date), view);

	if ('comment' in params)
		await test('Comment (' + params.comment + ') input', () => view.inputComment(params.comment), view);

	let res = view.getExpectedTransaction();

	await view.submit();

	return res;
}


export async function create(params)
{
	await TransactionTests.create(TRANSFER, params, params => submit(params));
}


// Update transfer transaction and check results
export async function update(params)
{
	await TransactionTests.update(TRANSFER, params, async (params) =>
	{
		let origTransaction = App.view.getExpectedTransaction();
		let isDiff = (origTransaction.src_curr != origTransaction.dest_curr);

		await test('Initial state of update transfer view', () => App.view.setExpectedState(isDiff ? 3 : 0), App.view);

		return submit(params);
	});
}


export async function stateLoop()
{
	const ACC_3 = 0;
	const ACC_RUB = 1;
	const ACC_USD = 2;
	const ACC_EUR = 3;
	const CARD_RUB = 4;

	await App.state.fetch();

	// Navigate to create income view
	if (!(App.view instanceof TransferTransactionView))
	{
		await App.goToMainView();
		await App.view.goToNewTransactionByAccount(0);
		if (App.view.content.typeMenu.activeType != TRANSFER)
			await App.view.changeTransactionType(TRANSFER);
	}

	let view = App.view;

	view.setBlock('Transfer loop', 2);
	await test('Initial state of new transfer view', async () => view.setExpectedState(0), view);

	// Input source amount
	await test('Source amount (1) input', () => view.inputSrcAmount('1'), view);
	await test('Source amount (1.) input', () => view.inputSrcAmount('1.'), view);
	await test('Source amount (1.0) input', () => view.inputSrcAmount('1.0'), view);
	await test('Source amount (1.01) input', () => view.inputSrcAmount('1.01'), view);
	await test('Source amount (1.010) input', () => view.inputSrcAmount('1.010'), view);
	await test('Source amount (1.0101) input', () => view.inputSrcAmount('1.0101'), view);
	await test('Emptry source amount input', () => view.inputSrcAmount(''), view);
	await test('Source amount (.) input', () => view.inputSrcAmount('.'), view);
	await test('Source amount (.0) input', () => view.inputSrcAmount('.0'), view);
	await test('Source amount (.09) input', () => view.inputSrcAmount('.09'), view);

	// Transition 7: Change destination account to another one with same currency as source (EUR)
	await test('(7) Change destination account', () => view.changeDestAccountByPos(ACC_3), view);
	// Transition 5: Change source account to another one with same currency as destination (USD)
	await test('(5) Change source account', () => view.changeSrcAccountByPos(ACC_3), view);
	// Transition 1: Click by source balance and move from State 0 to State 1
	await test('(1) Click on source result balance', () => view.clickSrcResultBalance(), view);

	// Input source result balance
	await test('Source result balance (400) input', () => view.inputResBalance('400'), view);
	await test('Source result balance (400.) input', () => view.inputResBalance('400.'), view);
	await test('Source result balance (400.9) input', () => view.inputResBalance('400.9'), view);
	await test('Source result balance (400.99) input', () => view.inputResBalance('400.99'), view);
	await test('Source result balance (400.990) input', () => view.inputResBalance('400.990'), view);
	await test('Source result balance (400.9901) input', () => view.inputResBalance('400.9901'), view);
	await test('Empty result balance input', () => view.inputResBalance(''), view);
	await test('Source result balance (.) input', () => view.inputResBalance('.'), view);
	await test('Source result balance (.0) input', () => view.inputResBalance('.0'), view);
	await test('Source result balance (.01) input', () => view.inputResBalance('.01'), view);

	// Transition 11: Change source account to another one with same currency as destination and stay on State 1
	await test('(11) Change source account', () => view.changeSrcAccountByPos(CARD_RUB), view);
	// Transition 13: Change destination account to another one with same currency as source and stay on State 1
	await test('(13) Change destination account', () => view.changeDestAccountByPos(CARD_RUB), view);
	// Transition 9: Click by destination balance and move from State 1 to State 2
	await test('(9) Click on destination result balance', () => view.clickDestResultBalance(), view);

	// Input destination result balance
	await test('Destination result balance (600) input', () => view.inputDestResBalance('600'), view);
	await test('Destination result balance (600.) input', () => view.inputDestResBalance('600.'), view);
	await test('Destination result balance (600.9) input', () => view.inputDestResBalance('600.9'), view);
	await test('Destination result balance (600.90) input', () => view.inputDestResBalance('600.90'), view);
	await test('Destination result balance (600.901) input', () => view.inputDestResBalance('600.901'), view);
	await test('Destination result balance (600.9010) input', () => view.inputDestResBalance('600.9010'), view);
	await test('Destination result balance (600.90101) input', () => view.inputDestResBalance('600.90101'), view);
	await test('Empty destination result balance input', () => view.inputDestResBalance(''), view);
	await test('Destination result balance (.) input', () => view.inputDestResBalance('.'), view);
	await test('Destination result balance (.0) input', () => view.inputDestResBalance('.0'), view);

	// Transition 15: Change source account to another one with same currency and stay on State 2
	await test('(15) Change source account', () => view.changeSrcAccountByPos(CARD_RUB), view);
	// Transition 17: Change destination account to another one with same currency and stay on State 2
	await test('(17) Change destination account', () => view.changeDestAccountByPos(CARD_RUB), view);
	// Transition 16: Change source account to another one with different currency (USD) and move from State 2 to State 5
	await test('(16) Change source account', () => view.changeSrcAccountByPos(ACC_USD), view);
	// Transition 26: Change source account to another one with different currency (EUR) and stay on State 5
	await test('(26) Change source account', () => view.changeSrcAccountByPos(ACC_EUR), view);
	// Transition 28: Change destination account to another one with different currency and stay on State 5
	await test('(28) Change destination account', () => view.changeDestAccountByPos(ACC_3), view);
	// Transition 27: Change source account to another one with same currency as destination (RUB) and move from State 5 to State 2
	await test('(27) Change source account', () => view.changeSrcAccountByPos(ACC_RUB), view);
	// Transition 18: Change destination account to another one with different currency than source (USD) and move from State 2 to State 5
	await test('(18) Change destination account', () => view.changeDestAccountByPos(ACC_USD), view);
	// Transition 29: Change destination account to another one with same currency as source and move from State 5 to State 2
	await test('(29) Change destination account', () => view.changeDestAccountByPos(ACC_3), view);
	// Transition 10: Click by source balance and move from State 1 to State 2
	await test('(10) Click on source result balance', () => view.clickSrcResultBalance(), view);
	// Transition 2: Click by source amount and move from State 1 to State 0
	await test('(2) Click on source amount', () => view.clickSrcAmount(), view);
	// Transition 6: Change source account to another one with different currency than destination (USD) and move from State 0 to State 3
	await test('(6) Change source account', () => view.changeSrcAccountByPos(ACC_USD), view);
	// Transition 43: Change source account to another one with different currency than destination (RUB) and stay on State 3
	await test('(43) Change source account', () => view.changeSrcAccountByPos(ACC_RUB), view);
	// Transition 41: Change destination account to another one with same currency as source (EUR) and stay on State 3
	await test('(41) Change destination account', () => view.changeDestAccountByPos(ACC_EUR), view);

	// Transition 44: Change source account to another one with same currency as destination (EUR > RUB) and move from State 3 to State 0
	await view.changeSrcAccountByPos(ACC_EUR);
	await test('(44) Change source account', () => view.changeSrcAccountByPos(ACC_3), view);

	// Transition 8: Change destination account to another one with different currency than source (USD) and move from State 0 to State 3
	await test('(8) Change destination account', () => view.changeDestAccountByPos(ACC_USD), view);
	// Transition 42: Change destination account to another one with same currency as source (RUB) and move from State 3 to State 0
	await test('(42) Change destination account', () => view.changeDestAccountByPos(ACC_RUB), view);

	// Transition 12: Change source account to another one with different currency than destination (EUR) and move from State 1 to State 4
	await view.clickSrcResultBalance();					// move from State 0 to State 1
	await test('(12) Change source account', () => view.changeSrcAccountByPos(ACC_EUR), view);

	// Transition 36: Change source account to another one with different currency than destination (USD) and stay on State 4
	await test('(36) Change source account', () => view.changeSrcAccountByPos(ACC_RUB), view);
	// Transition 38: Change destination account to another one with different currency than source (RUB) and stay on State 4
	await test('(38) Change destination account', () => view.changeDestAccountByPos(ACC_EUR), view);
	// Transition 39: Change destination account to another one with same currency as source (RUB) and move from State 4 to State 1
	await test('(39) Change destination account', () => view.changeDestAccountByPos(ACC_EUR), view);
	// Transition 14: Change destination account to another one with different currency than source (USD) and move from State 1 to State 4
	await test('(14) Change destination account', () => view.changeDestAccountByPos(ACC_USD), view);
	// Transition 32: Click by destination result balance and move from State 4 to State 6
	await test('(32) Click on destination result balance', () => view.clickDestResultBalance(), view);
	// Transition 49: Change source account to another one with different currency than destination (EUR) and stay on State 6
	await test('(49) Change source account', () => view.changeSrcAccountByPos(ACC_EUR), view);
	// Transition 47: Change destination account to another one with different currency than source (RUB) and stay on State 6
	await test('(47) Change destination account', () => view.changeDestAccountByPos(ACC_3), view);
	// Transition 20: Click by source amount and move from State 6 to State 5
	await test('(20) Click on source amount', () => view.clickSrcAmount(), view);
	// Transition 19: Click by source result balance and move from State 5 to State 6
	await test('(19) Click on source result balance', () => view.clickSrcResultBalance(), view);
	// Transition 45: Click by exchange rate and move from State 6 to State 8
	await test('(45) Click on exchange rate', () => view.clickExchRate(), view);
	// Transition 51: Change source account to another one with different currency than destination (USD) and stay on State 6
	await test('(51) Change source account', () => view.changeSrcAccountByPos(ACC_USD), view);
	// Transition 53: Change destination account to another one with different currency than source (EUR) and stay on State 6
	await test('(53) Change destination account', () => view.changeDestAccountByPos(ACC_EUR), view);
	// Transition 23: Click by source amount and move from State 8 to State 7
	await test('(23) Click on source amount', () => view.clickSrcAmount(), view);
	// Transition 57: Change source account to another one with different currency than destination (RUB) and stay on State 7
	await test('(57) Change source account', () => view.changeSrcAccountByPos(ACC_3), view);
	// Transition 59: Change destination account to another one with different currency than source (USD) and stay on State 7
	await test('(59) Change destination account', () => view.changeDestAccountByPos(ACC_USD), view);
	// Transition 22: Click by source result balance and move from State 7 to State 8
	await test('(22) Click on source result balance', () => view.clickSrcResultBalance(), view);
	// Transition 46: Click by destination result balance and move from State 8 to State 6
	await test('(46) Click on destination result balance', () => view.clickDestResultBalance(), view);
	// Transition 33: Click by destination amount and move from State 6 to State 4
	await test('(33) Click on destination amount', () => view.clickDestAmount(), view);

	// Transition 37: Change source account to another one with same currency as destination (RUB) and from State 4 to State 1
	await view.changeSrcAccountByPos(ACC_EUR);		// change source to EUR first
	await view.changeDestAccountByPos(CARD_RUB)		// change destination to RUB
	await test('(37) Change source account', () => view.changeSrcAccountByPos(ACC_3), view);

	// Transition 21: Click by exchange rate and move from State 5 to State 7
	await view.clickSrcAmount();						// move from State 1 to State 0
	await view.clickDestResultBalance();				// move from State 0 to State 2
	await view.changeDestAccountByPos(ACC_USD);			// move from State 2 to State 5
	await test('(21) Click on exchange rate', () => view.clickExchRate(), view);

	// Transition 55: Click by destination amount and move from State 7 to State 3
	await test('(55) Click on destination amount', () => view.clickDestAmount(), view);
	// Transition 25: Click by destination result balance and move from State 3 to State 5
	await test('(25) Click on destination result balance', () => view.clickDestResultBalance(), view);

	// Transition 56: Click by destination result balance and move from State 7 to State 5
	await view.clickExchRate();					// move from State 5 to State 7
	await test('(56) Click on destination result balance', () => view.clickDestResultBalance(), view);

	// Transition 24: Click by destination amount and move from State 5 to State 3
	await test('(24) Click on destination amount', () => view.clickDestAmount(), view);
	// Transition 40: Click by exchange rate and move from State 3 to State 7
	await test('(40) Click on exchange rate', () => view.clickExchRate(), view);
	// Transition 60: Change destination account to another one with same currency as source (RUB) and move from State 7 to State 0
	await test('(60) Change destination account', () => view.changeDestAccountByPos(ACC_RUB), view);

	// Transition 58: Change source account to another one with same currency as destination (RUB) and from State 7 to State 0
	await view.clickDestResultBalance();			// move from State 0 to State 2
	await view.changeSrcAccountByPos(ACC_USD);		// move from State 2 to State 5
	await view.clickExchRate();						// move from State 5 to State 7
	await test('(58) Change source account', () => view.changeSrcAccountByPos(ACC_3), view);

	// Transition 30: Click by source amount and move from State 4 to State 3
	await view.clickSrcResultBalance();				// move from State 0 to State 1
	await view.changeSrcAccountByPos(ACC_EUR);		// move from State 1 to State 4
	await test('(30) Click on source amount', () => view.clickSrcAmount(), view);

	// Transition 31: Click by source result balance and move from State 3 to State 4
	await test('(31) Click on source result balance', () => view.clickSrcResultBalance(), view);
	// Transition 34: Click by exchange rate and move from State 4 to State 8
	await test('(34) Click on exchange rate', () => view.clickExchRate(), view);
	// Transition 35: Click by destination amount and move from State 8 to State 4
	await test('(35) Click on destination amount', () => view.clickDestAmount(), view);

	// Transition 52: Change source account to another one with same currency as destination (RUB) and from State 8 to State 1
	await view.clickExchRate();						// move from State 4 to State 8
	await test('(52) Change source account', () => view.changeSrcAccountByPos(ACC_3), view);

	// Transition 54: Change destination account to another one with same currency as source (RUB) and move from State 8 to State 1
	await view.changeDestAccountByPos(ACC_USD);			// move from State 1 to State 4
	await view.clickExchRate();							// move from State 4 to State 8
	await test('(54) Change destination account', () => view.changeDestAccountByPos(ACC_RUB), view);

	// Transition 50: Change source account to another one with same currency as destination (RUB) and from State 6 to State 1
	await view.changeSrcAccountByPos(ACC_USD);		// move from State 1 to State 4
	await view.clickDestResultBalance();			// move from State 4 to State 6
	await test('(50) Change source account', () => view.changeSrcAccountByPos(ACC_3), view);

	// Transition 48: Change destination account to another one with same currency as source (RUB) and move from State 1 to State 2
	await view.changeDestAccountByPos(ACC_USD);			// move from State 1 to State 4
	await view.clickDestResultBalance();				// move from State 4 to State 6
	await test('(48) Change destination account', () => view.changeDestAccountByPos(ACC_RUB), view);
}
