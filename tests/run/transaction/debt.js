import * as TransactionTests from './common.js'
import { test } from '../../common.js'
import { DEBT } from '../../model/transaction.js';
import { DebtTransactionView } from '../../view/transaction/debt.js'
import { App } from '../../app.js';


export async function submit(params)
{
	if ('acc' in params)
		await TransactionTests.runAction({ action : 'changeAccountByPos', data : params.acc });

	if ('person' in params)
		await TransactionTests.runAction({ action : 'changePersonByPos', data : params.person });

	if ('debtType' in params)
		await TransactionTests.runAction({ action : 'toggleDebtType', data : params.debtType });

	if (!('srcAmount' in params))
		throw new Error('Source amount value not specified');

	await TransactionTests.runAction({ action : 'inputSrcAmount', data : params.srcAmount });

	if ('date' in params)
		await TransactionTests.runAction({ action : 'changeDate', data : params.date });

	if ('comment' in params)
		await TransactionTests.runAction({ action : 'inputComment', data : params.comment });

	return TransactionTests.submit();
}


export async function create(params)
{
	await TransactionTests.create(DEBT, params, submit);
}


export async function update(params)
{
	await TransactionTests.update(DEBT, params, async (params) =>
	{
		let expState;
		if (App.view.model.noAccount)
			expState = (App.view.model.debtType) ? 6 : 7;
		else
			expState = (App.view.model.debtType) ? 0 : 3;

		await test('Initial state of update debt view', () => App.view.setExpectedState(expState), App.view);

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
	const MARIA = 0;
	const IVAN = 1;

	await App.state.fetch();

	// Navigate to create income view
	if (!(App.view instanceof DebtTransactionView))
	{
		await App.goToMainView();
		await App.view.goToNewTransactionByAccount(0);
		if (App.view.content.typeMenu.activeType != DEBT)
			await App.view.changeTransactionType(DEBT);
	}

	let view = App.view;

	view.setBlock('Debt loop', 2);
	await test('Initial state of new debt view', async () => view.setExpectedState(0));

	// Input source amount
	await test('Source amount (1) input', () => view.inputSrcAmount('1'));
	await test('Source amount (1.) input', () => view.inputSrcAmount('1.'));
	await test('Source amount (1.0) input', () => view.inputSrcAmount('1.0'));
	await test('Source amount (1.01) input', () => view.inputSrcAmount('1.01'));
	await test('Source amount (1.010) input', () => view.inputSrcAmount('1.010'));
	await test('Source amount (1.0101) input', () => view.inputSrcAmount('1.0101'));
	await test('Emptry source amount input', () => view.inputSrcAmount(''));
	await test('Source amount (.) input', () => view.inputSrcAmount('.'));
	await test('Source amount (.0) input', () => view.inputSrcAmount('.0'));
	await test('Source amount (.09) input', () => view.inputSrcAmount('.09'));

	// Transition 1: Click by source result balance and move from State 0 to State 1
	await test('(1) Click on source result balance', () => view.clickSrcResultBalance());
	// Transition 47: Change to another one and stay on State 1
	await test('(47) Change account', () => view.changeAccountByPos(ACC_RUB));

	// Input source result balance
	await test('Source result balance (400) input', () => view.inputResBalance('400'));
	await test('Source result balance (400.) input', () => view.inputResBalance('400.'));
	await test('Source result balance (400.9) input', () => view.inputResBalance('400.9'));
	await test('Source result balance (400.99) input', () => view.inputResBalance('400.99'));
	await test('Source result balance (400.990) input', () => view.inputResBalance('400.990'));
	await test('Source result balance (400.9901) input', () => view.inputResBalance('400.9901'));
	await test('Empty result balance input', () => view.inputResBalance(''));
	await test('Source result balance (.) input', () => view.inputResBalance('.'));
	await test('Source result balance (.0) input', () => view.inputResBalance('.0'));
	await test('Source result balance (.01) input', () => view.inputResBalance('.01'));

	// Transition 2: Click by source amount and move from State 1 to State 0
	await test('(2) Click on source amount', () => view.clickSrcAmount());
	// Transition 3: Click by destination result balance and move from State 0 to State 2
	await test('(3) Click on destination result balance', () => view.clickDestResultBalance());
	// Transition 42: Change to another one and stay on State 2
	await test('(42) Change account', () => view.changeAccountByPos(ACC_USD));

	// Input destination result balance
	await test('Destination result balance (600) input', () => view.inputDestResBalance('600'));
	await test('Destination result balance (600.) input', () => view.inputDestResBalance('600.'));
	await test('Destination result balance (600.9) input', () => view.inputDestResBalance('600.9'));
	await test('Destination result balance (600.90) input', () => view.inputDestResBalance('600.90'));
	await test('Destination result balance (600.901) input', () => view.inputDestResBalance('600.901'));
	await test('Destination result balance (600.9010) input', () => view.inputDestResBalance('600.9010'));
	await test('Destination result balance (600.90101) input', () => view.inputDestResBalance('600.90101'));
	await test('Empty destination result balance input', () => view.inputDestResBalance(''));
	await test('Destination result balance (.) input', () => view.inputDestResBalance('.'));
	await test('Destination result balance (.0) input', () => view.inputDestResBalance('.0'));

	// Transition 4: Click by source result balance and move from State 2 to State 1
	await test('(4) Click on source result balance', () => view.clickSrcResultBalance());
	// Transition 5: Click by destination result balance and move from State 1 to State 2
	await test('(5) Click on destination result balance', () => view.clickDestResultBalance());
	// Transition 6: Click by source amount and move from State 2 to State 0
	await test('(6) Click on source amount', () => view.clickSrcAmount());
	// Transition 7: Change debt type to "take" and move from State 0 to State 3
	await test('(7) Change debt type', () => view.toggleDebtType());
	// Transition 8: Change debt type back to "give" and move from State 3 to State 0
	await test('(8) Change debt type', () => view.toggleDebtType());

	// Transition 49: Change to another one and stay on State 3
	await view.toggleDebtType();				// move from State 0 to State 3
	await test('(49) Change account', () => view.changeAccountByPos(ACC_EUR));

	// Transition 9: Click by destination result balance and move from State 3 to State 4
	await test('(9) Click on destination result balance', () => view.clickDestResultBalance());
	// Transition 51: Change to another one and stay on State 4
	await test('(51) Change account', () => view.changeAccountByPos(CARD_RUB));
	// Transition 10: Click by source amount and move from State 4 to State 3
	await test('(10) Click on source amount', () => view.clickSrcAmount());

	// Transition 11: Click by source result balance and move from State 4 to State 5
	await view.clickDestResultBalance();		// move from State 3 to State 4
	await test('(11) Click on source result balance', () => view.clickSrcResultBalance());

	// Transition 48: Change to another one and stay on State 5
	await test('(48) Change account', () => view.changeAccountByPos(ACC_3));
	// Transition 12: Click by source amount and move from State 5 to State 3
	await test('(12) Click on source amount', () => view.clickSrcAmount());
	// Transition 13: Click by source result balance and move from State 3 to State 5
	await test('(13) Click on source result balance', () => view.clickSrcResultBalance());
	// Transition 14: Click by destination result balance and move from State 5 to State 4
	await test('(14) Click on destination result balance', () => view.clickDestResultBalance());
	// Transition 15: Change debt type to "give" and move from State 4 to State 1
	await test('(15) Change debt type', () => view.toggleDebtType());
	// Transition 16: Change debt type to "take" and move from State 1 to State 4
	await test('(16) Change debt type', () => view.toggleDebtType());

	// Transition 17: Change debt type to "give" and move from State 5 to State 2
	await view.clickSrcResultBalance();			// move from State 4 to State 5
	await test('(17) Change debt type', () => view.toggleDebtType());

	// Transition 18: Change debt type to "take" and move from State 2 to State 5
	await test('(18) Change debt type', () => view.toggleDebtType());

	// Transition 19: Change person to another one and stay on State 0
	await view.clickSrcAmount();				// move from State 5 to State 3
	await view.toggleDebtType();				// move from State 3 to State 0
	await test('(19) Change person', () => view.changePersonByPos(IVAN));

	// Transition 20: Change person to another one and stay on State 1
	await view.clickSrcResultBalance();				// move from State 0 to State 1
	await test('(20) Change person', () => view.changePersonByPos(MARIA));

	// Transition 21: Change person to another one and stay on State 2
	await view.clickDestResultBalance();			// move from State 1 to State 2
	await test('(21) Change person', () => view.changePersonByPos(IVAN));

	// Transition 22: Change person to another one and stay on State 5
	await view.toggleDebtType();				// move from State 2 to State 5
	await test('(22) Change person', () => view.changePersonByPos(MARIA));

	// Transition 23: Change person to another one and stay on State 4
	await view.clickDestResultBalance();		// move from State 5 to State 4
	await test('(23) Change person', () => view.changePersonByPos(IVAN));

	// Transition 24: Change person to another one and stay on State 3
	await view.clickSrcAmount();				// move from State 4 to State 3
	await test('(24) Change person', () => view.changePersonByPos(MARIA));

	// Transition 25: Disable account and move from State 0 to State 6
	await view.toggleDebtType();		// move from State 3 to State 0
	await test('(25) Disable account', () => view.toggleAccount());

	// Transition 43: Change person to another one and stay on State 6
	await test('(43) Change person', () => view.changePersonByPos(IVAN));
	// Transition 26: Enable account and move from State 6 to State 0
	await test('(26) Enable account', () => view.toggleAccount());

	// Transition 27: Change debt type to "take" and move from State 6 to State 7
	await view.toggleAccount();			// move from State 0 to State 6
	await test('(27) Change debt type', () => view.toggleDebtType());

	// Transition 44: Change person to another one and stay on State 7
	await test('(44) Change person', () => view.changePersonByPos(MARIA));
	// Transition 28: Change debt type to "give" and move from State 7 to State 6
	await test('(28) Change debt type', () => view.toggleDebtType());

	// Transition 29: Enable account and move from State 7 to State 3
	await view.toggleDebtType();		// move from State 6 to State 7
	await test('(29) Enable account', () => view.toggleAccount());

	// Transition 30: Click by destination result balance and move from State 7 to State 8
	await view.toggleDebtType();				// move from State 3 to State 0
	await view.toggleAccount();					// move from State 0 to State 6
	await view.toggleDebtType();				// move from State 6 to State 7
	await test('(30) Click on destination result balance', () => view.clickDestResultBalance());

	// Transition 45: Change person to another one and stay on State 8
	await test('(45) Change person', () => view.changePersonByPos(IVAN));
	// Transition 31: Click by source amount and move from State 8 to State 7
	await test('(31) Click on source amount', () => view.clickSrcAmount());

	// Transition 32: Enable account and move from State 8 to State 4
	await view.clickDestResultBalance();		// move from State 7 to State 8
	await test('(32) Enable account', () => view.toggleAccount());

	// Transition 39: Disable account and move from State 4 to State 8
	await test('(39) Disable account', () => view.toggleAccount());
	// Transition 33: Change debt type to "give" and move from State 8 to State 9
	await test('(33) Change debt type', () => view.toggleDebtType());
	// Transition 46: Change person to another one and stay on State 9
	await test('(46) Change person', () => view.changePersonByPos(MARIA));
	// Transition 34: Change debt type to "take" and move from State 9 to State 8
	await test('(34) Change debt type', () => view.toggleDebtType());

	// Transition 35: Click by source amount and move from State 9 to State 6
	await view.changePersonByPos(IVAN);		// stay on State 8
	await view.toggleDebtType();			// move from State 8 to State 9
	await test('(35) Click on source amount', () => view.clickSrcAmount());

	// Transition 36: Click by source result balance and move from State 6 to State 9
	await test('(36) Click on source result balance', () => view.clickSrcResultBalance());
	// Transition 37: Enable account and move from State 9 to State 1
	await test('(37) Enable account', () => view.toggleAccount());
	// Transition 38: Disable account and move from State 1 to State 9
	await test('(38) Disable account', () => view.toggleAccount());

	// Transition 40: Disable account and move from State 3 to State 7
	await view.clickSrcAmount()			// move from State 9 to State 6
	await view.toggleAccount();			// move from State 6 to State 0
	await view.toggleDebtType();		// move from State 0 to State 3
	await test('(40) Disable account', () => view.toggleAccount());

	// Transition 41: Disable account and move from State 2 to State 6
	await view.toggleDebtType();				// move from State 7 to State 6
	await view.toggleAccount();					// move from State 6 to State 0
	await view.clickDestResultBalance();		// move from State 0 to State 2
	await test('(41) Disable account', () => view.toggleAccount());

	// Transition 52: Change to another one and stay on State 0
	await view.toggleAccount();					// move from State 6 to State 0
	await test('(52) Change account', () => view.changeAccountByPos(ACC_USD));

	// Transition 50: Disable account and move from State 5 to State 7
	await view.clickDestResultBalance();	// move from State 0 to State 2
	await view.toggleDebtType();			// move from State 2 to State 5
	await test('(50) Disable account', () => view.toggleAccount());
}
