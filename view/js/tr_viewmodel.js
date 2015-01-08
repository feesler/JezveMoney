function TransactionViewModel()
{
	var self = this;

	var calendarObj = null;
	var isMobile;
	var accDDList = null;
	var dwPopup = null;		// delete warning popup
	var submitStarted = false;
	var singleTransDeleteTitle = 'Delete transaction';
	var singleTransDeleteMsg = 'Are you sure want to delete selected transaction?<br>Changes in the balance of affected accounts will be canceled.';


	// Date select callback
	function onSelectDate(date)
	{
		var datefield;

		datefield = ge('date');
		if (!datefield)
			return;

		datefield.value = Calendar.format(date);

		self.calendarObj.hide();
	}


	// Show calendar block
	function showCalendar()
	{
		if (!self.calendarObj)
		{
			self.calendarObj = Calendar.create({ wrapper_id : 'calendar', ondateselect : onSelectDate });
			if (!self.calendarObj)
				return;
		}

		self.calendarObj.show(!self.calendarObj.visible());

		show('calendar_btn', false);
		show('date_block', true);

		setEmptyClick(self.calendarObj.hide.bind(self.calendarObj), ['calendar', 'calendar_btn', 'cal_rbtn']);
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

		if (!Transaction.noAccount() && !self.accDDList)
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

		if (self.submitStarted)
			return false;

		srcid = ge('src_id');
		destid = ge('dest_id');
		src_amount = ge('src_amount');
		dest_amount = ge('dest_amount');
		trdate = ge('date');
		submitbtn = ge('submitbtn');
		if (!frm || (!srcid && !destid) || !src_amount || !dest_amount || !trdate || !submitbtn)
			return false;

		if (Transaction.isExpense())
		{
			if (!dest_amount.value || !dest_amount.value.length || !isNum(fixFloat(dest_amount.value)))
			{
				alert('Please input correct amount.');
				return false;
			}
		}
		else if (Transaction.isIncome())
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

		self.submitStarted = true;
		enable(submitbtn, false);

		return true;
	}


	// Delete transaction icon link click event handler
	function onDelete()
	{
		showDeletePopup();
	}


	// Delete popup callback
	function onDeletePopup(res)
	{
		var delform;

		if (!self.dwPopup)
			return;

		self.dwPopup.close();
		self.dwPopup = null;

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
		if (self.dwPopup)
			return;

		self.dwPopup = new Popup();
		if (!self.dwPopup)
			return;

		if (!self.dwPopup.create({ id : 'delete_warning',
							title : singleTransDeleteTitle,
							msg : singleTransDeleteMsg,
							btn : { okBtn : { onclick : onDeletePopup.bind(null, true) },
							cancelBtn : { onclick : onDeletePopup.bind(null, false) } }
							}))
		{
			self.dwPopup = null;
			return;
		}

		self.dwPopup.show();
	}


	// Change account event handler
	function onChangeAcc()
	{
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

		if (self.submitStarted)
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

		if (Transaction.isDiff() && (!dest_amount.value || !dest_amount.value.length || !isNum(fixFloat(dest_amount.value))))
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

		self.submitStarted = true;
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
		var acclbl, debtgive, debttake, dType;
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

		dType = debtgive.checked;

		insertAfter(src_res_balance_left, (dType) ? exch_left : dest_amount_left);
		insertAfter(dest_res_balance_left, (dType) ? dest_amount_left : exch_left);

		Transaction.update('debt_type', dType);

		if (!Transaction.noAccount())
		{
			acclbl.innerHTML = (dType) ? 'Destination account' : 'Source account';
		}
	}


	// Person select event handler
	function onPersonSel()
	{
		var personid = ge('person_id');
		if (!personid)
			return;

		Transaction.update('person_id', personid.value);

		updatePersonTile();
	}


	// Debt form submit event handler
	function onDebtSubmit(frm)
	{
		var accid, src_amount, dest_amount, trdate;
		var submitbtn;

		if (self.submitStarted)
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

		if (Transaction.noAccount())
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

		self.submitStarted = true;
		enable(submitbtn, false);

		return true;
	}


	// Initialization of DDList control for account tile
	function initAccList()
	{
		if (self.accDDList)
			return;

		self.accDDList = new DDList();
		if (self.accDDList.create({ input_id : 'acc_tile', itemPrefix : 'acc', listAttach : true, selCB : onDebtAccSel, editable : false, mobile : self.isMobile }))
		{
			accounts.forEach(function(acc)
			{
				accId = acc[0];
				accName = acc[4];

				self.accDDList.addItem(accId, accName);
			});
		}
		else
			self.accDDList = null;
	}


	// Public methods

	// Initialization of page controls
	this.initControls = function()
	{
		var elem, srcDDList, destDDList, srcCurrDDList, destCurrDDList;

		self.isMobile = (document.documentElement.clientWidth < 700);

		// Init form submit event handler
		elem = ge('mainfrm');
		if (elem)
		{
			elem.onsubmit = function(e)
			{
				if (Transaction.isDebt())
					return onDebtSubmit(this);
				else if (Transaction.isTransfer() && !edit_mode)
					return onTransferSubmit(this);
				else
					return onSubmit(this);
			}
		}

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
			var persDDList;

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
			if (persDDList.create({ input_id : 'person_tile', itemPrefix : 'pers', listAttach : true, selCB : onPersAccSel, editable : false, mobile : self.isMobile }))
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
			if (srcDDList.create({ input_id : 'source_tile', itemPrefix : 'src', listAttach : true, selCB : onSrcAccSel, editable : false, mobile : self.isMobile }))
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
			if (destDDList.create({ input_id : 'dest_tile', itemPrefix : 'dest', listAttach : true, selCB : onDestAccSel, editable : false, mobile : self.isMobile }))
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
			if (srcCurrDDList.create({ input_id : 'srcamountsign', itemPrefix : 'srccurr', listAttach : true, selCB : onSrcCurrencySel, editable : false, mobile : self.isMobile }))
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
			if (destCurrDDList.create({ input_id : 'destamountsign', itemPrefix : 'destcurr', listAttach : true, selCB : onDestCurrencySel, editable : false, mobile : self.isMobile }))
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
}
