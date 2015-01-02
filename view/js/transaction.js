var dwPopup = null;		// delete warning popup
var submitStarted = false;


// Correct calculated value
function correct(val, prec)
{
	prec = prec || 2;

	return parseFloat(parseFloat(val).toFixed(prec));
}


// Correct calculated exchange rate value
function correctExch(val)
{
	return correct(val, 5);
}


// Localy cancel actions of current transaction
function calcelTransaction()
{
	var srcAcc, destAcc;

	if (!edit_mode || canceled || !edit_transaction)
		return;

	srcAcc = getAccount(edit_transaction.srcAcc);
	destAcc = getAccount(edit_transaction.destAcc);

	if (edit_transaction.type == 1)		// Expense
	{
		if (!srcAcc)
			throw new Error('Invalid transaction: Account not found');
		if (srcAcc[1] != edit_transaction.srcCurr)
			throw new Error('Invalid transaction');

		srcAcc[3] += edit_transaction.srcAmount;
	}
	else if (edit_transaction.type == 2)		// Income
	{
		if (!destAcc || destAcc[1] != edit_transaction.destCurr)
			throw new Error('Invalid transaction');

		destAcc[3] -= edit_transaction.destAmount;
	}
	else if (edit_transaction.type == 3)		// Transfer
	{
		if (!srcAcc || !destAcc || srcAcc[1] != edit_transaction.srcCurr || destAcc[1] != edit_transaction.destCurr)
			throw new Error('Invalid transaction');

		srcAcc[3] += edit_transaction.srcAmount;
		destAcc[3] -= edit_transaction.destAmount;
	}
	else if (edit_transaction.type == 4)		// Debt
	{
		if (debtType)		// person give
		{
			if (srcAcc)
				throw new Error('Invalid transaction');

			srcAcc = getPersonAccount(edit_transaction.srcAcc);
			if (!srcAcc)
				throw new Error('Invalid transaction');

			srcAcc[2] += edit_transaction.srcAmount;
			if (destAcc)
				destAcc[3] -= edit_transaction.destAmount;
		}
		else				// person take
		{
			if (destAcc)		// we should not find acount
				throw new Error('Invalid transaction');

			destAcc = getPersonAccount(edit_transaction.destAcc);
			if (!destAcc)
				throw new Error('Invalid transaction');

			if (srcAcc)
				srcAcc[3] += edit_transaction.srcAmount;
			destAcc[2] -= edit_transaction.destAmount;
		}
	}


	canceled = true;
}


// Set currency sign for specified field
function setSign(obj, curr_id)
{
	var signobj = ge(obj);
	if (signobj)
		signobj.innerHTML = getCurrencySign(curr_id);
}


// Spend/Income transaction event handler
function onSubmit(frm)
{
	var srcid, destid, src_amount, dest_amount, trdate;
	var submitbtn;

	if (submitStarted)
		return false;

	srcid = ge('src_id');
	destid = ge('dest_id');
	src_amount = ge('src_amount');
	dest_amount = ge('dest_amount');
	trdate = ge('date');
	submitbtn = ge('submitbtn');
	if (!frm || (!srcid && !destid) || !src_amount || !dest_amount || !trdate || !submitbtn)
		return false;

	if (isExpense())
	{
		if (!dest_amount.value || !dest_amount.value.length || !isNum(fixFloat(dest_amount.value)))
		{
			alert('Please input correct amount.');
			return false;
		}
	}
	else if (isIncome())
	{
		if (!src_amount.value || !src_amount.value.length || !isNum(fixFloat(src_amount.value)))
		{
			alert('Please input correct amount.');
			return false;
		}
	}

	src_amount.value = fixFloat(src_amount.value);
	dest_amount.value = fixFloat(dest_amount.value);

	if (!checkDate(trdate.value))
	{
		alert('Please input correct date.');
		return false;
	}

	submitStarted = true;
	enable(submitbtn, false);

	return true;
}


// Delete transaction icon link click event handler
function onDelete()
{
	showDeletePopup();
}


var singleTransDeleteTitle = 'Delete transaction';
var singleTransDeleteMsg = 'Are you sure want to delete selected transaction?<br>Changes in the balance of affected accounts will be canceled.';


