'use strict';

/* global ce, re, fixFloat, show, enable, extend, AppComponent */
/* global checkDate, formatDate, copyObject, addChilds, removeChilds */
/* global EXPENSE, INCOME, TRANSFER, DEBT, AccountList, DropDown */

/**
 * ImportTransactionItem component constructor
 * @param {Object} props
 */
function ImportTransactionItem() {
    ImportTransactionItem.parent.constructor.apply(this, arguments);

    if (
        !this.parent
        || !this.props
        || !this.props.mainAccount
        || !this.props.currencyModel
        || !this.props.accountModel
        || !this.props.personModel
    ) {
        throw new Error('Invalid props');
    }

    this.model = {
        currency: this.props.currencyModel,
        accounts: this.props.accountModel,
        persons: this.props.personModel,
        mainAccount: this.props.mainAccount
    };

    this.transTypeMap = {
        expense: EXPENSE,
        income: INCOME,
        transferfrom: TRANSFER,
        transferto: TRANSFER,
        debtfrom: DEBT,
        debtto: DEBT
    };

    this.state = {
        enabled: true,
        type: 'expense',
        accountId: this.model.mainAccount.id,
        accountCurrId: this.model.mainAccount.curr_id,
        secondAccountId: 0,
        secondAccountCurrId: 0,
        secondAccountVisible: false,
        currId: this.model.mainAccount.curr_id,
        isDiff: false,
        amount: '',
        secondAmount: '',
        personId: 0,
        personVisible: false,
        date: '',
        comment: ''
    };

    // Row enable checkbox
    this.enableCheck = ce('input', { type: 'checkbox' });
    this.enableCheck.addEventListener('change', this.onRowChecked.bind(this));

    this.createCurrencyField();
    this.createTypeField();
    this.createAccountField();
    this.createPersonField();

    // Amount controls
    this.amountInp = ce('input', {
        type: 'text',
        name: 'amount[]',
        placeholder: 'Amount'
    }, null, { input: this.onAmountInput.bind(this) });
    this.amountField = this.createField('Amount', this.amountInp, 'amount-field');

    this.destAmountInp = ce(
        'input',
        {
            type: 'text',
            name: 'dest_amount[]',
            disabled: true,
            placeholder: 'Destination amount'
        },
        null,
        { input: this.onDestAmountInput.bind(this) }
    );
    this.destAmountField = this.createField('Destination amount', this.destAmountInp, 'amount-field');
    // Date field
    this.dateInp = ce(
        'input',
        { type: 'text', name: 'date[]', placeholder: 'Date' },
        null,
        { input: this.onDateInput.bind(this) }
    );
    this.dateField = this.createField('Date', this.dateInp, 'date-field');
    // Comment field
    this.commInp = ce(
        'input',
        { type: 'text', name: 'comment[]', placeholder: 'Comment' },
        null,
        { input: this.onCommentInput.bind(this) }
    );
    this.commentField = this.createField('Comment', this.commInp, 'comment-field');
    // Delete button
    this.delBtn = ce(
        'button',
        { className: 'btn delete-btn', type: 'button' },
        this.createIcon('del'),
        { click: this.remove.bind(this) }
    );
    // Toggle expand/collapse
    this.toggleExtBtn = ce(
        'button',
        { className: 'btn toggle-btn hidden', type: 'button' },
        this.createIcon('toggle-ext'),
        { click: this.toggleCollapse.bind(this) }
    );

    this.topRow = this.createContainer('form-row', [
        this.amountField,
        this.currField,
        this.dateField,
        this.commentField
    ]);

    this.bottomRow = this.createContainer('form-row hidden', [
        this.destAccountField,
        this.personField,
        this.destAmountField
    ]);

    this.formContainer = this.createContainer('form-container', [
        this.trTypeField,
        this.createContainer('form-rows', [
            this.topRow,
            this.bottomRow
        ])
    ]);

    this.mainContainer = this.createContainer('main-content', [
        this.createCheck(this.enableCheck, 'enable-check'),
        this.formContainer,
        this.createContainer('row-container controls', [
            this.delBtn,
            this.toggleExtBtn
        ])
    ]);
    this.feedbackElem = ce('div', { className: 'invalid-feedback hidden' });
    this.extendedContainer = this.createContainer('extended-content');

    this.elem = this.createContainer('import-item', [
        this.mainContainer,
        this.feedbackElem,
        this.extendedContainer
    ]);

    this.data = null;
    if (this.props.originalData) {
        this.setOriginal(this.props.originalData);
        this.setExtendedContent(
            this.createOrigDataContainer(this.props.originalData, this.model.mainAccount)
        );
    }

    this.render();
}

