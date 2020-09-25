var singleTransDeleteTitle = 'Delete transaction';
var singleTransDeleteMsg = 'Are you sure want to delete selected transaction?<br>Changes in the balance of affected accounts will be canceled.';


/**
 * Create/update transaction view
 */
function TransactionView(props)
{
    TransactionView.parent.constructor.apply(this, arguments);

    this.model = {};

    if (this.props.transaction)
    {
        this.model.original = this.props.transaction;
        this.model.data = copyObject(this.props.transaction);
    }
}


extend(TransactionView, View);


/**
 * View initialization
 */
TransactionView.prototype.onStart = function()
{
	this.submitStarted = false;
	// Init form submit event handler
	this.form = ge('mainfrm');
	if (!this.form)
		throw new Error('Failed to initialize Transaction view');

	this.form.onsubmit = function(e)
	{
		if (Transaction.isDebt())
			return this.onDebtSubmit();
		else if (Transaction.isTransfer() && !edit_mode)
			return this.onTransferSubmit();
		else
			return this.onSubmit();
	}.bind(this);

	if (edit_mode)
	{
		this.deleteIconlink = ge('del_btn');
		this.deleteBtn = this.deleteIconlink.querySelector('button');
		this.deleteBtn.addEventListener('click', this.onDelete.bind(this));

        this.deleteForm = ge('delform');
	}

	this.srcContainer = ge('source');
	if (this.srcContainer)
	{
		this.srcTileContainer = this.srcContainer.querySelector('.tile_container');
		this.srcTileInfoBlock = this.srcContainer.querySelector('.tile-info-block');
	}

	this.destContainer = ge('destination');
	if (this.destContainer)
	{
		this.destTileContainer = this.destContainer.querySelector('.tile_container');
		this.destTileInfoBlock = this.destContainer.querySelector('.tile-info-block');
	}

    this.srcTile = ge('source_tile');
    this.destTile = ge('dest_tile');

	this.srcAmountInfo = ge('src_amount_left');
	this.srcAmountInfoBtn = ge('src_amount_b');
	if (this.srcAmountInfoBtn)
		this.srcAmountInfoBtn.addEventListener('click', this.onSrcAmountSelect.bind(this));

	this.destAmountInfo = ge('dest_amount_left');
	this.destAmountInfoBtn = ge('dest_amount_b');
	if (this.destAmountInfoBtn)
		this.destAmountInfoBtn.addEventListener('click', this.onDestAmountSelect.bind(this));

	this.exchangeInfo = ge('exch_left');
	this.exchangeInfoBtn = ge('exchrate_b');
	if (this.exchangeInfoBtn)
		this.exchangeInfoBtn.addEventListener('click', this.onExchRateSelect.bind(this));

	this.srcResBalanceInfo = ge('src_res_balance_left');
	this.srcResBalanceInfoBtn = ge('resbal_b');
	if (this.srcResBalanceInfoBtn)
		this.srcResBalanceInfoBtn.addEventListener('click', this.onResBalanceSelect.bind(this));

	this.destResBalanceInfo = ge('dest_res_balance_left');
	this.destResBalanceInfoBtn = ge('resbal_d_b');
	if (this.destResBalanceInfoBtn)
		this.destResBalanceInfoBtn.addEventListener('click', this.onResBalanceDestSelect.bind(this));

    this.srcAmountRow = ge('src_amount_row');
    if (this.srcAmountRow)
        this.srcAmountRowLabel = this.srcAmountRow.querySelector('label');
	this.srcAmountInput = DecimalInput.create({ elem : ge('src_amount'), oninput : this.onFInput.bind(this) });
	this.srcAmountSign = ge('srcamountsign');

    this.destAmountRow = ge('dest_amount_row');
    if (this.destAmountRow)
        this.destAmountRowLabel = this.destAmountRow.querySelector('label');
	this.destAmountInput = DecimalInput.create({ elem : ge('dest_amount'), oninput : this.onFInput.bind(this) });
	this.destAmountSign = ge('destamountsign');

    this.srcResBalanceRow = ge('result_balance');
    if (this.srcResBalanceRow)
        this.srcResBalanceRowLabel = this.srcResBalanceRow.querySelector('label');
	this.srcResBalanceInput = DecimalInput.create({ elem : ge('resbal'), oninput : this.onFInput.bind(this) });
	this.srcResBalanceSign = ge('res_currsign');

    this.destResBalanceRow = ge('result_balance_dest');
    if (this.destResBalanceRow)
        this.destResBalanceRowLabel = this.destResBalanceRow.querySelector('label');
	this.destResBalanceInput = DecimalInput.create({ elem : ge('resbal_d'), oninput : this.onFInput.bind(this) });
	this.destResBalanceSign = ge('res_currsign_d');

    this.exchangeRow = ge('exchange');
    if (this.exchangeRow)
        this.exchangeRowLabel = this.exchangeRow.querySelector('label');
	this.exchangeInput = DecimalInput.create({ elem : ge('exchrate'), oninput : this.onFInput.bind(this) });
    this.exchangeSign = ge('exchcomm');

	this.datePickerIconlink = ge('calendar_btn');
	if (this.datePickerIconlink)
	{
		this.datePickerBtn = this.datePickerIconlink.querySelector('button');
		if (this.datePickerBtn)
			this.datePickerBtn.addEventListener('click', this.showCalendar.bind(this));
	}
	this.dateBlock = ge('date_block');
	this.datePickerWrapper = ge('calendar');

	this.dateInputBtn = ge('cal_rbtn');
	this.dateInputBtn.addEventListener('click', this.showCalendar.bind(this));
    this.dateInput = ge('date');

	this.commentIconlink = ge('comm_btn');
	if (this.commentIconlink)
	{
		this.commentBtn = this.commentIconlink.querySelector('button');
		if (this.commentBtn)
			this.commentBtn.addEventListener('click', this.showComment.bind(this));
	}
	this.commentBlock = ge('comment_block');
	this.commentInput = ge('comm');

	this.srcAccount = null;
    this.destAccount = null;

	if (Transaction.isExpense() || Transaction.isTransfer())
	{
		this.srcIdInp = ge('src_id');
		if (this.srcIdInp)
			this.srcAccount = getAccount(this.srcIdInp.value);
	}
	if (Transaction.isIncome() || Transaction.isTransfer())
	{
		this.destIdInp = ge('dest_id');
		if (this.destIdInp)
			this.destAccount = getAccount(this.destIdInp.value);
	}

    this.srcCurrInp = ge('src_curr');
    this.destCurrInp = ge('dest_curr');

	if (this.exchangeInput)
		Transaction.set('exchrate', this.exchangeInput.value);
	if (Transaction.isExpense())
	{
		if (this.srcAccount)
			Transaction.set('src_initbal', this.srcAccount.balance);
	}
	else if (Transaction.isIncome())
	{
		if (this.destAccount)
			Transaction.set('dest_initbal', this.destAccount.balance);
	}
	else if (Transaction.isTransfer())
	{
		if (this.srcAccount)
			Transaction.set('src_initbal', this.srcAccount.balance);
		if (this.destAccount)
			Transaction.set('dest_initbal', this.destAccount.balance);
	}
	else if (Transaction.isDebt())
	{
		this.personIdInp = ge('person_id')
        if (this.personIdInp)
		    this.personAccount = getPersonAccount(this.personIdInp.value, Transaction.srcCurr());
		var personAccBalance = (this.personAccount) ? this.personAccount.balance : 0;

		if (Transaction.debtType())
			Transaction.set('src_initbal', personAccBalance);
		else
			Transaction.set('dest_initbal', personAccBalance);

		this.debtAccountInp = ge('acc_id');
		if (!Transaction.noAccount())
		{
            this.debtAccountTile = ge('acc_tile');

			if (this.debtAccountInp)
				this.debtAccount = getAccount(this.debtAccountInp.value);

			if (this.debtAccount)
			{
				if (Transaction.debtType())
					Transaction.set('dest_initbal', this.debtAccount.balance);
				else
					Transaction.set('src_initbal', this.debtAccount.balance);
			}
		}
	}

	Transaction.subscribe('src_amount', this.onValueChanged.bind(this, 'src_amount'));
	Transaction.subscribe('dest_amount', this.onValueChanged.bind(this, 'dest_amount'));
	Transaction.subscribe('exchrate', this.onValueChanged.bind(this, 'exchrate'));
	Transaction.subscribe('src_resbal', this.onValueChanged.bind(this, 'src_resbal'));
	Transaction.subscribe('dest_resbal', this.onValueChanged.bind(this, 'dest_resbal'));
	Transaction.subscribe('src_curr', this.onValueChanged.bind(this, 'src_curr'));
	Transaction.subscribe('dest_curr', this.onValueChanged.bind(this, 'dest_curr'));

	if (Transaction.isDebt())
	{
		this.noAccountBtn = ge('noacc_btn');
		if (this.noAccountBtn)
			this.noAccountBtn.addEventListener('click', this.toggleEnableAccount.bind(this));
		this.selectAccountBtn = ge('selaccount');
		if (this.selectAccountBtn)
        {
            var accountToggleBtn = this.selectAccountBtn.querySelector('button');
            if (accountToggleBtn)
			    accountToggleBtn.addEventListener('click', this.toggleEnableAccount.bind(this));
        }

        this.debtAccountLabel = ge('acclbl');

		this.debtGiveRadio = ge('debtgive');
		if (this.debtGiveRadio)
			this.debtGiveRadio.onclick = this.onChangeDebtOp.bind(this);
		this.debtTakeRadio = ge('debttake');
		if (this.debtTakeRadio)
			this.debtTakeRadio.onclick = this.onChangeDebtOp.bind(this);

        this.personTile = ge('person_tile')

		this.persDDList = DropDown.create({
            input_id : 'person_tile',
            listAttach : true,
            onitemselect : this.onPersAccSel.bind(this),
            editable : false
        });
		persons.forEach(function(person)
		{
			if (isVisiblePerson(person))
				this.persDDList.addItem(person.id, person.name);
		}, this);

		if (!Transaction.noAccount())
            this.initAccList();
	}
	else
	{
		this.srcDDList = DropDown.create({
            input_id : 'source_tile',
            listAttach : true,
            onitemselect : this.onSrcAccSel.bind(this),
            editable : false
        });
		if (this.srcDDList)
		{
			accounts.forEach(function(acc)
			{
				if (isVisibleAccount(acc))
					this.srcDDList.addItem(acc.id, acc.name);
			}, this);
		}

		this.destDDList = DropDown.create({
			input_id : 'dest_tile',
			listAttach : true,
			onitemselect : this.onDestAccSel.bind(this),
			editable : false
		});
		if (this.destDDList)
		{
			accounts.forEach(function(acc)
			{
				if (isVisibleAccount(acc))
					this.destDDList.addItem(acc.id, acc.name);
			}, this);
		}
	}

	if (Transaction.isIncome())
	{
		this.srcCurrDDList = DropDown.create({
			input_id : 'srcamountsign',
			listAttach : true,
			onitemselect : this.onSrcCurrencySel.bind(this),
			editable : false
		});
		currency.forEach(function(curr)
		{
			this.srcCurrDDList.addItem(curr.id, curr.name);
		}, this);
	}

	if (Transaction.isExpense())
	{
		this.destCurrDDList = DropDown.create({
			input_id : 'destamountsign',
			listAttach : true,
			onitemselect : this.onDestCurrencySel.bind(this),
			editable : false
		});
		currency.forEach(function(curr)
		{
			this.destCurrDDList.addItem(curr.id, curr.name);
		}, this);
	}


    this.submitBtn = ge('submitbtn');
};


