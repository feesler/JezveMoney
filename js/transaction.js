var S1;		// balance before transaction
var a;		// amount in currency of transaction
var d;		// charge off/receipt in currency of account
var e;		// exchange rate
var S2;		// balance after transaction

var fS1, fa, fd, fe, fS2;	// parsed float values
var s1valid, s2valid, dvalid, evalid, avalid;

// transfer only
var S1_d;		// balance of destination account before transaction
var S2_d;		// balance of destintation account after transaction

var fS1_d, fS2_d;
var s1dvalid, s2dvalid;

// Main formula
// S2 = S1 - d			for expense/transfer
// S2 = S1 + d			for income
// d = a * e
// S2_d = S1_d + a		for transfer


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


// Calculate result balance by initial and charge off/receipt
function f1()
{
	if (isIncome())
		S2 = fS1 + fd;
	else
		S2 = fS1 - fd;

	if (edit_mode)
		S2 += (isIncome()) ? -transaction.charge : transaction.charge;

	S2 = correct(S2);

	fS2 = S2;

	if (isTransfer() || isDebt())
	{
		S2_d = fS1_d + fa;
		S2_d = correct(S2_d);
		fS2_d = S2_d;
	}
}


// Calculate charge off/receipt amount by transaction amount and exchange rate
function f2()
{
	d = fa * fe;

	d = correct(d);

	fd = d;
}


// Calculate charge off/receipt amount by initial and result balance
function f3()
{
	if (isIncome())
		d = fS2 - fS1;
	else
		d = fS1 - fS2;

	d = correct(d);

	fd = d;
}


// Calculate amount amount by initial and result balance of destination account
function f3_d()
{
	a = fS2_d - fS1_d;

	a = correct(a);

	fa = a;
}


// Calculate transaction amount by charge off/receipt and exchange rate
function f4()
{
	a = fd / fe;

	a = correct(a);

	fa = a;

	if (isTransfer() || isDebt())
	{
		S2_d = fS1_d + fa;
		S2_d = correct(S2_d);
		fS2_d = S2_d;
	}
}


// Calculate exchange rate by charge off/receipt and transaction amount
function f5()
{
	e = fd / fa;

	e = correctExch(e);

	fe = e;
}


// Return sign of specified currency
function getCurrencySign(curr_id)
{
	var currSign = '';

	currency.some(function(curr)
	{
		if (curr[0] == curr_id)
			currSign = curr[2];

		return (curr[0] == curr_id);
	});

	return currSign;
}


// Return sign format of specified currency(before or after value)
function getCurrencyFormat(curr_id)
{
	var currFmt = false;

	currency.some(function(curr)
	{
		if (curr[0] == curr_id)
			currFmt = curr[3];

		return (curr[0] == curr_id);
	});

	return currFmt;
}


// Return currency id of specified account
function getCurrencyOfAccount(account_id)
{
	var curr_id = 0;

	account_id = parseInt(account_id);
	if (!account_id)
		return curr_id;

	accounts.some(function(acc)
	{
		if (acc[0] == account_id)
			curr_id = acc[1];

		return (acc[0] == account_id);
	});

	return curr_id;
}


// Return balance of specified account
function getBalanceOfAccount(account_id)
{
	var balance = 0;

	accounts.some(function(acc)
	{
		if (acc[0] == account_id)
			balance = acc[3];

		return (acc[0] == account_id);
	});

	return balance;
}


// Return name of specified account
function getNameOfAccount(account_id)
{
	var name = '';

	accounts.some(function(acc)
	{
		if (acc[0] == account_id)
			name = acc[4];

		return (acc[0] == account_id);
	});

	return name;
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
	var srcid, destid, amount, trdate;
	var submitbtn;

	if (submitStarted)
		return false;

	srcid = ge('src_id');
	destid = ge('dest_id');
	amount = ge('amount');
	trdate = ge('date');
	submitbtn = ge('submitbtn');
	if (!frm || (!srcid && !destid) || !amount || !trdate || !submitbtn)
		return false;

	if (!amount.value || !amount.value.length || !isNum(fixFloat(amount.value)))
	{
		alert('Please input correct amount.');
		return false;
	}

	amount.value = fixFloat(amount.value);

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
	var srcid, destid, amount, trdate, submitbtn;

	if (submitStarted)
		return false;

	srcid = ge('src_id');
	destid = ge('dest_id');
	amount = ge('amount');
	trdate = ge('date');
	submitbtn = ge('submitbtn');
	if (!frm || (!srcid && !destid) || !amount || !trdate || !submitbtn)
		return false;

	if (!amount.value || !amount.value.length || !isNum(fixFloat(amount.value)))
	{
		alert('Please input correct amount.');
		return false;
	}

	amount.value = fixFloat(amount.value);

	if (!checkDate(trdate.value))
	{
		alert('Please input correct date.');
		return false;
	}

	submitStarted = true;
	enable(submitbtn, false);

	return true;
}