extend(ImportTransactionItem, AppComponent);

/**
 * Create new ImportTransactionItem from specified element
 */
ImportTransactionItem.create = function (props) {
    var res;

    try {
        res = new ImportTransactionItem(props);
    } catch (e) {
        res = null;
    }

    return res;
};

/** Create transaction type field */
ImportTransactionItem.prototype.createTypeField = function () {
    var transferDisabled = this.model.accounts.length < 2;
    var debtDisabled = !this.model.persons.length;
    var typeItems = [
        { id: 'expense', title: 'Expense' },
        { id: 'income', title: 'Income' },
        { id: 'transferfrom', title: 'Transfer from', disabled: transferDisabled },
        { id: 'transferto', title: 'Transfer to', disabled: transferDisabled },
        { id: 'debtfrom', title: 'Debt from', disabled: debtDisabled },
        { id: 'debtto', title: 'Debt to', disabled: debtDisabled }
    ];
    var selectElem = ce('select');

    this.trTypeField = this.createField('Type', selectElem);

    this.typeDropDown = DropDown.create({
        input_id: selectElem,
        onchange: this.onTrTypeChanged.bind(this),
        editable: false
    });
    typeItems.forEach(function (typeItem) {
        this.typeDropDown.addItem(typeItem);
        if (typeItem.disabled) {
            this.typeDropDown.enableItem(typeItem.id, false);
        }
    }, this);
};

/** Create destination(second) account field */
ImportTransactionItem.prototype.createAccountField = function () {
    var selectElem = ce('select');
    var accountItems = this.model.accounts.map(function (account) {
        return { id: account.id, title: account.name };
    });
    this.destAccountField = this.createField('Destination account', selectElem);

    this.destAccDropDown = DropDown.create({
        input_id: selectElem,
        disabled: true,
        onchange: this.onDestChanged.bind(this),
        editable: false
    });

    this.destAccDropDown.append(accountItems);
    this.destAccDropDown.enableItem(this.state.accountId, false);
};

/** Create person field */
ImportTransactionItem.prototype.createPersonField = function () {
    var personItems = this.model.persons.map(function (person) {
        return { id: person.id, title: person.name };
    });
    var selectElem = ce('select');
    this.personField = this.createField('Person', selectElem);

    this.personDropDown = DropDown.create({
        input_id: selectElem,
        disabled: true,
        onchange: this.onPersonChanged.bind(this),
        editable: false
    });

    this.personDropDown.append(personItems);
};

/** Create currency field */
ImportTransactionItem.prototype.createCurrencyField = function () {
    var currencyItems = this.model.currency.map(function (currency) {
        return { id: currency.id, title: currency.name };
    });
    var selectElem = ce('select');
    this.currField = this.createField('Currency', selectElem);

    this.currencyDropDown = DropDown.create({
        input_id: selectElem,
        onchange: this.onCurrChanged.bind(this),
        editable: false
    });

    this.currencyDropDown.append(currencyItems);
};

/** Create static data value element */
ImportTransactionItem.prototype.createDataValue = function (title, value, extraClass) {
    var elemClasses = ['data-value'];

    if (typeof extraClass === 'string' && extraClass.length > 0) {
        elemClasses.push(extraClass);
    }

    return ce('div', { className: elemClasses.join(' ') }, [
        ce('label', { textContent: title }),
        ce('div', { textContent: value })
    ]);
};

/**
 * Create set of static data values for original transaction data
 * @param {Object} data - import transaction object
 */