/**
 * Initialize DropDown for debt account tile
 */
TransactionView.prototype.initAccList = function()
{
    this.accDDList = DropDown.create({
        input_id : 'acc_tile',
        listAttach : true,
        onitemselect : this.onDebtAccSel.bind(this),
        editable : false
    });
    if (!this.accDDList)
        throw new Error('Failed to initialize debt account DropDown');

    accounts.forEach(function(acc)
    {
        if (isVisibleAccount(acc))
            this.accDDList.addItem(acc.id, acc.name);
    }, this);
};


/**
 * Date select callback
 * @param {Date} date - selected date object
 */
TransactionView.prototype.onSelectDate = function(date)
{
	if (!this.dateInput)
		return;

	this.dateInput.value = DatePicker.format(date);

	this.calendarObj.hide();
};


/**
 * Show calendar block
 */
TransactionView.prototype.showCalendar = function()
{
	if (!this.calendarObj)
	{
		this.calendarObj = DatePicker.create({
			wrapper_id : this.datePickerWrapper.id,
			relparent : this.datePickerWrapper.parentNode,
			ondateselect : this.onSelectDate.bind(this)
		});
	}
	if (!this.calendarObj)
		return;

	this.calendarObj.show(!this.calendarObj.visible());

	show(this.datePickerIconlink, false);
	show(this.dateBlock, true);

	setEmptyClick(this.calendarObj.hide.bind(this.calendarObj), [
		this.datePickerWrapper,
		this.datePickerIconlink,
		this.dateInputBtn
	]);
};

