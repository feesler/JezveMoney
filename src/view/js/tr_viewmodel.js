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
			self.calendarObj = Calendar.create({ wrapper_id : 'calendar', relparent : ge('calendar').parentNode, ondateselect : onSelectDate });
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
		if (!Transaction.isDiff())
			resBalanceDestSwitch(false);
	}


	// Destination amount static click event handler
	function onDestAmountSelect()
	{
		destAmountSwitch(true);
		if (!Transaction.isDiff() || Transaction.isExpense())
			resBalanceSwitch(false);
		resBalanceDestSwitch(false);
		if (Transaction.isDiff())
			exchRateSwitch(false);
	}


	// Source result balance static click event handler
	function onResBalanceSelect()
	{
		resBalanceSwitch(true);
		if (!Transaction.isDiff())
			resBalanceDestSwitch(false);
		if (Transaction.isTransfer() || Transaction.isDebt())
			srcAmountSwitch(false);
		else
			destAmountSwitch(false);
		if (Transaction.isExpense() && Transaction.isDiff())
			exchRateSwitch(false);
	}


	// Destination result balance static click event handler
	function onResBalanceDestSelect()
	{
		resBalanceDestSwitch(true);
		if (Transaction.isDiff())
		{
			destAmountSwitch(false);
			exchRateSwitch(false);
		}
		else
		{
			resBalanceSwitch(false);
			srcAmountSwitch(false);
		}
	}


	// Exchange rate static click event handler
	function onExchRateSelect()
	{
		exchRateSwitch(true);
		destAmountSwitch(false);
		if (Transaction.isDiff())
		{
			if (Transaction.isExpense())
				resBalanceSwitch(false);
			else if (Transaction.isIncome() || Transaction.isTransfer())
				resBalanceDestSwitch(false);
		}
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
		show(source.firstElementChild.nextElementSibling, Transaction.noAccount());
		show(source.firstElementChild.nextElementSibling.nextElementSibling, Transaction.noAccount());
		show('selaccount', !Transaction.noAccount());

		Transaction.update('no_account', !Transaction.noAccount());

		if (Transaction.noAccount())
		{
			Transaction.update('last_acc', parseInt(acc_id.value));
			acc_id.value = 0;

			curr = parseInt(src_curr.value);
		}
		else
		{
			var lastAcc = getAccount(Transaction.lastAcc_id());
			acc_id.value = lastAcc.id;

			curr = lastAcc.curr_id;
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
		if (!amountRow || !amountRow.firstElementChild || !amountRow.firstElementChild.nextElementSibling)
			return;

		currContainer = amountRow.firstElementChild.nextElementSibling.firstElementChild;
		if (!currContainer)
			return;

		currBtn = currContainer.firstElementChild;
		inputContainer = currContainer.nextElementSibling;
		if (!currBtn || !inputContainer)
			return;

		if (act)
		{
			currBtn.classList.remove('inact_rbtn');
			inputContainer.classList.remove('trans_input');
			inputContainer.classList.add('rbtn_input');
		}
		else
		{
			currBtn.classList.add('inact_rbtn');
			inputContainer.classList.add('trans_input');
			inputContainer.classList.remove('rbtn_input');
		}
	}


	// Set full/short text for source or destination input label
	function setAmountInputLabel(src, full)
	{
		var amountRow, lblObj;

		amountRow = ge((src) ? 'src_amount_row' : 'dest_amount_row');
		if (!amountRow || !amountRow.firstElementChild)
			return;

		lblObj = amountRow.firstElementChild.firstElementChild;
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

		lblObj = amountBlock.firstElementChild;
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

		src_amount_b = ge('src_amount_b');
		if (src_amount_b && src_amount_b.firstElementChild)
			src_amount_b.firstElementChild.innerHTML = formatCurrency((isValidValue(val) ? val : 0), Transaction.srcCurr());

		if (val === undefined)
			return;

		src_amount = ge('src_amount');
		if (src_amount)
		{
			var sa = src_amount.value;
			var savalid = isValidValue(sa);
			var fsa = (savalid) ? normalize(sa) : sa;

			if (fsa != val)
				src_amount.value = val;
		}
	}


	// Set destination amount value at View
	function setDestAmount(val)
	{
		var dest_amount, dest_amount_b;

		dest_amount_b = ge('dest_amount_b');
		if (dest_amount_b && dest_amount_b.firstElementChild)
			dest_amount_b.firstElementChild.innerHTML = formatCurrency((isValidValue(val) ? val : 0), Transaction.destCurr());

		if (val === undefined)
			return;

		dest_amount = ge('dest_amount');
		if (dest_amount)
		{
			var da = dest_amount.value;
			var davalid = isValidValue(da);
			var fda = (davalid) ? normalize(da) : da;

			if (fda != val)
				dest_amount.value = val;
		}
	}


	// Set exchange rate value at View
	function setExchRate(val)
	{
		var exchrate, exchcomm, exchrate_b;
		var exchSigns, exchText, srcCurr, destCurr;

		if (val === undefined)
			return;

		exchrate = ge('exchrate');
		exchcomm = ge('exchcomm');
		exchrate_b = ge('exchrate_b');

		srcCurr = getCurrency(Transaction.srcCurr());
		destCurr = getCurrency(Transaction.destCurr());

		if (exchrate)
		{
			var e = exchrate.value;
			var evalid = isValidValue(e);
			var fe = (evalid) ? normalizeExch(e) : e;

			if (fe != val)
				exchrate.value = val;
		}

		val = normalizeExch(val);

		exchSigns = destCurr.sign + '/' + srcCurr.sign;
		exchcomm.innerHTML = exchSigns;

		exchText = exchSigns;
		if (isValidValue(val) && val != 1 && val != 0)
		{
			invExch = parseFloat((1 / val).toFixed(5));

			exchText += ' ('  + invExch + ' ' + srcCurr.sign + '/' + destCurr.sign + ')';
		}

		if (exchrate_b && exchrate_b.firstElementChild)
			exchrate_b.firstElementChild.innerHTML = val + ' ' + exchText;
	}


	// Set result balance of source value at View
	function setSrcResultBalance(val, valid)
	{
		var resbal, resbal_b, fmtBal;

		if (val === undefined && valid === undefined)
			return;

		resbal = ge('resbal');
		resbal_b = ge('resbal_b');

		if (resbal)
		{
			var s2_src = resbal.value;
			var s2valid = isValidValue(s2_src);
			var fs2_src = (s2valid) ? normalize(s2_src) : s2_src;

			if (fs2_src != val)
				resbal.value = val;
		}

		fmtBal = formatCurrency((isValidValue(val) ? val : valid), Transaction.srcCurr());
		if (resbal_b && resbal_b.firstElementChild)
			resbal_b.firstElementChild.innerHTML = fmtBal;
	}


	// Set result balance of destination value at View
	function setDestResultBalance(val, valid)
	{
		var resbal_d, resbal_d_b, fmtBal;

		if ((val === undefined && valid === undefined) || Transaction.isExpense())
			return;

		resbal_d = ge('resbal_d');
		resbal_d_b = ge('resbal_d_b');

		if (resbal_d)
		{
			var s2_dest = resbal_d.value;
			var s2valid = isValidValue(s2_dest);
			var fs2_dest = (s2valid) ? normalize(s2_dest) : s2_dest;

			if (fs2_dest != val)
				resbal_d.value = val;
		}

		fmtBal = formatCurrency((isValidValue(val) ? val : valid), Transaction.destCurr());
		if (resbal_d_b && resbal_d_b.firstElementChild)
			resbal_d_b.firstElementChild.innerHTML = fmtBal;
	}


	// Update information on person tile on currency change
	function updatePersonTile()
	{
		var person_tile, person_id, person, resbal_b;
		var curr, acc;

		if (!Transaction.isDebt())
			return;

		person_tile = ge('person_tile');
		person_id = ge('person_id');
		resbal_b = ge('resbal_b');
		if (!person_tile || !person_id || !resbal_b)
			return;

		person = getPerson(person_id.value);
		if (!person)
			return;
		curr = Transaction.debtType() ? Transaction.srcCurr() : Transaction.destCurr();

		acc = getPersonAccount(person_id.value, curr);
		pbalance = (acc) ? acc.balance : 0;

		setTileInfo(person_tile, person.name, formatCurrency(pbalance, curr));
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
		var signobj, curr;

		signobj = ge(obj);
		if (!signobj)
			return;

		curr = getCurrency(curr_id);
		if (!curr)
			return;

		signobj.innerHTML = curr.sign;
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

		if (self.dwPopup)
			self.dwPopup.close();

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
		if (!self.dwPopup)
		{
			self.dwPopup = Popup.create({ id : 'delete_warning',
							title : singleTransDeleteTitle,
							content : singleTransDeleteMsg,
							btn : { okBtn : { onclick : onDeletePopup.bind(null, true) },
							cancelBtn : { onclick : onDeletePopup.bind(null, false) } }
						});
		}

		self.dwPopup.show();
	}


	// Change account event handler
	function onChangeAcc()
	{
		var acc, acc_id, tile_id, copy_curr;
		var isDiff = Transaction.isDiff();

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

		if (Transaction.isExpense() || (Transaction.isDebt() && !Transaction.debtType()))
		{
			Transaction.update('src_id', acc_id);
			onSrcCurrChanged();
			if (!isDiff)
			{
				copy_curr = Transaction.srcCurr();
				Transaction.update('dest_curr', copy_curr);
				onDestCurrChanged(copy_curr);
			}
		}
		else if (Transaction.isIncome() || (Transaction.isDebt() && Transaction.debtType()))
		{
			Transaction.update('dest_id', acc_id);
			onDestCurrChanged();
			if (!isDiff)
			{
				copy_curr = Transaction.destCurr();
				Transaction.update('src_curr', copy_curr);
				onSrcCurrChanged(copy_curr);
			}
		}

		if (Transaction.isDebt())
		{
			updatePersonTile();

			var sa = Transaction.srcAmount();
			setSrcAmount(isValidValue(sa) ? sa : '');
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
		else if (item == 'src_curr')
			onSrcCurrChanged(value);
		else if (item == 'dest_curr')
			onDestCurrChanged(value);
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
	}


	// Update layout on source curency changed
	function onSrcCurrChanged(value)
	{
		if (value !== undefined)
		{
			var src_curr = ge('src_curr');

			if (src_curr)
				src_curr.value = value;
		}

		var am_s = isVisible('src_amount_row');
		var am_d = isVisible('dest_amount_row');
		var rbv_s = isVisible('result_balance');
		var rbv_d = isVisible('result_balance_dest');
		var exch = isVisible('exchange');

		if (Transaction.isDiff())
		{
			setAmountInputLabel(true, true);
			setAmountTileBlockLabel(true, true);
			setAmountInputLabel(false, true);
			setAmountTileBlockLabel(false, true);
			if (Transaction.isIncome())
			{
				setCurrActive(true, true);		// set source active
				setCurrActive(false, false);		// set destination inactive
			}

			var toShowDestAmount = false;
			if (Transaction.isTransfer())
				toShowDestAmount = !rbv_d && !(rbv_s && exch) && !(am_s && exch);
			else
				toShowDestAmount = !rbv_s && !rbv_d && !exch;
			destAmountSwitch(toShowDestAmount);

			if (Transaction.isTransfer())
				srcAmountSwitch(!rbv_s);

			if (!isVisible('exchange'))
				exchRateSwitch(false);
			setExchRate(Transaction.exchRate());
		}
		else
		{
			setAmountInputLabel(true, false);
			setAmountInputLabel(false, false);
			setAmountTileBlockLabel(true, false);
			setAmountTileBlockLabel(false, false);
			if (Transaction.isExpense())
				hideSrcAmountAndExchange();
			else if (Transaction.isIncome() || Transaction.isTransfer() || Transaction.isDebt())
				hideDestAmountAndExchange();

			if (Transaction.isIncome() || Transaction.isTransfer() || Transaction.isDebt())
				srcAmountSwitch(!rbv_d && !rbv_s);
			if (Transaction.isExpense())
				destAmountSwitch(!rbv_s);

			if (Transaction.isTransfer())
			{
				if (rbv_s && rbv_d)
					resBalanceDestSwitch(false);
			}
			else if (Transaction.isDebt())
			{
				if (Transaction.noAccount())
				{
					if (Transaction.debtType())
						resBalanceDestSwitch(false);
					else
						resBalanceSwitch(false);
				}
			}
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
	}


	// Update layout on destination curency changed
	function onDestCurrChanged(value)
	{
		if (value !== undefined)
		{
			var dest_curr = ge('dest_curr');

			if (dest_curr)
				dest_curr.value = value;
		}

		var am_s = isVisible('src_amount_row');
		var am_d = isVisible('dest_amount_row');
		var rbv_s = isVisible('result_balance');
		var rbv_d = isVisible('result_balance_dest');
		var exch = isVisible('exchange');

		if (Transaction.isDiff())
		{
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

			var toShowSrcAmount = false;
			if (Transaction.isIncome())
				toShowSrcAmount = (am_s && am_d) || (am_s && rbv_d) || (am_s && exch);
			else if (Transaction.isExpense())
				toShowSrcAmount = true;
			else if (Transaction.isTransfer())
				toShowSrcAmount = !rbv_s;
			srcAmountSwitch(toShowSrcAmount);

			if (Transaction.isTransfer())
				destAmountSwitch(!rbv_d && !(rbv_s && exch) && !(am_s && exch));

			if (!isVisible('exchange'))
				exchRateSwitch(false);
			setExchRate(Transaction.exchRate());
		}
		else
		{
			setAmountInputLabel(true, false);
			setAmountInputLabel(false, false);
			setAmountTileBlockLabel(true, false);
			setAmountTileBlockLabel(false, false);

			if (Transaction.isIncome() || Transaction.isTransfer() || Transaction.isDebt())
				srcAmountSwitch(!rbv_d && !rbv_s);
			if (Transaction.isExpense())
				destAmountSwitch(!rbv_s);

			if (Transaction.isIncome() || Transaction.isTransfer() || Transaction.isDebt())
				hideDestAmountAndExchange();
			else		// Expense
				hideSrcAmountAndExchange();

			if (Transaction.isTransfer())
			{
				if (rbv_s && rbv_d)
					resBalanceSwitch(false);
			}
			else if (Transaction.isDebt())
			{
				if (Transaction.noAccount())
				{
					if (Transaction.debtType())
						resBalanceDestSwitch(false);
					else
						resBalanceSwitch(false);
				}
			}
		}

		updateCurrSigns();
		updatePersonTile();
	}


	// Debt operation type change event handler
	function onChangeDebtOp()
	{
		var acclbl, debtgive, dType, rbv;
		var src_res_balance_left, dest_res_balance_left, dest_amount_left, exch_left;
		var resballbl;

		debtgive = ge('debtgive');
		if (!debtgive)
			return;

		dType = debtgive.checked;
		if (dType == Transaction.debtType())
			return;

		acclbl = ge('acclbl');
		src_res_balance_left = re('src_res_balance_left');
		dest_res_balance_left = re('dest_res_balance_left');
		dest_amount_left = ge('dest_amount_left');
		exch_left = ge('exch_left');
		if (!acclbl || !dest_res_balance_left || !src_res_balance_left)
			return;

		insertAfter(src_res_balance_left, (dType) ? exch_left : dest_amount_left);
		insertAfter(dest_res_balance_left, (dType) ? dest_amount_left : exch_left);

		rbv = isVisible('result_balance');
		if (rbv || isVisible('result_balance_dest'))
		{
			resBalanceSwitch(!rbv);
			resBalanceDestSwitch(rbv);
		}

		Transaction.update('debt_type', dType);

		if (!Transaction.noAccount())
		{
			acclbl.innerHTML = (dType) ? 'Destination account' : 'Source account';
		}

		var elem = ge('result_balance');
		resballbl = null;
		if (elem && elem.firstElementChild)
			resballbl = elem.firstElementChild.firstElementChild;
		if (resballbl)
			resballbl.innerHTML = (dType) ? 'Result balance (Person)' : 'Result balance (Account)';

		elem = ge('result_balance_dest');
		resballbl = null;
		if (elem && elem.firstElementChild)
			resballbl = elem.firstElementChild.firstElementChild;
		if (resballbl)
			resballbl.innerHTML = (dType) ? 'Result balance (Account)' : 'Result balance (Person)';

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
		if (self.accDDList.create({ input_id : 'acc_tile', listAttach : true, selCB : onDebtAccSel, editable : false, mobile : self.isMobile }))
		{
			accounts.forEach(function(acc)
			{
				self.accDDList.addItem(acc.id, acc.name);
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
			elem = ge('del_btn');
			if (elem && elem.firstElementChild)
				elem.firstElementChild.onclick = onDelete;
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

		elem = ge('calendar_btn');
		if (elem)
			setParam(elem.firstElementChild, { onclick : showCalendar });
		setParam(ge('cal_rbtn'), { onclick : showCalendar });

		elem = ge('comm_btn');
		if (elem)
			setParam(elem.firstElementChild, { onclick : showComment });

		var srcAcc, destAcc;

		if (Transaction.isExpense() || Transaction.isTransfer())
			srcAcc = getAccount(ge('src_id').value);
		if (Transaction.isIncome() || Transaction.isTransfer())
			destAcc = getAccount(ge('dest_id').value);

		Transaction.set('exchrate', ge('exchrate').value);
		if (Transaction.isExpense())
			Transaction.set('src_initbal', srcAcc.balance);
		else if (Transaction.isIncome())
			Transaction.set('dest_initbal', destAcc.balance);
		else if (Transaction.isTransfer())
		{
			Transaction.set('src_initbal', srcAcc.balance);
			Transaction.set('dest_initbal', destAcc.balance);
		}
		else if (Transaction.isDebt())
		{
			var acc, p_bal;

			acc = getPersonAccount(ge('person_id').value, Transaction.srcCurr());
			p_bal = (acc) ? acc.balance : 0;

			if (Transaction.debtType())
				Transaction.set('src_initbal', p_bal);
			else
				Transaction.set('dest_initbal', p_bal);

			if (!Transaction.noAccount())
			{
				acc = getAccount(ge('acc_id').value);

				if (Transaction.debtType())
					Transaction.set('dest_initbal', acc.balance);
				else
					Transaction.set('src_initbal', acc.balance);
			}
		}

		Transaction.subscribe('src_amount', onValueChanged.bind(null, 'src_amount'));
		Transaction.subscribe('dest_amount', onValueChanged.bind(null, 'dest_amount'));
		Transaction.subscribe('exchrate', onValueChanged.bind(null, 'exchrate'));
		Transaction.subscribe('src_resbal', onValueChanged.bind(null, 'src_resbal'));
		Transaction.subscribe('dest_resbal', onValueChanged.bind(null, 'dest_resbal'));
		Transaction.subscribe('src_curr', onValueChanged.bind(null, 'src_curr'));
		Transaction.subscribe('dest_curr', onValueChanged.bind(null, 'dest_curr'));

		if (Transaction.isDebt())
		{
			var persDDList;

			elem = ge('noacc_btn');
			if (elem && elem.firstElementChild)
				elem.firstElementChild.onclick = toggleEnableAccount;
			elem = ge('selaccount');
			if (elem && elem.firstElementChild)
				elem.firstElementChild.onclick = toggleEnableAccount;

			elem = ge('debtgive');
			if (elem)
				elem.onclick = onChangeDebtOp;
			elem = ge('debttake');
			if (elem)
				elem.onclick = onChangeDebtOp;

			persDDList = new DDList();
			if (persDDList.create({ input_id : 'person_tile', listAttach : true, selCB : onPersAccSel, editable : false, mobile : self.isMobile }))
			{
				persons.forEach(function(person)
				{
					persDDList.addItem(person.id, person.name);
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
			if (srcDDList.create({ input_id : 'source_tile', listAttach : true, selCB : onSrcAccSel, editable : false, mobile : self.isMobile }))
			{
				accounts.forEach(function(acc)
				{
					srcDDList.addItem(acc.id, acc.name);
				});
			}
			else
				srcDDList = null;

			destDDList = new DDList();
			if (destDDList.create({ input_id : 'dest_tile', listAttach : true, selCB : onDestAccSel, editable : false, mobile : self.isMobile }))
			{
				accounts.forEach(function(acc)
				{
					destDDList.addItem(acc.id, acc.name);
				});
			}
			else
				destDDList = null;
		}


		if (Transaction.isIncome())
		{
			srcCurrDDList = new DDList();
			if (srcCurrDDList.create({ input_id : 'srcamountsign', listAttach : true, selCB : onSrcCurrencySel, editable : false, mobile : self.isMobile }))
			{
				currency.forEach(function(curr)
				{
					srcCurrDDList.addItem(curr.id, curr.name);
				});
			}
			else
				srcCurrDDList = null;
		}

		if (Transaction.isExpense())
		{
			destCurrDDList = new DDList();
			if (destCurrDDList.create({ input_id : 'destamountsign', listAttach : true, selCB : onDestCurrencySel, editable : false, mobile : self.isMobile }))
			{
				currency.forEach(function(curr)
				{
					destCurrDDList.addItem(curr.id, curr.name);
				});
			}
			else
				destCurrDDList = null;
		}
	}
}
