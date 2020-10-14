var singleTransDeleteTitle = 'Delete transaction';
var singleTransDeleteMsg = 'Are you sure want to delete selected transaction?<br>Changes in the balance of affected accounts will be canceled.';


/**
 * Create/update transaction view
 */
function TransactionView()
{
    TransactionView.parent.constructor.apply(this, arguments);

    if (
        !('currency' in this.props) ||
        !('accounts' in this.props) ||
        !('transaction' in this.props) ||
        !('icons' in this.props)
    )
        throw new Error('Invalid Transaction view properties');

    this.model = {};

    this.model.currency = CurrencyList.create(this.props.currency);
    this.model.icons = IconList.create(this.props.icons);
    this.model.accounts = AccountList.create(this.props.accounts);
    if (this.props.persons) {
        this.model.persons = PersonList.create(this.props.persons);
    }
    this.model.transaction = new TransactionModel({
        transaction: this.props.transaction,
        parent: this
    });

    var availModes = ['create', 'update'];
    this.mode = this.props.mode;
    if (!availModes.includes(this.mode))
        throw new Error('Invalid Transaction view mode: ' + this.mode);
    if (this.mode == 'update')
    {
        this.model.accounts.cancelTransaction(this.props.transaction);
    }
}


extend(TransactionView, View);


/**
 * View initialization
 */
