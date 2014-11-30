var S1;		// balance before transaction
var sa;		// source amount
var da;		// destination amount
var e;		// exchange rate
var S2;		// balance after transaction

var fS1, fsa, fda, fe, fS2;	// parsed float values
var s1valid, s2valid, davalid, evalid, savalid;

// transfer only
var S1_d;		// balance of destination account before transaction
var S2_d;		// balance of destintation account after transaction

var fS1_d, fS2_d;
var s1dvalid, s2dvalid;

// Main formula
// S2 = S1 - sa			source account
// da = sa * e
// S2_d = S1_d + da		destination account


var dwPopup = null;		// delete warning popup
var submitStarted = false;


// Check current transaction is expense
function isExpense()
{
	return (trans_type == 1);
}


// Check current transaction is income
function isIncome()
{
	return (trans_type == 2);
}


// Check current transaction is transfer
function isTransfer()
{
	return (trans_type == 3);
}


// Check current transaction is debt
function isDebt()
{
	return (trans_type == 4);
}


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

	if (!edit_mode || canceled || !transaction)
		return;

	srcAcc = getAccount(transaction.srcAcc);
	destAcc = getAccount(transaction.destAcc);

	if (transaction.type == 1)		// Expense
	{
		if (!srcAcc)
			throw new Error('Invalid transaction: Account not found');
		if (srcAcc[1] != transaction.srcCurr)
			throw new Error('Invalid transaction');

		srcAcc[3] += transaction.srcAmount;
	}
	else if (transaction.type == 2)		// Income
	{
		if (!destAcc || destAcc[1] != transaction.destCurr)
			throw new Error('Invalid transaction');

		destAcc[3] -= transaction.destAmount;
	}
	else if (transaction.type == 3)		// Transfer
	{
		if (!srcAcc || !destAcc || srcAcc[1] != transaction.srcCurr || destAcc[1] != transaction.destCurr)
			throw new Error('Invalid transaction');

		srcAcc[3] += transaction.srcAmount;
		destAcc[3] -= transaction.destAmount;
	}
	else if (transaction.type == 4)		// Debt
	{
		if (debtType)		// person give
		{
			if (srcAcc)
				throw new Error('Invalid transaction');

			srcAcc = getPersonAccount(transaction.srcAcc);
			if (!srcAcc)
				throw new Error('Invalid transaction');

			srcAcc[2] += transaction.srcAmount;
			if (destAcc)
				destAcc[3] -= transaction.destAmount;
		}
		else				// person take
		{
			if (destAcc)		// we should not find acount
				throw new Error('Invalid transaction');

			destAcc = getPersonAccount(transaction.destAcc);
			if (!destAcc)
				throw new Error('Invalid transaction');

			if (srcAcc)
				srcAcc[3] += transaction.srcAmount;
			destAcc[2] -= transaction.destAmount;
		}
	}


	canceled = true;
}


// Calculate result balance of source by initial balance and source amount
function f1()
{
	if (!isExpense() && !isTransfer() && !isDebt())
		return;

	S2 = fS1 - fsa;

/*
	if (edit_mode)
	{
		var accid = ge(isDebt() ? 'acc_id' : 'src_id');

		if (accid && (transaction.srcAcc == parseInt(accid.value)))
			S2 += transaction.srcAmount;
	}
*/

	if (isExpense() || isTransfer() || isDebt())
		fS2 = S2 = correct(S2);
}


// Calculate result balance of destination by initial balance and destination amount
function f1_d()
{
	if (!isIncome() && !isTransfer() && !isDebt())
		return;

	S2_d = fS1_d + fda;

/*
	if (edit_mode)
	{
		var accid = ge(isDebt() ? 'acc_id' : 'src_id');

		if (accid && (transaction.destAcc == parseInt(accid.value)))
			S2_d -= transaction.destAmount;
	}
*/

	if (isIncome() || isTransfer() || isDebt())
		fS2_d = S2_d = correct(S2_d);
}


// Calculate destination amount by source amount and exchange rate
function f2()
{
	fda = da = correct(fsa * fe);
}


// Calculate source amount by initial and result balance
function f3()
{
	sa = fS1 - fS2;

	sa = correct(sa);

/*
	if (edit_mode)
		sa += transaction.srcAmount;
*/

	fsa = sa;
}


// Calculate destination amount by initial and result balance
function f3_d()
{
	fda = da = correct(fS2_d - fS1_d);
}


