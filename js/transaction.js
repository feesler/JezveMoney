// Spend/Income transaction event handler
function onSubmit(frm)
{
	var accid, amount, trdate;

	accid = ge('accid');
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

	frm.submit();

	return true;
}


// Change account event handler
function onChangeAcc()
{
	var accid, amountsign;

	accid = ge('accid');
	amountsign = ge('amountsign');
	if (!accid || !amountsign)
		return false;

	amountsign.innerHTML = acccur[accid.selectedIndex][1];
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

	return (acccur[src.selectedIndex][0] != acccur[dest.selectedIndex][0]);
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
	var src, dest, amount, charge, exchrate, chargeoff, exchange, amountsign, chargesign, dstyle;

	src = ge('srcid');
	dest = ge('destid');
	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	chargeoff = ge('chargeoff');
	exchange = ge('exchange');
	chargesign = ge('chargesign');
	amountsign = ge('amountsign');

	if (!src || !dest || !amount || !charge || !exchrate || !chargeoff || !exchange || !amountsign || !chargesign)
		return;

	exchange.value = '';
	if (isDiffCurr())
	{
		dstyle = '';
		charge.value = '';
	}
	else
	{
		dstyle = 'none';
		charge.value = amount.value;
	}

	chargeoff.style.display = dstyle;
	exchange.style.display = dstyle;

	amountsign.innerHTML = acccur[src.selectedIndex][1];
	chargesign.innerHTML = acccur[dest.selectedIndex][1];
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
			dest.selectedIndex = accounts - 1;
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
		if (src.selectedIndex == accounts - 1)
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
