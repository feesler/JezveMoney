'use strict';

/* global ce, re, svg, fixFloat, show, enable, selectedValue, selectByValue, extend, Component */
/* global copyObject, addChilds, removeChilds */
/* global EXPENSE, INCOME, TRANSFER, DEBT, AccountList */

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

    this.data = {
        type: EXPENSE,
        src_id: this.model.mainAccount.id,
        dest_id: 0,
        src_curr: this.model.mainAccount.curr_id,
        dest_curr: this.model.mainAccount.curr_id,
        src_amount: 0,
        dest_amount: 0,
        date: '',
        comment: ''
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
        accountId: this.data.src_id,
        accountCurrId: this.data.src_curr,
        secondAccountId: 0,
        secondAccountCurrId: 0,
        secondAccountVisible: false,
        currId: this.data.dest_curr,
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

    // Currency controls
    this.currIdInp = ce('input', { type: 'hidden', name: 'curr_id[]' });
    this.currSel = ce('select', {}, ce('option', { value: 0, textContent: '', disabled: true }));
    this.model.currency.data.forEach(function (currency) {
        var option = ce('option', {
            value: currency.id,
            textContent: currency.name
        });

        this.currSel.appendChild(option);
    }, this);
    this.currSel.addEventListener('change', this.onCurrChanged.bind(this));
    this.currField = this.createField('Currency', this.currSel);

    // Transaction type select
    this.trTypeSel = ce('select',
        { name: 'tr_type[]' },
        [
            ce('option', {
                value: 'expense',
                textContent: 'Expense'
            }),
            ce('option', {
                value: 'income',
                textContent: 'Income'
            }),
            ce('option', {
                value: 'transferfrom',
                textContent: 'Transfer>',
                disabled: (this.model.accounts.data.length < 2)
            }),
            ce('option', {
                value: 'transferto',
                textContent: 'Transfer<',
                disabled: (this.model.accounts.data.length < 2)
            }),
            ce('option', {
                value: 'debtfrom',
                textContent: 'Debt>',
                disabled: (!this.model.persons.data.length)
            }),
            ce('option', {
                value: 'debtto',
                textContent: 'Debt<',
                disabled: (!this.model.persons.data.length)
            })
        ]);
    this.trTypeSel.addEventListener('change', this.onTrTypeChanged.bind(this));
    this.trTypeField = this.createField('Type', this.trTypeSel);

    // Destination account controls
    this.destAccIdInp = ce('input', { type: 'hidden', name: 'dest_acc_id[]', value: '' });
    this.destAccSel = ce(
        'select',
        { disabled: true },
        ce('option', {
            value: 0,
            textContent: '',
            disabled: true,
            selected: true
        })
    );
    this.model.accounts.data.forEach(function (account) {
        var option = ce('option', {
            value: account.id,
            textContent: account.name,
            disabled: (account.id === this.data.src_id)
        });

        this.destAccSel.appendChild(option);
    }, this);
    this.destAccSel.addEventListener('change', this.onDestChanged.bind(this));
    this.destAccountField = this.createField('Destination account', this.destAccSel);

    // Person controls
    this.personIdInp = ce('input', { type: 'hidden', name: 'person_id[]', value: '' });
    this.personSel = ce(
        'select',
        { disabled: true },
        ce('option', {
            value: 0,
            textContent: '',
            disabled: true,
            selected: true
        })
    );
    this.model.persons.data.forEach(function (person) {
        var option = ce('option', { value: person.id, textContent: person.name });
        this.personSel.appendChild(option);
    }, this);
    this.personSel.addEventListener('change', this.onPersonChanged.bind(this));
    this.personField = this.createField('Person', this.personSel);

    // Amount controls
    this.amountInp = ce('input', {
        type: 'text',
        name: 'amount[]',
        placeholder: 'Amount'
    }, null, { input: this.onAmountInput.bind(this) });
    this.amountField = this.createField('Amount', this.amountInp, 'amount-field');

    this.destAmountInp = ce('input', {
        type: 'text',
        name: 'dest_amount[]',
        disabled: true,
        placeholder: 'Destination amount'
    }, null, { input: this.onDestAmountInput.bind(this) });
    this.destAmountField = this.createField('Destination amount', this.destAmountInp, 'amount-field');

    // Date field
    this.dateInp = ce('input', {
        type: 'text',
        name: 'date[]',
        placeholder: 'Date'
    }, null, { input: this.onDateInput.bind(this) });
    this.dateField = this.createField('Date', this.dateInp, 'date-field');

    // Comment field
    this.commInp = ce('input', {
        type: 'text',
        name: 'comment[]',
        placeholder: 'Comment'
    }, null, { input: this.onCommentInput.bind(this) });
    this.commentField = this.createField('Comment', this.commInp, 'comment-field');

    this.delBtn = ce(
        'button',
        { className: 'btn delete-btn', type: 'button' },
        this.createIcon('del')
    );
    this.delBtn.addEventListener('click', this.remove.bind(this));

    this.toggleExtBtn = ce(
        'button',
        { className: 'btn toggle-btn hidden', type: 'button' },
        this.createIcon('toggle-ext')
    );
    this.toggleExtBtn.addEventListener('click', this.toggleCollapse.bind(this));

    this.topRow = this.createContainer('form-row', [
        this.amountField,
        this.currIdInp,
        this.currField,
        this.dateField,
        this.commentField
    ]);

    this.bottomRow = this.createContainer('form-row hidden', [
        this.destAccIdInp,
        this.destAccountField,
        this.personIdInp,
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
        this.createCheck('enable-check', this.enableCheck),
        this.formContainer,
        this.createContainer('row-container controls', [
            this.delBtn,
            this.toggleExtBtn
        ])
    ]);
    this.extendedContainer = this.createContainer('extended-content');

    this.elem = this.createContainer('tr-row', [
        this.mainContainer,
        this.extendedContainer
    ]);

    if (this.props.originalData) {
        this.setExtendedContent(this.createOrigDataContainer(this.props.originalData));
    }

    this.render();
}

