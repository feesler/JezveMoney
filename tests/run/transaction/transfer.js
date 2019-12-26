var runTransfer = (function()
{
	let test = null;


	async function submitTransferTransaction(app, params)
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

		if ('destAcc' in params)
		{
			let acc = await view.getAccountByPos(params.destAcc);
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

		app.beforeSubmitTransaction = { srcAcc : view.model.srcAccount,
									srcAccPos : await view.getAccountPos(view.model.srcAccount.id),
									destAcc : view.model.destAccount,
									destAccPos : await view.getAccountPos(view.model.destAccount.id),
								 	srcAmount : view.model.fSrcAmount,
								 	destAmount : view.model.fDestAmount };

		return view.submit();
	}


	async function createTransfer(app, onState, params)
	{
		let view = app.view;
		test = app.test;

		let titleParams = [];
		for(let k in params)
			titleParams.push(k + ': ' + params[k]);
		view.setBlock('Create transfer (' + titleParams.join(', ') + ')', 2);

		await app.goToMainView();
		await app.view.goToNewTransactionByAccount(0);
		await app.view.changeTransactionType(app.TRANSFER);
		await transferTransactionLoop(app, onState, app => submitTransferTransaction(app, params));
		view = app.view;

		let srcAcc = app.beforeSubmitTransaction.srcAcc;
		let srcAccPos = app.beforeSubmitTransaction.srcAccPos;
		let destAcc = app.beforeSubmitTransaction.destAcc;
		let destAccPos = app.beforeSubmitTransaction.destAccPos;

		// Obtain real source and destination amount from props:
		// Source amount expected to be always set
		// In case of transfer between accounts with different currency use destination amount value
		// In case of transfer between accounts with the same currency copy source amount value
		var sa = params.srcAmount;
		var da = ('destAmount' in params) ? params.destAmount : params.srcAmount;
		var expSrcBalance = srcAcc.balance - app.normalize(sa);
		var expDestBalance = destAcc.balance + app.normalize(da);
		var fmtSrcBal = app.formatCurrency(expSrcBalance, srcAcc.curr_id, app.currencies);
		var fmtDestBal = app.formatCurrency(expDestBalance, destAcc.curr_id, app.currencies);

		// Accounts widget changes
		var accWidget = { tiles : { items : { length : app.accounts.length } } };
		accWidget.tiles.items[srcAccPos] = { balance : fmtSrcBal, name : srcAcc.name };
		accWidget.tiles.items[destAccPos] = { balance : fmtDestBal, name : destAcc.name };

		// Transactions widget changes
		var fmtAmount = app.formatCurrency(sa, srcAcc.curr_id, app.currencies);
		if ('destAmount' in params)
		{
			fmtAmount += ' (' + app.formatCurrency(da, destAcc.curr_id, app.currencies) + ')';
		}

		var transWidget = { title : 'Transactions',
							transList : { items : { length : Math.min(app.transactions.length + 1, app.config.latestTransactions) } } };
		transWidget.transList.items[0] = { accountTitle : srcAcc.name + ' → ' + destAcc.name,
										amountText : fmtAmount,
									 	dateFmt : app.formatDate(('date' in params) ? new Date(params.date) : new Date()),
									 	comment : ('comment' in params) ? params.comment : '' };

		var state = { values : { widgets : { length : 5, 0 : accWidget, 2 : transWidget } } };

		await test('Transfer transaction submit', async () => {}, view, state);

		app.transactions = view.content.widgets[2].transList.items;
		app.accounts = view.content.widgets[0].tiles.items;
		app.persons = view.content.widgets[3].infoTiles.items;
	}


	// Update transfer transaction and check results
	async function updateTransfer(app, pos, params)
	{
		let view = app.view;
		test = app.test;

		let titleParams = [];
		for(let k in params)
			titleParams.push(k + ': ' + params[k]);
		view.setBlock('Update transfer [' + pos + '] (' + titleParams.join(', ') + ')', 2);

		pos = parseInt(pos);
		if (isNaN(pos) || pos < 0)
			throw new Error('Position of transaction not specified');

		if (!app.isObject(params))
			throw new Error('Parameters not specified');

		// Step 0: Navigate to transactions list view and filter by transfer
		await app.goToMainView();
		await app.view.goToTransactions();
		await app.view.filterByType(app.TRANSFER);
		view = app.view;

		// Step 1: Save count of transactions and navigate to update transaction view
		app.beforeUpdateTransaction = { trCount : view.content.transList.items.length };

		let trObj = await view.getTransactionObject(view.content.transList.items[pos].id);
		if (!trObj)
			throw new Error('Transaction not found');

		app.beforeUpdateTransaction.trObj = trObj;

		await view.goToUpdateTransaction(pos);
		view = app.view;

		// Step 2: Save original data of transaction, perform update actions and submit
		let isDiff = (app.beforeUpdateTransaction.trObj.src_curr != app.beforeUpdateTransaction.trObj.dest_curr);

		await test('Initial state of update transfer view', async () => view.setExpectedState(isDiff ? 3 : 0), view);

		app.setParam(app.beforeUpdateTransaction,
					{ id : view.model.id,
						srcAcc : view.model.srcAccount,
						srcAccPos : await view.getAccountPos(view.model.srcAccount.id),
						srcBalance : view.model.fSrcResBal,
						destAcc : view.model.destAccount,
						destAccPos : await view.getAccountPos(view.model.destAccount.id),
						destBalance : view.model.fDestResBal,
						srcAmount : view.model.fSrcAmount,
						destAmount : view.model.fDestAmount,
						date : view.model.date,
						comment : view.model.comment});

		await submitTransferTransaction(app, params);

		// Step 3: Check update of transactions list
		await app.view.filterByType(app.TRANSFER);

		let trans_id = app.beforeUpdateTransaction.id;
	 	let updSrcAcc = app.beforeSubmitTransaction.srcAcc;
	 	let updDestAcc = app.beforeSubmitTransaction.destAcc;
		let updSrcAmount = app.beforeSubmitTransaction.srcAmount;
		let updDestAmount = app.beforeSubmitTransaction.destAmount;
		let transCount = app.beforeUpdateTransaction.trCount;
		let origDate = app.beforeUpdateTransaction.date;
		let origComment = app.beforeUpdateTransaction.comment;

		// Transactions list changes
		var fmtAmount = app.formatCurrency(updSrcAmount, updSrcAcc.curr_id, app.currencies);
		if (updSrcAcc.curr_id != updDestAcc.curr_id)
		{
			fmtAmount += ' (' + app.formatCurrency(updDestAmount, updDestAcc.curr_id, app.currencies) + ')';
		}

		var state = { values : { transList : { items : { length : transCount } } } };
		state.values.transList.items[pos] = { id : trans_id,
											accountTitle : updSrcAcc.name + ' → ' + updDestAcc.name,
											amountText : fmtAmount,
										 	dateFmt : ('date' in params) ? app.formatDate(new Date(params.date)) : origDate,
										 	comment : ('comment' in params) ? params.comment : origComment };

		await test('Transaction update', async () => {}, app.view, state);

		await app.goToMainView();

		// Step 4: Check updates of affected accounts
		let updSrcAccPos = app.beforeSubmitTransaction.srcAccPos;
	 	let origSrcAcc = app.beforeUpdateTransaction.srcAcc;
		let origSrcAccPos = app.beforeUpdateTransaction.srcAccPos;
		let origSrcBalance = app.beforeUpdateTransaction.srcBalance;

		let updDestAccPos = app.beforeSubmitTransaction.destAccPos;
	 	let origDestAcc = app.beforeUpdateTransaction.destAcc;
		let origDestAccPos = app.beforeUpdateTransaction.destAccPos;
		let origDestBalance = app.beforeUpdateTransaction.destBalance;

		let origSrcAmount = app.beforeUpdateTransaction.srcAmount;
		let origDestAmount = app.beforeUpdateTransaction.destAmount;

		// Obtain real source and destination amount from props:
		// Source amount expected to be always set
		// In case of transfer between accounts with different currency use destination amount value
		// In case of transfer between accounts with the same currency copy source amount value
		var sa = updSrcAmount;
		var da = updDestAmount;

		// Accounts widget changes
		var accWidget = { tiles : { items : { length : app.accounts.length } } };
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

		affectedAccounts[updSrcAccPos].balance -= app.normalize(sa);

		// Chech if account was changed we need to update both
		if (!(updDestAccPos in affectedAccounts))
		{
			affectedAccounts[updDestAccPos] = { balance : updDestAcc.balance, name : updDestAcc.name, curr_id : updDestAcc.curr_id };
		}

		affectedAccounts[updDestAccPos].balance += app.normalize(da);

		for(let accPos in affectedAccounts)
		{
			let acc = affectedAccounts[accPos];
			fmtBal = app.formatCurrency(acc.balance, acc.curr_id, app.currencies);

			accWidget.tiles.items[accPos] = { balance : fmtBal, name : acc.name };
		}

		var state = { values : { widgets : { length : 5, 0 : accWidget } } };

		await test('Account balance update', async () => {}, app.view, state);
	}


	async function transferTransactionLoop(app, actionState, action)
	{
		let view = app.view;
		test = app.test;

		view.setBlock('Transfer loop', 2);
		await test('Initial state of new transfer view', async () => view.setExpectedState(0), view);

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
			await test('Emptry source amount input', () => view.inputSrcAmount(''), view);
			await test('Source amount (.) input', () => view.inputSrcAmount('.'), view);
			await test('Source amount (.0) input', () => view.inputSrcAmount('.0'), view);
			await test('Source amount (.09) input', () => view.inputSrcAmount('.09'), view);
		}

	// Transition 7: Change destination account to another one with same currency as source (EUR)
		await test('(7) Change destination account', () => view.changeDestAccountByPos(0), view);
	// Transition 5: Change source account to another one with same currency as destination (USD)
		await test('(5) Change source account', () => view.changeSrcAccountByPos(0), view);
	// Transition 1: Click by source balance and move from State 0 to State 1
		await test('(1) Click on source result balance', () => view.clickSrcResultBalance(), view);

		if (actionState === 1)
			return action(app);

		if (!actionRequested)
		{
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
		}

		// Transition 11: Change source account to another one with same currency as destination and stay on State 1
		await test('(11) Change source account', () => view.changeSrcAccountByPos(4), view);
		// Transition 13: Change destination account to another one with same currency as source and stay on State 1
		await test('(13) Change destination account', () => view.changeDestAccountByPos(4), view);
		// Transition 9: Click by destination balance and move from State 1 to State 2
		await test('(9) Click on destination result balance', () => view.clickDestResultBalance(), view);

		if (actionState === 2)
			return action(app);

		if (!actionRequested)
		{
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
		}

	// Transition 15: Change source account to another one with same currency and stay on State 2
		await test('(15) Change source account', () => view.changeSrcAccountByPos(4), view);
	// Transition 17: Change destination account to another one with same currency and stay on State 2
		await test('(17) Change destination account', () => view.changeDestAccount(4), view);
	// Transition 16: Change source account to another one with different currency (USD) and move from State 2 to State 5

		if (actionState === 5)
			return action(app);

		await test('(16) Change source account', () => view.changeSrcAccountByPos(2), view);
	// Transition 26: Change source account to another one with different currency (EUR) and stay on State 5
		await test('(26) Change source account', () => view.changeSrcAccountByPos(3), view);
	// Transition 28: Change destination account to another one with different currency and stay on State 5
		await test('(28) Change destination account', () => view.changeDestAccountByPos(0), view);
	// Transition 27: Change source account to another one with same currency as destination (RUB) and move from State 5 to State 2
		await test('(27) Change source account', () => view.changeSrcAccountByPos(1), view);
	// Transition 18: Change destination account to another one with different currency than source (USD) and move from State 2 to State 5
		await test('(18) Change destination account', () => view.changeDestAccountByPos(2), view);
	// Transition 29: Change destination account to another one with same currency as source and move from State 5 to State 2
		await test('(29) Change destination account', () => view.changeDestAccountByPos(0), view);
	// Transition 10: Click by source balance and move from State 1 to State 2
		await test('(10) Click on source result balance', () => view.clickSrcResultBalance(), view);
	// Transition 2: Click by source amount and move from State 1 to State 0
		await test('(2) Click on source amount', () => view.clickSrcAmount(), view);
	// Transition 6: Change source account to another one with different currency than destination (USD) and move from State 0 to State 3

		if (actionState === 3)
			return action(app);

		await test('(6) Change source account', () => view.changeSrcAccountByPos(2), view);
	// Transition 43: Change source account to another one with different currency than destination (RUB) and stay on State 3
		await test('(43) Change source account', () => view.changeSrcAccountByPos(1), view);
	// Transition 41: Change destination account to another one with same currency as source (EUR) and stay on State 3
		await test('(41) Change destination account', () => view.changeDestAccountByPos(3), view);
	// Transition 44: Change source account to another one with same currency as destination (EUR > RUB) and move from State 3 to State 0
		await test('(44) Change source account', async () => {
			await view.changeSrcAccountByPos(3);
			return view.changeSrcAccountByPos(0);
		}, view);

	// Transition 8: Change destination account to another one with different currency than source (USD) and move from State 0 to State 3
		await test('(8) Change destination account', () => view.changeDestAccountByPos(2), view);
	// Transition 42: Change destination account to another one with same currency as source (RUB) and move from State 3 to State 0
		await test('(42) Change destination account', () => view.changeDestAccountByPos(1), view);
	// Transition 1: Click by source balance and move from State 0 to State 1
		await test('(1) Click on source result balance', () => view.clickSrcResultBalance(), view);
	// Transition 12: Change source account to another one with different currency than destination (EUR) and move from State 1 to State 4
		await test('(12) Change source account', () => view.changeSrcAccountByPos(3), view);
	// Transition 36: Change source account to another one with different currency than destination (USD) and stay on State 4
		await test('(36) Change source account', () => view.changeSrcAccountByPos(1), view);
	// Transition 38: Change destination account to another one with different currency than source (RUB) and stay on State 4
		await test('(38) Change destination account', () => view.changeDestAccountByPos(3), view);
	// Transition 39: Change destination account to another one with same currency as source (RUB) and move from State 4 to State 1
		await test('(39) Change destination account', () => view.changeDestAccountByPos(3), view);
	// Transition 14: Change destination account to another one with different currency than source (USD) and move from State 1 to State 4
		await test('(14) Change destination account', () => view.changeDestAccountByPos(2), view);
	// Transition 32: Click by destination result balance and move from State 4 to State 6
		await test('(32) Click on destination result balance', () => view.clickDestResultBalance(), view);
	// Transition 49: Change source account to another one with different currency than destination (EUR) and stay on State 6
		await test('(49) Change source account', () => view.changeSrcAccountByPos(3), view);
	// Transition 47: Change destination account to another one with different currency than source (RUB) and stay on State 6
		await test('(47) Change destination account', () => view.changeDestAccountByPos(0), view);
	// Transition 20: Click by source amount and move from State 6 to State 5
		await test('(20) Click on source amount', () => view.clickSrcAmount(), view);
	// Transition 19: Click by source result balance and move from State 5 to State 6
		await test('(19) Click on source result balance', () => view.clickSrcResultBalance(), view);
	// Transition 45: Click by exchange rate and move from State 6 to State 8
		await test('(45) Click on exchange rate', () => view.clickExchRate(), view);
	// Transition 51: Change source account to another one with different currency than destination (USD) and stay on State 6
		await test('(51) Change source account', () => view.changeSrcAccountByPos(2), view);
	// Transition 53: Change destination account to another one with different currency than source (EUR) and stay on State 6
		await test('(53) Change destination account', () => view.changeDestAccountByPos(3), view);
	// Transition 23: Click by source amount and move from State 8 to State 7
		await test('(23) Click on source amount', () => view.clickSrcAmount(), view);
	// Transition 57: Change source account to another one with different currency than destination (RUB) and stay on State 7
		await test('(57) Change source account', () => view.changeSrcAccountByPos(0), view);
	// Transition 59: Change destination account to another one with different currency than source (USD) and stay on State 7
		await test('(59) Change destination account', () => view.changeDestAccountByPos(2), view);
	// Transition 22: Click by source result balance and move from State 7 to State 8
		await test('(22) Click on source result balance', () => view.clickSrcResultBalance(), view);
	// Transition 46: Click by destination result balance and move from State 8 to State 6
		await test('(46) Click on destination result balance', () => view.clickDestResultBalance(), view);
	// Transition 33: Click by destination amount and move from State 6 to State 4
		await test('(33) Click on destination amount', () => view.clickDestAmount(), view);
	// Transition 37: Change source account to another one with same currency as destination (RUB) and from State 4 to State 1
		await test('(37) Change source account', async () => {
			await view.changeSrcAccountByPos(3);		// change source to EUR first
			await view.changeDestAccountByPos(4)		// change destination to RUB
			return view.changeSrcAccountByPos(0);		// change source to RUB
		}, view);

	// Transition 2: Click by source amount and move from State 1 to State 0
		await test('(2) Click on source amount', () => view.clickSrcAmount(), view);
	// Transition 3: Click by destination result balance and move from State 0 to State 2
		await test('(3) Click on destination result balance', () => view.clickDestResultBalance(), view);
	// Transition 4: Click by source amount and move from State 2 to State 0
		await test('(4) Click on source amount', () => view.clickSrcAmount(), view);
	// Transition 3: Click by destination result balance and move from State 0 to State 2
		await test('(3) Click on destination result balance', () => view.clickDestResultBalance(), view);

	// Transition 18: Change destination account to another one with different currency than source (USD) and move from State 2 to State 5
		await test('(18) Change destination account', () => view.changeDestAccountByPos(2), view);
	// Transition 21: Click by exchange rate and move from State 5 to State 7
		await test('(21) Click on exchange rate', () => view.clickExchRate(), view);
	// Transition 55: Click by destination amount and move from State 7 to State 3
		await test('(55) Click on destination amount', () => view.clickDestAmount(), view);
	// Transition 25: Click by destination result balance and move from State 3 to State 5
		await test('(25) Click on destination result balance', () => view.clickDestResultBalance(), view);
	// Transition 21: Click by exchange rate and move from State 5 to State 7
		await test('(21) Click on exchange rate', () => view.clickExchRate(), view);
	// Transition 56: Click by destination result balance and move from State 7 to State 5
		await test('(56) Click on destination result balance', () => view.clickDestResultBalance(), view);
	// Transition 24: Click by destination amount and move from State 5 to State 3
		await test('(24) Click on destination amount', () => view.clickDestAmount(), view);
	// Transition 40: Click by exchange rate and move from State 3 to State 7
		await test('(40) Click on exchange rate', () => view.clickExchRate(), view);
	// Transition 60: Change destination account to another one with same currency as source (RUB) and move from State 7 to State 0
		await test('(60) Change destination account', () => view.changeDestAccountByPos(1), view);
	// Transition 3: Click by destination result balance and move from State 0 to State 2
		await test('(3) Click on destination result balance', () => view.clickDestResultBalance(), view);
	// Transition 16: Change source account to another one with different currency (USD) and move from State 2 to State 5
		await test('(16) Change source account', () => view.changeSrcAccountByPos(2), view);
	// Transition 21: Click by exchange rate and move from State 5 to State 7
		await test('(21) Click on exchange rate', () => view.clickExchRate(), view);
	// Transition 58: Change source account to another one with same currency as destination (RUB) and from State 7 to State 0
		await test('(58) Change source account', () => view.changeSrcAccountByPos(0), view);
	// Transition 1: Click by source result balance and move from State 7 to State 8
		await test('(1) Click on source result balance', () => view.clickSrcResultBalance(), view);
	// Transition 12: Change source account to another one with different currency than destination (EUR) and move from State 1 to State 4
		await test('(12) Change source account', () => view.changeSrcAccountByPos(3), view);
	// Transition 30: Click by source amount and move from State 4 to State 3
		await test('(30) Click on source amount', () => view.clickSrcAmount(), view);
	// Transition 31: Click by source result balance and move from State 3 to State 4
		await test('(31) Click on source result balance', () => view.clickSrcResultBalance(), view);
	// Transition 34: Click by exchange rate and move from State 4 to State 8
		await test('(34) Click on exchange rate', () => view.clickExchRate(), view);
	// Transition 35: Click by destination amount and move from State 8 to State 4
		await test('(35) Click on destination amount', () => view.clickDestAmount(), view);
	// Transition 34: Click by exchange rate and move from State 4 to State 8
		await test('(34) Click on exchange rate', () => view.clickExchRate(), view);
	// Transition 52: Change source account to another one with same currency as destination (RUB) and from State 8 to State 1
		await test('(52) Change source account', () => view.changeSrcAccountByPos(0), view);
	// Transition 14: Change destination account to another one with different currency than source (USD) and move from State 1 to State 4
		await test('(14) Change destination account', () => view.changeDestAccountByPos(2), view);
	// Transition 34: Click by exchange rate and move from State 4 to State 8
		await test('(34) Click on exchange rate', () => view.clickExchRate(), view);
	// Transition 54: Change destination account to another one with same currency as source (RUB) and move from State 8 to State 1
		await test('(54) Change destination account', () => view.changeDestAccountByPos(1), view);
	// Transition 12: Change source account to another one with different currency than source (USD) and move from State 1 to State 4
		await test('(12) Change source account', () => view.changeSrcAccountByPos(2), view);
	// Transition 32: Click by destination result balance and move from State 4 to State 6
		await test('(32) Click on destination result balance', () => view.clickDestResultBalance(), view);
	// Transition 50: Change source account to another one with same currency as destination (RUB) and from State 6 to State 1
		await test('(50) Change source account', () => view.changeSrcAccountByPos(0), view);
	// Transition 14: Change destination account to another one with different currency than source (USD) and move from State 1 to State 4
		await test('(14) Change destination account', () => view.changeDestAccountByPos(2), view);
	// Transition 32: Click by destination result balance and move from State 4 to State 6
		await test('(32) Click on destination result balance', () => view.clickDestResultBalance(), view);
	// Transition 48: Change destination account to another one with same currency as source (RUB) and move from State 1 to State 2
		await test('(48) Change destination account', () => view.changeDestAccountByPos(1), view);

		return view;
	}


 	return { create : createTransfer,
				update : updateTransfer,
				stateLoop : transferTransactionLoop };
})();


export { runTransfer };

