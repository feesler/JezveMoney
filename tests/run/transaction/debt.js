var runDebt = (function()
{
	let test = null;


	async function submitDebtTransaction(app, params)
	{
		let view = app.view;
		test = app.test;

		if ('acc' in params)
		{
			if (params.acc === null)
			{
				await test('Disable account', async () =>
				{
					if (!view.model.noAccount)
						return view.toggleAccount();
				}, view);
			}
			else
			{
				if (view.model.noAccount)
				{
					await test('Enable account', () => view.toggleAccount(), view);
				}

				let acc = await view.getAccountByPos(params.acc);
				if (!acc)
					throw new Error('Account (' + params.destAcc + ') not found');

				await test('Change account to (' + acc.name + ')',
							() => view.changeAccountByPos(params.acc), view);
			}
		}

		if ('person' in params)
		{
			let person = await view.getPersonByPos(params.person);
			if (!person)
				throw new Error('Person (' + params.person + ') not found');

			await test('Change person to (' + person.name + ')',
						() => view.changePersonByPos(params.person), view);
		}

		if ('debtType' in params)
		{
			if (!!params.debtType != view.model.debtType)
			{
				await test('Change debt type (' + (params.debtType ? 'give' : 'take') + ')',
							() => view.toggleDebtType(), view);
			}
		}

		if (!('srcAmount' in params))
			throw new Error('Source amount value not specified');

		await test('Source amount (' + params.srcAmount + ') input', () => view.inputSrcAmount(params.srcAmount), view);

		if ('date' in params)
			await test('Date (' + params.date + ') input', () => view.changeDate(params.date), view);

		if ('comment' in params)
			await test('Comment (' + params.comment + ') input', () => view.inputComment(params.comment), view);

		app.beforeSubmitTransaction = { person : view.model.person,
		 								personPos : await view.getPersonPos(view.model.person.id),
										personAccount : view.getPersonAccount(view.model.person, view.model.src_curr_id),
										noAccount : view.model.noAccount,
										acc : view.model.account,
										debtType : view.model.debtType,
										srcAmount : view.model.fSrcAmount,
										destAmount : view.model.fDestAmount };

		if (!app.beforeSubmitTransaction.personAccount)
		{
			app.beforeSubmitTransaction.personAccount = { curr_id : view.model.src_curr_id, balance : 0 };
			app.beforeSubmitTransaction.person.accounts.push(app.beforeSubmitTransaction.personAccount);
		}

		if (app.beforeSubmitTransaction.acc)
			app.beforeSubmitTransaction.accPos = await view.getAccountPos(view.model.account.id);

		return view.submit();
	}


	async function createDebt(app, onState, params)
	{
		let view = app.view;
		test = app.test;

		let titleParams = [];
		for(let k in params)
			titleParams.push(k + ': ' + params[k]);
		view.setBlock('Create debt (' + titleParams.join(', ') + ')', 2);

		await app.goToMainView()
		await app.view.goToNewTransactionByAccount(0);
		await app.view.changeTransactionType(app.DEBT);
		await debtTransactionLoop(app, onState, app => submitDebtTransaction(app, params));

		let person = app.beforeSubmitTransaction.person;
		let personPos = app.beforeSubmitTransaction.personPos;
		let personAccount = app.beforeSubmitTransaction.personAccount;
		let acc = app.beforeSubmitTransaction.acc;
		let accPos = app.beforeSubmitTransaction.accPos;
		let debtType = app.beforeSubmitTransaction.debtType;

		var state = { values : { widgets : { length : 5 } } };
		var sa, da;

		sa = da = app.normalize(params.srcAmount);

		if (debtType)
		{
			personAccount.balance -= sa;
			if (acc)
				acc.balance += da;
		}
		else
		{
			personAccount.balance += da;
			if (acc)
				acc.balance -= sa;
		}

		var debtAccounts = person.accounts.reduce((val, pacc) =>
		{
			if (pacc.balance == 0)
				return val;

			let fmtBal = app.formatCurrency(pacc.balance, pacc.curr_id, app.currencies);
			return val.concat(fmtBal);
		}, []);

		let debtSubtitle = debtAccounts.length ? debtAccounts.join('\n') : 'No debts';

		var personsWidget = { infoTiles : { items : { length : app.persons.length } } };
		personsWidget.infoTiles.items[personPos] = { title : person.name, subtitle : debtSubtitle };

		state.values.widgets[3] = personsWidget;

		// Accounts widget changes
		if (acc)
		{
			var fmtAccBal = app.formatCurrency(acc.balance, acc.curr_id, app.currencies);
			var accWidget = { tiles : { items : { length : app.accounts.length } } };
			accWidget.tiles.items[accPos] = { balance : fmtAccBal, name : acc.name };

			state.values.widgets[0] = accWidget;
		}

		// Transactions widget changes
		var transWidget = { title : 'Transactions',
							transList : { items : { length : Math.min(app.transactions.length + 1, app.config.latestTransactions) } } };
		var title = '';
		var fmtAmount;

		if (debtType)
		{
			title = person.name;
			if (acc)
				title += ' → ' + acc.name;
			fmtAmount = (acc) ? '+ ' : '- ';
		}
		else
		{
			if (acc)
				title = acc.name + ' → ';
			title += person.name;
			fmtAmount = (acc) ? '- ' : '+ ';
		}
		fmtAmount += app.formatCurrency(sa, personAccount.curr_id, app.currencies);

		transWidget.transList.items[0] = { accountTitle : title,
										amountText : fmtAmount,
									 	dateFmt : app.formatDate(('date' in params) ? new Date(params.date) : new Date()),
									 	comment : ('comment' in params) ? params.comment : '' };

		state.values.widgets[2] = transWidget;

		await test('Debt transaction submit', async () => {}, app.view, state);

		app.transactions = app.view.content.widgets[2].transList.items;
		app.accounts = app.view.content.widgets[0].tiles.items;
		app.persons = app.view.content.widgets[3].infoTiles.items;
	}


	async function updateDebt(app, pos, params)
	{
		let view = app.view;

		let titleParams = [];
		for(let k in params)
			titleParams.push(k + ': ' + params[k]);
		view.setBlock('Update debt [' + pos + '] (' + titleParams.join(', ') + ')', 2);

		pos = parseInt(pos);
		if (isNaN(pos) || pos < 0)
			throw new Error('Position of transaction not specified');

		if (!app.isObject(params))
			throw new Error('Parameters not specified');

		// Step
		await app.goToMainView();
		await app.view.goToTransactions();
		await app.view.filterByType(app.DEBT);
		view = app.view;

		// Step
		app.beforeUpdateTransaction = { trCount : view.content.transList.items.length };

		let trObj = await view.getTransactionObject(view.content.transList.items[pos].id);
		if (!trObj)
			throw new Error('Transaction not found');

		app.beforeUpdateTransaction.trObj = trObj;

		await app.view.goToUpdateTransaction(pos);
		view = app.view;

		// Step
		let expState;
		if (view.model.noAccount)
			expState = (view.model.debtType) ? 6 : 7;
		else
			expState = (view.model.debtType) ? 0 : 3;

		await test('Initial state of update debt view', async () => view.setExpectedState(expState), view);

		app.setParam(app.beforeUpdateTransaction,
					{ id : view.model.id,
						person : view.model.person,
							personPos : await view.getPersonPos(view.model.person.id),
						personAccount : view.getPersonAccount(view.model.person, view.model.src_curr_id),
						noAccount : view.model.noAccount,
						acc : view.model.noAccount ? view.model.account : null,
						accPos : view.model.noAccount ? await view.getAccountPos(view.model.account.id) : -1,
						debtType : view.model.debtType,
						srcBalance : view.model.fSrcResBal,
						destBalance : view.model.fDestResBal,
						srcAmount : view.model.fSrcAmount,
						destAmount : view.model.fDestAmount,
						date : view.model.date,
						comment : view.model.comment});

		await submitDebtTransaction(app, params);

		// Step
		await app.view.filterByType(app.DEBT);

		let trans_id = app.beforeUpdateTransaction.id;
		let transCount = app.beforeUpdateTransaction.trCount;
		let updPerson = app.beforeSubmitTransaction.person;
		let updPersonAccount = app.beforeSubmitTransaction.personAccount;
		let updAcc = app.beforeSubmitTransaction.acc;
		let updNoAccount = app.beforeSubmitTransaction.noAccount;
		let updDebtType = app.beforeSubmitTransaction.debtType;
		let updSrcAmount = app.beforeSubmitTransaction.srcAmount;

		// Transactions list changes
		var title = '';
		var fmtAmount;

		if (updDebtType)
		{
			title = updPerson.name;
			if (updAcc && !updNoAccount)
				title += ' → ' + updAcc.name;
			fmtAmount = (updAcc && !updNoAccount) ? '+ ' : '- ';
		}
		else
		{
			if (updAcc && !updNoAccount)
				title = updAcc.name + ' → ';
			title += updPerson.name;
			fmtAmount = (updAcc && !updNoAccount) ? '- ' : '+ ';
		}
		fmtAmount += app.formatCurrency(updSrcAmount, updPersonAccount.curr_id, app.currencies);

		var state = { values : { transList : { items : { length : transCount } } } };
		state.values.transList.items[pos] = { id : trans_id,
											accountTitle : title,
											amountText : fmtAmount,
										 	dateFmt : app.formatDate(('date' in params) ? new Date(params.date) : new Date()),
										 	comment : ('comment' in params) ? params.comment : '' };

		await test('Transaction update', async () => {}, app.view, state);

		await app.goToMainView();

		// Step
		let origPerson = app.beforeUpdateTransaction.person;
		let origPersonPos = app.beforeUpdateTransaction.personPos;
		let origPersonAccount = app.beforeUpdateTransaction.personAccount;
		let origAcc = app.beforeUpdateTransaction.acc;
		let origAccPos = app.beforeUpdateTransaction.accPos;
		let origDebtType = app.beforeUpdateTransaction.debtType;
		let origAmount = app.beforeUpdateTransaction.srcAmount;
		let origNoAccount = app.beforeUpdateTransaction.noAccount;

		let updPersonPos = app.beforeSubmitTransaction.personPos;
		let updAccPos = app.beforeSubmitTransaction.accPos;
		let updAmount = app.beforeSubmitTransaction.srcAmount;

		var state = { values : { widgets : { length : 5 } } };
		var sa, da;

		sa = da = app.normalize(origAmount);

		var personsWidget = { infoTiles : { items : { length : app.persons.length } } };

		// Cancel transaction
		if (origDebtType)
		{
			origPersonAccount.balance += sa;
			if (origAcc)
				origAcc.balance -= da;
		}
		else
		{
			origPersonAccount.balance -= da;
			if (origAcc)
				origAcc.balance += sa;
		}

		// Apply new transaction
		sa = da = app.normalize(updAmount);
		if (updDebtType)
		{
			updPersonAccount.balance -= sa;
			if (updAcc)
				updAcc.balance += da;
		}
		else
		{
			updPersonAccount.balance += da;
			if (updAcc)
				updAcc.balance -= sa;
		}

		if (origPersonPos != updPersonPos)
		{
			let debtAccounts = origPerson.accounts.reduce((val, pacc) =>
			{
				if (pacc.balance == 0)
					return val;

				let fmtBal = app.formatCurrency(pacc.balance, pacc.curr_id, app.currencies);
				return val.concat(fmtBal);
			}, []);

			let debtSubtitle = debtAccounts.length ? debtAccounts.join('\n') : 'No debts';
			personsWidget.infoTiles.items[origPersonPos] = { title : origPerson.name, subtitle : debtSubtitle };
		}

		let debtAccounts = updPerson.accounts.reduce((val, pacc) =>
		{
			if (pacc.balance == 0)
				return val;

			let fmtBal = app.formatCurrency(pacc.balance, pacc.curr_id, app.currencies);
			return val.concat(fmtBal);
		}, []);

		let debtSubtitle = debtAccounts.length ? debtAccounts.join('\n') : 'No debts';

		personsWidget.infoTiles.items[updPersonPos] = { title : updPerson.name, subtitle : debtSubtitle };

		state.values.widgets[3] = personsWidget;

		// Accounts widget changes
		var accWidget = { tiles : { items : { length : app.accounts.length } } };
		if (origAcc && !origNoAccount)
		{
			var fmtAccBal = app.formatCurrency(origAcc.balance, origAcc.curr_id, app.currencies);
			accWidget.tiles.items[origAccPos] = { balance : fmtAccBal, name : origAcc.name };
		}
		if (updAcc && !updNoAccount)
		{
			var fmtAccBal = app.formatCurrency(updAcc.balance, updAcc.curr_id, app.currencies);
			accWidget.tiles.items[updAccPos] = { balance : fmtAccBal, name : updAcc.name };
		}

		state.values.widgets[0] = accWidget;

		await test('Account and person balance update', async () => {}, app.view, state);

		app.transactions = app.view.content.widgets[2].transList.items;
		app.accounts = app.view.content.widgets[0].tiles.items;
		app.persons = app.view.content.widgets[3].infoTiles.items;
	}


	async function debtTransactionLoop(app, actionState, action)
	{
		let view = app.view;
		test = app.test;

		view.setBlock('Debt loop', 2);
		await test('Initial state of new debt view', async () => view.setExpectedState(0), view);

		actionState = parseInt(actionState);
		var actionRequested = !isNaN(actionState);
		if (actionState === 0)
			return action(app);

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

	// Transition 1: Click by source result balance and move from State 0 to State 1
		await test('(1) Click on source result balance', () => view.clickSrcResultBalance(), view);

	// Transition 47: Change to another one and stay on State 1
		await test('(47) Change account', () => view.changeAccountByPos(1), view);

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

	// Transition 2: Click by source amount and move from State 1 to State 0
		await test('(2) Click on source amount', () => view.clickSrcAmount(), view);
	// Transition 3: Click by destination result balance and move from State 0 to State 2
		await test('(3) Click on destination result balance', () => view.clickDestResultBalance(), view);

	// Transition 42: Change to another one and stay on State 2
		await test('(42) Change account', () => view.changeAccountByPos(2), view);

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

	// Transition 4: Click by source result balance and move from State 2 to State 1
		await test('(4) Click on source result balance', () => view.clickSrcResultBalance(), view);
	// Transition 5: Click by destination result balance and move from State 1 to State 2
		await test('(5) Click on destination result balance', () => view.clickDestResultBalance(), view);
	// Transition 6: Click by source amount and move from State 2 to State 0
		await test('(6) Click on source amount', () => view.clickSrcAmount(), view);
	// Transition 7: Change debt type to "take" and move from State 0 to State 3
		await test('(7) Change debt type', () => view.toggleDebtType(), view);
	// Transition 8: Change debt type back to "give" and move from State 3 to State 0
		await test('(8) Change debt type', () => view.toggleDebtType(), view);

	// Transition 7: Change debt type to "take" and move from State 0 to State 3
		await test('(7) Change debt type', () => view.toggleDebtType(), view);

	// Transition 49: Change to another one and stay on State 3
		await test('(49) Change account', () => view.changeAccountByPos(3), view);

	// Transition 9: Click by destination result balance and move from State 3 to State 4
		await test('(9) Click on destination result balance', () => view.clickDestResultBalance(), view);

	// Transition 51: Change to another one and stay on State 4
		await test('(51) Change account', () => view.changeAccountByPos(4), view);

	// Transition 10: Click by source amount and move from State 4 to State 3
		await test('(10) Click on source amount', () => view.clickSrcAmount(), view);

	// Transition 9: Click by destination result balance and move from State 3 to State 4
		await test('(9) Click on destination result balance', () => view.clickDestResultBalance(), view);
	// Transition 11: Click by source result balance and move from State 4 to State 5
		await test('(11) Click on source result balance', () => view.clickSrcResultBalance(), view);

	// Transition 48: Change to another one and stay on State 5
		await test('(48) Change account', () => view.changeAccountByPos(0), view);

	// Transition 12: Click by source amount and move from State 5 to State 3
		await test('(12) Click on source amount', () => view.clickSrcAmount(), view);
	// Transition 13: Click by source result balance and move from State 3 to State 5
		await test('(13) Click on source result balance', () => view.clickSrcResultBalance(), view);
	// Transition 14: Click by destination result balance and move from State 5 to State 4
		await test('(14) Click on destination result balance', () => view.clickDestResultBalance(), view);
	// Transition 15: Change debt type to "give" and move from State 4 to State 1
		await test('(15) Change debt type', () => view.toggleDebtType(), view);
	// Transition 16: Change debt type to "take" and move from State 1 to State 4
		await test('(16) Change debt type', () => view.toggleDebtType(), view);

	// Transition 11: Click by source result balance and move from State 4 to State 5
		await test('(11) Click on source result balance', () => view.clickSrcResultBalance(), view);
	// Transition 17: Change debt type to "give" and move from State 5 to State 2
		await test('(17) Change debt type', () => view.toggleDebtType(), view);
	// Transition 18: Change debt type to "take" and move from State 2 to State 5
		await test('(18) Change debt type', () => view.toggleDebtType(), view);

	// Transition 12: Click by source amount and move from State 5 to State 3
		await test('(12) Click on source amount', () => view.clickSrcAmount(), view);
	// Transition 8: Change debt type back to "give" and move from State 3 to State 0
		await test('(8) Change debt type', () => view.toggleDebtType(), view);
	// Transition 19: Change person to another one and stay on State 0
		await test('(19) Change person', () => view.changePersonByPos(1), view);

	// Transition 1: Click by source result balance and move from State 0 to State 1
		await test('(1) Click on source result balance', () => view.clickSrcResultBalance(), view);
	// Transition 20: Change person to another one and stay on State 1
		await test('(20) Change person', () => view.changePersonByPos(0), view);

	// Transition 5: Click by destination result balance and move from State 1 to State 2
		await test('(5) Click on destination result balance', () => view.clickDestResultBalance(), view);
	// Transition 21: Change person to another one and stay on State 2
		await test('(21) Change person', () => view.changePersonByPos(1), view);

	// Transition 18: Change debt type to "take" and move from State 2 to State 5
		await test('(18) Change debt type', () => view.toggleDebtType(), view);
	// Transition 22: Change person to another one and stay on State 5
		await test('(22) Change person', () => view.changePersonByPos(0), view);

	// Transition 14: Click by destination result balance and move from State 5 to State 4
		await test('(14) Click on destination result balance', () => view.clickDestResultBalance(), view);
	// Transition 23: Change person to another one and stay on State 4
		await test('(23) Change person', () => view.changePersonByPos(1), view);

	// Transition 10: Click by source amount and move from State 4 to State 3
		await test('(10) Click on source amount', () => view.clickSrcAmount(), view);
	// Transition 24: Change person to another one and stay on State 3
		await test('(24) Change person', () => view.changePersonByPos(0), view);

	// Transition 8: Change debt type back to "give" and move from State 3 to State 0
		await test('(8) Change debt type', () => view.toggleDebtType(), view);
	// Transition 25: Disable account and move from State 0 to State 6
		await test('(25) Disable account', () => view.toggleAccount(), view);

	// Transition 43: Change person to another one and stay on State 6
		await test('(43) Change person', () => view.changePersonByPos(1), view);

	// Transition 26: Enable account and move from State 6 to State 0
		await test('(26) Enable account', () => view.toggleAccount(), view);

	// Transition 25: Disable account and move from State 0 to State 6
		await test('(25) Disable account', () => view.toggleAccount(), view);
	// Transition 27: Change debt type to "take" and move from State 6 to State 7
		await test('(27) Change debt type', () => view.toggleDebtType(), view);

	// Transition 44: Change person to another one and stay on State 7
		await test('(44) Change person', () => view.changePersonByPos(0), view);

	// Transition 28: Change debt type to "give" and move from State 7 to State 6
		await test('(28) Change debt type', () => view.toggleDebtType(), view);

	// Transition 27: Change debt type to "take" and move from State 6 to State 7
		await test('(27) Change debt type', () => view.toggleDebtType(), view);
	// Transition 29: Enable account and move from State 7 to State 3
		await test('(29) Enable account', () => view.toggleAccount(), view);

	// Transition 8: Change debt type back to "give" and move from State 3 to State 0
		await test('(8) Change debt type', () => view.toggleDebtType(), view);
	// Transition 25: Disable account and move from State 0 to State 6
		await test('(25) Disable account', () => view.toggleAccount(), view);

	// Transition 27: Change debt type to "take" and move from State 6 to State 7
		await test('(27) Change debt type', () => view.toggleDebtType(), view);
	// Transition 30: Click by destination result balance and move from State 7 to State 8
		await test('(30) Click on destination result balance', () => view.clickDestResultBalance(), view);

	// Transition 45: Change person to another one and stay on State 8
		await test('(45) Change person', () => view.changePersonByPos(1), view);

	// Transition 31: Click by source amount and move from State 8 to State 7
		await test('(31) Click on source amount', () => view.clickSrcAmount(), view);

	// Transition 30: Click by destination result balance and move from State 7 to State 8
		await test('(30) Click on destination result balance', () => view.clickDestResultBalance(), view);

	// Transition 32: Enable account and move from State 8 to State 4
		await test('(32) Enable account', () => view.toggleAccount(), view);

	// Transition 39: Disable account and move from State 4 to State 8
		await test('(39) Disable account', () => view.toggleAccount(), view);
	// Transition 33: Change debt type to "give" and move from State 8 to State 9
		await test('(33) Change debt type', () => view.toggleDebtType(), view);

	// Transition 46: Change person to another one and stay on State 9
		await test('(46) Change person', () => view.changePersonByPos(0), view);

	// Transition 34: Change debt type to "take" and move from State 9 to State 8
		await test('(34) Change debt type', () => view.toggleDebtType(), view);

	// Transition 44: Change person to another one and stay on State 8
		await test('(44) Change person', () => view.changePersonByPos(1), view);

	// Transition 33: Change debt type to "give" and move from State 8 to State 9
		await test('(33) Change debt type', () => view.toggleDebtType(), view);
	// Transition 35: Click by source amount and move from State 9 to State 6
		await test('(35) Click on source amount', () => view.clickSrcAmount(), view);
	// Transition 36: Click by source result balance and move from State 6 to State 9
		await test('(36) Click on source result balance', () => view.clickSrcResultBalance(), view);
	// Transition 37: Enable account and move from State 9 to State 1
		await test('(37) Enable account', () => view.toggleAccount(), view);
	// Transition 38: Disable account and move from State 1 to State 9
		await test('(38) Disable account', () => view.toggleAccount(), view);

	// Transition 35: Click by source amount and move from State 9 to State 6
		await test('(35) Click on source amount', () => view.clickSrcAmount(), view);
	// Transition 26: Enable account and move from State 6 to State 0
		await test('(26) Enable account', () => view.toggleAccount(), view);
	// Transition 7: Change debt type to "take" and move from State 0 to State 3
		await test('(7) Change debt type', () => view.toggleDebtType(), view);
	// Transition 40: Disable account and move from State 3 to State 7
		await test('(40) Disable account', () => view.toggleAccount(), view);


	// Transition 28: Change debt type to "give" and move from State 7 to State 6
		await test('(28) Change debt type', () => view.toggleDebtType(), view);
	// Transition 26: Enable account and move from State 6 to State 0
		await test('(26) Enable account', () => view.toggleAccount(), view);
	// Transition 3: Click by destination result balance and move from State 0 to State 2
		await test('(3) Click on destination result balance', () => view.clickDestResultBalance(), view);
	// Transition 41: Disable account and move from State 2 to State 6
		await test('(41) Disable account', () => view.toggleAccount(), view);

	// Transition 26: Enable account and move from State 6 to State 0
		await test('(26) Enable account', () => view.toggleAccount(), view);

	// Transition 52: Change to another one and stay on State 0
		await test('(52) Change account', () => view.changeAccountByPos(2), view);

	// Transition 3: Click by destination result balance and move from State 0 to State 2
		await test('(3) Click on destination result balance', () => view.clickDestResultBalance(), view);
	// Transition 18: Change debt type to "take" and move from State 2 to State 5
		await test('(18) Change debt type', () => view.toggleDebtType(), view);
	// Transition 50: Disable account and move from State 5 to State 7
		await test('(50) Disable account', () => view.toggleAccount(), view);

		return view;
	}


 	return { create : createDebt,
				update : updateDebt,
				stateLoop : debtTransactionLoop };
})();


export { runDebt };

