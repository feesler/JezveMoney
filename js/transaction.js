var S1;		// balance before transaction
var a;		// amount in currency of transaction
var d;		// charge off/receipt in currency of account
var e;		// exchange rate
var S2;		// balance after transaction

var fS1, fa, fd, fe, fS2;	// parsed float values
var s1valid, s2valid, dvalid, evalid, avalid;

// Main formula
// S2 = S1 - d		for expense/transfer
// S2 = S1 + d		for income
// d = a * e

// Calculate charge off/receipt amount by initial and result balance
function f1()
{
	if (trans_type == 2)		// income
		S2 = fS1 + fd;
	else
		S2 = fS1 - fd;

	if (edit_mode)
		S2 += (trans_type == 2) ? -transaction.charge : transaction.charge;
	fS2 = S2;
}


// Calculate charge off/receipt amount by transaction amount and exchange rate
function f2()
{
	d = fa * fe;

	fd = d;
}


// Calculate charge off/receipt amount by initial and result balance
function f3()
{
	if (trans_type == 2)		// income
		d = fS2 - fS1;
	else
		d = fS1 - fS2;

	fd = d;
}


// Calculate transaction amount by charge off/receipt and exchange rate
function f4()
{
	a = fd / fe;

	fa = a;
}


// Calculate exchange rate by charge off/receipt and transaction amount
function f5()
{
	e = fd / fa;

	fe = e;
}


// Retunr sign of specified currency
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


// Retunr currency id of specified account
function getCurrencyOfAccount(account_id)
{
	var curr_id = '';

	accounts.some(function(acc)
	{
		if (acc[0] == account_id)
			curr_id = acc[1];

		return (acc[0] == account_id);
	});

	return curr_id;
}


// Retunr balance of specified account
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


// Set currency sign for amount or charge field
function setSign(isAmount, curr_id)
{
	var signobj = ge((isAmount=== true) ? 'amountsign' : 'chargesign');
	if (signobj)
		signobj.innerHTML = getCurrencySign(curr_id);
}


// Spend/Income transaction event handler
function onSubmit(frm)
{
	var srcid, destid, amount, trdate;

	srcid = ge('srcid');
	destid = ge('destid');
	amount = ge('amount');
	trdate = ge('date');
	if (!frm || (!srcid && !destid) || !amount || !trdate)
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

	frm.submit();

	return true;
}


// Edit transaction submit event handler
function onEditTransSubmit(frm)
{
	var srcid, destid, amount, trdate;

	srcid = ge('srcid');
	destid = ge('destid');
	amount = ge('amount');
	trdate = ge('date');
	if (!frm || (!srcid && !destid) || !amount || !trdate)
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

	frm.submit();

	return true;
}


// Change account event handler
function onChangeAcc()
{
	var srcid, destid, amount, transcurr, chargeoff, exchange, exchrate, charge;
	var sync = false;

	srcid = ge('srcid');
	destid = ge('destid');
	amount = ge('amount');
	transcurr = ge('transcurr');
	chargeoff = ge('chargeoff');
	exchange = ge('exchange');
	exchrate = ge('exchrate');
	charge = ge('charge');
	if ((!srcid && !destid) || !amount || !transcurr  || !chargeoff || !exchange || !exchrate || !charge)
		return false;

	if (trans_curr == trans_acc_curr)				// currency of transaction is the same as currency of account
		sync = true;

	trans_acc_curr = getCurrencyOfAccount(selectedValue(srcid ? srcid : destid));
	if (sync)
		selectByValue(transcurr, trans_acc_curr);	// update currency of transaction

	trans_curr = selectedValue(transcurr);

	// hide charge and exchange rate if new currencies is the same
	if (trans_curr == trans_acc_curr)
	{
		chargeoff.style.display = 'none';
		exchange.style.display = 'none';
		exchrate.value = 1;
		charge.value = amount.value;

		getValues();
		if (d !== '' && a !== '')
		{
			f5();
			f1();
			setValues();
		}
	}

	setSign(false, trans_acc_curr);
	setSign(true, trans_curr);
}


// Show list of currencies
function showCurrList()
{
	var transcurr, ancurrbtn;

	transcurr = ge('transcurr');
	ancurrbtn = ge('ancurrbtn');
	if (!transcurr || !ancurrbtn)
		return;

	transcurr.style.display = '';
	ancurrbtn.style.display = 'none';
}


// Check selected currencies is different
function isDiffCurr()
{
	var src, dest;

	src = ge('srcid');
	dest = ge('destid');

	if (!src || !dest)
		return false;

	return (getCurrencyOfAccount(selectedValue(src)) != getCurrencyOfAccount(selectedValue(dest)));
}


// Transfer transaction submit event handler
function onTransferSubmit(frm)
{
	var amount, charge, exchrate, trdate;

	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	trdate = ge('date');
	if (!frm || !amount || !charge || !exchrate || !trdate)
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
	frm.submit();

	return true;
}