ImportTransactionItem.prototype.createOrigDataContainer = function (data, mainAccount) {
    var dateFmt;

    if (!data || !mainAccount) {
        throw new Error('Invalid data');
    }

    dateFmt = formatDate(new Date(data.date));

    return this.createContainer('orig-data', [
        ce('h3', { textContent: 'Original imported data' }),
        this.createContainer('orig-data-table', [
            this.createDataValue('Main account', mainAccount.name),
            this.createDataValue('Date', dateFmt),
            this.createDataValue('Tr. amount', data.trAmountVal),
            this.createDataValue('Tr. currency', data.trCurrVal),
            this.createDataValue('Acc. amount', data.accAmountVal),
            this.createDataValue('Acc. currency', data.accCurrVal),
            this.createDataValue('Comment', data.comment, 'comment-value')
        ])
    ]);
};

/**
 * Setup extended content of item
 * If value is null content is removed and toggle button hidden
 * @param {Element|null} content - value to set extended content
 */
ImportTransactionItem.prototype.setExtendedContent = function (content) {
    removeChilds(this.extendedContainer);

    if (content) {
        addChilds(this.extendedContainer, content);
    } else {
        this.elem.classList.remove('import-item_expanded');
    }

    show(this.toggleExtBtn, content);
};

/** Apply import data to component */
ImportTransactionItem.prototype.setOriginal = function (data) {
    var amount;
    var trAmount;
    var accCurr;
    var trCurr;

    if (!data) {
        throw new Error('Invalid data');
    }

    if (data !== this.data) {
        this.data = copyObject(data);
        this.data.origAccount = copyObject(this.model.mainAccount);
    }
    this.data.mainAccount = this.model.mainAccount.id;

    accCurr = this.model.currency.findByName(this.data.accCurrVal);
    if (!accCurr) {
        throw new Error('Unknown currency ' + this.data.accCurrVal);
    }
    if (accCurr.id !== this.model.mainAccount.curr_id) {
        throw new Error('Currency must be the same as main account');
    }

    trCurr = this.model.currency.findByName(this.data.trCurrVal);
    if (!trCurr) {
        throw new Error('Unknown currency ' + data.trCurrVal);
    }

    amount = parseFloat(fixFloat(data.accAmountVal));
    if (Number.isNaN(amount) || amount === 0) {
        throw new Error('Invalid account amount value');
    }
    trAmount = parseFloat(fixFloat(data.trAmountVal));
    if (Number.isNaN(trAmount) || trAmount === 0) {
        throw new Error('Invalid transaction amount value');
    }

    if (amount > 0) {
        this.invertTransactionType();
    }

    this.setAmount(Math.abs(amount));
    if (trCurr.id !== accCurr.id) {
        this.setCurrency(trCurr.id);
        this.setSecondAmount(Math.abs(trAmount));
    }
    this.setDate(formatDate(new Date(this.data.date)));
    this.setComment(this.data.comment);
};

/** Restore original data */
ImportTransactionItem.prototype.restoreOriginal = function () {
    var currentMainAccount = this.data.mainAccount;

    this.setTransactionType('expense');
    this.setMainAccount(this.data.origAccount.id);
    this.setCurrency(this.data.origAccount.curr_id);
    this.setAmount(0);

    this.setOriginal(this.data);

    this.setMainAccount(currentMainAccount);
};

/**
 * Remove item component
 */
ImportTransactionItem.prototype.remove = function () {
    if (!this.parent.onRemoveItem(this)) {
        return;
    }

    re(this.elem);
};

/** Enable checkbox 'change' event handler */
ImportTransactionItem.prototype.onRowChecked = function () {
    var value = this.enableCheck.checked;
    this.enable(value);
    this.render();

    this.parent.onEnableItem(this, this.enableCheck.checked);
};

/** Toggle collapse/expand button 'click' event handler */
ImportTransactionItem.prototype.toggleCollapse = function () {
    this.elem.classList.toggle('import-item_expanded');
};

/**
 * Enable/disable component
 * @param {boolean} val - if true then enables component, else disable
 */
ImportTransactionItem.prototype.enable = function (value) {
    var state;
    var res = !!value;

    if (this.state.enabled === res) {
        return this.state;
    }
    state = copyObject(this.state);
    state.enabled = res;

    this.state = state;
    return state;
};

/** Return component enabled status */
ImportTransactionItem.prototype.isEnabled = function () {
    return this.state.enabled;
};

/** Main account of transaction select 'change' event handler */
ImportTransactionItem.prototype.onMainAccountChanged = function (value) {
    this.setMainAccount(value);
    this.render();
};

