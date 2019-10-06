function submitTransferTransaction(page, params)
{
	if ('srcAcc' in params)
	{
		let acc = page.getAccountByPos(params.srcAcc);
		if (!acc)
			throw new Error('Account (' + params.srcAcc + ') not found');

		test('Change source account to (' + acc.name + ')',
				() => page.changeSrcAccountByPos(params.srcAcc), page);
	}

	if ('destAcc' in params)
	{
		let acc = page.getAccountByPos(params.destAcc);
		if (!acc)
			throw new Error('Account (' + params.destAcc + ') not found');

		test('Change destination account to (' + acc.name + ')',
				() => page.changeDestAccountByPos(params.destAcc), page);
	}

	if (!('srcAmount' in params))
		throw new Error('Source amount value not specified');

	test('Source amount (' + params.srcAmount + ') input', () => page.inputSrcAmount(params.srcAmount), page);

	if ('destAmount' in params)
		test('Destination amount (' + params.destAmount + ') input', () => page.inputDestAmount(params.destAmount), page);

	if ('date' in params)
		test('Date (' + params.date + ') input', () => page.inputDate(params.date), page);

	if ('comment' in params)
		test('Comment (' + params.comment + ') input', () => page.inputComment(params.comment), page);

	App.beforeSubmitTransaction = { srcAcc : page.model.srcAccount,
									srcAccPos : page.getAccountPos(page.model.srcAccount.id),
									destAcc : page.model.destAccount,
									destAccPos : page.getAccountPos(page.model.destAccount.id),
								 	srcAmount : page.model.fSrcAmount,
								 	destAmount : page.model.fDestAmount };

	return page.submit();
}


function createTransfer(page, onState, params)
{
	return goToMainPage(page)
			.then(page => page.goToNewTransactionByAccount(0))
			.then(page => page.changeTransactionType(TRANSFER))
			.then(page => transferTransactionLoop(page, onState, page => submitTransferTransaction(page, params)))
			.then(page =>
			{
				let srcAcc = App.beforeSubmitTransaction.srcAcc;
				let srcAccPos = App.beforeSubmitTransaction.srcAccPos;
				let destAcc = App.beforeSubmitTransaction.destAcc;
				let destAccPos = App.beforeSubmitTransaction.destAccPos;

				// Obtain real source and destination amount from props:
				// Source amount expected to be always set
				// In case of transfer between accounts with different currency use destination amount value
				// In case of transfer between accounts with the same currency copy source amount value
				var sa = params.srcAmount;
				var da = ('destAmount' in params) ? params.destAmount : params.srcAmount;
				var expSrcBalance = srcAcc.balance - normalize(sa);
				var expDestBalance = destAcc.balance + normalize(da);
				var fmtSrcBal = formatCurrency(expSrcBalance, srcAcc.curr_id);
				var fmtDestBal = formatCurrency(expDestBalance, destAcc.curr_id);

				// Accounts widget changes
				var accWidget = { tiles : { length : App.accounts.length } };
				accWidget.tiles[srcAccPos] = { balance : fmtSrcBal, name : srcAcc.name };
				accWidget.tiles[destAccPos] = { balance : fmtDestBal, name : destAcc.name };

				// Transactions widget changes
				var fmtAmount = formatCurrency(sa, srcAcc.curr_id);
				if ('destAmount' in params)
				{
					fmtAmount += ' (' + formatCurrency(da, destAcc.curr_id) + ')';
				}

				var transWidget = { title : 'Transactions',
									transList : { length : Math.min(App.transactions.length + 1, 5) } };
				transWidget.transList[0] = { accountTitle : srcAcc.name + ' → ' + destAcc.name,
												amountText : fmtAmount,
											 	dateFmt : formatDate(('date' in params) ? new Date(params.date) : new Date()),
											 	comment : ('comment' in params) ? params.comment : '' };

				var state = { values : { widgets : { length : 5, 0 : accWidget, 2 : transWidget } } };

				test('Transfer transaction submit', () => {}, page, state);

				App.transactions = page.content.widgets[2].transList;
				App.accounts = page.content.widgets[0].tiles;
				App.persons = page.content.widgets[3].infoTiles;

				return Promise.resolve(page);
			});
}