// Update controls of transfer transaction form
function updControls()
{
	var src, dest, amount, charge, exchrate, chargeoff, exchange, resbal, dstyle, transcurr;

	src = ge('srcid');
	dest = ge('destid');
	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	chargeoff = ge('chargeoff');
	exchange = ge('exchange');
	resbal = ge('resbal');
	if (!src || !dest || !amount || !charge || !exchrate || !chargeoff || !exchange || !resbal)
		return;

	exchange.value = '';
	if (isDiffCurr())
	{
		dstyle = '';
		charge.value = '';
		resbal.value = '';
	}
	else
	{
		dstyle = 'none';
		charge.value = amount.value;
		exchrate.value = 1;
		resbal.value = getBalanceOfAccount(selectedValue(src)) - amount.value;
	}

	chargeoff.style.display = dstyle;
	exchange.style.display = dstyle;

	amountCurr = getCurrencyOfAccount(selectedValue(dest));
	chargeCurr = getCurrencyOfAccount(selectedValue(src));

	if (trans_type == 3)
	{
		transcurr = ge('transcurr');
		if (transcurr)
			transcurr.value = amountCurr;
	}

	setSign(false, chargeCurr);
	setSign(true, amountCurr);
}


// Source account change event handler
function onChangeSource()
{
	var src, dest;

	src = ge('srcid');
	dest = ge('destid');

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

	src = ge('srcid');
	dest = ge('destid');
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
	var exchcomm, transcurr, accid, taccid;
	var chargeSign, amountSign;
	var invExch;

	exchcomm = ge('exchcomm');
	if (trans_type == 1 || trans_type == 2)
		transcurr = ge('transcurr');
	accid = ge((trans_type == 2) ? 'destid' : 'srcid');
	if (trans_type == 3)
		taccid = ge('destid');
	if (!exchcomm || !accid || (!transcurr && !taccid))
		return;

	if (fe == 1.0)
	{
		exchcomm.innerHTML = '';
	}
	else
	{
		if ((transcurr && transcurr.selectedIndex == -1) || (taccid && taccid.selectedIndex == -1) || accid.selectedIndex == -1)
			return;

		chargeSign = getCurrencySign(getCurrencyOfAccount(selectedValue(accid)));
		if (trans_type == 3)
			amountSign = getCurrencySign(getCurrencyOfAccount(selectedValue(taccid)));
		else
			amountSign = getCurrencySign(selectedValue(transcurr));

		invExch = parseFloat((1 / fe).toFixed(5));

		exchcomm.innerHTML = chargeSign + '/' + amountSign + ' ('  + invExch + ' ' + amountSign + '/' + chargeSign + ')';
	}
}


// Get values of transaction from input fields
function getValues()
{
	var accid, amount, charge, exchrate, resbal;

	accid = ge((trans_type == 2) ? 'destid' : 'srcid');
	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	resbal = ge('resbal');
	if (!accid || !amount || !charge || !exchrate || !resbal)
		return;

	S1 = getBalanceOfAccount(selectedValue(accid));
	a = amount.value;
	d = charge.value;
	e = exchrate.value;
	S2 = resbal.value;

	s1valid = (S1 !== '');
	s2valid = (S2 !== '');
	dvalid = (d !== '');
	evalid = (e !== '');
	avalid = (a !== '');

	fS1 = (s1valid) ? parseFloat(fixFloat(S1)) : S1;
	fS2 = (s2valid) ? parseFloat(fixFloat(S2)) : S2;
	fd = (dvalid) ? parseFloat(fixFloat(d)) : d;
	fe = (evalid) ? parseFloat(fixFloat(e)) : e;
	fa = (avalid) ? parseFloat(fixFloat(a)) : a;
}


// Set value of input fields
function setValues()
{
	var amount, charge, exchrate, resbal;

	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	resbal = ge('resbal');
	if (!amount || !charge || !exchrate || !resbal)
		return;

	amount.value = a;
	charge.value = d;
	exchrate.value = e;
	resbal.value = S2;
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

	setValues();

	return true;
}


// Currency of transaction change event handler
function onChangeTransCurr()
{
	var accid, amount, transcurr, chargeoff, exchange, exchrate, charge;
	var amountCurr, chargeCurr;

	accid = ge((trans_type == 2) ? 'destid' : 'srcid');
	amount = ge('amount');
	transcurr = ge('transcurr');
	chargeoff = ge('chargeoff');
	exchange = ge('exchange');
	exchrate = ge('exchrate');
	charge = ge('charge');
	if (!accid || !amount || !transcurr || !chargeoff || !exchange || !exchrate || !charge)
		return;
	if (transcurr.selectedIndex == -1 || accid.selectedIndex == -1)
		return

	amountCurr = selectedValue(transcurr);
	chargeCurr = getCurrencyOfAccount(selectedValue(accid));

	if (amountCurr == chargeCurr)
	{
		chargeoff.style.display = 'none';
		exchange.style.display = 'none';
		exchrate.value = 1;
		charge.value = amount.value;

		getValues();
		if (d !== '' && a !== '')
		{
			f5();
			f1();
			setValues();
		}
	}
	else
	{
		chargeoff.style.display = '';
		exchange.style.display = '';
	}

	trans_curr = amountCurr;

	setSign(false, chargeCurr);
	setSign(true, amountCurr);
}
