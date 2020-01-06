import { api } from '../../api.js';
import { runTransactionsCommon } from './common.js'
import { TransactionsList } from '../../trlist.js'


var runExpense = (function()
{
	let test = null;


	async function submitExpenseTransaction(app, params)
	{
		let view = app.view;
		test = app.test;

		if ('srcAcc' in params)
		{
			let acc = await view.getAccountByPos(params.srcAcc);
			if (!acc)
				throw new Error('Account (' + params.srcAcc + ') not found');

			await test('Change source account to (' + acc.name + ')',
					() => view.changeSrcAccountByPos(params.srcAcc), view);
		}

		if ('destCurr' in params)
		{
			let curr = app.getCurrency(params.destCurr, app.currencies);
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

		app.state.accounts = null;
		app.state.persons = null;

		await view.submit();

		return res;
	}


	async function createExpense(app, params)
	{
		let env = app.environment;
		test = app.test;

		let titleParams = [];
		for(let k in params)
			titleParams.push(k + ': ' + params[k]);
		app.view.setBlock('Create expense (' + titleParams.join(', ') + ')', 2);

		let accList = await app.state.getAccountsList();
		let pList = await app.state.getPersonsList();
		let trBefore = await api.transaction.list();
		let expTransList = new TransactionsList(app, trBefore);

		// Navigate to create transaction page
		let accNum = ('fromAccount' in params) ? params.fromAccount : 0;
		await app.goToMainView();
		await app.view.goToNewTransactionByAccount(accNum);

		// Input data and submit
		let expectedTransaction = await submitExpenseTransaction(app, params);

		// Prepare data for next calculations
		let afterCreate = app.state.createTransaction(accList, expectedTransaction);
		let newTransInd = expTransList.create(expectedTransaction);
		let expectedState = await app.state.render(afterCreate, pList, expTransList.list);

		await test('Main page widgets update', async () => {}, app.view, expectedState);

		app.accountTiles = app.view.content.widgets[app.config.AccountsWidgetPos].tiles.items;
		app.personTiles = app.view.content.widgets[app.config.PersonsWidgetPos].infoTiles.items;

		// Read updated list of transactions
		await runTransactionsCommon.checkData(app, 'List of transactions update', expTransList);

		app.transactions = expTransList.list;
	}


	// Update expense transaction and check results
	async function updateExpense(app, params)
	{
		let view = app.view;
		test = app.test;

		if (!app.isObject(params))
			throw new Error('Parameters not specified');

		let pos = parseInt(params.pos);
		if (isNaN(pos) || pos < 0)
			throw new Error('Position of transaction not specified');
		delete params.pos;

		let titleParams = [];
		for(let k in params)
			titleParams.push(k + ': ' + params[k]);
		view.setBlock('Update expense [' + pos + '] (' + titleParams.join(', ') + ')', 2);

		let accList = await app.state.getAccountsList();
		let pList = await app.state.getPersonsList();
		let trBefore = await api.transaction.list();
		let expTransList = new TransactionsList(app, trBefore);

		await app.goToMainView();
		await app.view.goToTransactions();
		await app.view.filterByType(app.EXPENSE);
		await app.view.goToUpdateTransaction(pos);

		// Step
		let origTransaction = app.view.getExpectedTransaction();
		let isDiff = (origTransaction.src_curr != origTransaction.dest_curr);

		await test('Initial state of update expense view', async () => app.view.setExpectedState(isDiff ? 2 : 0), app.view);

		let expectedTransaction = await submitExpenseTransaction(app, params);

		let afterUpdate = app.state.updateTransaction(accList, origTransaction, expectedTransaction);
		expTransList.update(origTransaction.id, expectedTransaction);
		let expectedState = await app.state.render(afterUpdate, pList, expTransList.list);

		await app.goToMainView();
		await test('Main page widgets update', async () => {}, app.view, expectedState);

		await runTransactionsCommon.checkData(app, 'List of transactions update', expTransList);
	}


	async function expenseTransactionLoop(app, actionState, action)
	{
		let view = app.view;
		test = app.test;

	// State 0
		view.setBlock('Expense loop', 2);
		await test('Initial state of new expense view', async () => view.setExpectedState(0), view);

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
				() => view.changeSrcAccountByPos(2), view);

	// Change account back
		await test('(12) Change account back', () => view.changeSrcAccountByPos(0), view);

	// Transition 3: click on destination amount block and move from State 1 to State 0
		await test('(3) Click on destination amount', () => view.clickDestAmount(), view);

	// Transition 4: select different currency for destination and move from State 0 to State 2
		await test('(4) Change destination curency to USD', () => view.changeDestCurrency(2), view);

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
		await test('(13) Change destination curency to EUR', () => view.changeDestCurrency(3), view);

	// Transition 9: select same currency as source account and move from State 2 to State 0
		await test('(9) Change destination curency to RUB', () => view.changeDestCurrency(1), view);

	// Transition 1: change account to another one with different currency and stay on State 0
		await test('(1) Change account to another one with different currency', () => view.changeSrcAccountByPos(2), view);

	// Transition 4: select different currency for destination and move from State 0 to State 2
		await test('(4) Select different currency for destination', () => view.changeDestCurrency(3), view);

	// Transition 5: change account to another one with currency different than current destination currency and stay on State 2
		await test('(5) Change account to another one with currency different than current destination currency',
				() => view.changeSrcAccountByPos(0), view);

	// Transition 6: click on source result balance block and move from State 2 to State 4
		await test('(6) Click on source result block', () => view.clickSrcResultBalance(), view);

	// Transition 10: change account to another one with currency different than current destination currency and stay on State 4
		await test('(10) Change account to another one with currency different than current destination currency',
				() => view.changeSrcAccountByPos(2), view);

	// Transition 7: click on destination amount block and move from State 4 to State 2
		await test('(7) Click on source amount block', () => view.clickDestAmount(), view);

	// Transition 14: select source account with the same currency as destination and move from State 2 to State 0
		await test('(14) Change account to another one with the same currency as current destination currency',
				() => view.changeSrcAccountByPos(3), view);

	// Transition 4: select different currency for destination and move from State 0 to State 2
		await test('(4) Select different currency for destination', () => view.changeDestCurrency(1), view);

	// Transition 8: click on exchange rate block and move from State 2 to State 3
		await test('(8) Click on exchange rate', () => view.clickExchRate(), view);

	// Transition 17: change account to another one with currency different than current destination currency and stay on State 3
		await test('(17) Change account to another one with currency different than current destination currency',
				() => view.changeSrcAccountByPos(2), view);

	// Transition 15: select source account with the same currency as destination and move from State 2 to State 0
		await test('(15) Change account to another one with the same currency as destination',
				() => view.changeSrcAccountByPos(1), view);

	// Transition 4: select different currency for destination and move from State 0 to State 2
		await test('(4) Select different currency for destination', () => view.changeDestCurrency(2), view);

	// Transition 6: click on source result balance block and move from State 2 to State 4
		await test('(6) Click on source result balance block', () => view.clickSrcResultBalance(), view);

	// Transition 19: click on exchange rate block and move from State 4 to State 3
		await test('(19) Click on exchange rate block', () => view.clickExchRate(), view);

	// Transition 18: click on source result balance and move from State 3 to State 4
		await test('(18) Click on source result balance rate block', () => view.clickSrcResultBalance(), view);

	// Transition 11: select source account with the same currency as destination and move from State 4 to State 1
		await test('(11) Change account to another one with the same currency as destination',
				() => view.changeSrcAccountByPos(2), view);
	}


 	return { create : createExpense,
				update : updateExpense,
				stateLoop : expenseTransactionLoop };
})();


export { runExpense };