/**
 * Show comment field
 */
TransactionView.prototype.showComment = function()
{
	show(this.commentIconlink, false);
	show(this.commentBlock, true);
	this.commentInput.focus();
};


/**
 * Common function for toggle switch
 * @param {string|Element} inputRow - input row element
 * @param {string|Element} infoBlock - info block element
 * @param {string|Element} inputObj - decimal input object 
 * @param {boolean} showInput - show/hide flag
 */
TransactionView.prototype.commonSwitch = function(inputRow, infoBlock, inputObj, showInput)
{
	showInput = !!showInput;

	show(inputRow, showInput);
	show(infoBlock, !showInput);

	if (showInput && inputObj && inputObj.elem)
		inputObj.elem.focus();
};


/**
 * Show input control or static block for source amount value
 * @param {boolean} showInput - if set ot true show input row, else show info block
 */
TransactionView.prototype.srcAmountSwitch = function(showInput)
{
	this.commonSwitch(this.srcAmountRow, this.srcAmountInfo, this.srcAmountInput, showInput);
};


/**
 * Show input control or static block for destination amount value
 * @param {boolean} showInput - if set ot true show input row, else show info block
 */
TransactionView.prototype.destAmountSwitch = function(showInput)
{
	this.commonSwitch(this.destAmountRow, this.destAmountInfo, this.destAmountInput, showInput);
};


/**
 * Show input control or static block for source result balance value
 * @param {boolean} showInput - if set ot true show input row, else show info block
 */
TransactionView.prototype.resBalanceSwitch = function(showInput)
{
	this.commonSwitch(this.srcResBalanceRow, this.srcResBalanceInfo, this.srcResBalanceInput, showInput);
};


/**
 * Show input control or static block for destination result balance value
 * @param {boolean} showInput - if set ot true show input row, else show info block
 */
TransactionView.prototype.resBalanceDestSwitch = function(showInput)
{
	this.commonSwitch(this.destResBalanceRow, this.destResBalanceInfo, this.destResBalanceInput, showInput);
};


// Show input control or static block for exchange rate value
TransactionView.prototype.exchRateSwitch = function(showInput)
{
	this.commonSwitch(this.exchangeRow, this.exchangeInfo, this.exchangeInput, showInput);
};


/**
 * Source amount static click event handler
 */
TransactionView.prototype.onSrcAmountSelect = function()
{
	this.srcAmountSwitch(true);
	this.resBalanceSwitch(false);
	if (!Transaction.isDiff())
		this.resBalanceDestSwitch(false);
};


/**
 * Destination amount static click event handler
 */
TransactionView.prototype.onDestAmountSelect = function()
{
	this.destAmountSwitch(true);
	if (!Transaction.isDiff() || Transaction.isExpense())
		this.resBalanceSwitch(false);
	this.resBalanceDestSwitch(false);
	if (Transaction.isDiff())
		this.exchRateSwitch(false);
};


/**
 * Source result balance static click event handler
 */
TransactionView.prototype.onResBalanceSelect = function()
{
	this.resBalanceSwitch(true);
	if (!Transaction.isDiff())
		this.resBalanceDestSwitch(false);
	if (Transaction.isTransfer() || Transaction.isDebt())
		this.srcAmountSwitch(false);
	else
		this.destAmountSwitch(false);
	if (Transaction.isExpense() && Transaction.isDiff())
		this.exchRateSwitch(false);
};


/**
 * Destination result balance static click event handler
 */
TransactionView.prototype.onResBalanceDestSelect = function()
{
	this.resBalanceDestSwitch(true);
	if (Transaction.isDiff())
	{
		this.destAmountSwitch(false);
		this.exchRateSwitch(false);
	}
	else
	{
		this.resBalanceSwitch(false);
		this.srcAmountSwitch(false);
	}
};