// Update exchange rate and result balance values
function updateExchAndRes()
{
	getValues();
	if (isValidValue(d) && isValidValue(a))
	{
		f5();
		f1();
		setValues();
	}
}


// Change account event handler
function onChangeAcc()
{
	var srcid, destid, accid, amount, transcurr, chargeoff, exchange, exchrate, exchrate_b, charge;
	var sync = false, target_id, new_acc_id;

	srcid = ge('src_id');
	destid = ge('dest_id');
	accid = ge('acc_id');
	amount = ge('amount');
	transcurr = ge('transcurr');
	chargeoff = ge('chargeoff');
	exchange = ge('exchange');
	exchrate = ge('exchrate');
	exchrate_b = ge('exchrate_b');
	charge = ge('charge');
	resbal_b = ge(isDebt() ? 'resbal_d_b' : 'resbal_b');
	if ((!srcid && !destid && !accid) || !amount || !transcurr  || !chargeoff || !exchange || !exchrate || !exchrate_b || !charge || !resbal_b)
		return false;

	if (trans_curr == trans_acc_curr)				// currency of transaction is the same as currency of account
		sync = true;

	target_id = isIncome() ? destid : (isDebt() ? accid : srcid);
	new_acc_id = selectedValue(target_id);

	trans_acc_curr = getCurrencyOfAccount(new_acc_id);
	if (sync)
		selectByValue(transcurr, trans_acc_curr);	// update currency of transaction

	trans_curr = selectedValue(transcurr);

	// hide charge and exchange rate if new currencies is the same
	if (trans_curr == trans_acc_curr)
	{
		hideChargeAndExchange();

		exchrate.value = 1;
		exchrate_b.firstElementChild.innerHTML = '1';
		charge.value = amount.value;

		resbal_b.firstElementChild.innerHTML = formatCurrency(getBalanceOfAccount(new_acc_id) - charge.value, getCurrencyOfAccount(new_acc_id));
	}

	updateExchAndRes();

	setSign('chargesign', trans_acc_curr);
	setSign('amountsign', trans_curr);

	setTileAccount(isIncome() ? 'dest_tile' : (isDebt() ? 'acc_tile' : 'source_tile'), new_acc_id);
/*
	if (isIncome())
		setTileAccount('dest_tile', selectedValue(destid));
	else
		setTileAccount('source_tile', selectedValue(srcid));
*/
}


// Show list of currencies
function showCurrList()
{
	var transcurr, ancurrbtn;

	if (isTransfer())
		return;

	curr_block = ge('curr_block');
	ancurrbtn = ge('ancurrbtn');
	if (!curr_block || !ancurrbtn)
		return;

	show(curr_block, true);
	show(ancurrbtn, false);
}


// Check selected currencies is different
function isDiffCurr()
{
	var src, dest;

	src = ge('src_id');
	dest = ge('dest_id');

	if (!src || !dest)
		return false;

	return (getCurrencyOfAccount(selectedValue(src)) != getCurrencyOfAccount(selectedValue(dest)));
}


// Transfer transaction submit event handler
function onTransferSubmit(frm)
{
	var amount, charge, exchrate, trdate;
	var submitbtn;

	if (submitStarted)
		return false;

	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	trdate = ge('date');
	submitbtn = ge('submitbtn');
	if (!frm || !amount || !charge || !exchrate || !trdate || !submitbtn)
		return false;

	if (!amount.value || !amount.value.length || !isNum(fixFloat(amount.value)))
	{
		alert('Please input correct amount.');
		return false;
	}

	if (isDiffCurr() && (!charge.value || !charge.value.length || !isNum(fixFloat(charge.value))))
	{
		alert('Please input correct charge off.');
		return false;
	}

	if (!checkDate(trdate.value))
	{
		alert('Please input correct date.');
		return false;
	}

	amount.value = fixFloat(amount.value);
	charge.value = fixFloat(charge.value);
	exchrate.value = fixFloat(exchrate.value);

	submitStarted = true;
	enable(submitbtn, false);

	return true;
}


