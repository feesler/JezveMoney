function TransactionViewModel()
{
	var self = this;

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
		resBalanceSwitch(false);
		resBalanceDestSwitch(false);
	}


	// Result balance static click event handler
	function onResBalanceSelect()
	{
		resBalanceSwitch(true);
		resBalanceDestSwitch(false);
		destAmountSwitch(false);
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


	// Hide both source amount and exchange rate controls
	function hideSrcAmountAndExchange()
	{
		show('src_amount_row', false);
		show('src_amount_left',  false);

		show('exchange', false);
		show('exch_left', false);
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


		if (Transaction.isTransfer())
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

		if (Transaction.isTransfer())
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


	// Source currency select callback
	function onSrcCurrencySel(obj)
	{
		var src_curr;

		if (!obj)
			return;
		src_curr = ge('src_curr');
		if (!src_curr)
			return;

		src_curr.value = obj.id;

		onChangeSrcCurr();
	}


	// Destination currency select callback
	function onDestCurrencySel(obj)
	{
		var dest_curr;

		if (!obj)
			return;
		dest_curr = ge('dest_curr');
		if (!dest_curr)
			return;

		dest_curr.value = obj.id;

		onChangeDestCurr();
	}


	var isMobile;
	var persDDList = null, accDDList = null;


	// Initialization of DDList control for account tile
	function initAccList()
	{
		if (accDDList)
			return;

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


	// Initialization of page controls
	this.initControls = function()
	{
		var elem, srcDDList, destDDList, srcCurrDDList, destCurrDDList;

		isMobile = (document.documentElement.clientWidth < 700);

		if (edit_mode)
		{
			elem = firstElementChild(ge('del_btn'))
			if (elem)
				elem.onclick = onDelete;
		}

		setParam(ge('src_amount_b'), { onclick : onSrcAmountSelect });
		setParam(ge('dest_amount_b'), { onclick : onDestAmountSelect });
		setParam(ge('exchrate_b'), { onclick : onExchRateSelect });
		setParam(ge('resbal_b'), { onclick : onResBalanceSelect });
		setParam(ge('resbal_d_b'), { onclick : onResBalanceDestSelect });

		var finpFunc = function(e){ return onFInput(this); };
		var fkeyFunc = function(e){ return onFieldKey(e, this); };

		elem = ge('src_amount');
		setParam(elem, { oninput : finpFunc.bind(elem), onkeypress : fkeyFunc.bind(elem) });
		elem = ge('dest_amount');
		setParam(elem, { oninput : finpFunc.bind(elem), onkeypress : fkeyFunc.bind(elem) });
		elem = ge('exchrate');
		setParam(elem, { oninput : finpFunc.bind(elem), onkeypress : fkeyFunc.bind(elem) });
		elem = ge('resbal');
		setParam(elem, { oninput : finpFunc.bind(elem), onkeypress : fkeyFunc.bind(elem) });
		elem = ge('resbal_d');
		setParam(elem, { oninput : finpFunc.bind(elem), onkeypress : fkeyFunc.bind(elem) });

		setParam(firstElementChild(ge('calendar_btn')), { onclick : showCalendar });
		setParam(ge('cal_rbtn'), { onclick : showCalendar });

		setParam(firstElementChild(ge('comm_btn')), { onclick : showComment });

		Transaction.set('exchrate', ge('exchrate').value);
		if (Transaction.isExpense())
			Transaction.set('src_initbal', getBalanceOfAccount(ge('src_id').value));
		else if (Transaction.isIncome())
			Transaction.set('dest_initbal', getBalanceOfAccount(ge('dest_id').value));
		else if (Transaction.isTransfer())
		{
			Transaction.set('src_initbal', getBalanceOfAccount(ge('src_id').value));
			Transaction.set('dest_initbal', getBalanceOfAccount(ge('dest_id').value));
		}
		else if (Transaction.isDebt())
		{
			var p_bal = getCurPersonBalance(Transaction.srcCurr());
			var acc_bal;

			if (Transaction.debtType())
				Transaction.set('src_initbal', p_bal);
			else
				updateValue('dest_initbal', p_bal);

			if (!Transaction.noAccount())
			{
				acc_bal = getBalanceOfAccount(ge('acc_id').value);

				if (Transaction.debtType())
					Transaction.set('dest_initbal', acc_bal);
				else
					updateValue('src_initbal', acc_bal);
			}
		}

		Transaction.subscribe('src_amount', onValueChanged.bind(null, 'src_amount'));
		Transaction.subscribe('dest_amount', onValueChanged.bind(null, 'dest_amount'));
		Transaction.subscribe('exchrate', onValueChanged.bind(null, 'exchrate'));
		Transaction.subscribe('src_resbal', onValueChanged.bind(null, 'src_resbal'));
		Transaction.subscribe('dest_resbal', onValueChanged.bind(null, 'dest_resbal'));

		if (Transaction.isDebt())
		{
			elem = firstElementChild(ge('noacc_btn'));
			if (elem)
				elem.onclick = toggleEnableAccount;
			elem = firstElementChild(ge('selaccount'));
			if (elem)
				elem.onclick = toggleEnableAccount;

			elem = ge('debtgive');
			if (elem)
				elem.onclick = onChangeDebtOp;
			elem = ge('debttake');
			if (elem)
				elem.onclick = onChangeDebtOp;


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

			if (!Transaction.noAccount())
				initAccList();
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


		if (Transaction.isIncome() || (Transaction.isDebt() && !Transaction.debtType()))
		{
			srcCurrDDList = new DDList();
			if (srcCurrDDList.create({ input_id : 'srcamountsign', itemPrefix : 'srccurr', listAttach : true, selCB : onSrcCurrencySel, editable : false, mobile : isMobile }))
			{
				currency.forEach(function(curr)
				{
					curr_id = curr[0];
					currName = curr[1];

					srcCurrDDList.addItem(curr_id, currName);
				});
			}
			else
				srcCurrDDList = null;
		}

		if (Transaction.isExpense() || (Transaction.isDebt() && Transaction.debtType()))
		{
			destCurrDDList = new DDList();
			if (destCurrDDList.create({ input_id : 'destamountsign', itemPrefix : 'destcurr', listAttach : true, selCB : onDestCurrencySel, editable : false, mobile : isMobile }))
			{
				currency.forEach(function(curr)
				{
					curr_id = curr[0];
					currName = curr[1];

					destCurrDDList.addItem(curr_id, currName);
				});
			}
			else
				destCurrDDList = null;
		}
	}


	// Account disable button click event handler
	function toggleEnableAccount()
	{
		var acclbl, source, dest_amount_left, acc_id, src_curr, curr;

		acclbl = ge('acclbl');
		source = ge('source');
		acc_id = ge('acc_id');
		src_curr = ge('src_curr');
		if (!acclbl || !source || !acc_id || !src_curr)
			return;

		if (Transaction.noAccount())
		{
			acclbl.innerHTML = (Transaction.debtType()) ? 'Destination account' : 'Source account';
		}
		else
		{
			acclbl.innerHTML = 'No account';
		}

		show('noacc_btn', Transaction.noAccount());
		show(nextElementSibling(firstElementChild(source)), Transaction.noAccount());
		show(nextElementSibling(nextElementSibling(firstElementChild(source))), Transaction.noAccount());
		show('selaccount', !Transaction.noAccount());

		srcAmountSwitch(true);
		resBalanceSwitch(false);
		resBalanceDestSwitch(false);

		Transaction.update('no_account', !Transaction.noAccount());

		if (Transaction.noAccount())
		{
			Transaction.update('last_acc', parseInt(acc_id.value));
			acc_id.value = 0;

			curr = parseInt(src_curr.value);
		}
		else
		{
			acc_id.value = Transaction.lastAcc_id();

			curr = getCurrencyOfAccount(Transaction.lastAcc_id());
		}
		Transaction.update('src_curr', curr);
		Transaction.update('dest_curr', curr);

		onChangeAcc();

		if (!Transaction.noAccount() && !accDDList)
		{
			initAccList();
		}
	}


	// Set currency button active/inactive
	function setCurrActive(src, act)
	{
		var amountRow, currContainer, currBtn, inputContainer;

		amountRow = ge((src) ? 'src_amount_row' : 'dest_amount_row');
		if (!amountRow || !firstElementChild(amountRow) || !nextElementSibling(firstElementChild(amountRow)))
			return;

		currContainer = firstElementChild(nextElementSibling(firstElementChild(amountRow)));
		if (!currContainer)
			return;

		currBtn = firstElementChild(currContainer);
		inputContainer = nextElementSibling(currContainer);
		if (!currBtn || !inputContainer)
			return;

		if (act)
		{
			removeClass(currBtn, 'inact_rbtn');
			removeClass(inputContainer, 'trans_input');
			addClass(inputContainer, 'rbtn_input');
		}
		else
		{
			addClass(currBtn, 'inact_rbtn');
			addClass(inputContainer, 'trans_input');
			removeClass(inputContainer, 'rbtn_input');
		}
	}


	// Set full/short text for source or destination input label
	function setAmountInputLabel(src, full)
	{
		var amountRow, lblObj;

		amountRow = ge((src) ? 'src_amount_row' : 'dest_amount_row');
		if (!amountRow || !firstElementChild(amountRow))
			return;

		lblObj = firstElementChild(firstElementChild(amountRow));
		if (!lblObj)
			return;

		if (full)
			lblObj.innerHTML = (src) ? 'Source amount' : 'Destination amount';
		else
			lblObj.innerHTML = 'Amount';
	}


	// Set full/short text for source or destination amount tile block label
	function setAmountTileBlockLabel(src, full)
	{
		var amountBlock, lblObj;

		amountBlock = ge((src) ? 'src_amount_left' : 'dest_amount_left');
		if (!amountBlock)
			return;

		lblObj = firstElementChild(amountBlock);
		if (!lblObj)
			return;

		if (full)
			lblObj.innerHTML = (src) ? 'Source amount' : 'Destination amount';
		else
			lblObj.innerHTML = 'Amount';
	}


	// Set source amount value at View
	function setSrcAmount(val)
	{
		var src_amount, src_amount_b;

		if (val === undefined)
			return;

		src_amount = ge('src_amount');
		src_amount_b = ge('src_amount_b');

		if (src_amount)
			src_amount.value = val;
		if (src_amount_b)
			firstElementChild(src_amount_b).innerHTML = formatCurrency((isValidValue(val) ? val : 0), Transaction.srcCurr());
	}


	// Set destination amount value at View
	function setDestAmount(val)
	{
		var dest_amount, dest_amount_b;

		if (val === undefined)
			return;

		dest_amount = ge('dest_amount');
		dest_amount_b = ge('dest_amount_b');

		if (dest_amount)
			dest_amount.value = val;
		if (dest_amount_b)
			firstElementChild(dest_amount_b).innerHTML = formatCurrency((isValidValue(val) ? val : 0), Transaction.destCurr());
	}


	// Set exchange rate value at View
	function setExchRate(val)
	{
		var exchrate, exchcomm, exchrate_b;
		var exchText;

		if (val === undefined)
			return;

		exchrate = ge('exchrate');
		exchcomm = ge('exchcomm');
		exchrate_b = ge('exchrate_b');

		srcAmountSign = getCurrencySign(Transaction.srcCurr());
		destAmountSign = getCurrencySign(Transaction.destCurr());

		if (exchrate)
			exchrate.value = val;

		exchText = destAmountSign + '/' + srcAmountSign;

		if (isValidValue(val) && val != 1 && val != 0)
		{
			invExch = parseFloat((1 / val).toFixed(5));

			exchText = destAmountSign + '/' + srcAmountSign + ' ('  + invExch + ' ' + srcAmountSign + '/' + destAmountSign + ')';
		}

		if (exchrate_b)
			firstElementChild(exchrate_b).innerHTML = val + ' ' + exchText;
	}


	// Set result balance of source value at View
	function setSrcResultBalance(val, valid)
	{
		var resbal, resbal_b, fmtBal;

		if (val === undefined && valid === undefined)
			return;

		resbal = ge('resbal');
		resbal_b = firstElementChild(ge('resbal_b'));

		if (resbal)
			resbal.value = val;

		fmtBal = formatCurrency((isValidValue(val) ? val : valid), Transaction.srcCurr());
		if (resbal_b)
			resbal_b.innerHTML = fmtBal;
	}


	// Set result balance of destination value at View
	function setDestResultBalance(val, valid)
	{
		var resbal_d, resbal_d_b, fmtBal;

		if ((val === undefined && valid === undefined) || Transaction.isExpense())
			return;

		resbal_d = ge('resbal_d');
		resbal_d_b = firstElementChild(ge('resbal_d_b'));

		if (resbal_d)
			resbal_d.value = val;

		fmtBal = formatCurrency((isValidValue(val) ? val : valid), Transaction.destCurr());
		if (resbal_d_b)
			resbal_d_b.innerHTML = fmtBal;
	}


	// Update information on person tile on currency change
	function updatePersonTile()
	{
		var person_tile, person_id, personname, pbalance, resbal_b;
		var curr;

		if (!Transaction.isDebt())
			return;

		person_tile = ge('person_tile');
		person_id = ge('person_id');
		resbal_b = ge('resbal_b');
		if (!person_tile || !person_id || !resbal_b)
			return;

		personname = getPersonName(person_id.value);
		curr = Transaction.debtType() ? Transaction.srcCurr() : Transaction.destCurr();

		pbalance = getCurPersonBalance(curr);
		setTileInfo(person_tile, personname, formatCurrency(pbalance, curr));
	}


	// Update currency signs near to input fields
	function updateCurrSigns()
	{
		setSign('destamountsign', Transaction.destCurr());
		setSign('srcamountsign', Transaction.srcCurr());
		setSign('res_currsign', Transaction.srcCurr());
		setSign('res_currsign_d', Transaction.destCurr());
	}

}
