async function submitExpenseTransaction(page, params)
{
	if ('srcAcc' in params)
	{
		let acc = page.getAccountByPos(params.srcAcc);
		if (!acc)
			throw new Error('Account (' + params.srcAcc + ') not found');

		await test('Change source account to (' + acc.name + ')',
				() => page.changeSrcAccountByPos(params.srcAcc), page);
	}

	if ('destCurr' in params)
	{
		let curr = getCurrency(params.destCurr);
		if (!curr)
			throw new Error('Currency (' + params.destCurr + ') not found');

		await test('Change destination currency to ' + curr.name,
				() => page.changeDestCurrency(params.destCurr), page);
	}

	if (!('destAmount' in params))
		throw new Error('Destination amount value not specified');

	await test('Destination amount (' + params.destAmount + ') input', () => page.inputDestAmount(params.destAmount), page);

	if ('destCurr' in params && 'srcAmount' in params)
		await test('Source amount (' + params.srcAmount + ') input', () => page.inputSrcAmount(params.srcAmount), page);

	if ('date' in params)
		await test('Date (' + params.date + ') input', () => page.inputDate(params.date), page);

	if ('comment' in params)
		await test('Comment (' + params.comment + ') input', () => page.inputComment(params.comment), page);

	App.beforeSubmitTransaction = { srcAcc : page.model.srcAccount,
									srcAccPos : page.getAccountPos(page.model.srcAccount.id) };

	if (page.model.isUpdate)
		App.beforeSubmitTransaction.id = page.model.id;

	return page.submit();
}


function createExpense(page, accNum, onState, params)
{
	return goToMainPage(page)
			.then(page => page.goToNewTransactionByAccount(accNum))
			.then(page => expenseTransactionLoop(page, onState, page => submitExpenseTransaction(page, params)))
			.then(async page =>
			{
			 	let srcAcc = App.beforeSubmitTransaction.srcAcc;
				let srcAccPos = App.beforeSubmitTransaction.srcAccPos;

				// Obtain real source amount from props:
				// In case of expense with different currency use source amount value
				// In case of expense with the same currency copy destination amount value
				var sa = ('destCurr' in params && 'srcAmount' in params) ? params.srcAmount : params.destAmount;
				var expBalance = srcAcc.balance - normalize(sa);
				var fmtBal = formatCurrency(expBalance, srcAcc.curr_id);

				// Accounts widget changes
				var accWidget = { tiles : { length : App.accounts.length } };
				accWidget.tiles[srcAccPos] = { balance : fmtBal, name : srcAcc.name };

				// Transactions widget changes
				var fmtAmount = '- ' + formatCurrency(('srcAmount' in params) ? params.srcAmount : params.destAmount, srcAcc.curr_id);
				if ('destCurr' in params && 'srcAmount' in params)
				{
					fmtAmount += ' (- ' + formatCurrency(params.destAmount, params.destCurr) + ')';
				}

				var transWidget = { title : 'Transactions',
									transList : { length : Math.min(App.transactions.length + 1, 5) } };
				transWidget.transList[0] = { accountTitle : srcAcc.name,
												amountText : fmtAmount,
											 	dateFmt : formatDate(('date' in params) ? new Date(params.date) : new Date()),
											 	comment : ('comment' in params) ? params.comment : '' };

				var state = { values : { widgets : { length : 5, 0 : accWidget, 2 : transWidget } } };

				await test('Expense transaction submit', async () => {}, page, state);

				App.transactions = page.content.widgets[2].transList;
				App.accounts = page.content.widgets[0].tiles;
				App.persons = page.content.widgets[3].infoTiles;

				return page;
			});
}