//
function formatValue(val)
{
	return val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}


// Format value with rules of specified currency
function formatCurrency(val, curr_id)
{
	var isBefore = getCurrencyFormat(curr_id);
	var sign = getCurrencySign(curr_id);

	if (isBefore)
		return sign + ' ' + formatValue(val);
	else
		return formatValue(val) + ' ' + sign;
}


// Format balance of account value with currency
function formatAccoutBalance(acc_id)
{
	return formatCurrency(getBalanceOfAccount(acc_id), getCurrencyOfAccount(acc_id));
}


// Update tile information
function setTileInfo(tile_id, title, subTitle)
{
	var tileObj, titleObj, subTitleObj;

	tileObj = ge(tile_id);
	if (!tileObj)
		return;

	subTitleObj = tileObj.firstElementChild.firstElementChild.firstElementChild;
	if (subTitleObj)
		subTitleObj.innerHTML = subTitle;

	titleObj = subTitleObj.nextElementSibling;
	if (titleObj)
		titleObj.innerHTML = title;
}


// Set source tile to the specified account
function setTileAccount(tile_id, acc_id)
{
	var name, formatBalance, balance;

	if (!tile_id || !acc_id)
		return;

	name = getNameOfAccount(acc_id);
	balance = getBalanceOfAccount(acc_id);

	if (edit_mode && (acc_id == transaction.srcAcc || acc_id == transaction.destAcc))
		balance += ((acc_id == transaction.srcAcc) ? transaction.charge : -transaction.amount);
	formatBalance = formatCurrency(balance, getCurrencyOfAccount(acc_id));

	setTileInfo(tile_id, name, formatBalance);
}


// Update controls of transfer transaction form
function updControls()
{
	var src, dest, acc, amount, charge, exchrate, exchrate_b, chargeoff, exchange, resbal, isDiff, transcurr;
	var src_acc, dest_acc, tramount, trcharge;

	src = ge('src_id');
	dest = ge('dest_id');
	acc = ge('acc_id');
	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	exchrate_b = ge('exchrate_b');
	chargeoff = ge('chargeoff');
	exchange = ge('exchange');
	resbal = ge('resbal');
	resbal_b = ge('resbal_b');
	if ((!src || !dest && !acc) || !amount || !charge || !exchrate || !chargeoff || !exchange || !resbal || !resbal_b)
		return;

	src_acc = parseInt(selectedValue(src));
	dest_acc = parseInt(selectedValue(dest));

	exchange.value = '';
	isDiff = isDiffCurr();
	if (isDiff)
	{
		if (!edit_mode)
		{
			charge.value = '';
			resbal.value = '';
		}

		chargeSwitch(true);
		exchRateSwitch(false);
	}
	else
	{
		tramount = (amount.value != '') ? amount.value : 0;
		trcharge = tramount;

		charge.value = amount.value;
		exchrate.value = 1;
		exchrate_b.firstElementChild.innerHTML = '1';
		if (edit_mode && (src_acc == transaction.srcAcc || src_acc == transaction.destAcc))
		{
			var fixedBalance = getBalanceOfAccount(src_acc) + ((src_acc == transaction.srcAcc) ? transaction.charge : -transaction.amount);
			resbal.value = normalize(fixedBalance - normalize(trcharge));
		}
		else
			resbal.value = normalize(getBalanceOfAccount(src_acc) - normalize(trcharge));

		resbal_b.firstElementChild.innerHTML = formatCurrency(resbal.value, getCurrencyOfAccount(src_acc));

		if (isTransfer() || isDebt())
		{
			var resbal_d = ge('resbal_d');
			var resbal_d_b = ge('resbal_d_b');

			if (!resbal_d || !resbal_d_b)
				return;

			if (edit_mode && (dest_acc == transaction.srcAcc || dest_acc == transaction.destAcc))
			{
				var fixedBalance = getBalanceOfAccount(dest_acc) + ((dest_acc == transaction.srcAcc) ? transaction.charge : -transaction.amount);
				resbal_d.value = normalize(fixedBalance + normalize(tramount));
			}
			else
				resbal_d.value = normalize(getBalanceOfAccount(dest_acc) + normalize(tramount));

			resbal_d_b.firstElementChild.innerHTML = formatCurrency(resbal_d.value, getCurrencyOfAccount(dest_acc));
		}

		hideChargeAndExchange();
	}

	amountCurr = getCurrencyOfAccount(dest_acc);
	chargeCurr = getCurrencyOfAccount(src_acc);

	if (isTransfer())
	{
		transcurr = ge('transcurr');
		if (transcurr)
			transcurr.value = amountCurr;
	}

	setSign('chargesign', chargeCurr);
	setSign('amountsign', amountCurr);

	setTileAccount('source_tile', src_acc);
	setTileAccount('dest_tile', dest_acc);

	getValues();
	setExchangeComment();
}