// Delete popup callback
function onDeletePopup(res)
{
	var delform;

	if (!dwPopup)
		return;

	dwPopup.close();
	dwPopup = null;

	if (res)
	{
		delform = ge('delform');
		if (delform)
			delform.submit();
	}
}


// Create and show transaction delete warning popup
function showDeletePopup()
{
	// check popup already created
	if (dwPopup)
		return;

	dwPopup = new Popup();
	if (!dwPopup)
		return;

	if (!dwPopup.create({ id : 'delete_warning',
						title : singleTransDeleteTitle,
						msg : singleTransDeleteMsg,
						btn : { okBtn : { onclick : onDeletePopup.bind(null, true) },
						cancelBtn : { onclick : onDeletePopup.bind(null, false) } }
						}))
	{
		dwPopup = null;
		return;
	}

	dwPopup.show();
}



// Update exchange rate and result balance values
function updateExchAndRes()
{
	getValues();
	if (isValidValue(da) && isValidValue(sa))
	{
		f5();
		f1();
		f1_d();
	}
	setValues();
}


// Change account event handler
function onChangeAcc()
{
/*
	var srcid, destid, accid, src_amount, src_curr, dest_curr, exchange, exchrate, exchrate_b, dest_amount;
	var resbal, resbal_d, resbal_b, resbal_d_b;
	var sync = false, target_id, new_acc_id;

	srcid = ge('src_id');
	destid = ge('dest_id');
	accid = ge('acc_id');
	src_amount = ge('src_amount');
	src_curr = ge('src_curr');
	dest_curr = ge('dest_curr');
	exchange = ge('exchange');
	exchrate = ge('exchrate');
	exchrate_b = ge('exchrate_b');
	dest_amount = ge('dest_amount');
	resbal = ge('resbal');
	resbal_d = ge('resbal_d');
	resbal_b = ge('resbal_b');
	resbal_d_b = ge('resbal_d_b');
	if ((!srcid && !destid && !accid) || !src_amount || !src_curr || !dest_curr || !exchange || !exchrate || !exchrate_b || !dest_amount || (!resbal && !resbal_d) || (!resbal_b && !resbal_d_b))
		return false;

	if (srcCurr == destCurr)				// source currency is the same as destination currency
		sync = true;

	target_id = isIncome() ? destid : (isDebt() ? accid : srcid);
	if (!(isDebt() && noAccount))
	{
		new_acc_id = parseInt(target_id.value);
		if (isExpense() || (isDebt() && debtType))
			srcCurr = getCurrencyOfAccount(new_acc_id);
		if (isIncome() || (isDebt() && !debtType))
			destCurr = getCurrencyOfAccount(new_acc_id);
	}
	if (sync)
	{
		if (isExpense() || (isDebt() && debtType))
			dest_curr.value = srcCurr;
		if (isIncome() || (isDebt() && !debtType))
			src_curr.value = destCurr;		// update currency of transaction
	}

	if (isExpense() || (isDebt() && debtType))
		src_curr.value = srcCurr;
	if (isIncome() || (isDebt() && !debtType))
		dest_curr.value = destCurr;		// update currency of transaction

	if (isExpense())
		destCurr = parseInt(dest_curr.value);
	else if (isDebt() && debtType)
		destCurr = srcCurr;
	else if (isIncome())
		srcCurr = parseInt(src_curr.value);
	else if (isDebt() && !debtType)
		srcCurr = destCurr;

	// hide destination amount and exchange rate if new currencies is the same
	if (srcCurr == destCurr)
	{
		if (isExpense())
			hideSrcAmountAndExchange();
		if (isIncome())
			hideDestAmountAndExchange();

		exchrate.value = 1;
		firstElementChild(exchrate_b).innerHTML = '1';
		if (isExpense())
			src_amount.value = dest_amount.value;
		if (isIncome())
			dest_amount.value = src_amount.value;

		if (isDebt() && noAccount)
		{
		}
		else
		{
			if (isDebt())
			{
				if (debtType)
					resbal.value = getCurPersonBalance(srcCurr);
				else
					resbal_d.value = getCurPersonBalance(srcCurr);
			}

			if ((isDebt() && debtType) || isIncome())
				firstElementChild(resbal_d_b).innerHTML = formatCurrency(getBalanceOfAccount(new_acc_id) - dest_amount.value, getCurrencyOfAccount(new_acc_id));
			else if ((isDebt() && !debtType) || isExpense())
				firstElementChild(resbal_b).innerHTML = formatCurrency(getBalanceOfAccount(new_acc_id) - dest_amount.value, getCurrencyOfAccount(new_acc_id));
		}
	}
	else
	{
		destAmountSwitch(true);
		exchRateSwitch(false);
	}

	updateExchAndRes();
	setExchangeComment();

	setSign('destamountsign', destCurr);
	setSign('srcamountsign', srcCurr);

	if (isDebt())
	{
		var person_tile, person_id, personname, pbalance;

		person_tile = ge('person_tile');
		person_id = ge('person_id');
		if (!person_tile || !person_id)
			return;

		personname = getPersonName(person_id.value);

		pbalance = getCurPersonBalance(debtType ? srcCurr : destCurr);
		setTileInfo(person_tile, personname, formatCurrency(pbalance, debtType ? srcCurr : destCurr));
	}

	setTileAccount(isIncome() ? 'dest_tile' : (isDebt() ? 'acc_tile' : 'source_tile'), new_acc_id);
*/
	var acc, acc_id, tile_id;

	if (Transaction.isExpense())
	{
		acc = ge('src_id');
		tile_id = 'source_tile';
	}
	else if (Transaction.isIncome())
	{
		acc = ge('dest_id');
		tile_id = 'dest_tile';
	}
	else if (Transaction.isDebt())
	{
		acc = ge('acc_id');
		tile_id = 'acc_tile';
	}

	acc_id = parseInt(acc.value);

	if (Transaction.isExpense() || (Transaction.isDebt() && Transaction.debtType()))
	{
		Transaction.update('src_id', acc_id);
		onSrcCurrChanged();
	}
	else if (Transaction.isIncome() || (Transaction.isDebt() && !Transaction.debtType()))
	{
		Transaction.update('dest_id', acc_id);
		onDestCurrChanged();
	}

	if (Transaction.isDebt())
	{
		updatePersonTile();
	}

	setTileAccount(tile_id, acc_id);
}


