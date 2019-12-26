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

		app.beforeSubmitTransaction = { srcAcc : view.model.srcAccount,
										srcAccPos : await view.getAccountPos(view.model.srcAccount.id) };

		if (view.model.isUpdate)
			app.beforeSubmitTransaction.id = view.model.id;

		return view.submit();
	}


	async function createExpense(app, accNum, onState, params)
	{
		let view = app.view;
		test = app.test;

		let titleParams = [];
		for(let k in params)
			titleParams.push(k + ': ' + params[k]);
		view.setBlock('Create expense (' + titleParams.join(', ') + ')', 2);

		// Step 0:
		await app.goToMainView();
		view = app.view;
		await view.goToNewTransactionByAccount(accNum);
		await expenseTransactionLoop(app, onState, app => submitExpenseTransaction(app, params));
		view = app.view;

		// Step
	 	let srcAcc = app.beforeSubmitTransaction.srcAcc;
		let srcAccPos = app.beforeSubmitTransaction.srcAccPos;

		// Obtain real source amount from props:
		// In case of expense with different currency use source amount value
		// In case of expense with the same currency copy destination amount value
		var sa = ('destCurr' in params && 'srcAmount' in params) ? params.srcAmount : params.destAmount;
		var expBalance = srcAcc.balance - app.normalize(sa);
		var fmtBal = app.formatCurrency(expBalance, srcAcc.curr_id, app.currencies);

		// Accounts widget changes
		var accWidget = { tiles : { items : { length : app.accounts.length } } };
		accWidget.tiles.items[srcAccPos] = { balance : fmtBal, name : srcAcc.name };

		// Transactions widget changes
		var fmtAmount = '- ' + app.formatCurrency(('srcAmount' in params) ? params.srcAmount : params.destAmount, srcAcc.curr_id, app.currencies);
		if ('destCurr' in params && 'srcAmount' in params)
		{
			fmtAmount += ' (- ' + app.formatCurrency(params.destAmount, params.destCurr, app.currencies) + ')';
		}

		var transWidget = { title : 'Transactions',
							transList : { items : { length : Math.min(app.transactions.length + 1, app.config.latestTransactions) } } };
		transWidget.transList.items[0] = { accountTitle : srcAcc.name,
										amountText : fmtAmount,
									 	dateFmt : app.formatDate(('date' in params) ? new Date(params.date) : new Date()),
									 	comment : ('comment' in params) ? params.comment : '' };

		var state = { values : { widgets : { length : 5, 0 : accWidget, 2 : transWidget } } };

		await test('Expense transaction submit', async () => {}, view, state);

		app.transactions = view.content.widgets[2].transList.items;
		app.accounts = view.content.widgets[0].tiles.items;
		app.persons = view.content.widgets[3].infoTiles.items;
	}


	// Update expense transaction and check results
	async function updateExpense(app, pos, params)
	{
		let view = app.view;
		test = app.test;

		let titleParams = [];
		for(let k in params)
			titleParams.push(k + ': ' + params[k]);
		view.setBlock('Update expense [' + pos + '] (' + titleParams.join(', ') + ')', 2);

		pos = parseInt(pos);
		if (isNaN(pos) || pos < 0)
			throw new Error('Position of transaction not specified');

		if (!app.isObject(params))
			throw new Error('Parameters not specified');

		await app.goToMainView();
		await app.view.goToTransactions();
		await app.view.filterByType(app.EXPENSE);

		app.beforeUpdateTransaction = { trCount : app.view.content.transList.items.length };

		let trObj = await app.view.getTransactionObject(app.view.content.transList.items[pos].id);
		if (!trObj)
			throw new Error('Transaction not found');

		app.beforeUpdateTransaction.trObj = trObj;

		await app.view.goToUpdateTransaction(pos);

		view = app.view;

		// Step
		let isDiff = (app.beforeUpdateTransaction.trObj.src_curr != app.beforeUpdateTransaction.trObj.dest_curr);

		await test('Initial state of update expense view', async () => app.view.setExpectedState(isDiff ? 2 : 0), view);

		app.setParam(app.beforeUpdateTransaction,
					{ id : view.model.id,
						srcAcc : view.model.srcAccount,
						srcAccPos : await view.getAccountPos(view.model.srcAccount.id),
						srcBalance : view.model.fSrcResBal,
						srcAmount : view.model.fSrcAmount,
						destAmount : view.model.fDestAmount,
						date : view.model.date,
						comment : view.model.comment });

		await submitExpenseTransaction(app, params);

		// Step
		await app.view.filterByType(app.EXPENSE);

	 	let updSrcAcc = app.beforeSubmitTransaction.srcAcc;
		let trans_id = app.beforeUpdateTransaction.id;
		let transCount = app.beforeUpdateTransaction.trCount;
		let origDate = app.beforeUpdateTransaction.date;
		let origComment = app.beforeUpdateTransaction.comment;

		// Transactions list changes
		var fmtAmount = '- ' + app.formatCurrency(('srcAmount' in params) ? params.srcAmount : params.destAmount, updSrcAcc.curr_id, app.currencies);
		if ('destCurr' in params && 'srcAmount' in params)
		{
			fmtAmount += ' (- ' + app.formatCurrency(params.destAmount, params.destCurr, app.currencies) + ')';
		}

		var state = { values : { transList : { items : { length : transCount } } } };
		state.values.transList.items[pos] = { id : trans_id,
											accountTitle : updSrcAcc.name,
											amountText : fmtAmount,
										 	dateFmt : ('date' in params) ? app.formatDate(new Date(params.date)) : origDate,
										 	comment : ('comment' in params) ? params.comment : origComment };

		await test('Transaction update', async () => {}, app.view, state);

		await app.goToMainView();

		// Step
		let updSrcAccPos = app.beforeSubmitTransaction.srcAccPos;
	 	let origSrcAcc = app.beforeUpdateTransaction.srcAcc;
		let origSrcAccPos = app.beforeUpdateTransaction.srcAccPos;
		let origSrcBalance = app.beforeUpdateTransaction.srcBalance;
		let origSrcAmount = app.beforeUpdateTransaction.srcAmount;

		// Obtain real source amount from props:
		// In case of expense with different currency use source amount value
		// In case of expense with the same currency copy destination amount value
		var sa = ('destCurr' in params && 'srcAmount' in params) ? params.srcAmount : params.destAmount;

		// Accounts widget changes
		var accWidget = { tiles : { items : { length : app.accounts.length } } };
		var expBalance, fmtBal;
		// Chech if account was changed we need to update both
		if (updSrcAccPos != origSrcAccPos)
		{
			expBalance = origSrcBalance + origSrcAmount;
			fmtBal = app.formatCurrency(expBalance, origSrcAcc.curr_id, app.currencies);

			accWidget.tiles.items[origSrcAccPos] = { balance : fmtBal, name : origSrcAcc.name };

			expBalance = updSrcAcc.balance - app.normalize(sa);
			fmtBal = app.formatCurrency(expBalance, updSrcAcc.curr_id, app.currencies);

			accWidget.tiles.items[updSrcAccPos] = { balance : fmtBal, name : updSrcAcc.name };
		}
		else		// account not changed
		{
			var expBalance = origSrcBalance + origSrcAmount - app.normalize(sa);
			var fmtBal = app.formatCurrency(expBalance, updSrcAcc.curr_id, app.currencies);

			accWidget.tiles.items[updSrcAccPos] = { balance : fmtBal, name : updSrcAcc.name };
		}

		var state = { values : { widgets : { length : 5, 0 : accWidget } } };

		await test('Account balance update', async () => {}, app.view, state);
	}


	async function expenseTransactionLoop(app, actionState, action)
	{
		let view = app.view;
		test = app.test;

	// State 0
		view.setBlock('Expense loop', 2);
		await test('Initial state of new expense view', async () =>
		{
			let trObj = await view.getUpdateTransactionObj();

			if (trObj)
			{
				let srcAcc = app.idSearch(app.accounts, view.model.srcAccount.id);

				let initialBal = app.normalize(view.model.fSrcResBal + trObj.srcAmount);
				view.model.srcAccount.fmtBalance = view.model.srcCurr.formatValue(initialBal);
			}

			view.setExpectedState(0);
		}, view);

		actionState = parseInt(actionState);
		var actionRequested = !isNaN(actionState);
		if (actionState === 0)
			return action(app);

		if (!actionRequested)
		{
			// Input destination amount
			await test('Destination amount (1) input', () => view.inputDestAmount('1'), view);
			await test('Destination amount (1.) input', () => view.inputDestAmount('1.'), view);
			await test('Destination amount (1.0) input', () => view.inputDestAmount('1.0'), view);
			await test('Destination amount (1.01) input', () => view.inputDestAmount('1.01'), view);
			await test('Destination amount (1.010) input', () => view.inputDestAmount('1.010'), view);
			await test('Destination amount (1.0101) input', () => view.inputDestAmount('1.0101'), view);
		}

	// Transition 2: click on result balance block and move from State 0 to State 1
		await test('(2) Click on source result balance', () => view.clickSrcResultBalance(), view);

		if (actionState === 1)
			return action(app);

		if (!actionRequested)
		{
			// Input result balance
			await test('Result balance (499.9) input', () => view.inputResBalance('499.9'), view);
			await test('Result balance (499.90) input', () => view.inputResBalance('499.90'), view);
			await test('Result balance (499.901) input', () => view.inputResBalance('499.901'), view);
		}

		if (!actionRequested)
		{
			// Transition 12: change account to another one with different currency and stay on State 1
			await test('(12) Change account to another one with currency different than current destination currency',
					() => view.changeSrcAccountByPos(2), view);

			// Change account back
			await test('(12) Change account back', () => view.changeSrcAccountByPos(0), view);
		}

	// Transition 3: click on destination amount block and move from State 1 to State 0
		await test('(3) Click on destination amount', () => view.clickDestAmount(), view);

	// Transition 4: select different currency for destination and move from State 0 to State 2
		await test('(4) Change destination curency to USD', () => view.changeDestCurrency(2), view);

		if (actionState === 2)
			return action(app);

		if (!actionRequested)
		{
			// Input source amount
			await test('Empty source amount input', () => view.inputSrcAmount(''), view);
			await test('Source amount (.) input', () => view.inputSrcAmount('.'), view);
			await test('Source amount (0.) input', () => view.inputSrcAmount('0.'), view);
			await test('Source amount (.0) input', () => view.inputSrcAmount('.0'), view);
			await test('Source amount (.01) input', () => view.inputSrcAmount('.01'), view);
			await test('Source amount (1.01) input', () => view.inputSrcAmount('1.01'), view);
			await test('Source amount (1.010) input', () => view.inputSrcAmount('1.010'), view);
		}

	// Transition 8: click on exchange rate block and move from State 2 to State 3
		await test('(8) Click on exchange rate', () => view.clickExchRate(), view);

		if (actionState === 3)
			return action(app);

		if (!actionRequested)
		{
			// Input exchange rate
			await test('Input exchange rate (1.09)', () => view.inputExchRate('1.09'), view);
			await test('Input exchange rate (3.09)', () => view.inputExchRate('3.09'), view);
			await test('Input exchange rate (.)', () => view.inputExchRate('.'), view);
			await test('Input exchange rate (.0)', () => view.inputExchRate('.0'), view);
			await test('Input exchange rate (.09)', () => view.inputExchRate('.09'), view);
			await test('Input exchange rate (.090101)', () => view.inputExchRate('.090101'), view);
		}

		// Transition 16: click on destination amount block and move from State 3 to State 2
		await test('(16) Click on destination amount', () => view.clickDestAmount(), view);

		if (!actionRequested)
		{
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
		}

	// Transition 6: click on source result balance block and move from State 2 to State 4
		await test('(6) Click on source result block', () => view.clickSrcResultBalance(), view);

		if (actionState === 4)
			return action(app);

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
