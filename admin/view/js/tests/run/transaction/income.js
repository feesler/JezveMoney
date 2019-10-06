function submitIncomeTransaction(page, params)
{
	if ('destAcc' in params)
	{
		let acc = page.getAccountByPos(params.destAcc);
		if (!acc)
			throw new Error('Account (' + params.destAcc + ') not found');

		test('Change destination account to (' + acc.name + ')',
				() => page.changeDestAccountByPos(params.destAcc), page);
	}

	if ('srcCurr' in params)
	{
		let curr = getCurrency(params.srcCurr);
		if (!curr)
			throw new Error('Currency (' + params.srcCurr + ') not found');

		test('Change source currency to ' + curr.name,
				() => page.changeSourceCurrency(params.srcCurr), page);
	}

	if (!('srcAmount' in params))
		throw new Error('Source amount value not specified');

	test('Source amount (' + params.srcAmount + ') input', () => page.inputSrcAmount(params.srcAmount), page);

	if ('srcCurr' in params && 'destAmount' in params)
		test('Destination amount (' + params.destAmount + ') input', () => page.inputDestAmount(params.destAmount), page);

	if ('date' in params)
		test('Date (' + params.date + ') input', () => page.inputDate(params.date), page);

	if ('comment' in params)
		test('Comment (' + params.comment + ') input', () => page.inputComment(params.comment), page);

	App.beforeSubmitTransaction = { destAcc : page.model.destAccount,
									destAccPos : page.getAccountPos(page.model.destAccount.id) };
	if (page.model.isUpdate)
		App.beforeSubmitTransaction.id = page.model.id;

	return page.submit();
}


function createIncome(page, accNum, onState, params)
{
	return goToMainPage(page)
			.then(page => page.goToNewTransactionByAccount(accNum))
			.then(page => page.changeTransactionType(INCOME))
			.then(page => incomeTransactionLoop(page, onState, page => submitIncomeTransaction(page, params)))
			.then(page =>
			{
				let destAcc = App.beforeSubmitTransaction.destAcc;
				let destAccPos = App.beforeSubmitTransaction.destAccPos;

				// Obtain real destination amount from props:
				// In case of income with different currency use destination amount value
				// In case of income with the same currency copy source amount value
				var da = ('srcCurr' in params && 'destAmount' in params) ? params.destAmount : params.srcAmount;
				var expBalance = destAcc.balance + normalize(da);
				var fmtBal = formatCurrency(expBalance, destAcc.curr_id);

				// Accounts widget changes
				var accWidget = { tiles : { length : App.accounts.length } };
				accWidget.tiles[destAccPos] = { balance : fmtBal, name : destAcc.name };

				// Transactions widget changes
				var fmtAmount = '+ ' + formatCurrency(params.srcAmount, ('srcCurr' in params) ? params.srcCurr : destAcc.curr_id);
				if ('srcCurr' in params && 'destAmount' in params)
				{
					fmtAmount += ' (+ ' + formatCurrency(params.destAmount, destAcc.curr_id) + ')';
				}

				var transWidget = { title : 'Transactions',
									transList : { length : Math.min(App.transactions.length + 1, 5) } };
				transWidget.transList[0] = { accountTitle : destAcc.name,
												amountText : fmtAmount,
											 	dateFmt : formatDate(('date' in params) ? new Date(params.date) : new Date()),
											 	comment : ('comment' in params) ? params.comment : '' };

				var state = { values : { widgets : { length : 5, 0 : accWidget, 2 : transWidget } } };

				test('Income transaction submit', () => {}, page, state);

				App.transactions = page.content.widgets[2].transList;
				App.accounts = page.content.widgets[0].tiles;
				App.persons = page.content.widgets[3].infoTiles;

				return Promise.resolve(page);
			});
}