/**
 * Return for specified state first available user account different from main account
 * @param {Object} state - state object
 */
ImportTransactionItem.prototype.getFirstAvailAccount = function (state) {
    var userAccountsData = this.model.accounts.getUserAccounts(this.model.mainAccount.owner_id);
    var userAccounts = new AccountList(userAccountsData);
    var visibleAccounts = userAccounts.getVisible();
    var res = visibleAccounts[0];

    if (res.id === state.accountId) {
        res = visibleAccounts[1];
    }

    return res;
};

/**
 * Return next available user account different from specified
 * @param {number} accountId - account id to find next account for
 */
ImportTransactionItem.prototype.getNextAccount = function (accountId) {
    var userAccountsData = this.model.accounts.getUserAccounts(this.model.mainAccount.owner_id);
    var userAccounts = new AccountList(userAccountsData);
    var visibleAccountsData = userAccounts.getVisible();
    var userVisible = new AccountList(visibleAccountsData);
    var ind;
    var resInd;
    var res;

    if (!userVisible.length) {
        return null;
    }

    if (!accountId) {
        return userVisible.getItemByIndex(0);
    }

    if (userVisible.length < 2) {
        return null;
    }

    ind = userVisible.getItemIndex(accountId);
    if (ind === -1 || ind === null) {
        return null;
    }

    resInd = (ind === userVisible.length - 1) ? 0 : ind + 1;
    res = userVisible.getItemByIndex(resInd);

    return res;
};

/** Transaction type select 'change' event handler */
ImportTransactionItem.prototype.onTrTypeChanged = function (type) {
    this.setTransactionType(type.id);
    this.clearInvalid();
    this.render();
};

/** Destination account select 'change' event handler */
ImportTransactionItem.prototype.onDestChanged = function (account) {
    this.setSecondAccount(account.id);
    this.clearInvalid();
    this.render();
};

/** Synchronize options of destination account select */
ImportTransactionItem.prototype.syncDestAccountSelect = function (state) {
    var accountItems = this.destAccDropDown.getVisibleItems();
    accountItems.forEach(function (accountItem) {
        var isMainAccount = accountItem.id === state.accountId;
        this.destAccDropDown.enableItem(accountItem.id, !isMainAccount);
    }, this);
};

/** Person select 'change' event handler */
ImportTransactionItem.prototype.onPersonChanged = function (person) {
    this.setPerson(person.id);
    this.clearInvalid();
    this.render();
};

/** Amount field 'input' event handler */
ImportTransactionItem.prototype.onAmountInput = function () {
    var value = this.amountInp.value;
    this.setAmount(value);
    this.clearInvalid();
    this.render();
};

/** Destination amount field 'input' event handler */
ImportTransactionItem.prototype.onDestAmountInput = function () {
    var value = this.destAmountInp.value;
    this.setSecondAmount(value);
    this.clearInvalid();
    this.render();
};

/** Currency select 'change' event handler */
ImportTransactionItem.prototype.onCurrChanged = function (currency) {
    this.setCurrency(currency.id);
    this.clearInvalid();
    this.render();
};

/** Date field 'input' event handler */
ImportTransactionItem.prototype.onDateInput = function () {
    var value = this.dateInp.value;
    this.setDate(value);
    this.clearInvalid();
    this.render();
};

/** Comment field 'input' event handler */
ImportTransactionItem.prototype.onCommentInput = function () {
    var value = this.dateInp.value;
    this.setComment(value);
    this.clearInvalid();
    this.render();
};

