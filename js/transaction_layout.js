var calendarObj = null;


// Create calendar for select date of transaction
function buildCalendar()
{
	var today = new Date();

	return createCalendar(today.getDate(), today.getMonth(), today.getFullYear(), onSelectDate);
}


// Hide calendar block
function hideCalendar()
{
	show('calendar', false);
}


// Date select callback
function onSelectDate(date, month, year)
{
	var datefield;

	datefield = ge('date');
	if (!datefield)
		return;

	datefield.value = formatDate(date, month, year);

	hideCalendar();
}


// Show calendar block
function showCalendar()
{
	if (!calendarObj)
	{
		calendarObj = ge('calendar');
		if (!calendarObj)
			return;

		calendarObj.appendChild(buildCalendar());
	}

	show(calendarObj, !isVisible(calendarObj));
	show('calendar_btn', false);
	show('date_block', true);

	setEmptyClick(hideCalendar, ['calendar', 'calendar_btn', 'cal_rbtn']);
}


// Show comment field
function showComment()
{
	var comm_btn, comment_block, comm;

	comm_btn = ge('comm_btn');
	comment_block = ge('comment_block');
	comm = ge('comm');
	if (!comm_btn || !comment_block || !comm)
		return;

	show(comm_btn, false);
	show(comment_block, true);
	comm.focus();
}


// Common function for toggle switch
function commonSwitch(input_block_id, static_block_id, input_id, showInput)
{
	var inpObj = ge(input_id);
	showInput = showInput | false;

	show(input_block_id, showInput);
	show(static_block_id, !showInput);

	if (showInput && inpObj)
		inpObj.focus();
}


// Show input control or static block for source amount value
function srcAmountSwitch(showInput)
{
	commonSwitch('src_amount_row', 'src_amount_left', 'src_amount', showInput);
}


// Show input control or static block for destination amount value
function destAmountSwitch(showInput)
{
	commonSwitch('dest_amount_row', 'dest_amount_left', 'dest_amount', showInput);
}


// Show input control or static block for result balance value
function resBalanceSwitch(showInput)
{
	commonSwitch('result_balance', 'src_res_balance_left', 'resbal', showInput);
}


// Show input control or static block for result balance value
function resBalanceDestSwitch(showInput)
{
	commonSwitch('result_balance_dest', 'dest_res_balance_left', 'resbal_d', showInput);
}


// Show input control or static block for exchange rate value
function exchRateSwitch(showInput)
{
	commonSwitch('exchange', 'exch_left', 'exchrate', showInput);
}


// Source amount static click event handler
function onSrcAmountSelect()
{
	srcAmountSwitch(true);
	resBalanceSwitch(false);
	resBalanceDestSwitch(false);
}


// Destination amount static click event handler
function onDestAmountSelect()
{
	destAmountSwitch(true);
	exchRateSwitch(false);
}


// Result balance static click event handler
function onResBalanceSelect()
{
	resBalanceSwitch(true);
	resBalanceDestSwitch(false);
	srcAmountSwitch(false);
}


// Result balance static click event handler
function onResBalanceDestSelect()
{
	resBalanceSwitch(false);
	resBalanceDestSwitch(true);
	srcAmountSwitch(false);
}


// Exchange rate static click event handler
function onExchRateSelect()
{
	exchRateSwitch(true);
	destAmountSwitch(false);
}


// Hide both destination amount and exchange rate controls
function hideDestAmountAndExchange()
{
	show('dest_amount_row', false);
	show('dest_amount_left',  false);

	show('exchange', false);
	show('exch_left', false);
}


// Source account select callback
function onSrcAccSel(obj)
{
	var src_id;

	if (!obj)
		return;
	src_id = ge('src_id');
	if (!src_id)
		return;

	src_id.value = obj.id;


	if (trans_type == 3)
		onChangeSource();
	else
		onChangeAcc();
}


// Destination account select callback
function onDestAccSel(obj)
{
	var dest_id;

	if (!obj)
		return;
	dest_id = ge('dest_id');
	if (!dest_id)
		return;

	dest_id.value = obj.id;

	if (trans_type == 3)
		onChangeDest();
	else
		onChangeAcc();
}


// Debt account select callback
function onDebtAccSel(obj)
{
	var acc_id;

	if (!obj)
		return;
	acc_id = ge('acc_id');
	if (!acc_id)
		return;

	acc_id.value = obj.id;

	onChangeAcc();
}