// Update income transaction and check results
function updateIncome(page, pos, params)
{
	pos = parseInt(pos);
	if (isNaN(pos) || pos < 0)
		throw new Error('Position of transaction not specified');

	if (!isObject(params))
		throw new Error('Parameters not specified');

	return goToMainPage(page)
			.then(page => page.goToTransactions())
			.then(page => page.filterByType(INCOME))
			.then(page => {
				App.beforeUpdateTransaction = { trCount : page.content.transactions.length };

				let trObj = page.getTransactionObject(page.content.transactions[pos].id);
				if (!trObj)
					throw new Error('Transaction not found');

				App.beforeUpdateTransaction.trObj = trObj;

				return page.goToUpdateTransaction(pos);
			})
			.then(page => {
				let isDiff = (App.beforeUpdateTransaction.trObj.src_curr != App.beforeUpdateTransaction.trObj.dest_curr);

				test('Initial state of update income page', () => page.setExpectedState(isDiff ? 2 : 0), page);

				setParam(App.beforeUpdateTransaction,
							{ id : page.model.id,
								destAcc : page.model.destAccount,
								destAccPos : page.getAccountPos(page.model.destAccount.id),
								destBalance : page.model.fDestResBal,
								srcAmount : page.model.fSrcAmount,
								destAmount : page.model.fDestAmount,
								date : page.model.date,
								comment : page.model.comment});

				return submitIncomeTransaction(page, params);
			})
			.then(page => page.filterByType(INCOME))
			.then(page =>
			{
			 	let updDestAcc = App.beforeSubmitTransaction.destAcc;
				let trans_id = App.beforeUpdateTransaction.id;
				let transCount = App.beforeUpdateTransaction.trCount;
				let origDate = App.beforeUpdateTransaction.date;
				let origComment = App.beforeUpdateTransaction.comment;

				// Transactions widget changes
				var fmtAmount = '+ ' + formatCurrency(params.srcAmount, ('srcCurr' in params) ? params.srcCurr : updDestAcc.curr_id);
				if ('srcCurr' in params && 'destAmount' in params)
				{
					fmtAmount += ' (+ ' + formatCurrency(params.destAmount, updDestAcc.curr_id) + ')';
				}

				var state = { values : { transactions : { length : transCount } } };
				state.values.transactions[pos] = { id : trans_id,
													accountTitle : updDestAcc.name,
													amountText : fmtAmount,
												 	dateFmt : ('date' in params) ? formatDate(new Date(params.date)) : origDate,
												 	comment : ('comment' in params) ? params.comment : origComment };

				test('Transaction update', () => {}, page, state);

				return goToMainPage(page);
			})
			.then(page => {
			 	let updDestAcc = App.beforeSubmitTransaction.destAcc;
				let updDestAccPos = App.beforeSubmitTransaction.destAccPos;
			 	let origDestAcc = App.beforeUpdateTransaction.destAcc;
				let origDestAccPos = App.beforeUpdateTransaction.destAccPos;
				let origDestBalance = App.beforeUpdateTransaction.destBalance;
				let origDestAmount = App.beforeUpdateTransaction.destAmount;

				// Obtain real source amount from props:
				// In case of income with different currency use source amount value
				// In case of expense with the same currency copy destination amount value
				var da = ('srcCurr' in params && 'destAmount' in params) ? params.destAmount : params.srcAmount;

				// Accounts widget changes
				var accWidget = { tiles : { length : App.accounts.length } };
				var expBalance, fmtBal;
				// Chech if account was changed we need to update both
				if (origDestAccPos != updDestAccPos)
				{
					expBalance = origDestBalance - origDestAmount;
					fmtBal = formatCurrency(expBalance, origDestAcc.curr_id);

					accWidget.tiles[origDestAccPos] = { balance : fmtBal, name : origDestAcc.name };

					expBalance = updDestAcc.balance + normalize(da);
					fmtBal = formatCurrency(expBalance, updDestAcc.curr_id);

					accWidget.tiles[updDestAccPos] = { balance : fmtBal, name : updDestAcc.name };
				}
				else		// account not changed
				{
					var expBalance = origDestBalance - origDestAmount + normalize(da);
					var fmtBal = formatCurrency(expBalance, updDestAcc.curr_id);

					accWidget.tiles[updDestAccPos] = { balance : fmtBal, name : updDestAcc.name };
				}

				var state = { values : { widgets : { length : 5, 0 : accWidget } } };

				test('Account balance update', () => {}, page, state);

				return Promise.resolve(page);
			});
}