// Transfer transaction submit event handler
function onTransferSubmit(frm)
{
	var src_amount, dest_amount, exchrate, trdate;
	var submitbtn;

	if (submitStarted)
		return false;

	src_amount = ge('src_amount');
	dest_amount = ge('dest_amount');
	exchrate = ge('exchrate');
	trdate = ge('date');
	submitbtn = ge('submitbtn');
	if (!frm || !src_amount || !dest_amount || !exchrate || !trdate || !submitbtn)
		return false;

	if (!src_amount.value || !src_amount.value.length || !isNum(fixFloat(src_amount.value)))
	{
		alert('Please input correct source amount.');
		return false;
	}

	if (isDiffCurr() && (!dest_amount.value || !dest_amount.value.length || !isNum(fixFloat(dest_amount.value))))
	{
		alert('Please input correct destination amount.');
		return false;
	}

	if (!checkDate(trdate.value))
	{
		alert('Please input correct date.');
		return false;
	}

	src_amount.value = fixFloat(src_amount.value);
	dest_amount.value = fixFloat(dest_amount.value);
	exchrate.value = fixFloat(exchrate.value);

	submitStarted = true;
	enable(submitbtn, false);

	return true;
}


// Source account change event handler
function onChangeSource()
{
	var src, dest, newAcc;

	src = ge('src_id');
	dest = ge('dest_id');

	if (!src || !dest)
		return;

	Transaction.update('src_id', src.value);
	onSrcCurrChanged();

	if (src.value == dest.value)
	{
		newAcc = getNextAccount(dest.value);
		if (newAcc != 0)
		{
			dest.value = newAcc;
			Transaction.update('dest_id', newAcc);
			onDestCurrChanged();
		}
	}

	if (Transaction.isDebt())
	{
		updatePersonTile();
	}
	else
	{
		setTileAccount('source_tile', Transaction.srcAcc());
		setTileAccount('dest_tile', Transaction.destAcc());
	}
}