/**
 * Exchange rate static click event handler
 */
TransactionView.prototype.onExchRateSelect = function()
{
	this.exchRateSwitch(true);
	this.destAmountSwitch(false);
	if (Transaction.isDiff())
	{
		if (Transaction.isExpense())
			this.resBalanceSwitch(false);
		else if (Transaction.isIncome() || Transaction.isTransfer())
			this.resBalanceDestSwitch(false);
	}
};


/**
 * Hide both source amount and exchange rate controls
 */
TransactionView.prototype.hideSrcAmountAndExchange = function()
{
	show(this.srcAmountRow, false);
	show(this.srcAmountInfo,  false);

	show(this.exchangeRow, false);
	show(this.exchangeInfo, false);
};


/**
 * Hide both destination amount and exchange rate controls
 */
TransactionView.prototype.hideDestAmountAndExchange = function()
{
	show(this.destAmountRow, false);
	show(this.destAmountInfo,  false);

	show(this.exchangeRow, false);
	show(this.exchangeInfo, false);
};


/**
 * Source account select callback
 * @param {object} obj - selected item
 */
TransactionView.prototype.onSrcAccSel = function(obj)
{
	if (!obj || !this.srcIdInp)
		return;

	this.srcIdInp.value = obj.id;

	if (Transaction.isTransfer())
		this.onChangeSource();
	else
		this.onChangeAcc();
};


/**
 * Destination account select callback
 * @param {object} obj - selected item
 */
TransactionView.prototype.onDestAccSel = function(obj)
{
	if (!obj || !this.destIdInp)
		return;

	this.destIdInp.value = obj.id;

	if (Transaction.isTransfer())
		this.onChangeDest();
	else
		this.onChangeAcc();
};


/**
 * Debt account select callback
 * @param {object} obj - selected item
 */
TransactionView.prototype.onDebtAccSel = function(obj)
{
	if (!obj || !this.debtAccountInp)
		return;

	this.debtAccountInp.value = obj.id;

	this.onChangeAcc();
};


/**
 * Person select callback
 * @param {object} obj - selected item
 */
TransactionView.prototype.onPersAccSel = function(obj)
{
	if (!obj || !this.personIdInp)
		return;

	this.personIdInp.value = obj.id;

	this.onPersonSel();
};


/**
 * Source currency select callback
 * @param {object} obj - selected item
 */
TransactionView.prototype.onSrcCurrencySel = function(obj)
{
	if (!obj || !this.srcCurrInp)
		return;

	this.srcCurrInp.value = obj.id;

	this.onChangeSrcCurr();
};


/**
 * Destination currency select callback
 * @param {object} obj - selected item
 */
TransactionView.prototype.onDestCurrencySel = function(obj)
{
	if (!obj || !this.destCurrInp)
		return;

	this.destCurrInp.value = obj.id;

	this.onChangeDestCurr();
};


/**
 * Account disable button click event handler
 */
TransactionView.prototype.toggleEnableAccount = function()
{
	if (Transaction.noAccount())
	{
		this.debtAccountLabel.textContent = (Transaction.debtType()) ? 'Destination account' : 'Source account';
	}
	else
	{
		this.debtAccountLabel.textContent = 'No account';
	}

	show(this.noAccountBtn, Transaction.noAccount());

	show(this.srcTileContainer, Transaction.noAccount());
	show(this.srcTileInfoBlock, Transaction.noAccount());
	show('selaccount', !Transaction.noAccount());

	Transaction.update('no_account', !Transaction.noAccount());

	var curr_id;
	if (Transaction.noAccount())
	{
		Transaction.update('last_acc', parseInt(this.debtAccountInp.value));
		this.debtAccountInp.value = 0;

		curr_id = parseInt(this.srcCurrInp.value);
	}
	else
	{
		var lastAcc = getAccount(Transaction.lastAcc_id());
		this.debtAccountInp.value = lastAcc.id;

		curr_id = lastAcc.curr_id;
	}
	Transaction.update('src_curr', curr_id);
	Transaction.update('dest_curr', curr_id);

	this.onChangeAcc();

	if (!Transaction.noAccount() && !this.accDDList)
	{
		this.initAccList();
	}
};


/**
 * Set currency button active/inactive
 * @param {boolean} src - if set to true activate/deactivate source amount currency button, else destination amount
 * @param {boolean} act - if set to true activate currency, else inactivate
 */
TransactionView.prototype.setCurrActive = function(src, act)
{
	var amountRow = (src) ? this.srcAmountRow : this.destAmountRow;
	if (!amountRow)
		return;

	var currBtn = amountRow.querySelector('.input-group__btn');
	var inputContainer = amountRow.querySelector('.stretch-input');
	if (!currBtn || !inputContainer)
		return;

	if (act)
	{
		currBtn.classList.remove('input-group__btn_inactive');
		inputContainer.classList.remove('trans_input');
		inputContainer.classList.add('rbtn_input');
	}
	else
	{
		currBtn.classList.add('input-group__btn_inactive');
		inputContainer.classList.add('trans_input');
		inputContainer.classList.remove('rbtn_input');
	}
};



/**
 * Set full/short text for source or destination input label
 * @param {boolean} src - if true set source amount, else destination amount
 * @param {boolean} full - if true set full amount label, else set short
 */
TransactionView.prototype.setAmountInputLabel = function(src, full)
{
	var labelElem = (src) ? this.srcAmountRowLabel : this.destAmountRowLabel;
	if (!labelElem)
		return;

	if (full)
		labelElem.textContent = (src) ? 'Source amount' : 'Destination amount';
	else
		labelElem.textContent = 'Amount';
};


