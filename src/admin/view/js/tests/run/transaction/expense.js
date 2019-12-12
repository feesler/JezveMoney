var runExpense = (function()
{
	let App = null;
	let test = null;

	function onAppUpdate(props)
	{
		props = props || {};

		if ('App' in props)
		{
			App = props.App;
			test = App.test;
		}
	}


	async function submitExpenseTransaction(view, params)
	{
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
			let curr = App.getCurrency(params.destCurr);
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

		App.beforeSubmitTransaction = { srcAcc : view.model.srcAccount,
										srcAccPos : await view.getAccountPos(view.model.srcAccount.id) };

		if (view.model.isUpdate)
			App.beforeSubmitTransaction.id = view.model.id;

		App.notify();

		return view.submit();
	}


	async function createExpense(view, accNum, onState, params)
	{
		let titleParams = [];
		for(let k in params)
			titleParams.push(k + ': ' + params[k]);
		view.setBlock('Create expense (' + titleParams.join(', ') + ')', 2);

		// Step 0:
		view = await App.goToMainView(view);
		view = await view.goToNewTransactionByAccount(accNum);
		view = await expenseTransactionLoop(view, onState, view => submitExpenseTransaction(view, params));

		// Step
	 	let srcAcc = App.beforeSubmitTransaction.srcAcc;
		let srcAccPos = App.beforeSubmitTransaction.srcAccPos;

		// Obtain real source amount from props:
		// In case of expense with different currency use source amount value
		// In case of expense with the same currency copy destination amount value
		var sa = ('destCurr' in params && 'srcAmount' in params) ? params.srcAmount : params.destAmount;
		var expBalance = srcAcc.balance - App.normalize(sa);
		var fmtBal = App.formatCurrency(expBalance, srcAcc.curr_id);

		// Accounts widget changes
		var accWidget = { tiles : { items : { length : App.accounts.length } } };
		accWidget.tiles.items[srcAccPos] = { balance : fmtBal, name : srcAcc.name };

		// Transactions widget changes
		var fmtAmount = '- ' + App.formatCurrency(('srcAmount' in params) ? params.srcAmount : params.destAmount, srcAcc.curr_id);
		if ('destCurr' in params && 'srcAmount' in params)
		{
			fmtAmount += ' (- ' + App.formatCurrency(params.destAmount, params.destCurr) + ')';
		}

		var transWidget = { title : 'Transactions',
							transList : { items : { length : Math.min(App.transactions.length + 1, 5) } } };
		transWidget.transList.items[0] = { accountTitle : srcAcc.name,
										amountText : fmtAmount,
									 	dateFmt : App.formatDate(('date' in params) ? new Date(params.date) : new Date()),
									 	comment : ('comment' in params) ? params.comment : '' };

		var state = { values : { widgets : { length : 5, 0 : accWidget, 2 : transWidget } } };

		await test('Expense transaction submit', async () => {}, view, state);

		App.transactions = view.content.widgets[2].transList.items;
		App.accounts = view.content.widgets[0].tiles.items;
		App.persons = view.content.widgets[3].infoTiles.items;
		App.notify();

		return view;
	}


	// Update expense transaction and check results
	async function updateExpense(view, pos, params)
	{
		let titleParams = [];
		for(let k in params)
			titleParams.push(k + ': ' + params[k]);
		view.setBlock('Update expense [' + pos + '] (' + titleParams.join(', ') + ')', 2);

		pos = parseInt(pos);
		if (isNaN(pos) || pos < 0)
			throw new Error('Position of transaction not specified');

		if (!App.isObject(params))
			throw new Error('Parameters not specified');

		view = await App.goToMainView(view);
		view = await view.goToTransactions();
		view = await view.filterByType(App.EXPENSE);

		App.beforeUpdateTransaction = { trCount : view.content.transList.items.length };

		let trObj = await view.getTransactionObject(view.content.transList.items[pos].id);
		if (!trObj)
			throw new Error('Transaction not found');

		App.beforeUpdateTransaction.trObj = trObj;
		App.notify();

		view = await view.goToUpdateTransaction(pos);

		// Step
		let isDiff = (App.beforeUpdateTransaction.trObj.src_curr != App.beforeUpdateTransaction.trObj.dest_curr);

		await test('Initial state of update expense view', async () => view.setExpectedState(isDiff ? 2 : 0), view);

		App.setParam(App.beforeUpdateTransaction,
					{ id : view.model.id,
						srcAcc : view.model.srcAccount,
						srcAccPos : await view.getAccountPos(view.model.srcAccount.id),
						srcBalance : view.model.fSrcResBal,
						srcAmount : view.model.fSrcAmount,
						destAmount : view.model.fDestAmount,
						date : view.model.date,
						comment : view.model.comment });
		App.notify();

		view = await submitExpenseTransaction(view, params);

		// Step
		view = await view.filterByType(App.EXPENSE);

	 	let updSrcAcc = App.beforeSubmitTransaction.srcAcc;
		let trans_id = App.beforeUpdateTransaction.id;
		let transCount = App.beforeUpdateTransaction.trCount;
		let origDate = App.beforeUpdateTransaction.date;
		let origComment = App.beforeUpdateTransaction.comment;

		// Transactions list changes
		var fmtAmount = '- ' + App.formatCurrency(('srcAmount' in params) ? params.srcAmount : params.destAmount, updSrcAcc.curr_id);
		if ('destCurr' in params && 'srcAmount' in params)
		{
			fmtAmount += ' (- ' + App.formatCurrency(params.destAmount, params.destCurr) + ')';
		}

		var state = { values : { transList : { items : { length : transCount } } } };
		state.values.transList.items[pos] = { id : trans_id,
											accountTitle : updSrcAcc.name,
											amountText : fmtAmount,
										 	dateFmt : ('date' in params) ? App.formatDate(new Date(params.date)) : origDate,
										 	comment : ('comment' in params) ? params.comment : origComment };

		await test('Transaction update', async () => {}, view, state);

		view = await App.goToMainView(view);

		// Step
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
		var accWidget = { tiles : { items : { length : App.accounts.length } } };
		var expBalance, fmtBal;
		// Chech if account was changed we need to update both
		if (updSrcAccPos != origSrcAccPos)
		{
			expBalance = origSrcBalance + origSrcAmount;
			fmtBal = App.formatCurrency(expBalance, origSrcAcc.curr_id);

			accWidget.tiles.items[origSrcAccPos] = { balance : fmtBal, name : origSrcAcc.name };

			expBalance = updSrcAcc.balance - App.normalize(sa);
			fmtBal = App.formatCurrency(expBalance, updSrcAcc.curr_id);

			accWidget.tiles.items[updSrcAccPos] = { balance : fmtBal, name : updSrcAcc.name };
		}
		else		// account not changed
		{
			var expBalance = origSrcBalance + origSrcAmount - App.normalize(sa);
			var fmtBal = App.formatCurrency(expBalance, updSrcAcc.curr_id);

			accWidget.tiles.items[updSrcAccPos] = { balance : fmtBal, name : updSrcAcc.name };
		}

		var state = { values : { widgets : { length : 5, 0 : accWidget } } };

		await test('Account balance update', async () => {}, view, state);

		return view;
	}


	async function expenseTransactionLoop(view, actionState, action)
	{
	// State 0
		view.setBlock('Expense loop', 2);
		await test('Initial state of new expense view', async () =>
		{
			let trObj = await view.getUpdateTransactionObj();

			if (trObj)
			{
				let srcAcc = App.idSearch(App.accounts, view.model.srcAccount.id);

				let initialBal = App.normalize(view.model.fSrcResBal + trObj.srcAmount);
				view.model.srcAccount.fmtBalance = view.model.srcCurr.formatValue(initialBal);
			}

			view.setExpectedState(0);
		}, view);

		actionState = parseInt(actionState);
		var actionRequested = !isNaN(actionState);
		if (actionState === 0)
			return action(view);

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
			return action(view);

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
			return action(view);

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
			return action(view);

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
			return action(view);

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


		return view;
	}


 	return { onAppUpdate : onAppUpdate,
				create : createExpense,
				update : updateExpense,
				stateLoop : expenseTransactionLoop };
})();


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runExpense;
}