// Source account change event handler
function onChangeSource()
{
	var src, dest;

	src = ge('src_id');
	dest = ge('dest_id');

	if (!src || !dest)
		return;

	if (src.selectedIndex == dest.selectedIndex)
	{
		if (dest.selectedIndex == 0)
			dest.selectedIndex = accounts.length - 1;
		else
			dest.selectedIndex--;
	}

	updControls();
}


// Destination account change event handler
function onChangeDest()
{
	var src, dest;

	src = ge('src_id');
	dest = ge('dest_id');
	if (!src || !dest)
		return;

	if (src.selectedIndex == dest.selectedIndex)
	{
		if (src.selectedIndex == accounts.length - 1)
			src.selectedIndex = 0;
		else
			src.selectedIndex++;
	}

	updControls();
}


// 
function onInput(obj)
{
	var amount, charge, exchrate;

	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');

	if (!obj || !amount || !charge || !exchrate)
		return false;

	if (obj == amount)
	{
		if (!isDiffCurr())
		{
			charge.value = amount.value;
		}
	}
	else if (obj == charge)
	{
		if (amount.value && isNum(fixFloat(amount.value)) && charge.value && isNum(fixFloat(charge.value)))
		{
			exchrate.value = fixFloat(charge.value) / fixFloat(amount.value);
		}
	}
	else if (obj == exchrate)
	{
		if (amount.value && isNum(fixFloat(amount.value)) && exchrate.value && isNum(fixFloat(exchrate.value)))
		{
			charge.value = fixFloat(exchrate.value) * fixFloat(amount.value);
		}
	}

	return true;
}