/**
 * Set full/short text for source or destination amount tile block label
 * @param {boolean} src - if true set source amount, else destination amount
 * @param {boolean} full - if true set full amount label, else set short
 */
TransactionView.prototype.setAmountTileBlockLabel = function(src, full)
{
	var amountBlock = (src) ? this.srcAmountInfo : this.destAmountInfo;
	if (!amountBlock)
		return;

	var labelElem = amountBlock.firstElementChild;
	if (!labelElem)
		return;

	if (full)
		labelElem.textContent = (src) ? 'Source amount' : 'Destination amount';
	else
		labelElem.textContent = 'Amount';
};



/**
 * Set source amount value at View
 * @param {*} val - source amount value
 */
TransactionView.prototype.setSrcAmount = function(val)
{
	if (this.srcAmountInfoBtn && this.srcAmountInfoBtn.firstElementChild)
		this.srcAmountInfoBtn.firstElementChild.textContent = formatCurrency((isValidValue(val) ? val : 0), Transaction.srcCurr());

	if (typeof val === 'undefined')
		return;

	if (this.srcAmountInput)
	{
		var sa = this.srcAmountInput.value;
		var savalid = isValidValue(sa);
		var fsa = (savalid) ? normalize(sa) : sa;

		if (fsa != val)
			this.srcAmountInput.value = val;
	}
};


/**
 * Set destination amount value at View
 * @param {*} val - destination amount value
 */
TransactionView.prototype.setDestAmount = function(val)
{
	if (this.destAmountInfoBtn && this.destAmountInfoBtn.firstElementChild)
		this.destAmountInfoBtn.firstElementChild.innerHTML = formatCurrency((isValidValue(val) ? val : 0), Transaction.destCurr());

	if (typeof val === 'undefined')
		return;

	if (this.destAmountInput)
	{
		var da = this.destAmountInput.value;
		var davalid = isValidValue(da);
		var fda = (davalid) ? normalize(da) : da;

		if (fda != val)
			this.destAmountInput.value = val;
	}
};


/**
 * Set exchange rate value at View
 * @param {*} val - exchange rate value
 */
TransactionView.prototype.setExchRate = function(val)
{
    if (typeof val === 'undefined')
        return;

    var srcCurr = getCurrency(Transaction.srcCurr());
    var destCurr = getCurrency(Transaction.destCurr());

    if (this.exchangeInput)
    {
        var e = this.exchangeInput.value;
        var fe = (isValidValue(e)) ? normalizeExch(e) : e;

        if (fe != val)
            this.exchangeInput.value = val;
    }

    val = normalizeExch(val);

    var exchSigns = destCurr.sign + '/' + srcCurr.sign;
    this.exchangeSign.textContent = exchSigns;

    var exchText = exchSigns;
    if (isValidValue(val) && val != 1 && val != 0)
    {
        var fsa = Transaction.srcAmount();
        var fda = Transaction.destAmount();
        invExch = parseFloat((fsa / fda).toFixed(5));

        exchText += ' ('  + invExch + ' ' + srcCurr.sign + '/' + destCurr.sign + ')';
    }

    if (this.exchangeInfoBtn && this.exchangeInfoBtn.firstElementChild)
        this.exchangeInfoBtn.firstElementChild.textContent = val + ' ' + exchText;
};


/**
 * Set result balance of source value at View
 * @param {*} val - source result balance value
 * @param {boolean} valid - valid value flag
 */
TransactionView.prototype.setSrcResultBalance = function(val, valid)
{
    if (typeof val === 'undefined' && typeof valid === 'undefined')
        return;

    if (resbal)
    {
        var s2_src = this.srcResBalanceInput.value;
        var s2valid = isValidValue(s2_src);
        var fs2_src = (s2valid) ? normalize(s2_src) : s2_src;

        if (fs2_src != val)
            this.srcResBalanceInput.value = val;
    }

    var fmtBal = formatCurrency((isValidValue(val) ? val : valid), Transaction.srcCurr());
    if (this.srcResBalanceInfoBtn && this.srcResBalanceInfoBtn.firstElementChild)
        this.srcResBalanceInfoBtn.firstElementChild.innerHTML = fmtBal;
};


/**
 * Set result balance of destination value at View
 * @param {*} val - destination result balance value
 * @param {boolean} valid - valid value flag
 */
TransactionView.prototype.setDestResultBalance = function(val, valid)
{
    if ((typeof val === 'undefined' && typeof valid === 'undefined') || Transaction.isExpense())
        return;

    if (this.destResBalanceInput)
    {
        var s2_dest = this.destResBalanceInput.value;
        var s2valid = isValidValue(s2_dest);
        var fs2_dest = (s2valid) ? normalize(s2_dest) : s2_dest;

        if (fs2_dest != val)
            this.destResBalanceInput.value = val;
    }

    var fmtBal = formatCurrency((isValidValue(val) ? val : valid), Transaction.destCurr());
    if (this.destResBalanceInfoBtn && this.destResBalanceInfoBtn.firstElementChild)
        this.destResBalanceInfoBtn.firstElementChild.textContent = fmtBal;
};


/**
 * Update information on person tile on currency change
 */
TransactionView.prototype.updatePersonTile = function()
{
    if (!Transaction.isDebt())
        return;

    var person = getPerson(this.personIdInp.value);
    if (!person)
        return;

    var curr_id = Transaction.debtType() ? Transaction.srcCurr() : Transaction.destCurr();
    var personAccount = getPersonAccount(person.id, curr_id);
    var personBalance = (personAccount) ? personAccount.balance : 0;

    setTileInfo(this.personTile, person.name, formatCurrency(personBalance, curr_id));
};


/**
 * Update currency signs near to input fields
 */