// Update expense transaction and check results
function updateExpense(page, pos, params)
{
	pos = parseInt(pos);
	if (isNaN(pos) || pos < 0)
		throw new Error('Position of transaction not specified');

	if (!isObject(params))
		throw new Error('Parameters not specified');

	return goToMainPage(page)
			.then(page => page.goToTransactions())
			.then(page => page.filterByType(EXPENSE))
			.then(page =>
			{
				App.beforeUpdateTransaction = { trCount : page.content.transactions.length };

				let trObj = page.getTransactionObject(page.content.transactions[pos].id);
				if (!trObj)
					throw new Error('Transaction not found');

				App.beforeUpdateTransaction.trObj = trObj;

				return page.goToUpdateTransaction(pos);
			})
			.then(async page =>
			{
				let isDiff = (App.beforeUpdateTransaction.trObj.src_curr != App.beforeUpdateTransaction.trObj.dest_curr);

				await test('Initial state of update expense page', async () => page.setExpectedState(isDiff ? 2 : 0), page);

				setParam(App.beforeUpdateTransaction,
							{ id : page.model.id,
								srcAcc : page.model.srcAccount,
								srcAccPos : page.getAccountPos(page.model.srcAccount.id),
								srcBalance : page.model.fSrcResBal,
								srcAmount : page.model.fSrcAmount,
								destAmount : page.model.fDestAmount,
								date : page.model.date,
								comment : page.model.comment});

				return submitExpenseTransaction(page, params);
			})
			.then(page => page.filterByType(EXPENSE))
			.then(async page =>
			{
			 	let updSrcAcc = App.beforeSubmitTransaction.srcAcc;
				let trans_id = App.beforeUpdateTransaction.id;
				let transCount = App.beforeUpdateTransaction.trCount;
				let origDate = App.beforeUpdateTransaction.date;
				let origComment = App.beforeUpdateTransaction.comment;

				// Transactions list changes
				var fmtAmount = '- ' + formatCurrency(('srcAmount' in params) ? params.srcAmount : params.destAmount, updSrcAcc.curr_id);
				if ('destCurr' in params && 'srcAmount' in params)
				{
					fmtAmount += ' (- ' + formatCurrency(params.destAmount, params.destCurr) + ')';
				}

				var state = { values : { transactions : { length : transCount } } };
				state.values.transactions[pos] = { id : trans_id,
													accountTitle : updSrcAcc.name,
													amountText : fmtAmount,
												 	dateFmt : ('date' in params) ? formatDate(new Date(params.date)) : origDate,
												 	comment : ('comment' in params) ? params.comment : origComment };

				await test('Transaction update', async () => {}, page, state);

				return goToMainPage(page);
			})
			.then(async page =>
			{
			 	let updSrcAcc = App.beforeSubmitTransaction.srcAcc;
				let updSrcAccPos = App.beforeSubmitTransaction.srcAccPos;
			 	let origSrcAcc = App.beforeUpdateTransaction.srcAcc;
				let origSrcAccPos = App.beforeUpdateTransaction.srcAccPos;
				let origSrcBalance = App.beforeUpdateTransaction.srcBalance;
				let origSrcAmount = App.beforeUpdateTransaction.srcAmount;

				// Obtain real source amount from props:
				// In case of expense with different currency use source amount value
				// In case of expense with the same currency copy destination amount value
				var sa = ('destCurr' in params && 'srcAmount' in params) ? params.srcAmount : params.destAmount;

				// Accounts widget changes
				var accWidget = { tiles : { length : App.accounts.length } };
				var expBalance, fmtBal;
				// Chech if account was changed we need to update both
				if (updSrcAccPos != origSrcAccPos)
				{
					expBalance = origSrcBalance + origSrcAmount;
					fmtBal = formatCurrency(expBalance, origSrcAcc.curr_id);

					accWidget.tiles[origSrcAccPos] = { balance : fmtBal, name : origSrcAcc.name };

					expBalance = updSrcAcc.balance - normalize(sa);
					fmtBal = formatCurrency(expBalance, updSrcAcc.curr_id);

					accWidget.tiles[updSrcAccPos] = { balance : fmtBal, name : updSrcAcc.name };
				}
				else		// account not changed
				{
					var expBalance = origSrcBalance + origSrcAmount - normalize(sa);
					var fmtBal = formatCurrency(expBalance, updSrcAcc.curr_id);

					accWidget.tiles[updSrcAccPos] = { balance : fmtBal, name : updSrcAcc.name };
				}

				var state = { values : { widgets : { length : 5, 0 : accWidget } } };

				await test('Account balance update', async () => {}, page, state);

				return page;
			});
}