// Person select callback
function onPersAccSel(obj)
{
	var personid;

	if (!obj)
		return;

	personid = ge('person_id');
	if (!personid)
		return;

	personid.value = obj.id;

	onPersonSel();
}


// Currency select callback
function onCurrencySel(obj)
{
	var transcurr;

	if (!obj)
		return;
	transcurr = ge('transcurr');
	if (!transcurr)
		return;

	transcurr.value = obj.id;

	onChangeTransCurr();
}


// Initialization of page controls
function initControls()
{
	var isMobile;
	var srcDDList, destDDList, transCurrDDList;

	isMobile = (document.documentElement.clientWidth < 700);

	if (isDebt())
	{
		var persDDList, accDDList;

		persDDList = new DDList();
		if (persDDList.create({ input_id : 'person_tile', itemPrefix : 'pers', listAttach : true, selCB : onPersAccSel, editable : false, mobile : isMobile }))
		{
			persons.forEach(function(person)
			{
				persId = person[0];
				persName = person[1];
	
				persDDList.addItem(persId, persName);
			});
		}
		else
			persDDList = null;

		accDDList = new DDList();
		if (accDDList.create({ input_id : 'acc_tile', itemPrefix : 'acc', listAttach : true, selCB : onDebtAccSel, editable : false, mobile : isMobile }))
		{
			accounts.forEach(function(acc)
			{
				accId = acc[0];
				accName = acc[4];
	
				accDDList.addItem(accId, accName);
			});
		}
		else
			accDDList = null;
	}
	else
	{
		srcDDList = new DDList();
		if (srcDDList.create({ input_id : 'source_tile', itemPrefix : 'src', listAttach : true, selCB : onSrcAccSel, editable : false, mobile : isMobile }))
		{
			accounts.forEach(function(acc)
			{
				accId = acc[0];
				accName = acc[4];

				srcDDList.addItem(accId, accName);
			});
		}
		else
			srcDDList = null;

		destDDList = new DDList();
		if (destDDList.create({ input_id : 'dest_tile', itemPrefix : 'dest', listAttach : true, selCB : onDestAccSel, editable : false, mobile : isMobile }))
		{
			accounts.forEach(function(acc)
			{
				accId = acc[0];
				accName = acc[4];

				destDDList.addItem(accId, accName);
			});
		}
		else
			destDDList = null;
	}


	if (!isTransfer())
	{
		transCurrDDList = new DDList();
		if (transCurrDDList.create({ input_id : 'srcamountsign', itemPrefix : 'curr', listAttach : true, selCB : onCurrencySel, editable : false, mobile : isMobile }))
		{
			currency.forEach(function(curr)
			{
				curr_id = curr[0];
				currName = curr[1];

				transCurrDDList.addItem(curr_id, currName);
			});
		}
		else
			transCurrDDList = null;
	}
}


// Account disable button click event handler
function toggleEnableAccount()
{
	var acclbl, source, dest_amount_left, acc_id, transcurr;

	acclbl = ge('acclbl');
	source = ge('source');
	dest_amount_left = re('dest_amount_left');
	acc_id = ge('acc_id');
	transcurr = ge('transcurr');
	if (!acclbl || !source || !dest_amount_left || !acc_id || !transcurr)
		return;

	if (noAccount)
	{
		acclbl.innerHTML = (debtType) ? 'Destination account' : 'Source account';
		insertBefore(dest_amount_left, ge('dest_res_balance_left'));
	}
	else
	{
		acclbl.innerHTML = 'No account';
		insertBefore(dest_amount_left, ge('src_amount_left'));
	}

	show('noacc_btn', noAccount);
	show(source.firstElementChild.nextElementSibling, noAccount);
	show(source.firstElementChild.nextElementSibling.nextElementSibling, noAccount);
	show('selaccount', !noAccount);

	srcAmountSwitch(true);
	resBalanceSwitch(false);
	resBalanceDestSwitch(false);

	noAccount = !noAccount;

	if (noAccount)
	{
		lastAcc_id = parseInt(acc_id.value);
		acc_id.value = 0;
		trans_acc_curr = parseInt(transcurr.value);
	}
	else
	{
		acc_id.value = lastAcc_id;
		trans_acc_curr = getCurrencyOfAccount(lastAcc_id);
	}

	onChangeAcc();
}
