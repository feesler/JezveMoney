function submitDebtTransaction(page, params)
{
	if ('acc' in params)
	{
		if (params.acc === null)
		{
			test('Disable account', () =>
			{
				if (!page.model.noAccount)
					page.toggleAccount();
			}, page);
		}
		else
		{
			if (page.model.noAccount)
			{
				test('Enable account', () => page.toggleAccount(), page);
			}

			test('Change account to (' + page.getAccountByPos(params.acc).name + ')',
					() => page.changeAccountByPos(params.acc), page);
		}
	}

	if ('person' in params)
	{
		test('Change person to (' + page.getPersonByPos(params.person).name + ')',
				() => page.changePersonByPos(params.person), page);
	}

	if ('debtType' in params)
	{
		if (!!params.debtType != page.model.debtType)
		{
			test('Change debt type (' + (params.debtType ? 'give' : 'take') + ')',
					() => page.toggleDebtType(), page);
		}
	}

	if (!('srcAmount' in params))
		throw new Error('Source amount value not specified');

	test('Source amount (' + params.srcAmount + ') input', () => page.inputSrcAmount(params.srcAmount), page);

	if ('date' in params)
		test('Date (' + params.date + ') input', () => page.inputDate(params.date), page);

	if ('comment' in params)
		test('Comment (' + params.comment + ') input', () => page.inputComment(params.comment), page);

	App.beforeSubmitTransaction = { person : page.model.person,
	 								personPos : page.getPersonPos(page.model.person.id),
									personAccount : page.getPersonAccount(page.model.person.id, page.model.src_curr_id),
									noAccount : page.model.noAccount,
									acc : page.model.account,
									debtType : page.model.debtType,
									srcAmount : page.model.fSrcAmount,
									destAmount : page.model.fDestAmount };

	if (!App.beforeSubmitTransaction.personAccount)
	{
		App.beforeSubmitTransaction.personAccount = { curr_id : page.model.src_curr_id, balance : 0 };
		App.beforeSubmitTransaction.person.accounts.push(App.beforeSubmitTransaction.personAccount);
	}

	if (App.beforeSubmitTransaction.acc)
		App.beforeSubmitTransaction.accPos = page.getAccountPos(page.model.account.id);

	return page.submit();
}


function createDebt(page, onState, params)
{
	return goToMainPage(page)
			.then(page => page.goToNewTransactionByAccount(0))
			.then(page => page.changeTransactionType(DEBT))
			.then(page => debtTransactionLoop(page, onState, page => submitDebtTransaction(page, params)))
			.then(page =>
			{
				let person = App.beforeSubmitTransaction.person;
				let personPos = App.beforeSubmitTransaction.personPos;
				let personAccount = App.beforeSubmitTransaction.personAccount;
				let acc = App.beforeSubmitTransaction.acc;
				let accPos = App.beforeSubmitTransaction.accPos;
				let debtType = App.beforeSubmitTransaction.debtType;

				var state = { values : { widgets : { length : 5 } } };
				var sa, da;

				sa = da = normalize(params.srcAmount);

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

					let fmtBal = formatCurrency(pacc.balance, pacc.curr_id);
					return val.concat(fmtBal);
				}, []);

				let debtSubtitle = debtAccounts.length ? debtAccounts.join('\n') : 'No debts';

				var personsWidget = { infoTiles : { length : App.persons.length } };
				personsWidget.infoTiles[personPos] = { title : person.name, subtitle : debtSubtitle };

				state.values.widgets[3] = personsWidget;

				// Accounts widget changes
				if (acc)
				{
					var fmtAccBal = formatCurrency(acc.balance, acc.curr_id);
					var accWidget = { tiles : { length : App.accounts.length } };
					accWidget.tiles[accPos] = { balance : fmtAccBal, name : acc.name };

					state.values.widgets[0] = accWidget;
				}

				// Transactions widget changes
				var transWidget = { title : 'Transactions',
									transList : { length : Math.min(App.transactions.length + 1, 5) } };
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
				fmtAmount += formatCurrency(sa, personAccount.curr_id);

				transWidget.transList[0] = { accountTitle : title,
												amountText : fmtAmount,
											 	dateFmt : formatDate(('date' in params) ? new Date(params.date) : new Date()),
											 	comment : ('comment' in params) ? params.comment : '' };

				state.values.widgets[2] = transWidget;

				test('Debt transaction submit', () => {}, page, state);

				App.transactions = page.content.widgets[2].transList;
				App.accounts = page.content.widgets[0].tiles;
				App.persons = page.content.widgets[3].infoTiles;

				return Promise.resolve(page);
			});
}