async function expenseTransactionLoop(page, actionState, action)
{
// State 0
	page.setBlock('Expense', 2);
	await test('Initial state of new expense page', async () =>
	{
		let trObj = page.getUpdateTransactionObj();

		if (trObj)
		{
			let srcAcc = idSearch(App.accounts, page.model.srcAccount.id);

			let initialBal = normalize(page.model.fSrcResBal + trObj.srcAmount);
			page.model.srcAccount.fmtBalance = page.model.srcCurr.formatValue(initialBal);
		}

		page.setExpectedState(0);
	}, page);

	actionState = parseInt(actionState);
	var actionRequested = !isNaN(actionState);
	if (actionState === 0)
		return action(page);

	if (!actionRequested)
	{
		// Input destination amount
		await test('Destination amount (1) input', () => page.inputDestAmount('1'), page);
		await test('Destination amount (1.) input', () => page.inputDestAmount('1.'), page);
		await test('Destination amount (1.0) input', () => page.inputDestAmount('1.0'), page);
		await test('Destination amount (1.01) input', () => page.inputDestAmount('1.01'), page);
		await test('Destination amount (1.010) input', () => page.inputDestAmount('1.010'), page);
		await test('Destination amount (1.0101) input', () => page.inputDestAmount('1.0101'), page);
	}

// Transition 2: click on result balance block and move from State 0 to State 1
	await test('(2) Click on source result balance', () => page.clickSrcResultBalance(), page);

	if (actionState === 1)
		return action(page);

	if (!actionRequested)
	{
		// Input result balance
		await test('Result balance (499.9) input', () => page.inputResBalance('499.9'), page);
		await test('Result balance (499.90) input', () => page.inputResBalance('499.90'), page);
		await test('Result balance (499.901) input', () => page.inputResBalance('499.901'), page);
	}

	if (!actionRequested)
	{
		// Transition 12: change account to another one with different currency and stay on State 1
		await test('(12) Change account to another one with currency different than current destination currency',
				() => page.changeSrcAccountByPos(2), page);

		// Change account back
		await test('(12) Change account back', () => page.changeSrcAccountByPos(0), page);
	}

// Transition 3: click on destination amount block and move from State 1 to State 0
	await test('(3) Click on destination amount', () => page.clickDestAmount(), page);

// Transition 4: select different currency for destination and move from State 0 to State 2
	await test('(4) Change destination curency to USD', () => page.changeDestCurrency(2), page);

	if (actionState === 2)
		return action(page);

	if (!actionRequested)
	{
		// Input source amount
		await test('Empty source amount input', () => page.inputSrcAmount(''), page);
		await test('Source amount (.) input', () => page.inputSrcAmount('.'), page);
		await test('Source amount (0.) input', () => page.inputSrcAmount('0.'), page);
		await test('Source amount (.0) input', () => page.inputSrcAmount('.0'), page);
		await test('Source amount (.01) input', () => page.inputSrcAmount('.01'), page);
		await test('Source amount (1.01) input', () => page.inputSrcAmount('1.01'), page);
		await test('Source amount (1.010) input', () => page.inputSrcAmount('1.010'), page);
	}

// Transition 8: click on exchange rate block and move from State 2 to State 3
	await test('(8) Click on exchange rate', () => page.clickExchRate(), page);

	if (actionState === 3)
		return action(page);

	if (!actionRequested)
	{
		// Input exchange rate
		await test('Input exchange rate (1.09)', () => page.inputExchRate('1.09'), page);
		await test('Input exchange rate (3.09)', () => page.inputExchRate('3.09'), page);
		await test('Input exchange rate (.)', () => page.inputExchRate('.'), page);
		await test('Input exchange rate (.0)', () => page.inputExchRate('.0'), page);
		await test('Input exchange rate (.09)', () => page.inputExchRate('.09'), page);
		await test('Input exchange rate (.090101)', () => page.inputExchRate('.090101'), page);
	}

	// Transition 16: click on destination amount block and move from State 3 to State 2
	await test('(16) Click on destination amount', () => page.clickDestAmount(), page);

	if (!actionRequested)
	{
		// Transition 13: select another currency different from currency of source account and stay on state
		await test('(13) Change destination curency to EUR', () => page.changeDestCurrency(3), page);

		// Transition 9: select same currency as source account and move from State 2 to State 0
		await test('(9) Change destination curency to RUB', () => page.changeDestCurrency(1), page);

		// Transition 1: change account to another one with different currency and stay on State 0
		await test('(1) Change account to another one with different currency', () => page.changeSrcAccountByPos(2), page);

		// Transition 4: select different currency for destination and move from State 0 to State 2
		await test('(4) Select different currency for destination', () => page.changeDestCurrency(3), page);

		// Transition 5: change account to another one with currency different than current destination currency and stay on State 2
		await test('(5) Change account to another one with currency different than current destination currency',
				() => page.changeSrcAccountByPos(0), page);
	}

// Transition 6: click on source result balance block and move from State 2 to State 4
	await test('(6) Click on source result block', () => page.clickSrcResultBalance(), page);

	if (actionState === 4)
		return action(page);

// Transition 10: change account to another one with currency different than current destination currency and stay on State 4
	await test('(10) Change account to another one with currency different than current destination currency',
			() => page.changeSrcAccountByPos(2), page);

// Transition 7: click on destination amount block and move from State 4 to State 2
	await test('(7) Click on source amount block', () => page.clickDestAmount(), page);

// Transition 14: select source account with the same currency as destination and move from State 2 to State 0
	await test('(14) Change account to another one with the same currency as current destination currency',
			() => page.changeSrcAccountByPos(3), page);

// Transition 4: select different currency for destination and move from State 0 to State 2
	await test('(4) Select different currency for destination', () => page.changeDestCurrency(1), page);

// Transition 8: click on exchange rate block and move from State 2 to State 3
	await test('(8) Click on exchange rate', () => page.clickExchRate(), page);

// Transition 17: change account to another one with currency different than current destination currency and stay on State 3
	await test('(17) Change account to another one with currency different than current destination currency',
			() => page.changeSrcAccountByPos(2), page);

// Transition 15: select source account with the same currency as destination and move from State 2 to State 0
	await test('(15) Change account to another one with the same currency as destination',
			() => page.changeSrcAccountByPos(1), page);

// Transition 4: select different currency for destination and move from State 0 to State 2
	await test('(4) Select different currency for destination', () => page.changeDestCurrency(2), page);

// Transition 6: click on source result balance block and move from State 2 to State 4
	await test('(6) Click on source result balance block', () => page.clickSrcResultBalance(), page);

// Transition 19: click on exchange rate block and move from State 4 to State 3
	await test('(19) Click on exchange rate block', () => page.clickExchRate(), page);

// Transition 18: click on source result balance and move from State 3 to State 4
	await test('(18) Click on source result balance rate block', () => page.clickSrcResultBalance(), page);

// Transition 11: select source account with the same currency as destination and move from State 4 to State 1
	await test('(11) Change account to another one with the same currency as destination',
			() => page.changeSrcAccountByPos(2), page);


	return page;
}