// Update transfer transaction and check results
function updateTransfer(page, pos, params)
{
	pos = parseInt(pos);
	if (isNaN(pos) || pos < 0)
		throw new Error('Position of transaction not specified');

	if (!isObject(params))
		throw new Error('Parameters not specified');

	setBlock('Update transfer transaction ' + pos, 3);

	return goToMainPage(page)
			.then(page => page.goToTransactions())
			.then(page => page.filterByType(TRANSFER))
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

				test('Initial state of update transfer page', () => page.setExpectedState(isDiff ? 3 : 0), page);

				setParam(App.beforeUpdateTransaction,
							{ id : page.model.id,
								srcAcc : page.model.srcAccount,
								srcAccPos : page.getAccountPos(page.model.srcAccount.id),
								srcBalance : page.model.fSrcResBal,
								destAcc : page.model.destAccount,
								destAccPos : page.getAccountPos(page.model.destAccount.id),
								destBalance : page.model.fDestResBal,
								srcAmount : page.model.fSrcAmount,
								destAmount : page.model.fDestAmount,
								date : page.model.date,
								comment : page.model.comment});

				return submitTransferTransaction(page, params);
			})
			.then(page => page.filterByType(TRANSFER))
			.then(page =>
			{
				let trans_id = App.beforeUpdateTransaction.id;
			 	let updSrcAcc = App.beforeSubmitTransaction.srcAcc;
			 	let updDestAcc = App.beforeSubmitTransaction.destAcc;
				let updSrcAmount = App.beforeSubmitTransaction.srcAmount;
				let updDestAmount = App.beforeSubmitTransaction.destAmount;
				let transCount = App.beforeUpdateTransaction.trCount;
				let origDate = App.beforeUpdateTransaction.date;
				let origComment = App.beforeUpdateTransaction.comment;

				// Transactions widget changes
				var fmtAmount = formatCurrency(updSrcAmount, updSrcAcc.curr_id);
				if (updSrcAcc.curr_id != updDestAcc.curr_id)
				{
					fmtAmount += ' (' + formatCurrency(updDestAmount, updDestAcc.curr_id) + ')';
				}

				var state = { values : { transactions : { length : transCount } } };
				state.values.transactions[pos] = { id : trans_id,
													accountTitle : updSrcAcc.name + ' → ' + updDestAcc.name,
													amountText : fmtAmount,
												 	dateFmt : ('date' in params) ? formatDate(new Date(params.date)) : origDate,
												 	comment : ('comment' in params) ? params.comment : origComment };

				test('Transaction update', () => {}, page, state);

				return goToMainPage(page);
			})
			.then(page => {
			 	let updSrcAcc = App.beforeSubmitTransaction.srcAcc;
				let updSrcAccPos = App.beforeSubmitTransaction.srcAccPos;
			 	let origSrcAcc = App.beforeUpdateTransaction.srcAcc;
				let origSrcAccPos = App.beforeUpdateTransaction.srcAccPos;
				let origSrcBalance = App.beforeUpdateTransaction.srcBalance;

			 	let updDestAcc = App.beforeSubmitTransaction.destAcc;
				let updDestAccPos = App.beforeSubmitTransaction.destAccPos;
			 	let origDestAcc = App.beforeUpdateTransaction.destAcc;
				let origDestAccPos = App.beforeUpdateTransaction.destAccPos;
				let origDestBalance = App.beforeUpdateTransaction.destBalance;

				let updSrcAmount = App.beforeSubmitTransaction.srcAmount;
				let updDestAmount = App.beforeSubmitTransaction.destAmount;
				let origSrcAmount = App.beforeUpdateTransaction.srcAmount;
				let origDestAmount = App.beforeUpdateTransaction.destAmount;

				// Obtain real source and destination amount from props:
				// Source amount expected to be always set
				// In case of transfer between accounts with different currency use destination amount value
				// In case of transfer between accounts with the same currency copy source amount value
				var sa = updSrcAmount;
				var da = updDestAmount;

				// Accounts widget changes
				var accWidget = { tiles : { length : App.accounts.length } };
				var expBalance = [], fmtBal;

				// Cancel transaction
				let affectedAccounts = [];
				affectedAccounts[origSrcAccPos] = { balance : origSrcBalance + origSrcAmount, name : origSrcAcc.name, curr_id : origSrcAcc.curr_id };
				affectedAccounts[origDestAccPos] = { balance : origDestBalance - origDestAmount, name : origDestAcc.name, curr_id : origDestAcc.curr_id };

				// Chech if account was changed we need to update both
				if (!(updSrcAccPos in affectedAccounts))
				{
					affectedAccounts[updSrcAccPos] = { balance : updSrcAcc.balance, name : updSrcAcc.name, curr_id : updSrcAcc.curr_id };
				}

				affectedAccounts[updSrcAccPos].balance -= normalize(sa);

				// Chech if account was changed we need to update both
				if (!(updDestAccPos in affectedAccounts))
				{
					affectedAccounts[updDestAccPos] = { balance : updDestAcc.balance, name : updDestAcc.name, curr_id : updDestAcc.curr_id };
				}

				affectedAccounts[updDestAccPos].balance += normalize(da);

				for(let accPos in affectedAccounts)
				{
					let acc = affectedAccounts[accPos];
					fmtBal = formatCurrency(acc.balance, acc.curr_id);

					accWidget.tiles[accPos] = { balance : fmtBal, name : acc.name };
				}

				var state = { values : { widgets : { length : 5, 0 : accWidget } } };

				test('Account balance update', () => {}, page, state);

				return Promise.resolve(page);
			});
}