TransactionView.prototype.updateCurrSigns = function()
{
    this.setSign(this.destAmountSign, this.destCurrDDList, Transaction.destCurr());
    this.setSign(this.srcAmountSign, this.srcCurrDDList, Transaction.srcCurr());
    this.setSign(this.srcResBalanceSign, null, Transaction.srcCurr());
    this.setSign(this.destResBalanceSign, null, Transaction.destCurr());
};


/**
 * Set currency sign for specified field
 * @param {string} obj - currency sign element id
 * @param {DropDown} ddown - DropDown object
 * @param {number} curr_id - currency id
 */
TransactionView.prototype.setSign = function(elem, ddown, curr_id)
{
    var signElem = (typeof elem === 'string') ? ge(elem) : elem;
    if (!signElem)
        return;

    var curr = getCurrency(curr_id);
    if (!curr)
        return;

    signElem.textContent = curr.sign;

    if (ddown)
        ddown.selectItem(curr_id);
};



/**
 * Change account event handler
 */
TransactionView.prototype.onChangeAcc = function()
{
    var isDiff = Transaction.isDiff();

    var tile = null;
    var accountInp = null;
    if (Transaction.isExpense())
    {
        accountInp = this.srcIdInp;
        tile = this.srcTile;
    }
    else if (Transaction.isIncome())
    {
        accountInp = this.destIdInp;
        tile = this.destTile;
    }
    else if (Transaction.isDebt())
    {
        accountInp = this.debtAccountInp;
        tile = this.debtAccountTile;
    }

    var account_id = parseInt(accountInp.value);
    var copy_curr;
    if (Transaction.isExpense() || (Transaction.isDebt() && !Transaction.debtType()))
    {
        Transaction.update('src_id', account_id);
        this.onSrcCurrChanged();
        if (!isDiff)
        {
            copy_curr = Transaction.srcCurr();
            Transaction.update('dest_curr', copy_curr);
            this.onDestCurrChanged(copy_curr);
        }
    }
    else if (Transaction.isIncome() || (Transaction.isDebt() && Transaction.debtType()))
    {
        Transaction.update('dest_id', account_id);
        this.onDestCurrChanged();
        if (!isDiff)
        {
            copy_curr = Transaction.destCurr();
            Transaction.update('src_curr', copy_curr);
            this.onSrcCurrChanged(copy_curr);
        }
    }

    if (Transaction.isDebt())
    {
        this.updatePersonTile();

        var srcAmount = Transaction.srcAmount();
        this.setSrcAmount(isValidValue(srcAmount) ? srcAmount : '');
    }

    setTileAccount(tile, account_id);
};


/**
 * Expense/Income transaction event handler
 */
TransactionView.prototype.onSubmit = function(frm)
{
    if (this.submitStarted)
        return false;

    var srcAmount = this.srcAmountInput.value;
    var destAmount = this.destAmountInput.value;

    var valid = true;
    if (isVisible(this.destAmountRow))
    {
        if (!destAmount || !destAmount.length || !isNum(fixFloat(destAmount)))
        {
            invalidateBlock('dest_amount_row');
            valid = false;
        }
    }

    if (isVisible(this.srcAmountRow))
    {
        if (!srcAmount || !srcAmount.length || !isNum(fixFloat(srcAmount)))
        {
            invalidateBlock('src_amount_row');
            valid = false;
        }
    }

    if (!checkDate(this.dateInput.value))
    {
        invalidateBlock('date_block');
        valid = false;
    }

    if (valid)
    {
        this.srcAmountInput.value = fixFloat(srcAmount);
        this.destAmountInput.value = fixFloat(destAmount);

        this.submitStarted = true;
        enable(this.submitBtn, false);
    }

    return valid;
};


/**
 * Transfer transaction submit event handler
 */
TransactionView.prototype.onTransferSubmit = function()
{
    if (this.submitStarted)
        return false;

    var srcAmount = this.srcAmountInput.value;
    var destAmount = this.destAmountInput.value;

    var valid = true;
    if (!srcAmount || !srcAmount.length || !isNum(fixFloat(srcAmount)))
    {
        invalidateBlock('src_amount_row');
        valid = false;
    }

    if (Transaction.isDiff() && (!destAmount || !destAmount.length || !isNum(fixFloat(destAmount))))
    {
        invalidateBlock('dest_amount_row');
        valid = false;
    }

    if (!checkDate(this.dateInput.value))
    {
        invalidateBlock('date_block');
        valid = false;
    }

    if (valid)
    {
        this.srcAmountInput.value = fixFloat(srcAmount);
        this.destAmountInput.value = fixFloat(destAmount);

        this.submitStarted = true;
        enable(this.submitBtn, false);
    }

    return valid;
};


/**
 * Debt transaction submit event handler
 */
TransactionView.prototype.onDebtSubmit = function()
{
    if (this.submitStarted)
        return false;

    var srcAmount = this.srcAmountInput.value;
    var destAmount = this.destAmountInput.value;

    if (Transaction.noAccount())
        this.debtAccountInp.value = 0;

    var valid = true;

    if (!srcAmount || !srcAmount.length || !isNum(fixFloat(srcAmount)))
    {
        invalidateBlock('src_amount_row');
        valid = false;
    }

    if (!destAmount || !destAmount.length || !isNum(fixFloat(destAmount)))
    {
        invalidateBlock('dest_amount_row');
        valid = false;
    }

    if (!checkDate(this.dateInput.value))
    {
        invalidateBlock('date_block');
        valid = false;
    }

    if (valid)
    {
        this.srcAmountInput.value = fixFloat(srcAmount);
        this.destAmountInput.value = fixFloat(destAmount);

        self.submitStarted = true;
        enable(this.submitBtn, false);
    }

    return valid;
};