function incomeTransactionLoop(page, actionState, action)
{
// State 0
	setBlock('Income', 2);
	test('Initial state of new income page', () => page.setExpectedState(0), page);

	actionState = parseInt(actionState);
	var actionRequested = !isNaN(actionState);
	if (actionState === 0)
		return action(page);

	if (!actionRequested)
	{
		// Input source amount
		test('Source amount (1) input', () => page.inputSrcAmount('1'), page);
		test('Source amount (1.) input', () => page.inputSrcAmount('1.'), page);
		test('Source amount (1.0) input', () => page.inputSrcAmount('1.0'), page);
		test('Source amount (1.01) input', () => page.inputSrcAmount('1.01'), page);
		test('Source amount (1.010) input', () => page.inputSrcAmount('1.010'), page);
		test('Source amount (1.0101) input', () => page.inputSrcAmount('1.0101'), page);
	}

// Transition 2: Click on destination result balance block and move from State 0 to State 1
	test('(2) Click on destination result balance', () => page.clickDestResultBalance(), page);

	if (actionState === 1)
		return action(page);

	if (!actionRequested)
	{
		// Transition 23: Change account to another one with different currency and stay on State 1
		test('(23) Change destination account', () => page.changeDestAccountByPos(3), page);
		test('(23) Change destination account back', () => page.changeDestAccountByPos(0), page);

		// Input result balance
		test('Result balance (502.08) input', () => page.inputDestResBalance('502.08'), page);
		test('Result balance (502.080) input', () => page.inputDestResBalance('502.080'), page);
		test('Result balance (502.0801) input', () => page.inputDestResBalance('502.0801'), page);
	}

// Transition 4: Click on source amount block and move from State 1 to State 0
	test('(4) Click on source amount', () => page.clickSrcAmount(), page);

// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
	test('(3) Change source curency to USD', () => page.changeSourceCurrency(2), page);

	if (actionState === 2)
		return action(page);

	if (!actionRequested)
	{
		// Transition 5: Change account to another one with currency different than current source currency and stay on State 2
		test('(5) Change destination account', () => page.changeDestAccountByPos(3), page);
		test('(5) Change destination account back', () => page.changeDestAccountByPos(0), page);

		// Input destination amount
		test('Empty destination amount input', () => page.inputDestAmount(''), page);
		test('Destination amount (.) input', () => page.inputDestAmount('.'), page);
		test('Destination amount (0.) input', () => page.inputDestAmount('0.'), page);
		test('Destination amount (.0) input', () => page.inputDestAmount('.0'), page);
		test('Destination amount (.01) input', () => page.inputDestAmount('.01'), page);
		test('Destination amount (1.01) input', () => page.inputDestAmount('1.01'), page);
		test('Destination amount (1.010) input', () => page.inputDestAmount('1.010'), page);
	}

// Transition 7: Click on result balance block and move from State 2 to State 4
	test('(7) Click on destination result balance', () => page.clickDestResultBalance(), page);

	if (actionState === 4)
		return action(page);

	if (!actionRequested)
	{
		// Transition 17: Change account to another one with currency different than current source currency and stay on State 4
		test('(17) Change destination account', () => page.changeDestAccountByPos(3), page);
		test('(17) Change destination account back', () => page.changeDestAccountByPos(0), page);

		// Transition 21: Change source currency to different than currency of account and stay on State 4
		test('(21) Change source curency to EUR', () => page.changeSourceCurrency(3), page);
		test('(21) Change source curency to USD', () => page.changeSourceCurrency(2), page);
	}

// Transition 20: Click on exchange rate block and move from State 4 to State 3
	test('(20) Click on exchange rate', () => page.clickExchRate(), page);

	if (actionState === 4)
		return action(page);

// Transition 14: Click on exchange rate block and move from State 4 to State 3
	test('(14) Click on exchange rate', () => page.clickDestResultBalance(), page);

// Transition 19: Click on destination amount block and move from State 4 to State 3
	test('(19) Click on destination amount', () => page.clickDestAmount(), page);

// Transition 8: Click on exchange rate block and move from State 2 to State 3
	test('(8) Click on exchange rate', () => page.clickExchRate(), page);

// Input exchange rate
	test('Input exchange rate (1.09)', () => page.inputExchRate('1.09'), page);
	test('Input exchange rate (3.09)', () => page.inputExchRate('3.09'), page);
	test('Input exchange rate (.09)', () => page.inputExchRate('.09'), page);
	test('Input exchange rate (.090101)', () => page.inputExchRate('.090101'), page);

// Transition 13: Click on destination amount block and move from State 3 to State 2
	test('(13) Click on destination amount', () => page.clickDestAmount(), page);

// Transition 9: change source currency to different than currency of account and stay on State 2
	test('(9) Change source curency to EUR', () => page.changeSourceCurrency(3), page);

// Transition 10: Change source currency to the same as currency of account and move from State 2 to State 0
	test('(10) Change source curency to RUB', () => page.changeSourceCurrency(1), page);

// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
	test('(3) Change source curency to USD', () => page.changeSourceCurrency(2), page);

// Transition 8: Click on exchange rate block and move from State 2 to State 3
	test('(8) Click on exchange rate', () => page.clickExchRate(), page);

// Transition 11: Change destination account to another with currency different currest source currency
	test('(11) Change destination account', () => page.changeDestAccountByPos(3), page);

// Transition 12: Change destination account to another one with same currency as currest source currency
	test('(12) Change destination account back', () => page.changeDestAccountByPos(2), page);

// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
	test('(3) Change source curency to RUB', () => page.changeSourceCurrency(1), page);

// Transition 8: Click on exchange rate block and move from State 2 to State 3
	test('(8) Click on exchange rate', () => page.clickExchRate(), page);

// Transition 15: Change source currency to different than currency of account and stay on State 3
	test('(15) Change source curency to EUR', () => page.changeSourceCurrency(3), page);

// Transition 16: Change source currency to different than currency of account and stay on State 3
	test('(16) Change source curency to USD', () => page.changeSourceCurrency(2), page);

// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
	test('(3) Change source curency to RUB', () => page.changeSourceCurrency(1), page);

// Transition 7: Click on result balance block and move from State 2 to State 4
	test('(7) Click on destination result balance', () => page.clickDestResultBalance(), page);

// Transition 18: Change destination account to another one with same currency as currest source currency and move from State 4 to State 1
	test('(18) Change destination account', () => page.changeDestAccountByPos(1), page);

// Transition 4: Click on source amount block and move from State 1 to State 0
	test('(4) Click on source amount', () => page.clickSrcAmount(), page);

// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
	test('(3) Change source curency to USD', () => page.changeSourceCurrency(2), page);

// Transition 6: Change destination account to another one with same currency as currest source currency
	test('(6) Change destination account', () => page.changeDestAccountByPos(2), page);

// Transition 1: Change destination account to another one with same currency as currest source currency
	test('(1) Change destination account', () => page.changeDestAccountByPos(0), page);

// Transition 3: Change source currency to different than currency of account and move from State 0 to State 2
	test('(3) Change source curency to USD', () => page.changeSourceCurrency(2), page);

// Transition 7: Click on result balance block and move from State 2 to State 4
	test('(7) Click on destination result balance', () => page.clickDestResultBalance(), page);

// Transition 22: Change source currency to the same as currency of account and move from State 4 to State 1
	test('(22) Change destination account', () => page.changeSourceCurrency(1), page);

	return Promise.resolve(page);
}