function transferTransactionLoop(page, actionState, action)
{
	setBlock('Transfer', 2);
	test('Initial state of new transfer page', () => page.setExpectedState(0), page);

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
		test('Emptry source amount input', () => page.inputSrcAmount(''), page);
		test('Source amount (.) input', () => page.inputSrcAmount('.'), page);
		test('Source amount (.0) input', () => page.inputSrcAmount('.0'), page);
		test('Source amount (.09) input', () => page.inputSrcAmount('.09'), page);
	}

// Transition 7: Change destination account to another one with same currency as source (EUR)
	test('(7) Change destination account', () => page.changeDestAccountByPos(0), page);
// Transition 5: Change source account to another one with same currency as destination (USD)
	test('(5) Change source account', () => page.changeSrcAccountByPos(0), page);
// Transition 1: Click by source balance and move from State 0 to State 1
	test('(1) Click on source result balance', () => page.clickSrcResultBalance(), page);

	if (actionState === 1)
		return action(page);

	if (!actionRequested)
	{
		// Input source result balance
		test('Source result balance (400) input', () => page.inputResBalance('400'), page);
		test('Source result balance (400.) input', () => page.inputResBalance('400.'), page);
		test('Source result balance (400.9) input', () => page.inputResBalance('400.9'), page);
		test('Source result balance (400.99) input', () => page.inputResBalance('400.99'), page);
		test('Source result balance (400.990) input', () => page.inputResBalance('400.990'), page);
		test('Source result balance (400.9901) input', () => page.inputResBalance('400.9901'), page);
		test('Empty result balance input', () => page.inputResBalance(''), page);
		test('Source result balance (.) input', () => page.inputResBalance('.'), page);
		test('Source result balance (.0) input', () => page.inputResBalance('.0'), page);
		test('Source result balance (.01) input', () => page.inputResBalance('.01'), page);
	}

	// Transition 11: Change source account to another one with same currency as destination and stay on State 1
	test('(11) Change source account', () => page.changeSrcAccountByPos(4), page);
	// Transition 13: Change destination account to another one with same currency as source and stay on State 1
	test('(13) Change destination account', () => page.changeDestAccountByPos(4), page);
	// Transition 9: Click by destination balance and move from State 1 to State 2
	test('(9) Click on destination result balance', () => page.clickDestResultBalance(), page);

	if (actionState === 2)
		return action(page);

	if (!actionRequested)
	{
		// Input destination result balance
		test('Destination result balance (600) input', () => page.inputDestResBalance('600'), page);
		test('Destination result balance (600.) input', () => page.inputDestResBalance('600.'), page);
		test('Destination result balance (600.9) input', () => page.inputDestResBalance('600.9'), page);
		test('Destination result balance (600.90) input', () => page.inputDestResBalance('600.90'), page);
		test('Destination result balance (600.901) input', () => page.inputDestResBalance('600.901'), page);
		test('Destination result balance (600.9010) input', () => page.inputDestResBalance('600.9010'), page);
		test('Destination result balance (600.90101) input', () => page.inputDestResBalance('600.90101'), page);
		test('Empty destination result balance input', () => page.inputDestResBalance(''), page);
		test('Destination result balance (.) input', () => page.inputDestResBalance('.'), page);
		test('Destination result balance (.0) input', () => page.inputDestResBalance('.0'), page);
	}

// Transition 15: Change source account to another one with same currency and stay on State 2
	test('(15) Change source account', () => page.changeSrcAccountByPos(4), page);