/**
 * Person select event handler
 */
TransactionView.prototype.onPersonSel = function()
{
    Transaction.update('person_id', this.personIdInp.value);

    this.updatePersonTile();
};


/**
 * Debt operation type change event handler
 */
TransactionView.prototype.onChangeDebtOp = function()
{
    var dType = this.debtGiveRadio.checked;
    if (dType == Transaction.debtType())
        return;

    insertAfter(this.srcResBalanceInfo, (dType) ? this.exchangeInfo : this.destAmountInfo);
    insertAfter(this.destResBalanceInfo, (dType) ? this.destAmountInfo : this.exchangeInfo);

    var rbv = isVisible(this.srcResBalanceRow);
    if (rbv || isVisible(this.destResBalanceRow))
    {
        this.resBalanceSwitch(!rbv);
        this.resBalanceDestSwitch(rbv);
    }

    Transaction.update('debt_type', dType);

    if (!Transaction.noAccount())
    {
        this.debtAccountLabel.textContent = (dType) ? 'Destination account' : 'Source account';
    }

    this.srcResBalanceRowLabel.textContent = (dType) ? 'Result balance (Person)' : 'Result balance (Account)';
    this.destResBalanceRowLabel.textContent = (dType) ? 'Result balance (Account)' : 'Result balance (Person)';
};


/**
 * Source account change event handler
 */
TransactionView.prototype.onChangeSource = function()
{
    Transaction.update('src_id', this.srcIdInp.value);
    this.onSrcCurrChanged();

    if (this.srcIdInp.value == this.destIdInp.value)
    {
        var newAcc = getNextAccount(this.destIdInp.value);
        if (newAcc != 0)
        {
            this.destIdInp.value = newAcc;
            Transaction.update('dest_id', newAcc);
            this.destDDList.selectItem(newAcc);
            this.onDestCurrChanged();
        }
    }

    if (Transaction.isDebt())
    {
        this.updatePersonTile();
    }
    else
    {
        setTileAccount('source_tile', Transaction.srcAcc());
        setTileAccount('dest_tile', Transaction.destAcc());
    }
};


/**
 * Destination account change event handler
 */
TransactionView.prototype.onChangeDest = function()
{
    Transaction.update('dest_id', this.destIdInp.value);
    this.onDestCurrChanged();

    if (this.srcIdInp.value == this.destIdInp.value)
    {
        var newAcc = getNextAccount(this.srcIdInp.value);
        if (newAcc != 0)
        {
            this.srcIdInp.value = newAcc;
            Transaction.update('src_id', newAcc);
            this.srcDDList.selectItem(newAcc);
            this.onSrcCurrChanged();
        }
    }

    if (Transaction.isDebt())
    {
        this.updatePersonTile();
    }
    else
    {
        setTileAccount('source_tile', Transaction.srcAcc());
        setTileAccount('dest_tile', Transaction.destAcc());
    }
};


/**
 * Field input event handler
 * @param {InputEvent} e - event object
 */
TransactionView.prototype.onFInput = function(e)
{
    var obj = e.target;

    if (obj.id == 'src_amount')
    {
        clearBlockValidation('src_amount_row');
        Transaction.update('src_amount', obj.value);
    }
    else if (obj.id == 'dest_amount')
    {
        clearBlockValidation('dest_amount_row');
        Transaction.update('dest_amount', obj.value);
    }
    else if (obj.id == 'exchrate')
        Transaction.update('exchrate', obj.value);
    else if (obj.id == 'resbal')
        Transaction.update('src_resbal', obj.value);
    else if (obj.id == 'resbal_d')
        Transaction.update('dest_resbal', obj.value);

    return true;
};


/**
 * Transaction model value changed notification callback
 * @param {string} item - transaction model item name
 * @param {*} value - new value of specified item
 */
TransactionView.prototype.onValueChanged = function(item, value)
{
    if (item == 'src_amount')
        this.setSrcAmount(value);
    else if (item == 'dest_amount')
        this.setDestAmount(value);
    else if (item == 'exchrate')
        this.setExchRate(value);
    else if (item == 'src_resbal')
        this.setSrcResultBalance(value, 0);
    else if (item == 'dest_resbal')
        this.setDestResultBalance(value, 0);
    else if (item == 'src_curr')
        this.onSrcCurrChanged(value);
    else if (item == 'dest_curr')
        this.onDestCurrChanged(value);
};


/**
 * Source currency change event handler
 */
TransactionView.prototype.onChangeSrcCurr = function()
{
    var srcCurr = parseInt(this.srcCurrInp.value);
    Transaction.update('src_curr', srcCurr);
};


/**
 * Update layout on source curency changed
 * @param {number|undefined} value - new source currency value
 */