TransactionView.prototype.onStart = function()
{
    var visibleAccounts = this.model.accounts.getVisible();

	this.submitStarted = false;
	// Init form submit event handler
	this.form = ge('mainfrm');
	if (!this.form)
		throw new Error('Failed to initialize Transaction view');
	this.form.addEventListener('submit', this.onFormSubmit.bind(this));

	if (this.mode == 'update')
	{
        this.deleteBtn = IconLink.fromElement({
            elem: 'del_btn',
            onclick: this.confirmDelete.bind(this)
        });
        this.deleteForm = ge('delform');
	}

	this.srcContainer = ge('source');
	if (this.srcContainer)
	{
		this.srcTileBase = this.srcContainer.querySelector('.tile-base');
		this.srcTileContainer = this.srcContainer.querySelector('.tile_container');
		this.srcTileInfoBlock = this.srcContainer.querySelector('.tile-info-block');
	}

	this.destContainer = ge('destination');
	if (this.destContainer)
	{
		this.destTileBase = this.destContainer.querySelector('.tile-base');
		this.destTileContainer = this.destContainer.querySelector('.tile_container');
		this.destTileInfoBlock = this.destContainer.querySelector('.tile-info-block');
	}

    this.srcTile = AccountTile.fromElement({ elem: 'source_tile', parent: this });
    this.destTile = AccountTile.fromElement({ elem: 'dest_tile', parent: this });

    this.srcAmountInfo = TileInfoItem.fromElement({
        elem: 'src_amount_left',
        onclick: this.onSrcAmountSelect.bind(this)
    });
    this.destAmountInfo = TileInfoItem.fromElement({
        elem: 'dest_amount_left',
        onclick: this.onDestAmountSelect.bind(this)
    });
    this.exchangeInfo = TileInfoItem.fromElement({
        elem: 'exch_left',
        onclick: this.onExchRateSelect.bind(this)
    });
    this.srcResBalanceInfo = TileInfoItem.fromElement({
        elem: 'src_res_balance_left',
        onclick: this.onResBalanceSelect.bind(this)
    });
    this.destResBalanceInfo = TileInfoItem.fromElement({
        elem: 'dest_res_balance_left',
        onclick: this.onResBalanceDestSelect.bind(this)
    });

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

    this.datePickerBtn = IconLink.fromElement({
        elem: 'calendar_btn',
        onclick: this.showCalendar.bind(this)
    });
	this.dateBlock = ge('date_block');
	this.datePickerWrapper = ge('calendar');

	this.dateInputBtn = ge('cal_rbtn');
	this.dateInputBtn.addEventListener('click', this.showCalendar.bind(this));
    this.dateInput = ge('date');

    this.commentBtn = IconLink.fromElement({
        elem: 'comm_btn',
        onclick: this.showComment.bind(this)
    });
	this.commentBlock = ge('comment_block');
	this.commentInput = ge('comm');

	this.srcAccount = null;
    this.destAccount = null;

	if (this.model.transaction.isExpense() || this.model.transaction.isTransfer())
	{
		this.srcIdInp = ge('src_id');
		if (this.srcIdInp)
        {
            this.model.transaction.setValue('src_id', this.srcIdInp.value);
			this.srcAccount = this.model.accounts.getItem(this.srcIdInp.value);
        }
	}
	if (this.model.transaction.isIncome() || this.model.transaction.isTransfer())
	{
		this.destIdInp = ge('dest_id');
		if (this.destIdInp)
        {
            this.model.transaction.setValue('dest_id', this.destIdInp.value);
			this.destAccount = this.model.accounts.getItem(this.destIdInp.value);
        }
	}

    this.srcCurrInp = ge('src_curr');
    this.destCurrInp = ge('dest_curr');

	if (this.exchangeInput)
		this.model.transaction.setValue('exchrate', this.exchangeInput.value);
	if (this.model.transaction.isExpense())
	{
		if (this.srcAccount)
			this.model.transaction.setValue('src_initbal', this.srcAccount.balance);
	}
	else if (this.model.transaction.isIncome())
	{
		if (this.destAccount)
			this.model.transaction.setValue('dest_initbal', this.destAccount.balance);
	}
	else if (this.model.transaction.isTransfer())
	{
		if (this.srcAccount)
			this.model.transaction.setValue('src_initbal', this.srcAccount.balance);
		if (this.destAccount)
			this.model.transaction.setValue('dest_initbal', this.destAccount.balance);
	}
	else if (this.model.transaction.isDebt())
	{
		this.personIdInp = ge('person_id')
        if (this.personIdInp)
		    this.personAccount = this.model.accounts.getPersonAccount(this.personIdInp.value, this.model.transaction.srcCurr());
		var personAccBalance = (this.personAccount) ? this.personAccount.balance : 0;

		if (this.model.transaction.debtType)
			this.model.transaction.setValue('src_initbal', personAccBalance);
		else
			this.model.transaction.setValue('dest_initbal', personAccBalance);

		this.debtAccountInp = ge('acc_id');
        this.debtAccountTile = AccountTile.fromElement({ elem: 'acc_tile', parent: this });
		if (!this.model.transaction.noAccount)
		{
			if (this.debtAccountInp)
				this.debtAccount = this.model.accounts.getItem(this.debtAccountInp.value);

			if (this.debtAccount)
			{
				if (this.model.transaction.debtType)
					this.model.transaction.setValue('dest_initbal', this.debtAccount.balance);
				else
					this.model.transaction.setValue('src_initbal', this.debtAccount.balance);
			}
		}
	}

	this.model.transaction.subscribe('src_amount', this.onValueChanged.bind(this, 'src_amount'));
	this.model.transaction.subscribe('dest_amount', this.onValueChanged.bind(this, 'dest_amount'));
	this.model.transaction.subscribe('exchrate', this.onValueChanged.bind(this, 'exchrate'));
	this.model.transaction.subscribe('src_resbal', this.onValueChanged.bind(this, 'src_resbal'));
	this.model.transaction.subscribe('dest_resbal', this.onValueChanged.bind(this, 'dest_resbal'));
	this.model.transaction.subscribe('src_curr', this.onValueChanged.bind(this, 'src_curr'));
	this.model.transaction.subscribe('dest_curr', this.onValueChanged.bind(this, 'dest_curr'));

	if (this.model.transaction.isDebt())
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
			this.debtGiveRadio.addEventListener('change', this.onChangeDebtOp.bind(this));
		this.debtTakeRadio = ge('debttake');
		if (this.debtTakeRadio)
			this.debtTakeRadio.addEventListener('change', this.onChangeDebtOp.bind(this));

        this.personTile = Tile.fromElement({ elem: 'person_tile', parent: this });

		this.persDDList = DropDown.create({
            input_id : 'person_tile',
            listAttach : true,
            onitemselect : this.onPersAccSel.bind(this),
            editable : false
        });

        var visiblePersons = this.model.persons.getVisible();
		visiblePersons.forEach(function(person)
		{
			this.persDDList.addItem({ id: person.id, title: person.name });
		}, this);

		if (!this.model.transaction.noAccount)
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
			visibleAccounts.forEach(function(acc)
			{
                this.srcDDList.addItem({ id: acc.id, title: acc.name });
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
			visibleAccounts.forEach(function(acc)
			{
				this.destDDList.addItem({ id: acc.id, title: acc.name });
			}, this);
		}
	}

	if (this.model.transaction.isIncome())
	{
		this.srcCurrDDList = DropDown.create({
			input_id : 'srcamountsign',
			listAttach : true,
			onitemselect : this.onSrcCurrencySel.bind(this),
			editable : false
		});
		this.model.currency.data.forEach(function(curr)
		{
			this.srcCurrDDList.addItem({ id: curr.id, title: curr.name });
		}, this);
	}

	if (this.model.transaction.isExpense())
	{
		this.destCurrDDList = DropDown.create({
			input_id : 'destamountsign',
			listAttach : true,
			onitemselect : this.onDestCurrencySel.bind(this),
			editable : false
		});
		this.model.currency.data.forEach(function(curr)
		{
			this.destCurrDDList.addItem({ id: curr.id, title: curr.name });
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

    var visibleAccounts = this.model.accounts.getVisible();
    visibleAccounts.forEach(function(acc)
    {
        this.accDDList.addItem({ id: acc.id, title: acc.name });
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
			wrapper : this.datePickerWrapper,
			relparent : this.datePickerWrapper.parentNode,
			ondateselect : this.onSelectDate.bind(this)
		});
	}
	if (!this.calendarObj)
		return;

	this.calendarObj.show(!this.calendarObj.visible());

	this.datePickerBtn.hide();
	show(this.dateBlock, true);

	setEmptyClick(this.calendarObj.hide.bind(this.calendarObj), [
		this.datePickerWrapper,
		this.datePickerBtn.elem,
		this.dateInputBtn
	]);
};

/**
 * Show comment field
 */
TransactionView.prototype.showComment = function()
{
	this.commentBtn.hide();
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
    if (infoBlock)
    	infoBlock.show(!showInput);

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
	if (!this.model.transaction.isDiff())
		this.resBalanceDestSwitch(false);
};


/**
 * Destination amount static click event handler
 */
TransactionView.prototype.onDestAmountSelect = function()
{
	this.destAmountSwitch(true);
	if (!this.model.transaction.isDiff() || this.model.transaction.isExpense())
		this.resBalanceSwitch(false);
	this.resBalanceDestSwitch(false);
	if (this.model.transaction.isDiff())
		this.exchRateSwitch(false);
};


/**
 * Source result balance static click event handler
 */
TransactionView.prototype.onResBalanceSelect = function()
{
	this.resBalanceSwitch(true);
	if (!this.model.transaction.isDiff())
		this.resBalanceDestSwitch(false);
	if (this.model.transaction.isTransfer() || this.model.transaction.isDebt())
		this.srcAmountSwitch(false);
	else
		this.destAmountSwitch(false);
	if (this.model.transaction.isExpense() && this.model.transaction.isDiff())
		this.exchRateSwitch(false);
};


/**
 * Destination result balance static click event handler
 */
TransactionView.prototype.onResBalanceDestSelect = function()
{
	this.resBalanceDestSwitch(true);
	if (this.model.transaction.isDiff())
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
	if (this.model.transaction.isDiff())
	{
		if (this.model.transaction.isExpense())
			this.resBalanceSwitch(false);
		else if (this.model.transaction.isIncome() || this.model.transaction.isTransfer())
			this.resBalanceDestSwitch(false);
	}
};


/**
 * Hide both source amount and exchange rate controls
 */
TransactionView.prototype.hideSrcAmountAndExchange = function()
{
	show(this.srcAmountRow, false);
    if (this.srcAmountInfo)
	    this.srcAmountInfo.hide();

	show(this.exchangeRow, false);
    if (this.exchangeInfo)
    	this.exchangeInfo.hide();
};


/**
 * Hide both destination amount and exchange rate controls
 */
TransactionView.prototype.hideDestAmountAndExchange = function()
{
	show(this.destAmountRow, false);
    if (this.destAmountInfo)
	    this.destAmountInfo.hide();

	show(this.exchangeRow, false);
    if (this.exchangeInfo)
	    this.exchangeInfo.hide();
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

	if (this.model.transaction.isTransfer())
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

	if (this.model.transaction.isTransfer())
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
    var debtAccountLabel = 'No account';

	if (this.model.transaction.noAccount) {
		debtAccountLabel = (this.model.transaction.debtType) ? 'Destination account' : 'Source account';
	}

	this.debtAccountLabel.textContent = debtAccountLabel;

	show(this.noAccountBtn, this.model.transaction.noAccount);
    show(this.srcTileBase, this.model.transaction.noAccount);
	show(this.selectAccountBtn, !this.model.transaction.noAccount);

	this.model.transaction.updateValue('no_account', !this.model.transaction.noAccount);

	var curr_id;
	if (this.model.transaction.noAccount)
	{
		this.model.transaction.updateValue('last_acc', parseInt(this.debtAccountInp.value));
		this.debtAccountInp.value = 0;

		curr_id = parseInt(this.srcCurrInp.value);
	}
	else
	{
		var lastAcc = this.model.accounts.getItem(this.model.transaction.lastAcc_id);
		this.debtAccountInp.value = lastAcc.id;

		curr_id = lastAcc.curr_id;
	}
	this.model.transaction.updateValue('src_curr', curr_id);
	this.model.transaction.updateValue('dest_curr', curr_id);

	this.onChangeAcc();

	if (!this.model.transaction.noAccount && !this.accDDList)
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
    if (this.srcAmountInfo)
    {
        var title = this.model.currency.formatCurrency((isValidValue(val) ? val : 0), this.model.transaction.srcCurr());
        this.srcAmountInfo.setTitle(title);
    }

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
    if (this.destAmountInfo)
    {
        var title = this.model.currency.formatCurrency((isValidValue(val) ? val : 0), this.model.transaction.destCurr());
        this.destAmountInfo.setTitle(title);
    }

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

    var srcCurr = this.model.currency.getItem(this.model.transaction.srcCurr());
    var destCurr = this.model.currency.getItem(this.model.transaction.destCurr());

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
        var fsa = this.model.transaction.srcAmount();
        var fda = this.model.transaction.destAmount();
        invExch = parseFloat((fsa / fda).toFixed(5));

        exchText += ' ('  + invExch + ' ' + srcCurr.sign + '/' + destCurr.sign + ')';
    }

    if (this.exchangeInfo)
        this.exchangeInfo.setTitle(val + ' ' + exchText);
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

    if (this.srcResBalanceInfo) {
        var fmtBal = this.model.currency.formatCurrency(isValidValue(val) ? val : valid, this.model.transaction.srcCurr());
        this.srcResBalanceInfo.setTitle(fmtBal);
    }
};


/**
 * Set result balance of destination value at View
 * @param {*} val - destination result balance value
 * @param {boolean} valid - valid value flag
 */
TransactionView.prototype.setDestResultBalance = function(val, valid)
{
    if ((typeof val === 'undefined' && typeof valid === 'undefined') || this.model.transaction.isExpense())
        return;

    if (this.destResBalanceInput)
    {
        var s2_dest = this.destResBalanceInput.value;
        var s2valid = isValidValue(s2_dest);
        var fs2_dest = (s2valid) ? normalize(s2_dest) : s2_dest;

        if (fs2_dest != val)
            this.destResBalanceInput.value = val;
    }

    if (this.destResBalanceInfo) {
        var fmtBal = this.model.currency.formatCurrency(isValidValue(val) ? val : valid, this.model.transaction.destCurr());
        this.destResBalanceInfo.setTitle(fmtBal);
    }
};


/**
 * Update information on person tile on currency change
 */
TransactionView.prototype.updatePersonTile = function()
{
    if (!this.model.transaction.isDebt() || !this.personTile)
        return;

    var person = this.model.persons.getItem(this.personIdInp.value);
    if (!person)
        return;

    var curr_id = this.model.transaction.debtType ? this.model.transaction.srcCurr() : this.model.transaction.destCurr();
    var personAccount = this.model.accounts.getPersonAccount(person.id, curr_id);
    var personBalance = (personAccount) ? personAccount.balance : 0;

    this.personTile.render({
        title: person.name,
        subtitle: this.model.currency.formatCurrency(personBalance, curr_id)
    });
};


/**
 * Update currency signs near to input fields
 */
TransactionView.prototype.updateCurrSigns = function()
{
    this.setSign(this.destAmountSign, this.destCurrDDList, this.model.transaction.destCurr());
    this.setSign(this.srcAmountSign, this.srcCurrDDList, this.model.transaction.srcCurr());
    this.setSign(this.srcResBalanceSign, null, this.model.transaction.srcCurr());
    this.setSign(this.destResBalanceSign, null, this.model.transaction.destCurr());
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

    var curr = this.model.currency.getItem(curr_id);
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
    var isDiff = this.model.transaction.isDiff();

    var tile = null;
    var accountInp = null;
    if (this.model.transaction.isExpense())
    {
        accountInp = this.srcIdInp;
        tile = this.srcTile;
    }
    else if (this.model.transaction.isIncome())
    {
        accountInp = this.destIdInp;
        tile = this.destTile;
    }
    else if (this.model.transaction.isDebt())
    {
        accountInp = this.debtAccountInp;
        tile = this.debtAccountTile;
    }

    var account_id = parseInt(accountInp.value);
    var copy_curr;
    if (this.model.transaction.isExpense() || (this.model.transaction.isDebt() && !this.model.transaction.debtType))
    {
        this.model.transaction.updateValue('src_id', account_id);
        this.onSrcCurrChanged();
        if (!isDiff)
        {
            copy_curr = this.model.transaction.srcCurr();
            this.model.transaction.updateValue('dest_curr', copy_curr);
            this.onDestCurrChanged(copy_curr);
        }
    }
    else if (this.model.transaction.isIncome() || (this.model.transaction.isDebt() && this.model.transaction.debtType))
    {
        this.model.transaction.updateValue('dest_id', account_id);
        this.onDestCurrChanged();
        if (!isDiff)
        {
            copy_curr = this.model.transaction.destCurr();
            this.model.transaction.updateValue('src_curr', copy_curr);
            this.onSrcCurrChanged(copy_curr);
        }
    }

    if (this.model.transaction.isDebt())
    {
        this.updatePersonTile();

        var srcAmount = this.model.transaction.srcAmount();
        this.setSrcAmount(isValidValue(srcAmount) ? srcAmount : '');
    }

    if (account_id)
        tile.render(this.model.accounts.getItem(account_id));
};


/**
 * Common transaction 'submit' event handler
 */
TransactionView.prototype.onFormSubmit = function(e)
{
    if (this.submitStarted) { 
        e.preventDefault();
        return;
    }

    if (this.model.transaction.isDebt())
        this.onDebtSubmit(e);
    else if (this.model.transaction.isTransfer() && this.mode != 'update')
        this.onTransferSubmit(e);
    else
        this.onSubmit(e);
};


/**
 * Expense/Income transaction 'submit' event handler
 */
TransactionView.prototype.onSubmit = function(e)
{
    var srcAmount = this.srcAmountInput.value;
    var destAmount = this.destAmountInput.value;

    var valid = true;
    if (isVisible(this.destAmountRow))
    {
        if (!destAmount || !destAmount.length || !isNum(fixFloat(destAmount)))
        {
            this.invalidateBlock('dest_amount_row');
            valid = false;
        }
    }

    if (isVisible(this.srcAmountRow))
    {
        if (!srcAmount || !srcAmount.length || !isNum(fixFloat(srcAmount)))
        {
            this.invalidateBlock('src_amount_row');
            valid = false;
        }
    }

    if (!checkDate(this.dateInput.value))
    {
        this.invalidateBlock('date_block');
        valid = false;
    }

    if (valid) {
        this.srcAmountInput.value = fixFloat(srcAmount);
        this.destAmountInput.value = fixFloat(destAmount);

        this.submitStarted = true;
        enable(this.submitBtn, false);
    } else {
        e.preventDefault();
    }
};


/**
 * Transfer transaction submit event handler
 */
TransactionView.prototype.onTransferSubmit = function(e)
{
    var srcAmount = this.srcAmountInput.value;
    var destAmount = this.destAmountInput.value;

    var valid = true;
    if (!srcAmount || !srcAmount.length || !isNum(fixFloat(srcAmount)))
    {
        this.invalidateBlock('src_amount_row');
        valid = false;
    }

    if (this.model.transaction.isDiff() && (!destAmount || !destAmount.length || !isNum(fixFloat(destAmount))))
    {
        this.invalidateBlock('dest_amount_row');
        valid = false;
    }

    if (!checkDate(this.dateInput.value))
    {
        this.invalidateBlock('date_block');
        valid = false;
    }

    if (valid) {
        this.srcAmountInput.value = fixFloat(srcAmount);
        this.destAmountInput.value = fixFloat(destAmount);

        this.submitStarted = true;
        enable(this.submitBtn, false);
    } else {
        e.preventDefault();
    }
};


/**
 * Debt transaction submit event handler
 */
TransactionView.prototype.onDebtSubmit = function(e)
{
    var srcAmount = this.srcAmountInput.value;
    var destAmount = this.destAmountInput.value;

    if (this.model.transaction.noAccount)
        this.debtAccountInp.value = 0;

    var valid = true;

    if (!srcAmount || !srcAmount.length || !isNum(fixFloat(srcAmount)))
    {
        this.invalidateBlock('src_amount_row');
        valid = false;
    }

    if (!destAmount || !destAmount.length || !isNum(fixFloat(destAmount)))
    {
        this.invalidateBlock('dest_amount_row');
        valid = false;
    }

    if (!checkDate(this.dateInput.value))
    {
        this.invalidateBlock('date_block');
        valid = false;
    }

    if (valid) {
        this.srcAmountInput.value = fixFloat(srcAmount);
        this.destAmountInput.value = fixFloat(destAmount);

        this.submitStarted = true;
        enable(this.submitBtn, false);
    } else {
        e.preventDefault();
    }
};


/**
 * Person select event handler
 */
TransactionView.prototype.onPersonSel = function()
{
    this.model.transaction.updateValue('person_id', this.personIdInp.value);

    this.updatePersonTile();
};


/**
 * Debt operation type change event handler
 */
TransactionView.prototype.onChangeDebtOp = function()
{
    var dType = this.debtGiveRadio.checked;
    if (dType == this.model.transaction.debtType)
        return;

    insertAfter(this.srcResBalanceInfo.elem, (dType) ? this.exchangeInfo.elem : this.destAmountInfo.elem);
    insertAfter(this.destResBalanceInfo.elem, (dType) ? this.destAmountInfo.elem : this.exchangeInfo.elem);

    var rbv = isVisible(this.srcResBalanceRow);
    if (rbv || isVisible(this.destResBalanceRow))
    {
        this.resBalanceSwitch(!rbv);
        this.resBalanceDestSwitch(rbv);
    }

    this.model.transaction.updateValue('debt_type', dType);

    if (!this.model.transaction.noAccount)
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
    this.model.transaction.updateValue('src_id', this.srcIdInp.value);
    this.onSrcCurrChanged();

    if (this.srcIdInp.value == this.destIdInp.value)
    {
        var nextAccount = this.model.accounts.getNextAccount(this.destIdInp.value);
        if (nextAccount != 0)
        {
            this.destIdInp.value = nextAccount;
            this.model.transaction.updateValue('dest_id', nextAccount);
            this.destDDList.selectItem(nextAccount);
            this.onDestCurrChanged();
        }
    }

    if (this.model.transaction.isDebt())
    {
        this.updatePersonTile();
    }
    else
    {
        if (this.srcTile)
            this.srcTile.render(this.model.accounts.getItem(this.model.transaction.srcAcc()));
        if (this.destTile)
            this.destTile.render(this.model.accounts.getItem(this.model.transaction.destAcc()));
    }
};


/**
 * Destination account change event handler
 */
TransactionView.prototype.onChangeDest = function()
{
    this.model.transaction.updateValue('dest_id', this.destIdInp.value);
    this.onDestCurrChanged();

    if (this.srcIdInp.value == this.destIdInp.value)
    {
        var nextAccount = this.model.accounts.getNextAccount(this.srcIdInp.value);
        if (nextAccount != 0)
        {
            this.srcIdInp.value = nextAccount;
            this.model.transaction.updateValue('src_id', nextAccount);
            this.srcDDList.selectItem(nextAccount);
            this.onSrcCurrChanged();
        }
    }

    if (this.model.transaction.isDebt())
    {
        this.updatePersonTile();
    }
    else
    {
        if (this.srcTile)
            this.srcTile.render(this.model.accounts.getItem(this.model.transaction.srcAcc()));
        if (this.destTile)
            this.destTile.render(this.model.accounts.getItem(this.model.transaction.destAcc()));
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
        this.clearBlockValidation('src_amount_row');
        this.model.transaction.updateValue('src_amount', obj.value);
    }
    else if (obj.id == 'dest_amount')
    {
        this.clearBlockValidation('dest_amount_row');
        this.model.transaction.updateValue('dest_amount', obj.value);
    }
    else if (obj.id == 'exchrate')
        this.model.transaction.updateValue('exchrate', obj.value);
    else if (obj.id == 'resbal')
        this.model.transaction.updateValue('src_resbal', obj.value);
    else if (obj.id == 'resbal_d')
        this.model.transaction.updateValue('dest_resbal', obj.value);

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
    this.model.transaction.updateValue('src_curr', srcCurr);
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

    if (this.model.transaction.isDiff())
    {
        this.setAmountInputLabel(true, true);
        this.setAmountTileBlockLabel(true, true);
        this.setAmountInputLabel(false, true);
        this.setAmountTileBlockLabel(false, true);
        if (this.model.transaction.isIncome())
        {
            this.setCurrActive(true, true);		// set source active
            this.setCurrActive(false, false);		// set destination inactive
        }

        var toShowDestAmount = false;
        if (this.model.transaction.isTransfer())
            toShowDestAmount = !rbv_d && !(rbv_s && exch) && !(am_s && exch);
        else
            toShowDestAmount = !rbv_s && !rbv_d && !exch;
        this.destAmountSwitch(toShowDestAmount);

        if (this.model.transaction.isTransfer())
            this.srcAmountSwitch(!rbv_s);

        if (!isVisible(this.exchangeRow))
            this.exchRateSwitch(false);
        this.setExchRate(this.model.transaction.exchRate());
    }
    else
    {
        this.setAmountInputLabel(true, false);
        this.setAmountInputLabel(false, false);
        this.setAmountTileBlockLabel(true, false);
        this.setAmountTileBlockLabel(false, false);
        if (this.model.transaction.isExpense())
            this.hideSrcAmountAndExchange();
        else if (this.model.transaction.isIncome() || this.model.transaction.isTransfer() || this.model.transaction.isDebt())
            this.hideDestAmountAndExchange();

        if (this.model.transaction.isIncome() || this.model.transaction.isTransfer() || this.model.transaction.isDebt())
            this.srcAmountSwitch(!rbv_d && !rbv_s);
        if (this.model.transaction.isExpense())
            this.destAmountSwitch(!rbv_s);

        if (this.model.transaction.isTransfer())
        {
            if (rbv_s && rbv_d)
                this.resBalanceDestSwitch(false);
        }
        else if (this.model.transaction.isDebt())
        {
            if (this.model.transaction.noAccount)
            {
                if (this.model.transaction.debtType)
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
    this.model.transaction.updateValue('dest_curr', destCurr);
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

    if (this.model.transaction.isDiff())
    {
        this.setAmountInputLabel(true, true);
        this.setAmountTileBlockLabel(true, true);
        this.setAmountInputLabel(false, true);
        this.setAmountTileBlockLabel(false, true);
        if (this.model.transaction.isIncome())
            this.setCurrActive(true, true);		// set source active
        else
            this.setCurrActive(true, false);		// set source inactive

        if (this.model.transaction.isExpense())
            this.setCurrActive(false, true);		// set destination active
        else
            this.setCurrActive(false, false);		// set destination inactive

        var toShowSrcAmount = false;
        if (this.model.transaction.isIncome())
            toShowSrcAmount = (am_s && am_d) || (am_s && rbv_d) || (am_s && exch);
        else if (this.model.transaction.isExpense())
            toShowSrcAmount = true;
        else if (this.model.transaction.isTransfer())
            toShowSrcAmount = !rbv_s;
        this.srcAmountSwitch(toShowSrcAmount);

        if (this.model.transaction.isTransfer())
            this.destAmountSwitch(!rbv_d && !(rbv_s && exch) && !(am_s && exch));

        if (!isVisible(this.exchangeRow))
            this.exchRateSwitch(false);
        this.setExchRate(this.model.transaction.exchRate());
    }
    else
    {
        this.setAmountInputLabel(true, false);
        this.setAmountInputLabel(false, false);
        this.setAmountTileBlockLabel(true, false);
        this.setAmountTileBlockLabel(false, false);

        if (this.model.transaction.isIncome() || this.model.transaction.isTransfer() || this.model.transaction.isDebt())
            this.srcAmountSwitch(!rbv_d && !rbv_s);
        if (this.model.transaction.isExpense())
            this.destAmountSwitch(!rbv_s);

        if (this.model.transaction.isIncome() || this.model.transaction.isTransfer() || this.model.transaction.isDebt())
            this.hideDestAmountAndExchange();
        else		// Expense
            this.hideSrcAmountAndExchange();

        if (this.model.transaction.isTransfer())
        {
            if (rbv_s && rbv_d)
                this.resBalanceSwitch(false);
        }
        else if (this.model.transaction.isDebt())
        {
            if (this.model.transaction.noAccount)
            {
                if (this.model.transaction.debtType)
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
 * Create and show transaction delete warning popup
 */
TransactionView.prototype.confirmDelete = function()
{
    ConfirmDialog.create({
        id: 'delete_warning',
        title: singleTransDeleteTitle,
        content: singleTransDeleteMsg,
        onconfirm: function() {
            this.deleteForm.submit();
        }.bind(this)
    });
};