extend(ImportTransactionItem, Component);

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

/** Create container element */
ImportTransactionItem.prototype.createContainer = function (elemClass, children) {
    return ce('div', { className: elemClass }, children);
};

/** Create checkbox element */
ImportTransactionItem.prototype.createCheck = function (elemClass, children) {
    return ce('label', { className: elemClass }, children);
};

/** Create field element */
ImportTransactionItem.prototype.createField = function (title, input, extraClass) {
    var elemClasses = ['field'];

    if (typeof extraClass === 'string' && extraClass.length > 0) {
        elemClasses.push(extraClass);
    }

    return ce('div', { className: elemClasses.join(' ') }, [
        ce('label', { textContent: title }),
        ce('div', {}, input)
    ]);
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
ImportTransactionItem.prototype.createOrigDataContainer = function (data) {
    if (!data) {
        throw new Error('Invalid data');
    }

    return this.createContainer('orig-data-table', [
        this.createDataValue('Date', data.date),
        this.createDataValue('Tr. amount', data.trAmountVal),
        this.createDataValue('Tr. currency', data.trCurrVal),
        this.createDataValue('Acc. amount', data.accAmountVal),
        this.createDataValue('Acc. currency', data.accCurrVal),
        this.createDataValue('Comment', data.comment, 'comment-value')
    ]);
};

/** Create SVG icon element */
ImportTransactionItem.prototype.createIcon = function (icon) {
    var useElem = svg('use');
    var res = svg('svg', {}, useElem);

    useElem.href.baseVal = (icon) ? '#' + icon : '';

    return res;
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
        this.elem.classList.remove('tr-row_expanded');
    }

    show(this.toggleExtBtn, content);
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

/**
 * Toggle collapse/expande button 'click' event handler
 */
ImportTransactionItem.prototype.toggleCollapse = function () {
    this.elem.classList.toggle('tr-row_expanded');
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

/** Transaction type select 'change' event handler */
ImportTransactionItem.prototype.onTrTypeChanged = function () {
    var value = selectedValue(this.trTypeSel);
    this.setTransactionType(value);
    this.render();
};

/**
 * Destination account select 'change' event handler
 */
ImportTransactionItem.prototype.onDestChanged = function () {
    var value = selectedValue(this.destAccSel);
    this.setSecondAccount(value);
    this.render();
};

/** Synchronize options of destination account select */
ImportTransactionItem.prototype.syncDestAccountSelect = function (state) {
    var i;
    var l;
    var option;
    var value;

    for (i = 0, l = this.destAccSel.options.length; i < l; i += 1) {
        option = this.destAccSel.options[i];
        value = parseInt(option.value, 10);
        if (Number.isNaN(value)) {
            throw new Error('Invalid option value: ' + option.value);
        }
        if (value === 0 || value === state.accountId) {
            option.disabled = true;
            option.selected = false;
        } else {
            option.disabled = false;
        }
    }
};

/** Person select 'change' event handler */
ImportTransactionItem.prototype.onPersonChanged = function () {
    var value = selectedValue(this.personSel);
    this.setPerson(value);
    this.render();
};

/** Amount field 'input' event handler */
ImportTransactionItem.prototype.onAmountInput = function () {
    var value = this.amountInp.value;
    this.setAmount(value);
    this.render();
};

/** Destination amount field 'input' event handler */
ImportTransactionItem.prototype.onDestAmountInput = function () {
    var value = this.destAmountInp.value;
    this.setSecondAmount(value);
    this.render();
};

/** Currency select 'change' event handler */
ImportTransactionItem.prototype.onCurrChanged = function () {
    var value = selectedValue(this.currSel);
    this.setCurrency(value);
    this.render();
};

/** Date field 'input' event handler */
ImportTransactionItem.prototype.onDateInput = function () {
    var value = this.dateInp.value;
    this.setDate(value);
    this.render();
};

/** Comment field 'input' event handler */
ImportTransactionItem.prototype.onCommentInput = function () {
    var value = this.dateInp.value;
    this.setComment(value);
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
    var trType = selectedValue(this.trTypeSel);

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
    state.accountId = account.id;
    state.accountCurrId = account.curr_id;

    if (state.type === 'expense' || state.type === 'income') {
        if (!state.isDiff) {
            state.currId = state.accountCurrId;
        }
    } else if (state.type === 'transferfrom' || state.type === 'transferto') {
        if (state.secondAccountId === state.accountId) {
            secondAccount = this.getFirstAvailAccount(state);
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

    if (this.state.secondAmount === value) {
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
        this.elem.classList.remove('tr-row_disabled');
    } else {
        this.elem.classList.add('tr-row_disabled');
    }

    this.enableCheck.checked = state.enabled;
    enable(this.trTypeSel, state.enabled);
    enable(this.amountInp, state.enabled);
    enable(this.currIdInp, state.enabled);
    enable(this.currSel, state.enabled && isExpenseOrIncome);
    enable(this.destAccIdInp, state.enabled && isTransfer);
    enable(this.destAccSel, state.enabled && isTransfer);
    enable(this.personIdInp, state.enabled && isDebt);
    enable(this.personSel, state.enabled && isDebt);
    enable(this.destAmountInp, state.enabled && state.isDiff);
    enable(this.dateInp, state.enabled);
    enable(this.commInp, state.enabled);

    selectByValue(this.trTypeSel, state.type);

    // Amount field
    this.amountInp.value = state.amount;

    // Currency field
    selectByValue(this.currSel, state.currId);
    this.currIdInp.value = state.currId;

    // Bottom row
    show(this.bottomRow, showBottom);

    // Second account field
    this.syncDestAccountSelect(state);
    selectByValue(this.destAccSel, state.secondAccountId);
    this.destAccIdInp.value = state.secondAccountId;
    show(this.destAccountField, state.secondAccountVisible);

    // Second amount field
    this.destAmountInp.value = state.secondAmount;
    show(this.destAmountField, state.isDiff);

    // Person field
    selectByValue(this.personSel, state.personId);
    this.personIdInp.value = state.personId;
    show(this.personField, state.personVisible);

    this.dateInp.value = state.date;
    this.commInp.value = state.comment;
};