/** Set type of transaction */
ImportTransactionItem.prototype.setTransactionType = function (value) {
    var secondAccount;
    var state;

    if (typeof value !== 'string' || !(value in this.transTypeMap)) {
        throw new Error('Invalid transaction type');
    }

    if (this.state.type === value) {
        return this.state;
    }
    state = copyObject(this.state);

    if (value === 'expense' || value === 'income') {
        state.personId = 0;
        state.personVisible = false;
        state.secondAccountId = 0;
        state.secondAccountVisible = false;

        if (!state.isDiff
            || (value === 'expense' && state.type !== 'income')
            || (value === 'income' && state.type !== 'expense')) {
            state.currId = state.accountCurrId;
        }
    } else if (value === 'transferfrom' || value === 'transferto') {
        state.personId = 0;
        state.personVisible = false;
        state.secondAccountVisible = true;
        if (!state.secondAccountId) {
            secondAccount = this.getFirstAvailAccount(state);
            state.secondAccountId = secondAccount.id;
            state.secondAccountCurrId = secondAccount.curr_id;
        }
        state.currId = state.secondAccountCurrId;
    } else if (value === 'debtfrom' || value === 'debtto') {
        state.secondAccountId = 0;
        state.secondAccountVisible = false;
        state.personVisible = true;
        if (!state.personId) {
            state.personId = this.model.persons.data[0].id;
        }
        state.currId = state.accountCurrId;
    }
    state.isDiff = state.currId !== state.accountCurrId;
    if (!state.isDiff) {
        state.secondAmount = '';
    }
    state.type = value;

    this.state = state;
    return state;
};

/** Invert type of transaction */
ImportTransactionItem.prototype.invertTransactionType = function () {
    var typeValue;
    var trType = this.state.type;

    if (trType === 'expense') {
        typeValue = 'income';
    } else if (trType === 'income') {
        typeValue = 'expense';
    } else if (trType === 'transferfrom') {
        typeValue = 'transferto';
    } else if (trType === 'transferto') {
        typeValue = 'transferfrom';
    } else if (trType === 'debtto') {
        typeValue = 'debtfrom';
    } else if (trType === 'debtfrom') {
        typeValue = 'debtto';
    }

    return this.setTransactionType(typeValue);
};

/** Set currency */
ImportTransactionItem.prototype.setCurrency = function (value) {
    var state;
    var selectedCurr;

    if (typeof value === 'undefined') {
        throw new Error('Invalid currency value');
    }
    selectedCurr = parseInt(value, 10);
    if (Number.isNaN(selectedCurr)) {
        throw new Error('Invalid currency selected');
    }

    if (this.state.currId === selectedCurr) {
        return this.state;
    }
    state = copyObject(this.state);

    state.currId = selectedCurr;
    state.isDiff = state.accountCurrId !== state.currId;
    if (!state.isDiff) {
        state.secondAmount = '';
    }

    this.state = state;
    return state;
};

/** Set main account */
ImportTransactionItem.prototype.setMainAccount = function (value) {
    var account;
    var secondAccount;
    var state;

    account = this.model.accounts.getItem(value);
    if (!account) {
        throw new Error('Account not found');
    }

    if (this.state.accountId === account.id) {
        return this.state;
    }
    state = copyObject(this.state);

    this.model.mainAccount = account;
    if (this.data) {
        this.data.mainAccount = account.id;
    }
    state.accountId = account.id;
    state.accountCurrId = account.curr_id;

    if (state.type === 'expense' || state.type === 'income') {
        if (!state.isDiff) {
            state.currId = state.accountCurrId;
        }
    } else if (state.type === 'transferfrom' || state.type === 'transferto') {
        if (state.secondAccountId === state.accountId) {
            secondAccount = this.getNextAccount(state.secondAccountId);
            state.secondAccountId = secondAccount.id;
            state.secondAccountCurrId = secondAccount.curr_id;
        }
        state.currId = state.secondAccountCurrId;
    } else if (state.type === 'debtfrom' || state.type === 'debtto') {
        state.currId = state.accountCurrId;
    }
    state.isDiff = state.accountCurrId !== state.currId;
    if (!state.isDiff) {
        state.secondAmount = '';
    }

    this.state = state;
    return state;
};

/** Set second account */
ImportTransactionItem.prototype.setSecondAccount = function (value) {
    var account;
    var state;

    account = this.model.accounts.getItem(value);
    if (!account) {
        throw new Error('Account not found');
    }

    if (this.state.secondAccountId === account.id) {
        return this.state;
    }
    state = copyObject(this.state);

    state.secondAccountId = account.id;
    state.secondAccountCurrId = account.curr_id;
    state.currId = state.secondAccountCurrId;
    state.isDiff = state.accountCurrId !== state.currId;
    if (!state.isDiff) {
        state.secondAmount = '';
    }

    this.state = state;

    return state;
};