function updateDebt(page, pos, params)
{
	pos = parseInt(pos);
	if (isNaN(pos) || pos < 0)
		throw new Error('Position of transaction not specified');

	if (!isObject(params))
		throw new Error('Parameters not specified');

	setBlock('Update debt transaction ' + pos, 3);

	return goToMainPage(page)
			.then(page => page.goToTransactions())
			.then(page => page.filterByType(DEBT))
			.then(page => {
				App.beforeUpdateTransaction = { trCount : page.content.transactions.length };

				let trObj = page.getTransactionObject(page.content.transactions[pos].id);
				if (!trObj)
					throw new Error('Transaction not found');

				App.beforeUpdateTransaction.trObj = trObj;

				return page.goToUpdateTransaction(pos);
			})
			.then(page => {
				let expState;
				if (page.model.noAccount)
					expState = (page.model.debtType) ? 6 : 7;
				else
					expState = (page.model.debtType) ? 0 : 3;

				test('Initial state of update debt page', () => page.setExpectedState(expState), page);

				setParam(App.beforeUpdateTransaction,
							{ id : page.model.id,
								person : page.model.person,
 								personPos : page.getPersonPos(page.model.person.id),
								personAccount : page.getPersonAccount(page.model.person.id, page.model.src_curr_id),
								noAccount : page.model.noAccount,
								acc : page.model.noAccount ? page.model.account : null,
								accPos : page.model.noAccount ? page.getAccountPos(page.model.account.id) : -1,
								debtType : page.model.debtType,
								srcBalance : page.model.fSrcResBal,
								destBalance : page.model.fDestResBal,
								srcAmount : page.model.fSrcAmount,
								destAmount : page.model.fDestAmount,
								date : page.model.date,
								comment : page.model.comment});

				return submitDebtTransaction(page, params);
			})
			.then(page => page.filterByType(DEBT))
			.then(page =>
			{
				let trans_id = App.beforeUpdateTransaction.id;
				let transCount = App.beforeUpdateTransaction.trCount;
				let updPerson = App.beforeSubmitTransaction.person;
				let updPersonAccount = App.beforeSubmitTransaction.personAccount;
				let updAcc = App.beforeSubmitTransaction.acc;
				let updNoAccount = App.beforeSubmitTransaction.noAccount;
				let updDebtType = App.beforeSubmitTransaction.debtType;
				let updSrcAmount = App.beforeSubmitTransaction.srcAmount;

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
				fmtAmount += formatCurrency(updSrcAmount, updPersonAccount.curr_id);

				var state = { values : { transactions : { length : transCount } } };
				state.values.transactions[pos] = { id : trans_id,
													accountTitle : title,
													amountText : fmtAmount,
												 	dateFmt : formatDate(('date' in params) ? new Date(params.date) : new Date()),
												 	comment : ('comment' in params) ? params.comment : '' };

				test('Transaction update', () => {}, page, state);

				return goToMainPage(page);
			})
			.then(page =>
			{
				let origPerson = App.beforeUpdateTransaction.person;
				let origPersonPos = App.beforeUpdateTransaction.personPos;
				let origPersonAccount = App.beforeUpdateTransaction.personAccount;
				let origAcc = App.beforeUpdateTransaction.acc;
				let origAccPos = App.beforeUpdateTransaction.accPos;
				let origDebtType = App.beforeUpdateTransaction.debtType;
				let origAmount = App.beforeUpdateTransaction.srcAmount;
				let origNoAccount = App.beforeUpdateTransaction.noAccount;

				let updPerson = App.beforeSubmitTransaction.person;
				let updPersonPos = App.beforeSubmitTransaction.personPos;
				let updPersonAccount = App.beforeSubmitTransaction.personAccount;
				let updAcc = App.beforeSubmitTransaction.acc;
				let updAccPos = App.beforeSubmitTransaction.accPos;
				let updDebtType = App.beforeSubmitTransaction.debtType;
				let updAmount = App.beforeSubmitTransaction.srcAmount;
				let updNoAccount = App.beforeSubmitTransaction.noAccount;

				var state = { values : { widgets : { length : 5 } } };
				var sa, da;

				sa = da = normalize(origAmount);

				var personsWidget = { infoTiles : { length : App.persons.length } };

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
				sa = da = normalize(updAmount);
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

						let fmtBal = formatCurrency(pacc.balance, pacc.curr_id);
						return val.concat(fmtBal);
					}, []);

					let debtSubtitle = debtAccounts.length ? debtAccounts.join('\n') : 'No debts';
					personsWidget.infoTiles[origPersonPos] = { title : origPerson.name, subtitle : debtSubtitle };
				}

				let debtAccounts = updPerson.accounts.reduce((val, pacc) =>
				{
					if (pacc.balance == 0)
						return val;

					let fmtBal = formatCurrency(pacc.balance, pacc.curr_id);
					return val.concat(fmtBal);
				}, []);

				let debtSubtitle = debtAccounts.length ? debtAccounts.join('\n') : 'No debts';

				personsWidget.infoTiles[updPersonPos] = { title : updPerson.name, subtitle : debtSubtitle };

				state.values.widgets[3] = personsWidget;

				// Accounts widget changes
				var accWidget = { tiles : { length : App.accounts.length } };
				if (origAcc && !origNoAccount)
				{
					var fmtAccBal = formatCurrency(origAcc.balance, origAcc.curr_id);
					accWidget.tiles[origAccPos] = { balance : fmtAccBal, name : origAcc.name };
				}
				if (updAcc && !updNoAccount)
				{
					var fmtAccBal = formatCurrency(updAcc.balance, updAcc.curr_id);
					accWidget.tiles[updAccPos] = { balance : fmtAccBal, name : updAcc.name };
				}

				state.values.widgets[0] = accWidget;

				test('Account and person balance update', () => {}, page, state);

				App.transactions = page.content.widgets[2].transList;
				App.accounts = page.content.widgets[0].tiles;
				App.persons = page.content.widgets[3].infoTiles;

				return Promise.resolve(page);
			});
}


