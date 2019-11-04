if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../../common.js');
	var test = common.test;
	var formatDate = common.formatDate;

	const _ = require('../../../../../../view/js/common.js');
	var isObject = _.isObject;
	var setParam = _.setParam;

	const a = require('../../../../../../view/js/app.js');
	var normalize = a.normalize;
	var normalizeExch = a.normalizeExch;
	var TRANSFER = a.TRANSFER;

	var c = require('../../../../../../view/js/currency.js');
	var formatCurrency = c.formatCurrency;

	var App = null;
}


function onAppUpdateTransfer(props)
{
	props = props || {};

	if ('App' in props)
		App = props.App;
}


async function submitTransferTransaction(page, params)
{
	if ('srcAcc' in params)
	{
		let acc = await page.getAccountByPos(params.srcAcc);
		if (!acc)
			throw new Error('Account (' + params.srcAcc + ') not found');

		await test('Change source account to (' + acc.name + ')',
				() => page.changeSrcAccountByPos(params.srcAcc), page);
	}

	if ('destAcc' in params)
	{
		let acc = await page.getAccountByPos(params.destAcc);
		if (!acc)
			throw new Error('Account (' + params.destAcc + ') not found');

		await test('Change destination account to (' + acc.name + ')',
				() => page.changeDestAccountByPos(params.destAcc), page);
	}

	if (!('srcAmount' in params))
		throw new Error('Source amount value not specified');

	await test('Source amount (' + params.srcAmount + ') input', () => page.inputSrcAmount(params.srcAmount), page);

	if ('destAmount' in params)
		await test('Destination amount (' + params.destAmount + ') input', () => page.inputDestAmount(params.destAmount), page);

	if ('date' in params)
		await test('Date (' + params.date + ') input', () => page.inputDate(params.date), page);

	if ('comment' in params)
		await test('Comment (' + params.comment + ') input', () => page.inputComment(params.comment), page);

	App.beforeSubmitTransaction = { srcAcc : page.model.srcAccount,
									srcAccPos : await page.getAccountPos(page.model.srcAccount.id),
									destAcc : page.model.destAccount,
									destAccPos : await page.getAccountPos(page.model.destAccount.id),
								 	srcAmount : page.model.fSrcAmount,
								 	destAmount : page.model.fDestAmount };
	App.notify();

	return page.submit();
}