// Destination account change event handler
function onChangeDest()
{
	var src, dest, newAcc;

	src = ge('src_id');
	dest = ge('dest_id');
	if (!src || !dest)
		return;

	Transaction.update('dest_id', dest.value);
	onDestCurrChanged();

	if (src.value == dest.value)
	{
		newAcc = getNextAccount(src.value);
		if (newAcc != 0)
		{
			src.value = newAcc;
			Transaction.update('src_id', newAcc);
			onSrcCurrChanged();
		}
	}

	if (Transaction.isDebt())
	{
		updatePersonTile();
	}
	else
	{
		setTileAccount('source_tile', Transaction.srcAcc());
		setTileAccount('dest_tile', Transaction.destAcc());
	}
}


// Normalize monetary value from string
function normalize(val, prec)
{
	prec = prec || 2;

	return parseFloat(parseFloat(fixFloat(val)).toFixed(prec));
}


// Normalize exchange rate value from string
function normalizeExch(val)
{
	return normalize(val, 5);
}


// Check value is valid
function isValidValue(val)
{
	return (val != undefined && val != null && val !== '');
}


// Field input event handler
function onFInput(obj)
{
	if (obj.id == 'src_amount')
		Transaction.update('src_amount', obj.value);
	else if (obj.id == 'dest_amount')
		Transaction.update('dest_amount', obj.value);
	else if (obj.id == 'exchrate')
		Transaction.update('exchrate', obj.value);
	else if (obj.id == 'resbal')
		Transaction.update('src_resbal', obj.value);
	else if (obj.id == 'resbal_d')
		Transaction.update('dest_resbal', obj.value);

	return true;
}


// Transaction model value changed notification callback
function onValueChanged(item, value)
{
	if (item == 'src_amount')
		setSrcAmount(value);
	else if (item == 'dest_amount')
		setDestAmount(value);
	else if (item == 'exchrate')
		setExchRate(value);
	else if (item == 'src_resbal')
		setSrcResultBalance(value, 0);
	else if (item == 'dest_resbal')
		setDestResultBalance(value, 0);
}


// Source currency change event handler
function onChangeSrcCurr()
{
	var src_curr, srcCurr;

	src_curr = ge('src_curr');
	if (!src_curr)
		return;

	srcCurr = parseInt(src_curr.value);
	Transaction.update('src_curr', srcCurr);

	onSrcCurrChanged();
}


// Update layout on source curency changed
function onSrcCurrChanged()
{
	if (Transaction.isDiff())
	{
		destAmountSwitch(true);
		setAmountInputLabel(true, true);
		setAmountTileBlockLabel(true, true);
		setAmountInputLabel(false, true);
		setAmountTileBlockLabel(false, true);
		if (Transaction.isIncome())
		{
			setCurrActive(true, true);		// set source active
			setCurrActive(false, false);		// set destination inactive
		}
		exchRateSwitch(false);

		setExchRate(Transaction.exchRate());
	}
	else
	{
		setAmountInputLabel(true, false);
		setAmountTileBlockLabel(true, false);
		if (Transaction.isIncome())
			hideDestAmountAndExchange();
	}

	updateCurrSigns();
	updatePersonTile();
}


// Destination currency change event handler
function onChangeDestCurr()
{
	var dest_curr, destCurr;

	dest_curr = ge('dest_curr');
	if (!dest_curr)
		return;

	destCurr = parseInt(dest_curr.value);
	Transaction.update('dest_curr', destCurr);

	onDestCurrChanged();
}


// Update layout on destination curency changed
function onDestCurrChanged()
{
	if (Transaction.isDiff())
	{
		if (Transaction.isTransfer())
			destAmountSwitch(true);

		srcAmountSwitch(true);
		setAmountInputLabel(true, true);
		setAmountTileBlockLabel(true, true);
		setAmountInputLabel(false, true);
		setAmountTileBlockLabel(false, true);
		if (Transaction.isIncome())
			setCurrActive(true, true);		// set source active
		else
			setCurrActive(true, false);		// set source inactive

		if (Transaction.isExpense())
			setCurrActive(false, true);		// set destination active
		else
			setCurrActive(false, false);		// set destination inactive

		exchRateSwitch(false);

		setExchRate(Transaction.exchRate());
	}
	else
	{
		setAmountInputLabel(false, false);
		setAmountTileBlockLabel(false, false);
		if (Transaction.isExpense())
			hideSrcAmountAndExchange();
	}

	updateCurrSigns();
	updatePersonTile();
}