// Set exchange rate comment
function setExchangeComment()
{
	var exchcomm, exchrate_b, transcurr, accid, taccid;
	var chargeSign, amountSign;
	var invExch;

	exchcomm = ge('exchcomm');
	exchrate_b = ge('exchrate_b');
	if (isExpense() || isIncome())
		transcurr = ge('transcurr');
	accid = ge(isIncome() ? 'dest_id' : (isDebt()) ? 'acc_id' : 'src_id');
	if (isTransfer())
		taccid = ge('dest_id');
	if (!exchcomm || !exchrate_b || !accid || (!transcurr && !taccid))
		return;

	if (fe == 1.0 || fe == 0.0 || e == '')
	{
		chargeSign = getCurrencySign(getCurrencyOfAccount(selectedValue(accid)));
		if (isTransfer())
			amountSign = getCurrencySign(getCurrencyOfAccount(selectedValue(taccid)));
		else
			amountSign = getCurrencySign(selectedValue(transcurr));

		exchcomm.innerHTML = chargeSign + '/' + amountSign;
	}
	else
	{
		if ((transcurr && transcurr.selectedIndex == -1) || (taccid && taccid.selectedIndex == -1) || accid.selectedIndex == -1)
			return;

		chargeSign = getCurrencySign(getCurrencyOfAccount(selectedValue(accid)));
		if (isTransfer())
			amountSign = getCurrencySign(getCurrencyOfAccount(selectedValue(taccid)));
		else
			amountSign = getCurrencySign(selectedValue(transcurr));

		invExch = parseFloat((1 / fe).toFixed(5));

		exchcomm.innerHTML = chargeSign + '/' + amountSign + ' ('  + invExch + ' ' + amountSign + '/' + chargeSign + ')';
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
	var accid, amount, charge, exchrate, resbal;

	accid = ge(isIncome() ? 'dest_id' : (isDebt()) ? 'acc_id' : 'src_id');
	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	resbal = ge('resbal');
	if (!accid || !amount || !charge || !exchrate || !resbal)
		return;

	S1 = getBalanceOfAccount(selectedValue(accid));
	if (isTransfer())
	{
		S1_d = getBalanceOfAccount(selectedValue(ge('dest_id')));		// TODO: fix here
		S2_d = ge('resbal_d').value;
	}
	else if (isDebt())
	{
		if (debtType)	// person account is source
		{
			S1 = getCurPersonBalance(trans_curr);
			S2 = ge('resbal').value;
			S1_d = getBalanceOfAccount(selectedValue(accid));
			S2_d = ge('resbal_d').value;
		}
		else			// person account is destination
		{
			S1 = getBalanceOfAccount(selectedValue(accid));
			S2 = ge('resbal').value;
			S1_d = getCurPersonBalance(trans_curr);
			S2_d = ge('resbal_d').value;
		}
	}
	a = amount.value;
	d = charge.value;
	e = exchrate.value;
	S2 = resbal.value;

	s1valid = isValidValue(S1);
	s2valid = isValidValue(S2);
	if (isTransfer() || isDebt())
	{
		s1dvalid = isValidValue(S1_d);
		s2dvalid = isValidValue(S2_d);
	}
	dvalid = isValidValue(d);
	evalid = isValidValue(e);
	avalid = isValidValue(a);

	fS1 = (s1valid) ? normalize(S1) : S1;
	fS2 = (s2valid) ? normalize(S2) : S2;
	if (isTransfer() || isDebt())
	{
		fS1_d = (s1dvalid) ? normalize(S1_d) : S1_d;
		fS2_d = (s2dvalid) ? normalize(S2_d) : S2_d;
	}
	fd = (dvalid) ? normalize(d) : d;
	fe = (evalid) ? normalizeExch(e) : e;
	fa = (avalid) ? normalize(a) : a;
}


// Set value of input fields
function setValues()
{
	var amount, amount_b, charge, charge_b, exchrate, exchcomm, exchrate_b, resbal;
	var selCurrVal;

	amount = ge('amount');
	amount_b = ge('amount_b');
	charge = ge('charge');
	charge_b = ge('charge_b');
	exchrate = ge('exchrate');
	exchcomm = ge('exchcomm');
	exchrate_b = ge('exchrate_b');
	resbal = ge('resbal');
	resbal_b = ge('resbal_b');
	if (!amount || !amount_b || !charge || !charge_b || !exchrate || !exchrate_b || !resbal || !resbal_b)
		return;

	amount.value = a;
	amount_b.firstElementChild.innerHTML = formatCurrency((isValidValue(a) ? a : 0), selectedValue(ge('transcurr')));


	selCurrVal = getCurrencyOfAccount(selectedValue(ge(isIncome() ? 'dest_id' : isDebt() ? 'acc_id' : 'src_id')));

	charge.value = d;
	charge_b.firstElementChild.innerHTML =  formatCurrency((isValidValue(d) ? d : 0), selCurrVal);

	exchrate.value = e;
	exchrate_b.firstElementChild.innerHTML = e + ' ' + exchcomm.innerHTML;

	resbal.value = S2;

	if (isDebt() && debtType == false)
		resbal_b.firstElementChild.innerHTML = formatCurrency((isValidValue(S2_d) ? S2_d : S1_d), selCurrVal);
	else
		resbal_b.firstElementChild.innerHTML = formatCurrency((isValidValue(S2) ? S2 : S1), selCurrVal);

	if (isTransfer() || isDebt())
	{
		var resbal_d_b = ge('resbal_d_b');
		if (!resbal_d_b)
			return;

		if (isDebt() && debtType == false)
			resbal_d_b.firstElementChild.innerHTML = formatCurrency(isValidValue(S2) ? S2 : S1, selCurrVal);
		else
			resbal_d_b.firstElementChild.innerHTML = formatCurrency(isValidValue(S2_d) ? S2_d : S1_d, selCurrVal);
	}
}


// Amount field input event handler
function onAmountInput()
{
	if (!s1valid)
		return;

	if (evalid)
	{
		f2();		// calculate d
		f1();		// calculate S2
	}
	else if (dvalid)
		f5();		// calculate e

	setExchangeComment();
}


// Charge/receipt field input event handler
function onChargeInput()
{
	if (!s1valid)
		return;

	f1();			// calculate S2
	if (avalid)
		f5();		// calculate e
	else if (evalid)
		f4();		// calculate a

	setExchangeComment();
}


// Exchange rate field input event handler
function onExchangeInput()
{
	if (!s1valid)
		return;

	if (avalid)
	{
		f2();		// calculate d
		f1();		// calculate S2
	}
	else if (dvalid)
		f4();		// calculate a

	setExchangeComment();
}


// Result balance field input event handler
function onResBalanceInput()
{
	if (!s1valid)
		return;

	f3();		// calculate d
	if (evalid)
		f4();				// calculate a
	else if (avalid)
		f5();				// calculate e
}


// Result balance field input event handler
function onResBalanceDestInput()
{
	if (!s1dvalid)
		return;

	f3_d();		// calculate a
	f2();			// calculate d
	f1();			// calculate S1
}


// Field input event handler
function onFInput(obj)
{
	getValues();

	if (obj.id == 'amount')
		onAmountInput();
	else if (obj.id == 'charge')
		onChargeInput();
	else if (obj.id == 'exchrate')
		onExchangeInput();
	else if (obj.id == 'resbal')
		onResBalanceInput();
	else if (obj.id == 'resbal_d' && (isTransfer() || isDebt()))
		onResBalanceDestInput();

	setValues();

	return true;
}


// Currency of transaction change event handler
function onChangeTransCurr()
{
	var accid, amount, transcurr, chargeoff, exchange, exchrate, exchrate_b, charge;
	var amountCurr, chargeCurr, isDiff;

	accid = ge(isIncome() ? 'dest_id' : (isDebt()) ? 'acc_id' : 'src_id');
	amount = ge('amount');
	transcurr = ge('transcurr');
	chargeoff = ge('chargeoff');
	exchange = ge('exchange');
	exchrate = ge('exchrate');
	exchrate_b = ge('exchrate_b');
	charge = ge('charge');
	if (!accid || !amount || !transcurr || !chargeoff || !exchange || !exchrate || !exchrate_b || !charge)
		return;
	if (transcurr.selectedIndex == -1 || accid.selectedIndex == -1)
		return

	amountCurr = parseInt(selectedValue(transcurr));
	chargeCurr = getCurrencyOfAccount(selectedValue(accid));

	isDiff = (amountCurr != chargeCurr);
	if (isDiff)
	{
		chargeSwitch(true);
		exchRateSwitch(false);
	}
	else
	{
		exchrate.value = 1;
		exchrate_b.firstElementChild.innerHTML = '1';
		charge.value = amount.value;

		updateExchAndRes();

		hideChargeAndExchange();
	}

	trans_curr = amountCurr;

	setSign('chargesign', chargeCurr);
	setSign('amountsign', amountCurr);

	getValues();
	setExchangeComment();
}


// Debt operation type change event handler
function onChangeDebtOp()
{
	var acclbl, debtgive, debttake;

	acclbl = ge('acclbl');
	debtgive = ge('debtgive');
	debttake = ge('debttake');
	if (!acclbl || !debtgive || !debttake)
		return;

	debtType = debtgive.checked;

	acclbl.innerHTML = (debtType) ? 'Destination account' : 'Source account';

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
	var personname, personid, pbalance, resbal_b;

	personname = ge('personname');
	personid = ge('person_id');
	resbal_b = ge('resbal_b');
	if (!personname || !personid || !resbal_b)
		return;
	if (!obj || typeof(obj.selectedIndex) == "undefined" || obj.selectedIndex == -1)
		return;

	personname.value = selectedText(obj);
	personid.value = selectedValue(obj);
	pbalance = getPersonBalance(parseInt(personid.value));

	setTileInfo(ge('person_tile'), personname.value, pbalance ? pbalance.join(',<br>') : '');

	togglePerson(false);

	updControls();
}


// New person icon link click event
function onNewPerson()
{
	togglePerson(true);
}


// New debt form submit event handler
function onDebtSubmit(frm)
{
	var accid, amount, trdate, personname;
	var submitbtn;

	if (submitStarted)
		return false;

	personname = ge('personname');
	submitbtn = ge('submitbtn');
	if (!frm || !personname || !submitbtn)
		return false;

	if (!personname.value || personname.value.length < 1)
	{
		if (personname.type == 'hidden')
			alert('Please select person.');
		else
			alert('Please type name of person.');
		return false;
	}

	accid = ge('acc_id');
	amount = ge('amount');
	trdate = ge('date');
	if (!frm || !accid || !amount || !trdate)
		return false;

	if (!amount.value || !amount.value.length || !isNum(fixFloat(amount.value)))
	{
		alert('Please input correct amount.');
		return false;
	}

	amount.value = fixFloat(amount.value);

	if (!checkDate(trdate.value))
	{
		alert('Please input correct date.');
		return false;
	}

	if (!amount.value || !amount.value.length || !isNum(fixFloat(amount.value)))
	{
		alert('Please input correct amount.');
		return false;
	}

	amount.value = fixFloat(amount.value);

	if (!checkDate(trdate.value))
	{
		alert('Please input correct date.');
		return false;
	}

	submitStarted = true;
	enable(submitbtn, false);

	return true;
}