// Calculate source amount by destination amount and exchange rate
function f4()
{
	fsa = sa = correct(fda / fe);

/*
	if (isTransfer())
		S2_d = fS1_d + fa;
	else if (isDebt())
		S2_d = fS1_d + ((debtType) ? fd : fa);

	if (isTransfer() || isDebt())
		fS2_d = S2_d = correct(S2_d);
*/
}


// Calculate exchange rate by destination and source amount
function f5()
{
	if (fsa == 0)
		fe = e = (fda == 0) ? 1 : 0;
	else
		fe = e = correctExch(fda / fsa);
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
		if (!src_amount.value || !src_amount.value.length || !isNum(fixFloat(src_amount.value)))
		{
			alert('Please input correct source amount.');
			return false;
		}
	}
	else if (isIncome())
	{
		if (!dest_amount.value || !dest_amount.value.length || !isNum(fixFloat(dest_amount.value)))
		{
			alert('Please input correct destination amount.');
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


// Edit transaction submit event handler
function onEditTransSubmit(frm)
{
	var srcid, destid, src_amount, dest_amount, trdate, submitbtn;

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

	if (!src_amount.value || !src_amount.value.length || !isNum(fixFloat(src_amount.value)))
	{
		alert('Please input correct amount.');
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
		exchrate_b.firstElementChild.innerHTML = '1';
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
				resbal_d_b.firstElementChild.innerHTML = formatCurrency(getBalanceOfAccount(new_acc_id) - dest_amount.value, getCurrencyOfAccount(new_acc_id));
			else if ((isDebt() && !debtType) || isExpense())
				resbal_b.firstElementChild.innerHTML = formatCurrency(getBalanceOfAccount(new_acc_id) - dest_amount.value, getCurrencyOfAccount(new_acc_id));
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
}


// Check selected currencies is different
function isDiffCurr()
{
	var src, dest;

	src = ge('src_id');
	dest = ge('dest_id');

	if (!src || !dest)
		return false;

	return (getCurrencyOfAccount(src.value) != getCurrencyOfAccount(dest.value));
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


// Update controls of transfer transaction form
/* TODO : don't calculate values here; we have getValues(), f1-5() */
function updControls()
{
	var src, dest, acc, src_amount, dest_amount, exchrate, exchrate_b, exchange, resbal, src_curr, dest_curr;
	var src_acc, dest_acc, debt_acc, trsrc_amount, trdest_amount, selCurrVal;

	src = ge('src_id');
	dest = ge('dest_id');
	acc = ge('acc_id');
	src_amount = ge('src_amount');
	dest_amount = ge('dest_amount');
	exchrate = ge('exchrate');
	exchrate_b = ge('exchrate_b');
	exchange = ge('exchange');
	resbal = ge('resbal');
	resbal_b = ge('resbal_b');
	src_curr = ge('src_curr');
	dest_curr = ge('dest_curr');
	if ((!src && !dest && !acc) || !src_amount || !dest_amount || !exchrate || !exchange || !resbal || !resbal_b || !src_curr || !dest_curr)
		return;

	if (isDebt())
	{
		debt_acc = parseInt(acc.value);
	}
	else
	{
		src_acc = parseInt(src.value);
		dest_acc = parseInt(dest.value);
	}

	if (isDebt())
		selCurrVal = noAccount ? parseInt(src_curr.value) : getCurrencyOfAccount(debt_acc);
	else
		selCurrVal = getCurrencyOfAccount(src_acc);

	if (isTransfer())
	{
		srcAmountCurr = getCurrencyOfAccount(src_acc);
		destAmountCurr = getCurrencyOfAccount(dest_acc);
		src_curr.value = srcAmountCurr;
		srcCurr = srcAmountCurr;
		dest_curr.value = destAmountCurr;
		destCurr = destAmountCurr;
	}
	else if (isDebt())
	{
		srcCurr = parseInt(src_curr.value);
		srcAmountCurr = srcCurr;
		destAmountCurr = noAccount ? selCurrVal : getCurrencyOfAccount(debt_acc);
	}

	exchange.value = '';
	if (srcAmountCurr != destAmountCurr)
	{
/*
		if (!edit_mode)
		{
*/
			trsrc_amount = (src_amount.value != '') ? src_amount.value : 0;
			trdest_amount = 0;

			//dest_amount.value = '';
			//resbal.value = '';

/*
			resbal.value = normalize(getBalanceOfAccount(src_acc));
*/
			if (isDebt())
			{
				resbal.value = normalize(getCurPersonBalance((debtType) ? srcCurr : destCurr) + normalize((debtType) ? -trsrc_amount : trdest_amount));
			}
			else
			{
				resbal.value = normalize(getBalanceOfAccount(src_acc) - normalize(trsrc_amount));
			}
			resbal_b.firstElementChild.innerHTML = formatCurrency(resbal.value, getCurrencyOfAccount(src_acc));

			if (isTransfer() || isDebt())
			{
				var resbal_d = ge('resbal_d');
				var resbal_d_b = ge('resbal_d_b');

				if (!resbal_d || !resbal_d_b)
					return;

/*
				if (edit_mode && (dest_acc == transaction.srcAcc || dest_acc == transaction.destAcc))
				{
					var fixedBalance = getBalanceOfAccount(dest_acc) + ((dest_acc == transaction.srcAcc) ? transaction.dest_amount : -transaction.src_amount);
					resbal_d.value = normalize(fixedBalance + normalize(trsrc_amount));
				}
				else
*/
					resbal_d.value = normalize(getBalanceOfAccount(dest_acc) + normalize(trsrc_amount));

				resbal_d_b.firstElementChild.innerHTML = formatCurrency(resbal_d.value, getCurrencyOfAccount(dest_acc));
			}
/*
		}
*/

		destAmountSwitch(true);
		exchRateSwitch(false);

		setAmountInputLabel(true, true);
		setAmountInputLabel(false, true);
	}
	else
	{
		if (isExpense() || isTransfer())
			src_amount.value = dest_amount.value;
		else if (isIncome())
			dest_amount.value = src_amount.value;

		trsrc_amount = (src_amount.value != '') ? src_amount.value : 0;
		trdest_amount = (dest_amount.value != '') ? dest_amount.value : 0;


		exchrate.value = 1;
		exchrate_b.firstElementChild.innerHTML = '1';
/*
		if (edit_mode && (src_acc == transaction.srcAcc || src_acc == transaction.destAcc))
		{
			var fixedBalance = getBalanceOfAccount(src_acc) + ((src_acc == transaction.srcAcc) ? transaction.destAmount : -transaction.srcAmount);
			resbal.value = normalize(fixedBalance - normalize(trdest_amount));
		}
		else
		{
*/
			if (isDebt())
			{
				resbal.value = normalize(getCurPersonBalance((debtType) ? srcCurr : destCurr) + normalize((debtType) ? -trsrc_amount : trdest_amount));
			}
			else
			{
				resbal.value = normalize(getBalanceOfAccount(src_acc) - normalize(trdest_amount));
			}
/*
		}
*/

		resbal_b.firstElementChild.innerHTML = formatCurrency(resbal.value, srcCurr);

		if (isTransfer() || isDebt())
		{
			var resbal_d = ge('resbal_d');
			var resbal_d_b = ge('resbal_d_b');

			if (!resbal_d || !resbal_d_b)
				return;

/*
			if (edit_mode && (dest_acc == transaction.srcAcc || dest_acc == transaction.destAcc))
			{
				var fixedBalance = getBalanceOfAccount(dest_acc) + ((dest_acc == transaction.srcAcc) ? transaction.destAmount : -transaction.srcAmount);
				resbal_d.value = normalize(fixedBalance + normalize(trsrc_amount));
			}
			else
			{
*/
				if (isDebt())
				{
					resbal_d.value = normalize(getBalanceOfAccount(debt_acc) + normalize(trsrc_amount));
				}
				else
				{
					resbal_d.value = normalize(getBalanceOfAccount(dest_acc) + normalize(trsrc_amount));
				}
/*
			}
*/

			resbal_d_b.firstElementChild.innerHTML = formatCurrency(resbal_d.value, selCurrVal);
		}

		hideDestAmountAndExchange();

		setAmountInputLabel(true, false);
	}

	setSign('destamountsign', destAmountCurr);
	setSign('srcamountsign', srcAmountCurr);
	setSign('res_currsign', destAmountCurr);
	setSign('res_currsign_d', srcAmountCurr);

	if (isDebt())
	{
		var person_tile, person_id, personname, pbalance;

		person_tile = ge('person_tile');
		person_id = ge('person_id');
		if (!person_tile || !person_id)
			return;

		personname = getPersonName(person_id.value);
		pbalance = getCurPersonBalance((debtType) ? srcCurr : destCurr);
		setTileInfo(person_tile, personname, formatCurrency(pbalance, (debtType) ? srcCurr : destCurr));

		setTileAccount('acc_tile', parseInt(acc.value));
	}
	else
	{
		setTileAccount('source_tile', src_acc);
		setTileAccount('dest_tile', dest_acc);
	}

	getValues();
	setExchangeComment();
}


// Source account change event handler
function onChangeSource()
{
	var src, dest, newAcc;

	src = ge('src_id');
	dest = ge('dest_id');

	if (!src || !dest)
		return;

	if (src.value == dest.value)
	{
		newAcc = getNextAccount(dest.value);
		if (newAcc != 0)
			dest.value = newAcc;
	}

	updControls();
}


// Destination account change event handler
function onChangeDest()
{
	var src, dest, newAcc;

	src = ge('src_id');
	dest = ge('dest_id');
	if (!src || !dest)
		return;

	if (src.value == dest.value)
	{
		newAcc = getNextAccount(src.value);
		if (newAcc != 0)
			src.value = newAcc;
	}

	updControls();
}


// Set exchange rate comment
function setExchangeComment()
{
	var exchcomm, exchrate_b, src_curr, dest_curr;
	var destAmountSign, srcAmountSign;
	var invExch;

	exchcomm = ge('exchcomm');
	exchrate_b = ge('exchrate_b');
	src_curr = ge('src_curr');
	dest_curr = ge('dest_curr');
	if (!exchcomm || !exchrate_b || !src_curr || !dest_curr)
		return;

	srcCurr = parseInt(src_curr.value);
	destCurr = parseInt(dest_curr.value);

	destAmountSign = getCurrencySign(destCurr);
	srcAmountSign = getCurrencySign(srcCurr);

	if (fe == 1.0 || fe == 0.0 || e == '')
	{
		exchcomm.innerHTML = destAmountSign + '/' + srcAmountSign;
	}
	else
	{
		invExch = parseFloat((1 / fe).toFixed(5));

		exchcomm.innerHTML = destAmountSign + '/' + srcAmountSign + ' ('  + invExch + ' ' + srcAmountSign + '/' + destAmountSign + ')';
	}

	exchrate_b.firstElementChild.innerHTML = fe + ' ' + exchcomm.innerHTML;
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


// Get values of transaction from input fields
function getValues()
{
	var accid, src_amount, dest_amount, exchrate, resbal, resbal_d;

	accid = ge(isIncome() ? 'dest_id' : (isDebt()) ? 'acc_id' : 'src_id');
	src_amount = ge('src_amount');
	dest_amount = ge('dest_amount');
	exchrate = ge('exchrate');
	resbal = ge('resbal');
	resbal_d = ge('resbal_d');
	if (!accid || !src_amount || !dest_amount || !exchrate || (!resbal && !resbal_d))
		return;

	if (isExpense())
	{
		S1 = getBalanceOfAccount(accid.value);
		S2 = resbal.value;
	}
	else if (isIncome())
	{
		S1_d = getBalanceOfAccount(accid.value);
		S2_d = resbal_d.value;
	}
	else if (isTransfer())
	{
		var dest_id = ge('dest_id');
		if (!dest_id)
			return;

		S1 = getBalanceOfAccount(accid.value);
		S2 = resbal.value;
		S1_d = getBalanceOfAccount(dest_id.value);
		S2_d = resbal_d.value;
	}
	else if (isDebt())
	{
		if (debtType)	// person give to us; person account is source
		{
			S1 = getCurPersonBalance(srcCurr);
			S2 = resbal.value;
			if (!noAccount)
			{
				S1_d = getBalanceOfAccount(accid.value);
				S2_d = resbal_d.value;
			}
		}
		else			// person take from us; person account is destination
		{
			S1_d = getCurPersonBalance(destCurr);
			S2_d = resbal.value;
			if (!noAccount)
			{
				S1 = getBalanceOfAccount(accid.value);
				S2 = resbal_d.value;
			}
		}
	}
	sa = src_amount.value;
	da = dest_amount.value;
	e = exchrate.value;

	s1valid = isValidValue(S1);
	s2valid = isValidValue(S2);
	if (isIncome() || isTransfer() || isDebt())
	{
		s1dvalid = isValidValue(S1_d);
		s2dvalid = isValidValue(S2_d);
	}
	davalid = isValidValue(da);
	evalid = isValidValue(e);
	savalid = isValidValue(sa);

	fS1 = (s1valid) ? normalize(S1) : S1;
	fS2 = (s2valid) ? normalize(S2) : S2;
	if (isIncome() || isTransfer() || isDebt())
	{
		fS1_d = (s1dvalid) ? normalize(S1_d) : S1_d;
		fS2_d = (s2dvalid) ? normalize(S2_d) : S2_d;
	}
	fda = (davalid) ? normalize(da) : da;
	fe = (evalid) ? normalizeExch(e) : e;
	fsa = (savalid) ? normalize(sa) : sa;
}


// Set value of input fields
function setValues()
{
	var src_amount, src_amount_b, dest_amount, dest_amount_b, exchrate, exchcomm, exchrate_b, resbal, resbal_d, resbal_b, resbal_d_b;

	src_amount = ge('src_amount');
	src_amount_b = ge('src_amount_b');
	dest_amount = ge('dest_amount');
	dest_amount_b = ge('dest_amount_b');
	exchrate = ge('exchrate');
	exchcomm = ge('exchcomm');
	exchrate_b = ge('exchrate_b');
	resbal = ge('resbal');
	resbal_d = ge('resbal_d');
	resbal_b = ge('resbal_b');
	resbal_d_b = ge('resbal_d_b');
	if (!src_amount || !src_amount_b || !dest_amount || !dest_amount_b || !exchrate || !exchrate_b || (!resbal && !resbal_d) || (!resbal_b && !resbal_d_b))
		return;

	src_amount.value = sa;
	src_amount_b.firstElementChild.innerHTML = formatCurrency((isValidValue(sa) ? sa : 0), srcCurr);

	dest_amount.value = da;
	dest_amount_b.firstElementChild.innerHTML =  formatCurrency((isValidValue(da) ? da : 0), destCurr);

	exchrate.value = e;
	exchrate_b.firstElementChild.innerHTML = e + ' ' + exchcomm.innerHTML;

	if (isDebt())
	{
		if (debtType)		// person give to us
		{
			resbal.value = S2;
			resbal_d.value = S2_d;
		}
		else				// person take from us
		{
			resbal_d.value = S2;
			resbal.value = S2_d;
		}
	}
	else if (isIncome())
		resbal_d.value = S2_d;
	else
		resbal.value = S2;

	if (isDebt())
	{
		resbal_b.firstElementChild.innerHTML = formatCurrency((isValidValue(S2) ? S2 : S1), srcCurr);
	}
	else if (isIncome())
		resbal_d_b.firstElementChild.innerHTML = formatCurrency((isValidValue(S2_d) ? S2_d : S1_d), destCurr);
	else
		resbal_b.firstElementChild.innerHTML = formatCurrency((isValidValue(S2) ? S2 : S1), srcCurr);

	if (isTransfer())
	{
		resbal_d_b.firstElementChild.innerHTML = formatCurrency(isValidValue(S2_d) ? S2_d : S1_d, destCurr);
	}
	else if (isDebt())
	{
		resbal_d_b.firstElementChild.innerHTML = formatCurrency(isValidValue(S2_d) ? S2_d : S1_d, destCurr);
	}
}


// Check currency of source amount and destination amount is different
function isDiff()
{
	var srcAmountCurr, destAmountCurr, src_curr, dest_curr;
	var accid, destid;

	accid = ge(isIncome() ? 'dest_id' : (isDebt()) ? 'acc_id' : 'src_id');
	src_curr = ge('src_curr');
	dest_curr = ge('dest_curr');

	if (isDebt() && noAccount)
		return false;

	if (isExpense() || isIncome() || isDebt())
	{
		srcAmountCurr = parseInt(src_curr.value);
	}
	else if (isTransfer())
	{
		destid = ge('dest_id');
		srcAmountCurr = getCurrencyOfAccount(destid.value);
	}

	destAmountCurr = getCurrencyOfAccount(accid.value);

	return (srcAmountCurr != destAmountCurr);
}


// Source amount field input event handler
function onSrcAmountInput()
{
	if (!s1valid && !s1dvalid)
		return;

	if (isDiff())
	{
		if (davalid)
		{
			if (isIncome() || isTransfer() || (isDebt() && !debtType))
				f1_d();			// calculate S2_d
		}
		if (savalid)
		{
			if (isExpense() || isTransfer() || (isDebt() && debtType))
				f1();				// calculate S2
		}

		if (davalid)
			f5();		// calculate e
	}
	else
	{
		f2();		// calculate da
		if (isIncome())
		{
			f1_d();			// calculate S2_d
		}
		else if (isTransfer() || isDebt())
		{
			f1_d();			// calculate S2_d
			f1();				// calculate S2
		}
		else
			f1();				// calculate S2
	}

	setExchangeComment();
}


// Destination amount field input event handler
function onDestAmountInput()
{
	if (!s1valid && !s1dvalid)
		return;

	if (!isDiff())
	{
		f4();		// calculate sa
	}

	if (isIncome() || isTransfer() || (isDebt() && debtType))
		f1_d();		// calculate S2_d
	if (isExpense() || isTransfer() || (isDebt() && !debtType))
		f1();			// calculate S2

	if (savalid)
		f5();		// calculate e

	setExchangeComment();
}


// Exchange rate field input event handler
function onExchangeInput()
{
	if (!s1valid && !s1dvalid)
		return;

	if (savalid)
	{
		f2();		// calculate da
		f1();		// calculate S2
	}
	else if (davalid)
		f4();		// calculate sa

	setExchangeComment();
}


// Result balance field input event handler
function onResBalanceInput()
{
	if (!s1valid && !s1dvalid)
		return;

	if (isDebt())
	{
		if (debtType)
		{
			f3();			// calculate da
			f4();			// calculate sa and S2_d
		}
		else
		{
			f3_d();		// calculate sa
			f2();			// calculate da
			f1();			// calculate S2
		}
	}
	else
	{
		f3();		// calculate d
		if (evalid)
			f4();				// calculate sa
		else if (savalid)
			f5();				// calculate e
	}
}


// Result balance field input event handler
function onResBalanceDestInput()
{
	if (!s1dvalid)
		return;

	if (isTransfer() || isIncome())
	{
		f3_d();		// calculate sa
		f2();			// calculate da
		f1();			// calculate S2
	}
	else if (isDebt())
	{
		if (debtType)
		{
			f3_d();		// calculate sa
			f2();			// calculate da
			f1();			// calculate S2
		}
		else
		{
			f3();			// calculate da
			f4();			// calculate sa and S2_d
		}
	}
}


// Field input event handler
function onFInput(obj)
{
	getValues();

	if (obj.id == 'src_amount')
		onSrcAmountInput();
	else if (obj.id == 'dest_amount')
		onDestAmountInput();
	else if (obj.id == 'exchrate')
		onExchangeInput();
	else if (obj.id == 'resbal')
		onResBalanceInput();
	else if (obj.id == 'resbal_d')
		onResBalanceDestInput();

	setValues();

	return true;
}


// Source currency change event handler
function onChangeSrcCurr()
{
	var accid, src_amount, src_curr, dest_curr, exchange, exchrate, exchrate_b, dest_amount;
	var srcAmountCurr, destAmountCurr, isDiff;

	accid = ge(isIncome() ? 'dest_id' : (isDebt()) ? 'acc_id' : 'src_id');
	src_amount = ge('src_amount');
	src_curr = ge('src_curr');
	dest_curr = ge('dest_curr');
	exchange = ge('exchange');
	exchrate = ge('exchrate');
	exchrate_b = ge('exchrate_b');
	dest_amount = ge('dest_amount');
	if (!accid || !src_amount || !src_curr || !dest_curr || !exchange || !exchrate || !exchrate_b || !dest_amount)
		return;

	if (isExpense() || isTransfer() || (isDebt() && debtType))
		return;

	srcAmountCurr = parseInt(src_curr.value);
	if (isDebt() && noAccount)
		destAmountCurr = srcAmountCurr;
	else
		destAmountCurr = getCurrencyOfAccount(accid.value);

	isDiff = (srcAmountCurr != destAmountCurr);
	if (isDiff)
	{
		destAmountSwitch(true);
		setAmountInputLabel(true, true);
		setAmountInputLabel(false, true);
		setCurrActive(true, true);		// set source active
		setCurrActive(false, false);		// set destination inactive
		exchRateSwitch(false);
	}
	else
	{
		exchrate.value = 1;
		exchrate_b.firstElementChild.innerHTML = '1';
		dest_amount.value = src_amount.value;

		updateExchAndRes();

		setAmountInputLabel(true, false);
		hideDestAmountAndExchange();
	}

	srcCurr = srcAmountCurr;

	setSign('destamountsign', destAmountCurr);
	setSign('srcamountsign', srcAmountCurr);
	if (isDebt())
	{
		setSign('res_currsign', srcAmountCurr);
		setSign('res_currsign_d', destAmountCurr);
	}

	getValues();
	updateExchAndRes();
	setExchangeComment();

	if (isDebt())
	{
		var person_tile, person_id, personname, pbalance, resbal_b;

		person_tile = ge('person_tile');
		person_id = ge('person_id');
		resbal_b = ge('resbal_b');
		if (!person_tile || !person_id || !resbal_b)
			return;

		personname = getPersonName(person_id.value);
		pbalance = getCurPersonBalance(debtType ? srcCurr : destCurr);
		setTileInfo(person_tile, personname, formatCurrency(pbalance, debtType ? srcCurr : destCurr));

		if (debtType)
			resbal_b.firstElementChild.innerHTML = formatCurrency((isValidValue(S2) ? S2 : S1), srcCurr);
		else
			resbal_b.firstElementChild.innerHTML = formatCurrency((isValidValue(S2_d) ? S2_d : S1_d), destCurr);
	}
}


// Destination currency change event handler
function onChangeDestCurr()
{
	var accid, src_amount, src_curr, dest_curr, exchange, exchrate, exchrate_b, dest_amount;
	var srcAmountCurr, destAmountCurr, isDiff;

	accid = ge(isIncome() ? 'dest_id' : (isDebt()) ? 'acc_id' : 'src_id');
	src_amount = ge('src_amount');
	src_curr = ge('src_curr');
	dest_curr = ge('dest_curr');
	exchange = ge('exchange');
	exchrate = ge('exchrate');
	exchrate_b = ge('exchrate_b');
	dest_amount = ge('dest_amount');
	if (!accid || !src_amount || !src_curr || !dest_curr || !exchange || !exchrate || !exchrate_b || !dest_amount)
		return;

	if (isIncome() || isTransfer() || (isDebt() && !debtType))
		return;

	destAmountCurr = parseInt(dest_curr.value);
	if (isDebt() && noAccount)
		srcAmountCurr = destAmountCurr;
	else
		srcAmountCurr = getCurrencyOfAccount(accid.value);

	isDiff = (srcAmountCurr != destAmountCurr);
	if (isDiff)
	{
		srcAmountSwitch(true);
		setAmountInputLabel(true, true);
		setAmountInputLabel(false, true);
		setCurrActive(true, false);		// set source inactive
		setCurrActive(false, true);		// set destination active
		exchRateSwitch(false);
	}
	else
	{
		exchrate.value = 1;
		exchrate_b.firstElementChild.innerHTML = '1';
		dest_amount.value = src_amount.value;

		updateExchAndRes();

		setAmountInputLabel(false, false);
		hideSrcAmountAndExchange();
	}

	destCurr = destAmountCurr;

	setSign('destamountsign', destAmountCurr);
	setSign('srcamountsign', srcAmountCurr);
	if (isDebt())
	{
		setSign('res_currsign', srcAmountCurr);
		setSign('res_currsign_d', destAmountCurr);
	}

	getValues();
	updateExchAndRes();
	setExchangeComment();

	if (isDebt())
	{
		var person_tile, person_id, personname, pbalance, resbal_b;

		person_tile = ge('person_tile');
		person_id = ge('person_id');
		resbal_b = ge('resbal_b');
		if (!person_tile || !person_id || !resbal_b)
			return;

		personname = getPersonName(person_id.value);
		pbalance = getCurPersonBalance(debtType ? srcCurr : destCurr);
		setTileInfo(person_tile, personname, formatCurrency(pbalance, debtType ? srcCurr : destCurr));

		if (debtType)
			resbal_b.firstElementChild.innerHTML = formatCurrency((isValidValue(S2) ? S2 : S1), srcCurr);
		else
			resbal_b.firstElementChild.innerHTML = formatCurrency((isValidValue(S2_d) ? S2_d : S1_d), destCurr);
	}
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