// Debt operation type change event handler
function onChangeDebtOp()
{
	var acclbl, debtgive, debttake;
	var src_res_balance_left, dest_res_balance_left, dest_amount_left, exch_left;

	acclbl = ge('acclbl');
	debtgive = ge('debtgive');
	debttake = ge('debttake');
	src_res_balance_left = re('src_res_balance_left');
	dest_res_balance_left = re('dest_res_balance_left');
	dest_amount_left = ge('dest_amount_left');
	exch_left = ge('exch_left');
	if (!acclbl || !debtgive || !debttake || !dest_res_balance_left || !src_res_balance_left)
		return;

	debtType = debtgive.checked;

	if (!noAccount)
	{
		acclbl.innerHTML = (debtType) ? 'Destination account' : 'Source account';
	}
	insertAfter(src_res_balance_left, (debtType) ? exch_left : dest_amount_left);
	insertAfter(dest_res_balance_left, (debtType) ? dest_amount_left : exch_left);

	updateExchAndRes();
}


// Return object for specified person
function getPersonObject(person_id)
{
	var pObj = null, p_id;

	p_id = parseInt(person_id);
	if (!persons || !p_id)
		return null;

	persons.some(function(person)
	{
		if (person[0] == p_id)
			pObj = person;
		return (person[0] == p_id);
	});

	return pObj;
}


// Return name of person
function getPersonName(p_id)
{
	var person;

	person = getPersonObject(p_id);
	if (!person || !isArray(person) || person.length < 3)
		return null;

	return person[1];
}


// Return array of balance
function getPersonBalance(p_id)
{
	var person, resArr = [];

	person = getPersonObject(p_id);
	if (!person || !isArray(person) || person.length < 3 || !isArray(person[2]))
		return null;

	person[2].forEach(function(acc)
	{
		resArr.push(formatCurrency(acc[2], acc[1]));
	});

	return resArr;
}


// Return balance of current person in specified currency
function getCurPersonBalance(curr_id)
{
	var personid, p_id, person, resBal = 0.0;

	personid = ge('person_id');
	if (!personid || !curr_id)
		return resBal;
	person = getPersonObject(personid.value);
	if (!person || !isArray(person) || person.length < 3 || !isArray(person[2]))
		return resBal;

	// check person have account in specified currency
	person[2].some(function(acc)
	{
		if (acc[1] == curr_id)
			resBal = acc[2];

		return (acc[1] == curr_id);
	});

	return resBal;
}


// Person select event handler
function onPersonSel(obj)
{
	updControls();
}


// Debt form submit event handler
function onDebtSubmit(frm)
{
	var accid, src_amount, dest_amount, trdate;
	var submitbtn;

	if (submitStarted)
		return false;

	submitbtn = ge('submitbtn');
	if (!frm || !submitbtn)
		return false;

	accid = ge('acc_id');
	src_amount = ge('src_amount');
	dest_amount = ge('dest_amount');
	trdate = ge('date');
	if (!frm || !accid || !src_amount || !dest_amount || !trdate)
		return false;

	if (noAccount)
		accid.value = 0;

	if (!src_amount.value || !src_amount.value.length || !isNum(fixFloat(src_amount.value)))
	{
		alert('Please input correct source amount.');
		return false;
	}

	if (!checkDate(trdate.value))
	{
		alert('Please input correct date.');
		return false;
	}

	if (!dest_amount.value || !dest_amount.value.length || !isNum(fixFloat(dest_amount.value)))
	{
		alert('Please input correct destination amount.');
		return false;
	}

	src_amount.value = fixFloat(src_amount.value);
	dest_amount.value = fixFloat(dest_amount.value);

	if (!checkDate(trdate.value))
	{
		alert('Please input correct date.');
		return false;
	}

	submitStarted = true;
	enable(submitbtn, false);

	return true;
}