/** Set person */
ImportTransactionItem.prototype.setPerson = function (value) {
    var person;
    var state;

    person = this.model.persons.getItem(value);
    if (!person) {
        throw new Error('Person not found');
    }

    if (this.state.personId === person.id) {
        return this.state;
    }
    state = copyObject(this.state);
    state.personId = person.id;

    this.state = state;

    return state;
};

/** Set source amount */
ImportTransactionItem.prototype.setAmount = function (value) {
    var res;
    var state;

    if (typeof value === 'undefined') {
        throw new Error('Invalid amount value');
    }
    res = parseFloat(fixFloat(value));
    if (Number.isNaN(res)) {
        throw new Error('Invalid amount value');
    }

    if (this.state.amount === value) {
        return this.state;
    }
    state = copyObject(this.state);
    state.amount = value;

    this.state = state;

    return state;
};

/** Set second amount */
ImportTransactionItem.prototype.setSecondAmount = function (value) {
    var res;
    var state;

    if (typeof value === 'undefined') {
        throw new Error('Invalid amount value');
    }
    res = parseFloat(fixFloat(value));
    if (Number.isNaN(res)) {
        throw new Error('Invalid amount value');
    }

    if (
        !this.state.isDiff
        || this.state.secondAmount === value
    ) {
        return this.state;
    }
    state = copyObject(this.state);
    state.secondAmount = value;

    this.state = state;

    return state;
};

/** Set date */
ImportTransactionItem.prototype.setDate = function (value) {
    var state;

    if (typeof value === 'undefined') {
        throw new Error('Invalid date value');
    }

    if (this.state.date === value) {
        return this.state;
    }
    state = copyObject(this.state);
    state.date = value;

    this.state = state;

    return state;
};

/** Set comment */
ImportTransactionItem.prototype.setComment = function (value) {
    var state;

    if (typeof value !== 'string') {
        throw new Error('Invalid comment value');
    }

    if (this.state.comment === value) {
        return this.state;
    }
    state = copyObject(this.state);
    state.comment = value;

    this.state = state;

    return state;
};

/** Return original data object */
ImportTransactionItem.prototype.getOriginal = function () {
    return this.data;
};

/** Validate transaction object */
ImportTransactionItem.prototype.setFeedback = function (value) {
    if (typeof value === 'string' && value.length > 0) {
        this.feedbackElem.textContent = value;
        show(this.feedbackElem, true);
    } else {
        this.feedbackElem.textContent = '';
        show(this.feedbackElem, false);
    }
};

/** Remove all invalidated marks */
ImportTransactionItem.prototype.clearInvalid = function () {
    this.parent.clearBlockValidation(this.amountField);
    this.parent.clearBlockValidation(this.destAmountField);
    this.parent.clearBlockValidation(this.dateField);
    this.setFeedback();
};

/** Validate transaction object */
ImportTransactionItem.prototype.validate = function () {
    var state = this.state;
    var amountVal;
    var secondAmountVal = parseFloat(fixFloat(state.secondAmount));

    amountVal = parseFloat(fixFloat(state.amount));
    if (Number.isNaN(amountVal) || amountVal <= 0) {
        this.parent.invalidateBlock(this.amountField);
        this.setFeedback('Please input correct amount');
        return false;
    }

    if (state.isDiff) {
        secondAmountVal = parseFloat(fixFloat(state.secondAmount));
        if (Number.isNaN(secondAmountVal) || secondAmountVal <= 0) {
            this.parent.invalidateBlock(this.destAmountField);
            this.setFeedback('Please input correct second amount');
            return false;
        }
    }

    if (!checkDate(state.date)) {
        this.parent.invalidateBlock(this.dateField);
        this.setFeedback('Please input correct date');
        return false;
    }

    return true;
};

/** Return date string */
ImportTransactionItem.prototype.getDate = function () {
    return this.state.date;
};

