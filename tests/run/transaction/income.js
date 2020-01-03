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

		app.beforeSubmitTransaction = { destAcc : view.model.destAccount,
										destAccPos : await view.getAccountPos(view.model.destAccount.id),
										srcCurr : view.model.srcCurr,
										destCurr : view.model.destCurr,
										srcAmount : view.model.fSrcAmount,
										destAmount : view.model.fDestAmount,
										date : view.model.date,
										comment : view.model.comment };
		if (view.model.isUpdate)
			app.beforeSubmitTransaction.id = view.model.id;

		app.accountsCache = null;
		app.personsCache = null;

		return view.submit();
	}


	async function createIncome(app, params)
	{
		let env = app.view.props.environment;
		test = app.test;

		let titleParams = [];
		for(let k in params)
			titleParams.push(k + ': ' + params[k]);
		app.view.setBlock('Create income (' + titleParams.join(', ') + ')', 2);

		let expTransList = await runTransactionsCommon.checkData(app, 'Initial data consistency');

		// Navigate to create transaction page
		let accNum = ('fromAccount' in params) ? params.fromAccount : 0;
		await app.goToMainView();
		await app.view.goToNewTransactionByAccount(accNum);
		await app.view.changeTransactionType(app.INCOME);

		// Input data and submit
		await submitIncomeTransaction(app, params);

		// Prepare data for next calculations
		let { destAcc, destAccPos, srcAmount, destAmount, srcCurr, destCurr, date, comment } = app.beforeSubmitTransaction;
		let newTransInd = expTransList.create({ type : app.INCOME,
												src_id : 0,
												dest_id : destAcc.id,
												src_amount : srcAmount,
												dest_amount : destAmount,
											 	src_curr : srcCurr.id,
												dest_curr : destCurr.id,
												date,
												comment });

		// Obtain real destination amount from props:
		// In case of income with different currency use destination amount value
		// In case of income with the same currency copy source amount value
		let da = ('srcCurr' in params && 'destAmount' in params) ? params.destAmount : params.srcAmount;
		let expBalance = destAcc.balance + app.normalize(da);
		let fmtBal = app.formatCurrency(expBalance, destAcc.curr_id, app.currencies);

		// Accounts widget changes
		let accWidget = { tiles : { items : { length : app.accountTiles.length } } };
		accWidget.tiles.items[destAccPos] = { balance : fmtBal, name : destAcc.name };

		// Transactions widget changes
		let transWidget = { title : 'Transactions',
							transList : { items : { length : Math.min(expTransList.list.length, app.config.latestTransactions) } } };

		if (newTransInd >= 0 && newTransInd < app.config.latestTransactions)
		{
			let listItem = await runTransactionsCommon.convertToListItem(app, expTransList.list[newTransInd]);
			transWidget.transList.items[newTransInd] = listItem;
		}


		let state = { values : { widgets : { length : app.config.widgetsCount } } };
		state.values.widgets[app.config.AccountsWidgetPos] = accWidget;
		state.values.widgets[app.config.LatestWidgetPos] = transWidget;

		await test('Main page widgets update', async () => {}, app.view, state);

		app.accountTiles = app.view.content.widgets[app.config.AccountsWidgetPos].tiles.items;
		app.personTiles = app.view.content.widgets[app.config.PersonsWidgetPos].infoTiles.items;

		await runTransactionsCommon.checkData(app, 'List of transactions update', expTransList);

		app.transactions = expTransList.list;
	}


	// Update income transaction and check results
	async function updateIncome(app, params)
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
		app.view.setBlock('Update income [' + pos + '] (' + titleParams.join(', ') + ')', 2);

		let expTransList = await runTransactionsCommon.checkData(app, 'Initial data consistency');

		// Step 0: navigate to transactions view and filter by income
		await app.goToMainView();
		await app.view.goToTransactions();
		await app.view.filterByType(app.INCOME);

		// Step 1: Save count of transactions and navigate to update transaction view
		app.beforeUpdateTransaction = { trCount : expTransList.list.length };

		let trObj = await app.view.getTransactionObject(app.view.content.transList.items[pos].id);
		if (!trObj)
			throw new Error('Transaction not found');

		app.beforeUpdateTransaction.trObj = trObj;

		await app.view.goToUpdateTransaction(pos);

		// Step 2: Save original data of transaction, perform update actions and submit
		let isDiff = (app.beforeUpdateTransaction.trObj.src_curr != app.beforeUpdateTransaction.trObj.dest_curr);

		await test('Initial state of update income view', async () => app.view.setExpectedState(isDiff ? 2 : 0), app.view);

		app.setParam(app.beforeUpdateTransaction,
					{ id : app.view.model.id,
						destAcc : app.view.model.destAccount,
						destAccPos : await app.view.getAccountPos(app.view.model.destAccount.id),
						destBalance : app.view.model.fDestResBal,
						srcAmount : app.view.model.fSrcAmount,
						destAmount : app.view.model.fDestAmount,
						date : app.view.model.date,
						comment : app.view.model.comment});

		await submitIncomeTransaction(app, params);

		// Step 3: Check update of transactions list
		await app.view.filterByType(app.INCOME);

		let { destAcc : updDestAcc,
				destAccPos : updDestAccPos,
				srcAmount : updSrcAmount,
				destAmount : updDestAmount,
				srcCurr : updSrcCurr,
				destCurr : updDestCurr,
				date : updDate,
				comment : updComment } = app.beforeSubmitTransaction;

		let { id : trans_id,
				destAcc : origDestAcc,
				destAccPos : origDestAccPos,
				destBalance : origDestBalance,
				srcAmount : origSrcAmount,
				destAmount : origDestAmount,
				date : origDate,
				comment : origComment,
				trCount : transCount } = app.beforeUpdateTransaction;

		expTransList.update(trans_id, {
			id : trans_id,
			type : app.INCOME,
			src_id : 0,
			dest_id : updDestAcc.id,
			src_amount : updSrcAmount,
			dest_amount : updDestAmount,
		 	src_curr : updSrcCurr.id,
			dest_curr : updDestCurr.id,
			date : updDate,
			comment : updComment,
		 	pos : trObj.pos });

		// Transactions list changes
		await app.goToMainView();

		let transWidget = { title : 'Transactions',
							transList : { items : { length : Math.min(expTransList.list.length, app.config.latestTransactions) } } };

		let updTransInd = expTransList.findItem(trans_id);
		if (updTransInd >= 0 && updTransInd < app.config.latestTransactions)
		{
			let listItem = await runTransactionsCommon.convertToListItem(app, expTransList.list[updTransInd]);
			transWidget.transList.items[updTransInd] = listItem;
		}

		// Step 4: Check updates of affected accounts

		// Accounts widget changes
		let accWidget = { tiles : { items : { length : app.accountTiles.length } } };
		let expBalance, fmtBal;
		// Chech if account was changed we need to update both
		if (origDestAccPos != updDestAccPos)
		{
			expBalance = origDestBalance - origDestAmount;
			fmtBal = app.formatCurrency(expBalance, origDestAcc.curr_id, app.currencies);

			accWidget.tiles.items[origDestAccPos] = { balance : fmtBal, name : origDestAcc.name };

			expBalance = updDestAcc.balance + app.normalize(updDestAmount);
			fmtBal = app.formatCurrency(expBalance, updDestAcc.curr_id, app.currencies);

			accWidget.tiles.items[updDestAccPos] = { balance : fmtBal, name : updDestAcc.name };
		}
		else		// account not changed
		{
			expBalance = origDestBalance - origDestAmount + app.normalize(updDestAmount);
			fmtBal = app.formatCurrency(expBalance, updDestAcc.curr_id, app.currencies);

			accWidget.tiles.items[updDestAccPos] = { balance : fmtBal, name : updDestAcc.name };
		}

		let state = { values : { widgets : { length : app.config.widgetsCount } } };
		state.values.widgets[app.config.AccountsWidgetPos] = accWidget;
		state.values.widgets[app.config.LatestWidgetPos] = transWidget;

		await test('Main page widgets update', async () => {}, app.view, state);

		await runTransactionsCommon.checkData(app, 'List of transactions update', expTransList);

		app.transactions = expTransList.list;
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