// Transition 17: Change destination account to another one with same currency and stay on State 2
	test('(17) Change destination account', () => page.changeDestAccount(4), page);
// Transition 16: Change source account to another one with different currency (USD) and move from State 2 to State 5

	if (actionState === 5)
		return action(page);

	test('(16) Change source account', () => page.changeSrcAccountByPos(2), page);
// Transition 26: Change source account to another one with different currency (EUR) and stay on State 5
	test('(26) Change source account', () => page.changeSrcAccountByPos(3), page);
// Transition 28: Change destination account to another one with different currency and stay on State 5
	test('(28) Change destination account', () => page.changeDestAccountByPos(0), page);
// Transition 27: Change source account to another one with same currency as destination (RUB) and move from State 5 to State 2
	test('(27) Change source account', () => page.changeSrcAccountByPos(1), page);
// Transition 18: Change destination account to another one with different currency than source (USD) and move from State 2 to State 5
	test('(18) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 29: Change destination account to another one with same currency as source and move from State 5 to State 2
	test('(29) Change destination account', () => page.changeDestAccountByPos(0), page);
// Transition 10: Click by source balance and move from State 1 to State 2
	test('(10) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 2: Click by source amount and move from State 1 to State 0
	test('(2) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 6: Change source account to another one with different currency than destination (USD) and move from State 0 to State 3

	if (actionState === 3)
		return action(page);

	test('(6) Change source account', () => page.changeSrcAccountByPos(2), page);
// Transition 43: Change source account to another one with different currency than destination (RUB) and stay on State 3
	test('(43) Change source account', () => page.changeSrcAccountByPos(1), page);
// Transition 41: Change destination account to another one with same currency as source (EUR) and stay on State 3
	test('(41) Change destination account', () => page.changeDestAccountByPos(3), page);
// Transition 44: Change source account to another one with same currency as destination (EUR > RUB) and move from State 3 to State 0
	test('(44) Change source account', () => {
		page.changeSrcAccountByPos(3);
		page.changeSrcAccountByPos(0);
	}, page);

// Transition 8: Change destination account to another one with different currency than source (USD) and move from State 0 to State 3
	test('(8) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 42: Change destination account to another one with same currency as source (RUB) and move from State 3 to State 0
	test('(42) Change destination account', () => page.changeDestAccountByPos(1), page);
// Transition 1: Click by source balance and move from State 0 to State 1
	test('(1) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 12: Change source account to another one with different currency than destination (EUR) and move from State 1 to State 4
	test('(12) Change source account', () => page.changeSrcAccountByPos(3), page);
// Transition 36: Change source account to another one with different currency than destination (USD) and stay on State 4
	test('(36) Change source account', () => page.changeSrcAccountByPos(1), page);
// Transition 38: Change destination account to another one with different currency than source (RUB) and stay on State 4
	test('(38) Change destination account', () => page.changeDestAccountByPos(3), page);
// Transition 39: Change destination account to another one with same currency as source (RUB) and move from State 4 to State 1
	test('(39) Change destination account', () => page.changeDestAccountByPos(3), page);
// Transition 14: Change destination account to another one with different currency than source (USD) and move from State 1 to State 4
	test('(14) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 32: Click by destination result balance and move from State 4 to State 6
	test('(32) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 49: Change source account to another one with different currency than destination (EUR) and stay on State 6
	test('(49) Change source account', () => page.changeSrcAccountByPos(3), page);
// Transition 47: Change destination account to another one with different currency than source (RUB) and stay on State 6
	test('(47) Change destination account', () => page.changeDestAccountByPos(0), page);
// Transition 20: Click by source amount and move from State 6 to State 5
	test('(20) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 19: Click by source result balance and move from State 5 to State 6
	test('(19) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 45: Click by exchange rate and move from State 6 to State 8
	test('(45) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 51: Change source account to another one with different currency than destination (USD) and stay on State 6
	test('(51) Change source account', () => page.changeSrcAccountByPos(2), page);
// Transition 53: Change destination account to another one with different currency than source (EUR) and stay on State 6
	test('(53) Change destination account', () => page.changeDestAccountByPos(3), page);
// Transition 23: Click by source amount and move from State 8 to State 7
	test('(23) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 57: Change source account to another one with different currency than destination (RUB) and stay on State 7
	test('(57) Change source account', () => page.changeSrcAccountByPos(0), page);
// Transition 59: Change destination account to another one with different currency than source (USD) and stay on State 7
	test('(59) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 22: Click by source result balance and move from State 7 to State 8
	test('(22) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 46: Click by destination result balance and move from State 8 to State 6
	test('(46) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 33: Click by destination amount and move from State 6 to State 4
	test('(33) Click on destination amount', () => page.clickDestAmount(), page);
// Transition 37: Change source account to another one with same currency as destination (RUB) and from State 4 to State 1
	test('(37) Change source account', () => {
		page.changeSrcAccountByPos(3);		// change source to EUR first
		page.changeDestAccountByPos(4)		// change destination to RUB
		page.changeSrcAccountByPos(0);		// change source to RUB
	}, page);

// Transition 2: Click by source amount and move from State 1 to State 0
	test('(2) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 3: Click by destination result balance and move from State 0 to State 2
	test('(3) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 4: Click by source amount and move from State 2 to State 0
	test('(4) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 3: Click by destination result balance and move from State 0 to State 2
	test('(3) Click on destination result balance', () => page.clickDestResultBalance(), page);

// Transition 18: Change destination account to another one with different currency than source (USD) and move from State 2 to State 5
	test('(18) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 21: Click by exchange rate and move from State 5 to State 7
	test('(21) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 55: Click by destination amount and move from State 7 to State 3
	test('(55) Click on destination amount', () => page.clickDestAmount(), page);
// Transition 25: Click by destination result balance and move from State 3 to State 5
	test('(25) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 21: Click by exchange rate and move from State 5 to State 7
	test('(21) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 56: Click by destination result balance and move from State 7 to State 5
	test('(56) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 24: Click by destination amount and move from State 5 to State 3
	test('(24) Click on destination amount', () => page.clickDestAmount(), page);
// Transition 40: Click by exchange rate and move from State 3 to State 7
	test('(40) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 60: Change destination account to another one with same currency as source (RUB) and move from State 7 to State 0
	test('(60) Change destination account', () => page.changeDestAccountByPos(1), page);
// Transition 3: Click by destination result balance and move from State 0 to State 2
	test('(3) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 16: Change source account to another one with different currency (USD) and move from State 2 to State 5
	test('(16) Change source account', () => page.changeSrcAccountByPos(2), page);
// Transition 21: Click by exchange rate and move from State 5 to State 7
	test('(21) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 58: Change source account to another one with same currency as destination (RUB) and from State 7 to State 0
	test('(58) Change source account', () => page.changeSrcAccountByPos(0), page);
// Transition 1: Click by source result balance and move from State 7 to State 8
	test('(1) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 12: Change source account to another one with different currency than destination (EUR) and move from State 1 to State 4
	test('(12) Change source account', () => page.changeSrcAccountByPos(3), page);
// Transition 30: Click by source amount and move from State 4 to State 3
	test('(30) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 31: Click by source result balance and move from State 3 to State 4
	test('(31) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 34: Click by exchange rate and move from State 4 to State 8
	test('(34) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 35: Click by destination amount and move from State 8 to State 4
	test('(35) Click on destination amount', () => page.clickDestAmount(), page);
// Transition 34: Click by exchange rate and move from State 4 to State 8
	test('(34) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 52: Change source account to another one with same currency as destination (RUB) and from State 8 to State 1
	test('(52) Change source account', () => page.changeSrcAccountByPos(0), page);
// Transition 14: Change destination account to another one with different currency than source (USD) and move from State 1 to State 4
	test('(14) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 34: Click by exchange rate and move from State 4 to State 8
	test('(34) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 54: Change destination account to another one with same currency as source (RUB) and move from State 8 to State 1
	test('(54) Change destination account', () => page.changeDestAccountByPos(1), page);
// Transition 12: Change source account to another one with different currency than source (USD) and move from State 1 to State 4
	test('(12) Change source account', () => page.changeSrcAccountByPos(2), page);
// Transition 32: Click by destination result balance and move from State 4 to State 6
	test('(32) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 50: Change source account to another one with same currency as destination (RUB) and from State 6 to State 1
	test('(50) Change source account', () => page.changeSrcAccountByPos(0), page);
// Transition 14: Change destination account to another one with different currency than source (USD) and move from State 1 to State 4
	test('(14) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 32: Click by destination result balance and move from State 4 to State 6
	test('(32) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 48: Change destination account to another one with same currency as source (RUB) and move from State 1 to State 2
	test('(48) Change destination account', () => page.changeDestAccountByPos(1), page);

	return Promise.resolve(page);
}