/** Return transaction object */
ImportTransactionItem.prototype.getData = function () {
    var state = this.state;

    var secondAcc = this.model.accounts.getItem(state.secondAccountId);
    var person = this.model.persons.getItem(state.personId);
    var amountVal = parseFloat(fixFloat(state.amount));
    var secondAmountVal = parseFloat(fixFloat(state.secondAmount));
    var selectedCurr = parseInt(state.currId, 10);
    var res = {};

    if (!secondAcc && (state.type === 'transferfrom' || state.type === 'transferto')) {
        throw new Error('Invalid transaction: Second account not set');
    }
    if (!person && (state.type === 'debtfrom' || state.type === 'debtto')) {
        throw new Error('Invalid transaction: Person not set');
    }

    if (state.type === 'expense') {
        res.type = EXPENSE;
        res.src_id = state.accountId;
        res.dest_id = 0;
        res.src_curr = state.accountCurrId;
        res.dest_curr = selectedCurr;
        res.src_amount = amountVal;
        res.dest_amount = (state.isDiff) ? secondAmountVal : amountVal;
    } else if (state.type === 'income') {
        res.type = INCOME;
        res.src_id = 0;
        res.dest_id = state.accountId;
        res.src_curr = selectedCurr;
        res.dest_curr = state.accountCurrId;
        res.src_amount = (state.isDiff) ? secondAmountVal : amountVal;
        res.dest_amount = amountVal;
    } else if (state.type === 'transferfrom') {
        res.type = TRANSFER;
        res.src_id = state.accountId;
        res.dest_id = secondAcc.id;
        res.src_curr = state.accountCurrId;
        res.dest_curr = secondAcc.curr_id;
        res.src_amount = amountVal;
        res.dest_amount = (state.isDiff) ? secondAmountVal : amountVal;
    } else if (state.type === 'transferto') {
        res.type = TRANSFER;
        res.src_id = secondAcc.id;
        res.dest_id = state.accountId;
        res.src_curr = secondAcc.curr_id;
        res.dest_curr = state.accountCurrId;
        res.src_amount = (state.isDiff) ? secondAmountVal : amountVal;
        res.dest_amount = amountVal;
    } else if (state.type === 'debtfrom' || state.type === 'debtto') {
        res.type = DEBT;
        res.op = (state.type === 'debtto') ? 1 : 2;
        res.person_id = person.id;
        res.acc_id = state.accountId;
        res.src_curr = state.accountCurrId;
        res.dest_curr = state.accountCurrId;
        res.src_amount = amountVal;
        res.dest_amount = amountVal;
    }

    res.date = state.date;
    res.comment = state.comment;

    return res;
};

/** Render component */
ImportTransactionItem.prototype.render = function () {
    var isExpenseOrIncome;
    var isTransfer;
    var isDebt;
    var showBottom;
    var state = this.state;

    if (!state) {
        throw new Error('Invalid state');
    }

    isExpenseOrIncome = ['expense', 'income'].includes(state.type);
    isTransfer = ['transferfrom', 'transferto'].includes(state.type);
    isDebt = ['debtfrom', 'debtto'].includes(state.type);
    showBottom = (!isExpenseOrIncome || state.isDiff);

    if (state.enabled) {
        this.elem.classList.remove('import-item_disabled');
    } else {
        this.elem.classList.add('import-item_disabled');
    }

    this.enableCheck.checked = state.enabled;
    this.typeDropDown.enable(state.enabled);
    enable(this.amountInp, state.enabled);
    this.currencyDropDown.enable(state.enabled && isExpenseOrIncome);
    this.destAccDropDown.enable(state.enabled && isTransfer);
    this.personDropDown.enable(state.enabled && isDebt);
    enable(this.destAmountInp, state.enabled && state.isDiff);
    enable(this.dateInp, state.enabled);
    enable(this.commInp, state.enabled);

    this.typeDropDown.selectItem(state.type);

    // Amount field
    this.amountInp.value = state.amount;
    // Currency field
    this.currencyDropDown.selectItem(state.currId);

    // Bottom row
    show(this.bottomRow, showBottom);

    // Second account field
    this.syncDestAccountSelect(state);
    this.destAccDropDown.selectItem(state.secondAccountId);
    show(this.destAccountField, state.secondAccountVisible);

    // Second amount field
    this.destAmountInp.value = state.secondAmount;
    show(this.destAmountField, state.isDiff);

    // Person field
    this.personDropDown.selectItem(state.personId);
    show(this.personField, state.personVisible);

    this.dateInp.value = state.date;
    this.commInp.value = state.comment;
};