function debtTransactionLoop(page, actionState, action)
{
	setBlock('Debt', 2);
	test('Initial state of new debt page', () => page.setExpectedState(0), page);

	actionState = parseInt(actionState);
	var actionRequested = !isNaN(actionState);
	if (actionState === 0)
		return action(page);

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

// Transition 1: Click by source result balance and move from State 0 to State 1
	test('(1) Click on source result balance', () => page.clickSrcResultBalance(), page);

// Transition 47: Change to another one and stay on State 1
	test('(47) Change account', () => page.changeAccountByPos(1), page);

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

// Transition 2: Click by source amount and move from State 1 to State 0
	test('(2) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 3: Click by destination result balance and move from State 0 to State 2
	test('(3) Click on destination result balance', () => page.clickDestResultBalance(), page);

// Transition 42: Change to another one and stay on State 2
	test('(42) Change account', () => page.changeAccountByPos(2), page);

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

// Transition 4: Click by source result balance and move from State 2 to State 1
	test('(4) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 5: Click by destination result balance and move from State 1 to State 2
	test('(5) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 6: Click by source amount and move from State 2 to State 0
	test('(6) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 7: Change debt type to "take" and move from State 0 to State 3
	test('(7) Change debt type', () => page.toggleDebtType(), page);
// Transition 8: Change debt type back to "give" and move from State 3 to State 0
	test('(8) Change debt type', () => page.toggleDebtType(), page);

// Transition 7: Change debt type to "take" and move from State 0 to State 3
	test('(7) Change debt type', () => page.toggleDebtType(), page);

// Transition 49: Change to another one and stay on State 3
	test('(49) Change account', () => page.changeAccountByPos(3), page);

// Transition 9: Click by destination result balance and move from State 3 to State 4
	test('(9) Click on destination result balance', () => page.clickDestResultBalance(), page);

// Transition 51: Change to another one and stay on State 4
	test('(51) Change account', () => page.changeAccountByPos(4), page);

// Transition 10: Click by source amount and move from State 4 to State 3
	test('(10) Click on source amount', () => page.clickSrcAmount(), page);

// Transition 9: Click by destination result balance and move from State 3 to State 4
	test('(9) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 11: Click by source result balance and move from State 4 to State 5
	test('(11) Click on source result balance', () => page.clickSrcResultBalance(), page);

// Transition 48: Change to another one and stay on State 5
	test('(48) Change account', () => page.changeAccountByPos(0), page);

// Transition 12: Click by source amount and move from State 5 to State 3
	test('(12) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 13: Click by source result balance and move from State 3 to State 5
	test('(13) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 14: Click by destination result balance and move from State 5 to State 4
	test('(14) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 15: Change debt type to "give" and move from State 4 to State 1
	test('(15) Change debt type', () => page.toggleDebtType(), page);
// Transition 16: Change debt type to "take" and move from State 1 to State 4
	test('(16) Change debt type', () => page.toggleDebtType(), page);

// Transition 11: Click by source result balance and move from State 4 to State 5
	test('(11) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 17: Change debt type to "give" and move from State 5 to State 2
	test('(17) Change debt type', () => page.toggleDebtType(), page);
// Transition 18: Change debt type to "take" and move from State 2 to State 5
	test('(18) Change debt type', () => page.toggleDebtType(), page);

// Transition 12: Click by source amount and move from State 5 to State 3
	test('(12) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 8: Change debt type back to "give" and move from State 3 to State 0
	test('(8) Change debt type', () => page.toggleDebtType(), page);
// Transition 19: Change person to another one and stay on State 0
	test('(19) Change person', () => page.changePersonByPos(1), page);

// Transition 1: Click by source result balance and move from State 0 to State 1
	test('(1) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 20: Change person to another one and stay on State 1
	test('(20) Change person', () => page.changePersonByPos(0), page);

// Transition 5: Click by destination result balance and move from State 1 to State 2
	test('(5) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 21: Change person to another one and stay on State 2
	test('(21) Change person', () => page.changePersonByPos(1), page);

// Transition 18: Change debt type to "take" and move from State 2 to State 5
	test('(18) Change debt type', () => page.toggleDebtType(), page);
// Transition 22: Change person to another one and stay on State 5
	test('(22) Change person', () => page.changePersonByPos(0), page);

// Transition 14: Click by destination result balance and move from State 5 to State 4
	test('(14) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 23: Change person to another one and stay on State 4
	test('(23) Change person', () => page.changePersonByPos(1), page);

// Transition 10: Click by source amount and move from State 4 to State 3
	test('(10) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 24: Change person to another one and stay on State 3
	test('(24) Change person', () => page.changePersonByPos(0), page);

// Transition 8: Change debt type back to "give" and move from State 3 to State 0
	test('(8) Change debt type', () => page.toggleDebtType(), page);
// Transition 25: Disable account and move from State 0 to State 6
	test('(25) Disable account', () => page.toggleAccount(), page);

// Transition 43: Change person to another one and stay on State 6
	test('(43) Change person', () => page.changePersonByPos(1), page);

// Transition 26: Enable account and move from State 6 to State 0
	test('(26) Enable account', () => page.toggleAccount(), page);

// Transition 25: Disable account and move from State 0 to State 6
	test('(25) Disable account', () => page.toggleAccount(), page);
// Transition 27: Change debt type to "take" and move from State 6 to State 7
	test('(27) Change debt type', () => page.toggleDebtType(), page);

// Transition 44: Change person to another one and stay on State 7
	test('(44) Change person', () => page.changePersonByPos(0), page);

// Transition 28: Change debt type to "give" and move from State 7 to State 6
	test('(28) Change debt type', () => page.toggleDebtType(), page);

// Transition 27: Change debt type to "take" and move from State 6 to State 7
	test('(27) Change debt type', () => page.toggleDebtType(), page);
// Transition 29: Enable account and move from State 7 to State 3
	test('(29) Enable account', () => page.toggleAccount(), page);

// Transition 8: Change debt type back to "give" and move from State 3 to State 0
	test('(8) Change debt type', () => page.toggleDebtType(), page);
// Transition 25: Disable account and move from State 0 to State 6
	test('(25) Disable account', () => page.toggleAccount(), page);

// Transition 27: Change debt type to "take" and move from State 6 to State 7
	test('(27) Change debt type', () => page.toggleDebtType(), page);
// Transition 30: Click by destination result balance and move from State 7 to State 8
	test('(30) Click on destination result balance', () => page.clickDestResultBalance(), page);

// Transition 45: Change person to another one and stay on State 8
	test('(45) Change person', () => page.changePersonByPos(1), page);

// Transition 31: Click by source amount and move from State 8 to State 7
	test('(31) Click on source amount', () => page.clickSrcAmount(), page);

// Transition 30: Click by destination result balance and move from State 7 to State 8
	test('(30) Click on destination result balance', () => page.clickDestResultBalance(), page);

// Transition 32: Enable account and move from State 8 to State 4
	test('(32) Enable account', () => page.toggleAccount(), page);

// Transition 39: Disable account and move from State 4 to State 8
	test('(39) Disable account', () => page.toggleAccount(), page);
// Transition 33: Change debt type to "give" and move from State 8 to State 9
	test('(33) Change debt type', () => page.toggleDebtType(), page);

// Transition 46: Change person to another one and stay on State 9
	test('(46) Change person', () => page.changePersonByPos(0), page);

// Transition 34: Change debt type to "take" and move from State 9 to State 8
	test('(34) Change debt type', () => page.toggleDebtType(), page);

// Transition 44: Change person to another one and stay on State 8
	test('(44) Change person', () => page.changePersonByPos(1), page);

// Transition 33: Change debt type to "give" and move from State 8 to State 9
	test('(33) Change debt type', () => page.toggleDebtType(), page);
// Transition 35: Click by source amount and move from State 9 to State 6
	test('(35) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 36: Click by source result balance and move from State 6 to State 9
	test('(36) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 37: Enable account and move from State 9 to State 1
	test('(37) Enable account', () => page.toggleAccount(), page);
// Transition 38: Disable account and move from State 1 to State 9
	test('(38) Disable account', () => page.toggleAccount(), page);

// Transition 35: Click by source amount and move from State 9 to State 6
	test('(35) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 26: Enable account and move from State 6 to State 0
	test('(26) Enable account', () => page.toggleAccount(), page);
// Transition 7: Change debt type to "take" and move from State 0 to State 3
	test('(7) Change debt type', () => page.toggleDebtType(), page);
// Transition 40: Disable account and move from State 3 to State 7
	test('(40) Disable account', () => page.toggleAccount(), page);


// Transition 28: Change debt type to "give" and move from State 7 to State 6
	test('(28) Change debt type', () => page.toggleDebtType(), page);
// Transition 26: Enable account and move from State 6 to State 0
	test('(26) Enable account', () => page.toggleAccount(), page);
// Transition 3: Click by destination result balance and move from State 0 to State 2
	test('(3) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 41: Disable account and move from State 2 to State 6
	test('(41) Disable account', () => page.toggleAccount(), page);

// Transition 26: Enable account and move from State 6 to State 0
	test('(26) Enable account', () => page.toggleAccount(), page);

// Transition 52: Change to another one and stay on State 0
	test('(52) Change account', () => page.changeAccountByPos(2), page);

// Transition 3: Click by destination result balance and move from State 0 to State 2
	test('(3) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 18: Change debt type to "take" and move from State 2 to State 5
	test('(18) Change debt type', () => page.toggleDebtType(), page);
// Transition 50: Disable account and move from State 5 to State 7
	test('(50) Disable account', () => page.toggleAccount(), page);

	return Promise.resolve(page);
}
