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
										destAccPos : await view.getAccountPos(view.model.destAccount.id) };
		if (view.model.isUpdate)
			app.beforeSubmitTransaction.id = view.model.id;

		app.accountsCache = null;
		app.personsCache = null;

		return view.submit();
	}


	async function createIncome(app, accNum, onState, params)
	{
		let view = app.view;
		test = app.test;

		let titleParams = [];
		for(let k in params)
			titleParams.push(k + ': ' + params[k]);
		view.setBlock('Create income (' + titleParams.join(', ') + ')', 2);

		// Step 0: navigate
		await app.goToMainView();
		await app.view.goToNewTransactionByAccount(accNum);
		await app.view.changeTransactionType(app.INCOME);
		await incomeTransactionLoop(app, onState, app => submitIncomeTransaction(app, params));
		view = app.view;

		// Step
		let destAcc = app.beforeSubmitTransaction.destAcc;
		let destAccPos = app.beforeSubmitTransaction.destAccPos;

		// Obtain real destination amount from props:
		// In case of income with different currency use destination amount value
		// In case of income with the same currency copy source amount value
		var da = ('srcCurr' in params && 'destAmount' in params) ? params.destAmount : params.srcAmount;
		var expBalance = destAcc.balance + app.normalize(da);
		var fmtBal = app.formatCurrency(expBalance, destAcc.curr_id, app.currencies);

		// Accounts widget changes
		var accWidget = { tiles : { items : { length : app.accounts.length } } };
		accWidget.tiles.items[destAccPos] = { balance : fmtBal, name : destAcc.name };

		// Transactions widget changes
		var fmtAmount = '+ ' + app.formatCurrency(params.srcAmount, ('srcCurr' in params) ? params.srcCurr : destAcc.curr_id, app.currencies);
		if ('srcCurr' in params && 'destAmount' in params)
		{
			fmtAmount += ' (+ ' + app.formatCurrency(params.destAmount, destAcc.curr_id, app.currencies) + ')';
		}

		var transWidget = { title : 'Transactions',
							transList : { items : { length : Math.min(app.transactions.length + 1, app.config.latestTransactions) } } };
		transWidget.transList.items[0] = { accountTitle : destAcc.name,
										amountText : fmtAmount,
									 	dateFmt : app.formatDate(('date' in params) ? new Date(params.date) : new Date()),
									 	comment : ('comment' in params) ? params.comment : '' };

		var state = { values : { widgets : { length : app.config.widgetsCount } } };
		state.values.widgets[app.config.AccountsWidgetPos] = accWidget;
		state.values.widgets[app.config.LatestWidgetPos] = transWidget;

		await test('Income transaction submit', async () => {}, view, state);

		app.transactions = view.content.widgets[app.config.LatestWidgetPos].transList.items;
		app.accounts = view.content.widgets[app.config.AccountsWidgetPos].tiles.items;
		app.persons = view.content.widgets[app.config.PersonsWidgetPos].infoTiles.items;
	}


	// Update income transaction and check results
	async function updateIncome(app, pos, params)
	{
		let view = app.view;
		test = app.test;

		let titleParams = [];
		for(let k in params)
			titleParams.push(k + ': ' + params[k]);
		view.setBlock('Update income [' + pos + '] (' + titleParams.join(', ') + ')', 2);

		pos = parseInt(pos);
		if (isNaN(pos) || pos < 0)
			throw new Error('Position of transaction not specified');

		if (!app.isObject(params))
			throw new Error('Parameters not specified');

		// Step 0: navigate to transactions view and filter by income
		await app.goToMainView();
		await app.view.goToTransactions();
		await app.view.filterByType(app.INCOME);
		view = app.view;

		// Step 1: Save count of transactions and navigate to update transaction view
		app.beforeUpdateTransaction = { trCount : view.content.transList.items.length };

		let trObj = await view.getTransactionObject(view.content.transList.items[pos].id);
		if (!trObj)
			throw new Error('Transaction not found');

		app.beforeUpdateTransaction.trObj = trObj;

		await app.view.goToUpdateTransaction(pos);
		view = app.view;

		// Step 2: Save original data of transaction, perform update actions and submit
		let isDiff = (app.beforeUpdateTransaction.trObj.src_curr != app.beforeUpdateTransaction.trObj.dest_curr);

		await test('Initial state of update income view', async () => view.setExpectedState(isDiff ? 2 : 0), view);

		app.setParam(app.beforeUpdateTransaction,
					{ id : view.model.id,
						destAcc : view.model.destAccount,
						destAccPos : await view.getAccountPos(view.model.destAccount.id),
						destBalance : view.model.fDestResBal,
						srcAmount : view.model.fSrcAmount,
						destAmount : view.model.fDestAmount,
						date : view.model.date,
						comment : view.model.comment});

		await submitIncomeTransaction(app, params);

		// Step 3: Check update of transactions list
		await app.view.filterByType(app.INCOME);

	 	let updDestAcc = app.beforeSubmitTransaction.destAcc;
		let trans_id = app.beforeUpdateTransaction.id;
		let transCount = app.beforeUpdateTransaction.trCount;
		let origDate = app.beforeUpdateTransaction.date;
		let origComment = app.beforeUpdateTransaction.comment;

		// Transactions list changes
		var fmtAmount = '+ ' + app.formatCurrency(params.srcAmount, ('srcCurr' in params) ? params.srcCurr : updDestAcc.curr_id, app.currencies);
		if ('srcCurr' in params && 'destAmount' in params)
		{
			fmtAmount += ' (+ ' + app.formatCurrency(params.destAmount, updDestAcc.curr_id, app.currencies) + ')';
		}

		var state = { values : { transList : { items : { length : transCount } } } };
		state.values.transList.items[pos] = { id : trans_id,
											accountTitle : updDestAcc.name,
											amountText : fmtAmount,
										 	dateFmt : ('date' in params) ? app.formatDate(new Date(params.date)) : origDate,
										 	comment : ('comment' in params) ? params.comment : origComment };

		await test('Transaction update', async () => {}, app.view, state);

		// Step 4: Check updates of affected accounts
		await app.goToMainView();

		let updDestAccPos = app.beforeSubmitTransaction.destAccPos;
	 	let origDestAcc = app.beforeUpdateTransaction.destAcc;
		let origDestAccPos = app.beforeUpdateTransaction.destAccPos;
		let origDestBalance = app.beforeUpdateTransaction.destBalance;
		let origDestAmount = app.beforeUpdateTransaction.destAmount;

		// Obtain real source amount from props:
		// In case of income with different currency use source amount value
		// In case of expense with the same currency copy destination amount value
		var da = ('srcCurr' in params && 'destAmount' in params) ? params.destAmount : params.srcAmount;

		// Accounts widget changes
		var accWidget = { tiles : { items : { length : app.accounts.length } } };
		var expBalance, fmtBal;
		// Chech if account was changed we need to update both
		if (origDestAccPos != updDestAccPos)
		{
			expBalance = origDestBalance - origDestAmount;
			fmtBal = app.formatCurrency(expBalance, origDestAcc.curr_id, app.currencies);

			accWidget.tiles.items[origDestAccPos] = { balance : fmtBal, name : origDestAcc.name };

			expBalance = updDestAcc.balance + app.normalize(da);
			fmtBal = app.formatCurrency(expBalance, updDestAcc.curr_id, app.currencies);

			accWidget.tiles.items[updDestAccPos] = { balance : fmtBal, name : updDestAcc.name };
		}
		else		// account not changed
		{
			var expBalance = origDestBalance - origDestAmount + app.normalize(da);
			var fmtBal = app.formatCurrency(expBalance, updDestAcc.curr_id, app.currencies);

			accWidget.tiles.items[updDestAccPos] = { balance : fmtBal, name : updDestAcc.name };
		}

		var state = { values : { widgets : { length : app.config.widgetsCount } } };
		state.values.widgets[app.config.AccountsWidgetPos] = accWidget;

		await test('Account balance update', async () => {}, app.view, state);
	}


	async function incomeTransactionLoop(app, actionState, action)
	{
		let view = app.view;
		test = app.test;

	// State 0
		view.setBlock('Income loop', 2);
		await test('Initial state of new income view', async () => view.setExpectedState(0), view);

		actionState = parseInt(actionState);
		var actionRequested = !isNaN(actionState);
		if (actionState === 0)
			return action(app);

		if (!actionRequested)
		{
			// Input source amount
			await test('Source amount (1) input', () => view.inputSrcAmount('1'), view);
			await test('Source amount (1.) input', () => view.inputSrcAmount('1.'), view);
			await test('Source amount (1.0) input', () => view.inputSrcAmount('1.0'), view);
			await test('Source amount (1.01) input', () => view.inputSrcAmount('1.01'), view);
			await test('Source amount (1.010) input', () => view.inputSrcAmount('1.010'), view);
			await test('Source amount (1.0101) input', () => view.inputSrcAmount('1.0101'), view);
		}

	// Transition 2: Click on destination result balance block and move from State 0 to State 1
		await test('(2) Click on destination result balance', () => view.clickDestResultBalance(), view);

		if (actionState === 1)
			return action(app);

		if (!actionRequested)
		{
			// Transition 23: Change account to another one with different currency and stay on State 1
			await test('(23) Change destination account', () => view.changeDestAccountByPos(3), view);
			await test('(23) Change destination account back', () => view.changeDestAccountByPos(0), view);

			// Input result balance
			await test('Result balance (502.08) input', () => view.inputDestResBalance('502.08'), view);
			await test('Result balance (502.080) input', () => view.inputDestResBalance('502.080'), view);
			await test('Result balance (502.0801) input', () => view.inputDestResBalance('502.0801'), view);
		}

	// Transition 4: Click on source amount block and move from State 1 to State 0
		await test('(4) Click on source amount', () => view.clickSrcAmount(), view);

	// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
		await test('(3) Change source curency to USD', () => view.changeSourceCurrency(2), view);

		if (actionState === 2)
			return action(app);

		if (!actionRequested)
		{
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
		}

	// Transition 7: Click on result balance block and move from State 2 to State 4
		await test('(7) Click on destination result balance', () => view.clickDestResultBalance(), view);

		if (actionState === 4)
			return action(app);

		if (!actionRequested)
		{
			// Transition 17: Change account to another one with currency different than current source currency and stay on State 4
			await test('(17) Change destination account', () => view.changeDestAccountByPos(3), view);
			await test('(17) Change destination account back', () => view.changeDestAccountByPos(0), view);

			// Transition 21: Change source currency to different than currency of account and stay on State 4
			await test('(21) Change source curency to EUR', () => view.changeSourceCurrency(3), view);
			await test('(21) Change source curency to USD', () => view.changeSourceCurrency(2), view);
		}

	// Transition 20: Click on exchange rate block and move from State 4 to State 3
		await test('(20) Click on exchange rate', () => view.clickExchRate(), view);

		if (actionState === 4)
			return action(app);

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

		return view;
	}


	return { create : createIncome,
				update : updateIncome,
				stateLoop : incomeTransactionLoop };
})();


export { runIncome };
