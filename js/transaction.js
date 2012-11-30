// Return value of selected option of select object
function selectedValue(selectObj)
{
	if (!selectObj || !selectObj.options || selectObj.selectedIndex == -1)
		return -1;

	return selectObj.options[selectObj.selectedIndex].value
}


// Select item with specified value if exist
function selectByValue(selectObj, selValue)
{
	var i;

	if (!selectObj || !selectObj.options)
		return -1;

	for(i = 0, l = selectObj.options.length; i < l; i++)
	{
		if (selectObj.options[i] && selectObj.options[i].value == selValue)
		{
			selectObj.selectedIndex = i;
			return true;
		}
	}

	return false;
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
	var srcid, destid, amount, transcurr, chargeoff, amountsign, exchange, exchrate, charge, chargesign;
	var sync = false;

	srcid = ge('srcid');
	destid = ge('destid');
	amount = ge('amount');
	transcurr = ge('transcurr');
	chargeoff = ge('chargeoff');
	exchange = ge('exchange');
	exchrate = ge('exchrate');
	charge = ge('charge');
	chargesign = ge('chargesign');
	amountsign = ge('amountsign');
	if ((!srcid && !destid) || !amount || !transcurr  || !chargeoff || !exchange || !exchrate || !charge || !chargesign || !amountsign)
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
		f5();
		f1();
		setValues();
	}

	chargesign.innerHTML = getCurrencySign(trans_acc_curr);
	amountsign.innerHTML = getCurrencySign(trans_curr);
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
	var src, dest, amount, charge, exchrate, chargeoff, exchange, amountsign, chargesign, resbal, dstyle;

	src = ge('srcid');
	dest = ge('destid');
	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	chargeoff = ge('chargeoff');
	exchange = ge('exchange');
	chargesign = ge('chargesign');
	amountsign = ge('amountsign');
	resbal = ge('resbal');
	if (!src || !dest || !amount || !charge || !exchrate || !chargeoff || !exchange || !amountsign || !chargesign || !resbal)
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

	chargesign.innerHTML = getCurrencySign(chargeCurr);
	amountsign.innerHTML = getCurrencySign(amountCurr);
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


// Get values of transaction from input fields
function getValues()
{
	var accid, amount, charge, exchrate, resbal;

	accid = ge((trans_type == 1) ? 'srcid' : 'destid');
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


// Field input event handler
function onFInput(obj)
{
	var s1valid, s2valid, dvalid, evalid, avalid;

	getValues();

	s1valid = (S1 !== '');
	s2valid = (S2 !== '');
	dvalid = (d !== '');
	evalid = (e !== '');
	avalid = (a !== '');


	if (s1valid && s2valid && dvalid && evalid && avalid)
	{
		if (obj.id == 'charge')		// d is changed, update S2 and e
		{
			f5();
			f1();
		}
		else if (obj.id == 'resbal')	// S2 is changed, update d and e
		{
			f3();
			f5();
		}
		else if (obj.id == 'amount' || obj.id == 'exchrate')	// a or e is changed, update S2 and d
		{
			f2();
			f1();
		}
	}
	else if (e == 1)		// account currency is the same as operation currency
	{
		d = a;
		f1();
	}
	else				// account currency is different from operation currency
	{
		if (s1valid && evalid && s2valid)
		{
			f3();
			f4();
		}
		else if (s1valid && evalid && avalid)
		{
			f2();
			f1();
		}
		else if (s1valid && evalid && dvalid)
		{
			f1();
			f4();
		}
		else if (s1valid && s2valid && avalid)
		{
			f3();
			f5();
		}
		else if (s1valid && s2valid && dvalid && !evalid && !avalid)
		{
			return;
		}
		else if (s1valid && avalid && dvalid)
		{
			f1();
			f5();
		}
	}

	setValues();

	return true;
}


// Currency of transaction change event handler
function onChangeTransCurr()
{
	var accid, amount, transcurr, chargeoff, exchange, exchrate, charge, chargesign, amountsign;
	var amountCurr, chargeCurr;

	accid = ge((trans_type == 1) ? 'srcid' : 'destid');
	amount = ge('amount');
	transcurr = ge('transcurr');
	chargeoff = ge('chargeoff');
	exchange = ge('exchange');
	exchrate = ge('exchrate');
	charge = ge('charge');
	chargesign = ge('chargesign');
	amountsign = ge('amountsign');
	if (!accid || !amount || !transcurr || !chargeoff || !exchange || !exchrate || !charge || !chargesign || !amountsign)
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
		f5();
		f1();
		setValues();
	}
	else
	{
		chargeoff.style.display = '';
		exchange.style.display = '';
	}

	trans_curr = amountCurr;

	chargesign.innerHTML = getCurrencySign(chargeCurr);
	amountsign.innerHTML = getCurrencySign(amountCurr);
}