TransactionView.prototype.onSrcCurrChanged = function(value)
{
    if (typeof value !== 'undefined')
    {
        if (this.srcCurrInp)
            this.srcCurrInp.value = value;
    }

    var am_s = isVisible(this.srcAmountRow);
    var am_d = isVisible(this.destAmountRow);
    var rbv_s = isVisible(this.srcResBalanceRow);
    var rbv_d = isVisible(this.destResBalanceRow);
    var exch = isVisible(this.exchangeRow);

    if (Transaction.isDiff())
    {
        this.setAmountInputLabel(true, true);
        this.setAmountTileBlockLabel(true, true);
        this.setAmountInputLabel(false, true);
        this.setAmountTileBlockLabel(false, true);
        if (Transaction.isIncome())
        {
            this.setCurrActive(true, true);		// set source active
            this.setCurrActive(false, false);		// set destination inactive
        }

        var toShowDestAmount = false;
        if (Transaction.isTransfer())
            toShowDestAmount = !rbv_d && !(rbv_s && exch) && !(am_s && exch);
        else
            toShowDestAmount = !rbv_s && !rbv_d && !exch;
        this.destAmountSwitch(toShowDestAmount);

        if (Transaction.isTransfer())
            this.srcAmountSwitch(!rbv_s);

        if (!isVisible(this.exchangeRow))
            this.exchRateSwitch(false);
        this.setExchRate(Transaction.exchRate());
    }
    else
    {
        this.setAmountInputLabel(true, false);
        this.setAmountInputLabel(false, false);
        this.setAmountTileBlockLabel(true, false);
        this.setAmountTileBlockLabel(false, false);
        if (Transaction.isExpense())
            this.hideSrcAmountAndExchange();
        else if (Transaction.isIncome() || Transaction.isTransfer() || Transaction.isDebt())
            this.hideDestAmountAndExchange();

        if (Transaction.isIncome() || Transaction.isTransfer() || Transaction.isDebt())
            this.srcAmountSwitch(!rbv_d && !rbv_s);
        if (Transaction.isExpense())
            this.destAmountSwitch(!rbv_s);

        if (Transaction.isTransfer())
        {
            if (rbv_s && rbv_d)
                this.resBalanceDestSwitch(false);
        }
        else if (Transaction.isDebt())
        {
            if (Transaction.noAccount())
            {
                if (Transaction.debtType())
                    this.resBalanceDestSwitch(false);
                else
                    this.resBalanceSwitch(false);
            }
        }
    }

    this.updateCurrSigns();
    this.updatePersonTile();
};


/**
 * Destination currency change event handler
 */
TransactionView.prototype.onChangeDestCurr = function()
{
    var destCurr = parseInt(this.destCurrInp.value);
    Transaction.update('dest_curr', destCurr);
};


/**
 * Update layout on destination curency changed
 * @param {number|undefined} value - new destination currency value
 */
TransactionView.prototype.onDestCurrChanged = function(value)
{
    if (typeof value !== 'undefined')
    {
        if (this.destCurrInp)
            this.destCurrInp.value = value;
    }

    var am_s = isVisible(this.srcAmountRow);
    var am_d = isVisible(this.destAmountRow);
    var rbv_s = isVisible(this.srcResBalanceRow);
    var rbv_d = isVisible(this.destResBalanceRow);
    var exch = isVisible(this.exchangeRow);

    if (Transaction.isDiff())
    {
        this.setAmountInputLabel(true, true);
        this.setAmountTileBlockLabel(true, true);
        this.setAmountInputLabel(false, true);
        this.setAmountTileBlockLabel(false, true);
        if (Transaction.isIncome())
            this.setCurrActive(true, true);		// set source active
        else
            this.setCurrActive(true, false);		// set source inactive

        if (Transaction.isExpense())
            this.setCurrActive(false, true);		// set destination active
        else
            this.setCurrActive(false, false);		// set destination inactive

        var toShowSrcAmount = false;
        if (Transaction.isIncome())
            toShowSrcAmount = (am_s && am_d) || (am_s && rbv_d) || (am_s && exch);
        else if (Transaction.isExpense())
            toShowSrcAmount = true;
        else if (Transaction.isTransfer())
            toShowSrcAmount = !rbv_s;
        this.srcAmountSwitch(toShowSrcAmount);

        if (Transaction.isTransfer())
            this.destAmountSwitch(!rbv_d && !(rbv_s && exch) && !(am_s && exch));

        if (!isVisible(this.exchangeRow))
            this.exchRateSwitch(false);
        this.setExchRate(Transaction.exchRate());
    }
    else
    {
        this.setAmountInputLabel(true, false);
        this.setAmountInputLabel(false, false);
        this.setAmountTileBlockLabel(true, false);
        this.setAmountTileBlockLabel(false, false);

        if (Transaction.isIncome() || Transaction.isTransfer() || Transaction.isDebt())
            this.srcAmountSwitch(!rbv_d && !rbv_s);
        if (Transaction.isExpense())
            this.destAmountSwitch(!rbv_s);

        if (Transaction.isIncome() || Transaction.isTransfer() || Transaction.isDebt())
            this.hideDestAmountAndExchange();
        else		// Expense
            this.hideSrcAmountAndExchange();

        if (Transaction.isTransfer())
        {
            if (rbv_s && rbv_d)
                this.resBalanceSwitch(false);
        }
        else if (Transaction.isDebt())
        {
            if (Transaction.noAccount())
            {
                if (Transaction.debtType())
                    this.resBalanceDestSwitch(false);
                else
                    this.resBalanceSwitch(false);
            }
        }
    }

    this.updateCurrSigns();
    this.updatePersonTile();
};


/**
 * Delete transaction icon link click event handler
 */
TransactionView.prototype.onDelete = function()
{
    this.showDeletePopup();
}


/**
 * Create and show transaction delete warning popup
 */
TransactionView.prototype.showDeletePopup = function()
{
    if (!this.dwPopup)
    {
        this.dwPopup = Popup.create({
            id : 'delete_warning',
            title : singleTransDeleteTitle,
            content : singleTransDeleteMsg,
            btn : {
                okBtn : { onclick : this.onDeletePopup.bind(this, true) },
                cancelBtn : { onclick : this.onDeletePopup.bind(this, false) }
            }
        });
    }

    this.dwPopup.show();
};


/**
 * Delete popup callback
 */
TransactionView.prototype.onDeletePopup = function(result)
{
    if (this.dwPopup)
        this.dwPopup.close();

    if (result)
    {
        if (this.deleteForm)
            this.deleteForm.submit();
    }
};