function createTransfer(page, onState, params)
{
	return App.goToMainPage(page)
			.then(page => page.goToNewTransactionByAccount(0))
			.then(page => page.changeTransactionType(TRANSFER))
			.then(page => transferTransactionLoop(page, onState, page => submitTransferTransaction(page, params)))
			.then(async page =>
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

				await test('Transfer transaction submit', async () => {}, page, state);

				App.transactions = page.content.widgets[2].transList;
				App.accounts = page.content.widgets[0].tiles;
				App.persons = page.content.widgets[3].infoTiles;
				App.notify();

				return page;
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

	page.setBlock('Update transfer transaction ' + pos, 3);

	return App.goToMainPage(page)
			.then(page => page.goToTransactions())
			.then(page => page.filterByType(TRANSFER))
			.then(async page =>
			{
				App.beforeUpdateTransaction = { trCount : page.content.transactions.length };

				let trObj = await page.getTransactionObject(page.content.transactions[pos].id);
				if (!trObj)
					throw new Error('Transaction not found');

				App.beforeUpdateTransaction.trObj = trObj;
				App.notify();

				return page.goToUpdateTransaction(pos);
			})
			.then(async page =>
			{
				let isDiff = (App.beforeUpdateTransaction.trObj.src_curr != App.beforeUpdateTransaction.trObj.dest_curr);

				await test('Initial state of update transfer page', async () => page.setExpectedState(isDiff ? 3 : 0), page);

				setParam(App.beforeUpdateTransaction,
							{ id : page.model.id,
								srcAcc : page.model.srcAccount,
								srcAccPos : await page.getAccountPos(page.model.srcAccount.id),
								srcBalance : page.model.fSrcResBal,
								destAcc : page.model.destAccount,
								destAccPos : await page.getAccountPos(page.model.destAccount.id),
								destBalance : page.model.fDestResBal,
								srcAmount : page.model.fSrcAmount,
								destAmount : page.model.fDestAmount,
								date : page.model.date,
								comment : page.model.comment});

				return submitTransferTransaction(page, params);
			})
			.then(page => page.filterByType(TRANSFER))
			.then(async page =>
			{
				let trans_id = App.beforeUpdateTransaction.id;
			 	let updSrcAcc = App.beforeSubmitTransaction.srcAcc;
			 	let updDestAcc = App.beforeSubmitTransaction.destAcc;
				let updSrcAmount = App.beforeSubmitTransaction.srcAmount;
				let updDestAmount = App.beforeSubmitTransaction.destAmount;
				let transCount = App.beforeUpdateTransaction.trCount;
				let origDate = App.beforeUpdateTransaction.date;
				let origComment = App.beforeUpdateTransaction.comment;

				// Transactions list changes
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

				await test('Transaction update', async () => {}, page, state);

				return App.goToMainPage(page);
			})
			.then(async page =>
			{
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

				await test('Account balance update', async () => {}, page, state);

				return page;
			});
}


async function transferTransactionLoop(page, actionState, action)
{
	page.setBlock('Transfer', 2);
	await test('Initial state of new transfer page', async () => page.setExpectedState(0), page);

	actionState = parseInt(actionState);
	var actionRequested = !isNaN(actionState);
	if (actionState === 0)
		return action(page);

	if (!actionRequested)
	{
		// Input source amount
		await test('Source amount (1) input', () => page.inputSrcAmount('1'), page);
		await test('Source amount (1.) input', () => page.inputSrcAmount('1.'), page);
		await test('Source amount (1.0) input', () => page.inputSrcAmount('1.0'), page);
		await test('Source amount (1.01) input', () => page.inputSrcAmount('1.01'), page);
		await test('Source amount (1.010) input', () => page.inputSrcAmount('1.010'), page);
		await test('Source amount (1.0101) input', () => page.inputSrcAmount('1.0101'), page);
		await test('Emptry source amount input', () => page.inputSrcAmount(''), page);
		await test('Source amount (.) input', () => page.inputSrcAmount('.'), page);
		await test('Source amount (.0) input', () => page.inputSrcAmount('.0'), page);
		await test('Source amount (.09) input', () => page.inputSrcAmount('.09'), page);
	}

// Transition 7: Change destination account to another one with same currency as source (EUR)
	await test('(7) Change destination account', () => page.changeDestAccountByPos(0), page);
// Transition 5: Change source account to another one with same currency as destination (USD)
	await test('(5) Change source account', () => page.changeSrcAccountByPos(0), page);
// Transition 1: Click by source balance and move from State 0 to State 1
	await test('(1) Click on source result balance', () => page.clickSrcResultBalance(), page);

	if (actionState === 1)
		return action(page);

	if (!actionRequested)
	{
		// Input source result balance
		await test('Source result balance (400) input', () => page.inputResBalance('400'), page);
		await test('Source result balance (400.) input', () => page.inputResBalance('400.'), page);
		await test('Source result balance (400.9) input', () => page.inputResBalance('400.9'), page);
		await test('Source result balance (400.99) input', () => page.inputResBalance('400.99'), page);
		await test('Source result balance (400.990) input', () => page.inputResBalance('400.990'), page);
		await test('Source result balance (400.9901) input', () => page.inputResBalance('400.9901'), page);
		await test('Empty result balance input', () => page.inputResBalance(''), page);
		await test('Source result balance (.) input', () => page.inputResBalance('.'), page);
		await test('Source result balance (.0) input', () => page.inputResBalance('.0'), page);
		await test('Source result balance (.01) input', () => page.inputResBalance('.01'), page);
	}

	// Transition 11: Change source account to another one with same currency as destination and stay on State 1
	await test('(11) Change source account', () => page.changeSrcAccountByPos(4), page);
	// Transition 13: Change destination account to another one with same currency as source and stay on State 1
	await test('(13) Change destination account', () => page.changeDestAccountByPos(4), page);
	// Transition 9: Click by destination balance and move from State 1 to State 2
	await test('(9) Click on destination result balance', () => page.clickDestResultBalance(), page);

	if (actionState === 2)
		return action(page);

	if (!actionRequested)
	{
		// Input destination result balance
		await test('Destination result balance (600) input', () => page.inputDestResBalance('600'), page);
		await test('Destination result balance (600.) input', () => page.inputDestResBalance('600.'), page);
		await test('Destination result balance (600.9) input', () => page.inputDestResBalance('600.9'), page);
		await test('Destination result balance (600.90) input', () => page.inputDestResBalance('600.90'), page);
		await test('Destination result balance (600.901) input', () => page.inputDestResBalance('600.901'), page);
		await test('Destination result balance (600.9010) input', () => page.inputDestResBalance('600.9010'), page);
		await test('Destination result balance (600.90101) input', () => page.inputDestResBalance('600.90101'), page);
		await test('Empty destination result balance input', () => page.inputDestResBalance(''), page);
		await test('Destination result balance (.) input', () => page.inputDestResBalance('.'), page);
		await test('Destination result balance (.0) input', () => page.inputDestResBalance('.0'), page);
	}

// Transition 15: Change source account to another one with same currency and stay on State 2
	await test('(15) Change source account', () => page.changeSrcAccountByPos(4), page);
// Transition 17: Change destination account to another one with same currency and stay on State 2
	await test('(17) Change destination account', () => page.changeDestAccount(4), page);
// Transition 16: Change source account to another one with different currency (USD) and move from State 2 to State 5

	if (actionState === 5)
		return action(page);

	await test('(16) Change source account', () => page.changeSrcAccountByPos(2), page);
// Transition 26: Change source account to another one with different currency (EUR) and stay on State 5
	await test('(26) Change source account', () => page.changeSrcAccountByPos(3), page);
// Transition 28: Change destination account to another one with different currency and stay on State 5
	await test('(28) Change destination account', () => page.changeDestAccountByPos(0), page);
// Transition 27: Change source account to another one with same currency as destination (RUB) and move from State 5 to State 2
	await test('(27) Change source account', () => page.changeSrcAccountByPos(1), page);
// Transition 18: Change destination account to another one with different currency than source (USD) and move from State 2 to State 5
	await test('(18) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 29: Change destination account to another one with same currency as source and move from State 5 to State 2
	await test('(29) Change destination account', () => page.changeDestAccountByPos(0), page);
// Transition 10: Click by source balance and move from State 1 to State 2
	await test('(10) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 2: Click by source amount and move from State 1 to State 0
	await test('(2) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 6: Change source account to another one with different currency than destination (USD) and move from State 0 to State 3

	if (actionState === 3)
		return action(page);

	await test('(6) Change source account', () => page.changeSrcAccountByPos(2), page);
// Transition 43: Change source account to another one with different currency than destination (RUB) and stay on State 3
	await test('(43) Change source account', () => page.changeSrcAccountByPos(1), page);
// Transition 41: Change destination account to another one with same currency as source (EUR) and stay on State 3
	await test('(41) Change destination account', () => page.changeDestAccountByPos(3), page);
// Transition 44: Change source account to another one with same currency as destination (EUR > RUB) and move from State 3 to State 0
	await test('(44) Change source account', async () => {
		await page.changeSrcAccountByPos(3);
		return page.changeSrcAccountByPos(0);
	}, page);

// Transition 8: Change destination account to another one with different currency than source (USD) and move from State 0 to State 3
	await test('(8) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 42: Change destination account to another one with same currency as source (RUB) and move from State 3 to State 0
	await test('(42) Change destination account', () => page.changeDestAccountByPos(1), page);
// Transition 1: Click by source balance and move from State 0 to State 1
	await test('(1) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 12: Change source account to another one with different currency than destination (EUR) and move from State 1 to State 4
	await test('(12) Change source account', () => page.changeSrcAccountByPos(3), page);
// Transition 36: Change source account to another one with different currency than destination (USD) and stay on State 4
	await test('(36) Change source account', () => page.changeSrcAccountByPos(1), page);
// Transition 38: Change destination account to another one with different currency than source (RUB) and stay on State 4
	await test('(38) Change destination account', () => page.changeDestAccountByPos(3), page);
// Transition 39: Change destination account to another one with same currency as source (RUB) and move from State 4 to State 1
	await test('(39) Change destination account', () => page.changeDestAccountByPos(3), page);
// Transition 14: Change destination account to another one with different currency than source (USD) and move from State 1 to State 4
	await test('(14) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 32: Click by destination result balance and move from State 4 to State 6
	await test('(32) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 49: Change source account to another one with different currency than destination (EUR) and stay on State 6
	await test('(49) Change source account', () => page.changeSrcAccountByPos(3), page);
// Transition 47: Change destination account to another one with different currency than source (RUB) and stay on State 6
	await test('(47) Change destination account', () => page.changeDestAccountByPos(0), page);
// Transition 20: Click by source amount and move from State 6 to State 5
	await test('(20) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 19: Click by source result balance and move from State 5 to State 6
	await test('(19) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 45: Click by exchange rate and move from State 6 to State 8
	await test('(45) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 51: Change source account to another one with different currency than destination (USD) and stay on State 6
	await test('(51) Change source account', () => page.changeSrcAccountByPos(2), page);
// Transition 53: Change destination account to another one with different currency than source (EUR) and stay on State 6
	await test('(53) Change destination account', () => page.changeDestAccountByPos(3), page);
// Transition 23: Click by source amount and move from State 8 to State 7
	await test('(23) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 57: Change source account to another one with different currency than destination (RUB) and stay on State 7
	await test('(57) Change source account', () => page.changeSrcAccountByPos(0), page);
// Transition 59: Change destination account to another one with different currency than source (USD) and stay on State 7
	await test('(59) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 22: Click by source result balance and move from State 7 to State 8
	await test('(22) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 46: Click by destination result balance and move from State 8 to State 6
	await test('(46) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 33: Click by destination amount and move from State 6 to State 4
	await test('(33) Click on destination amount', () => page.clickDestAmount(), page);
// Transition 37: Change source account to another one with same currency as destination (RUB) and from State 4 to State 1
	await test('(37) Change source account', async () => {
		await page.changeSrcAccountByPos(3);		// change source to EUR first
		await page.changeDestAccountByPos(4)		// change destination to RUB
		return page.changeSrcAccountByPos(0);		// change source to RUB
	}, page);

// Transition 2: Click by source amount and move from State 1 to State 0
	await test('(2) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 3: Click by destination result balance and move from State 0 to State 2
	await test('(3) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 4: Click by source amount and move from State 2 to State 0
	await test('(4) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 3: Click by destination result balance and move from State 0 to State 2
	await test('(3) Click on destination result balance', () => page.clickDestResultBalance(), page);

// Transition 18: Change destination account to another one with different currency than source (USD) and move from State 2 to State 5
	await test('(18) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 21: Click by exchange rate and move from State 5 to State 7
	await test('(21) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 55: Click by destination amount and move from State 7 to State 3
	await test('(55) Click on destination amount', () => page.clickDestAmount(), page);
// Transition 25: Click by destination result balance and move from State 3 to State 5
	await test('(25) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 21: Click by exchange rate and move from State 5 to State 7
	await test('(21) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 56: Click by destination result balance and move from State 7 to State 5
	await test('(56) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 24: Click by destination amount and move from State 5 to State 3
	await test('(24) Click on destination amount', () => page.clickDestAmount(), page);
// Transition 40: Click by exchange rate and move from State 3 to State 7
	await test('(40) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 60: Change destination account to another one with same currency as source (RUB) and move from State 7 to State 0
	await test('(60) Change destination account', () => page.changeDestAccountByPos(1), page);
// Transition 3: Click by destination result balance and move from State 0 to State 2
	await test('(3) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 16: Change source account to another one with different currency (USD) and move from State 2 to State 5
	await test('(16) Change source account', () => page.changeSrcAccountByPos(2), page);
// Transition 21: Click by exchange rate and move from State 5 to State 7
	await test('(21) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 58: Change source account to another one with same currency as destination (RUB) and from State 7 to State 0
	await test('(58) Change source account', () => page.changeSrcAccountByPos(0), page);
// Transition 1: Click by source result balance and move from State 7 to State 8
	await test('(1) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 12: Change source account to another one with different currency than destination (EUR) and move from State 1 to State 4
	await test('(12) Change source account', () => page.changeSrcAccountByPos(3), page);
// Transition 30: Click by source amount and move from State 4 to State 3
	await test('(30) Click on source amount', () => page.clickSrcAmount(), page);
// Transition 31: Click by source result balance and move from State 3 to State 4
	await test('(31) Click on source result balance', () => page.clickSrcResultBalance(), page);
// Transition 34: Click by exchange rate and move from State 4 to State 8
	await test('(34) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 35: Click by destination amount and move from State 8 to State 4
	await test('(35) Click on destination amount', () => page.clickDestAmount(), page);
// Transition 34: Click by exchange rate and move from State 4 to State 8
	await test('(34) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 52: Change source account to another one with same currency as destination (RUB) and from State 8 to State 1
	await test('(52) Change source account', () => page.changeSrcAccountByPos(0), page);
// Transition 14: Change destination account to another one with different currency than source (USD) and move from State 1 to State 4
	await test('(14) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 34: Click by exchange rate and move from State 4 to State 8
	await test('(34) Click on exchange rate', () => page.clickExchRate(), page);
// Transition 54: Change destination account to another one with same currency as source (RUB) and move from State 8 to State 1
	await test('(54) Change destination account', () => page.changeDestAccountByPos(1), page);
// Transition 12: Change source account to another one with different currency than source (USD) and move from State 1 to State 4
	await test('(12) Change source account', () => page.changeSrcAccountByPos(2), page);
// Transition 32: Click by destination result balance and move from State 4 to State 6
	await test('(32) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 50: Change source account to another one with same currency as destination (RUB) and from State 6 to State 1
	await test('(50) Change source account', () => page.changeSrcAccountByPos(0), page);
// Transition 14: Change destination account to another one with different currency than source (USD) and move from State 1 to State 4
	await test('(14) Change destination account', () => page.changeDestAccountByPos(2), page);
// Transition 32: Click by destination result balance and move from State 4 to State 6
	await test('(32) Click on destination result balance', () => page.clickDestResultBalance(), page);
// Transition 48: Change destination account to another one with same currency as source (RUB) and move from State 1 to State 2
	await test('(48) Change destination account', () => page.changeDestAccountByPos(1), page);

	return page;
}


var runTransfer = { onAppUpdate : onAppUpdateTransfer,
					createTransfer : createTransfer,
					updateTransfer : updateTransfer,
					transferTransactionLoop : transferTransactionLoop };


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runTransfer;
}
