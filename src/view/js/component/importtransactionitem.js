'use strict';

/* global ce, re, svg, fixFloat, show, enable, selectedValue, selectByValue, extend, Component */
/* global addChilds, removeChilds */
/* global EXPENSE, INCOME, TRANSFER, DEBT */

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

    this.enabled = true;

    // Row enable checkbox
    this.enableCheck = ce('input', { type: 'checkbox', checked: this.enabled });
    this.enableCheck.addEventListener('change', this.onRowChecked.bind(this));

    // Currency controls
    this.currIdInp = ce('input', {
        type: 'hidden',
        name: 'curr_id[]',
        value: this.data.dest_curr
    });
    this.currSel = ce(
        'select',
        { disabled: false },
        ce('option', { value: 0, textContent: '', disabled: true })
    );

    this.model.currency.data.forEach(function (currency) {
        var option = ce('option', {
            value: currency.id,
            textContent: currency.name,
            selected: (currency.id === this.data.dest_curr)
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
    show(this.destAccountField, false);

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
    show(this.personField, false);

    // Amount controls
    this.amountInp = ce('input', {
        type: 'text',
        name: 'amount[]',
        placeholder: 'Amount'
    });
    this.amountField = this.createField('Amount', this.amountInp, 'amount-field');

    this.destAmountInp = ce('input', {
        type: 'text',
        name: 'dest_amount[]',
        disabled: true,
        placeholder: 'Destination amount'
    });
    this.destAmountField = this.createField('Destination amount', this.destAmountInp, 'amount-field');
    show(this.destAmountField, false);

    // Date field
    this.dateInp = ce('input', {
        type: 'text',
        name: 'date[]',
        placeholder: 'Date'
    });
    this.dateField = this.createField('Date', this.dateInp, 'date-field');

    // Comment field
    this.commInp = ce('input', {
        type: 'text',
        name: 'comment[]',
        placeholder: 'Comment'
    });
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
        this.createDataValue('Comment', data.descr, 'comment-value')
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

/**
 * Row checkbox 'change' event handler. Enable/disable item
 */
ImportTransactionItem.prototype.onRowChecked = function () {
    this.enable(this.enableCheck.checked);

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
ImportTransactionItem.prototype.enable = function (val) {
    var newState = (typeof val === 'undefined') ? true : !!val;
    var isDiff = (this.data.src_curr !== this.data.dest_curr);

    if (newState) {
        this.elem.classList.remove('tr-row_disabled');
    } else {
        this.elem.classList.add('tr-row_disabled');
    }

    this.enableCheck.checked = newState;
    enable(this.trTypeSel, newState);
    enable(this.amountInp, newState);
    enable(this.currIdInp, newState);
    enable(this.currSel, newState && [EXPENSE,INCOME].includes(this.data.type));
    enable(this.destAccIdInp, newState && (this.data.type === TRANSFER));
    enable(this.destAccSel, newState && (this.data.type === TRANSFER));
    enable(this.personIdInp, newState && (this.data.type === DEBT));
    enable(this.personSel, newState && (this.data.type === DEBT));
    enable(this.destAmountInp, newState && isDiff);
    enable(this.dateInp, newState);
    enable(this.commInp, newState);

    this.enabled = newState;
};

/** Return component enabled status */
ImportTransactionItem.prototype.isEnabled = function () {
    return this.enabled;
};

/** Main account of transaction select 'change' event handler */
ImportTransactionItem.prototype.onMainAccountChanged = function (value) {
    var account;
    var trType;
    var isDiffBefore = (this.data.src_curr !== this.data.dest_curr);

    account = this.model.accounts.getItem(value);
    if (!account) {
        throw new Error('Account not found');
    }
    this.model.mainAccount = account;

    trType = selectedValue(this.trTypeSel);
    if (trType === 'expense') {
        this.data.src_id = account.id;
        this.data.src_curr = account.curr_id;
        if (!isDiffBefore) {
            this.setCurrency(this.model.mainAccount.curr_id);
        }
    } else if (trType === 'income') {
        this.data.dest_id = account.id;
        this.data.dest_curr = account.curr_id;
        if (!isDiffBefore) {
            this.setCurrency(this.model.mainAccount.curr_id);
        }
    } else if (trType === 'transferfrom' || trType === 'transferto') {
        if (trType === 'transferfrom') {
            this.data.src_id = account.id;
            this.data.src_curr = account.curr_id;
        } else {
            this.data.dest_id = account.id;
            this.data.dest_curr = account.curr_id;
        }
        this.syncDestAccountSelect();
        this.copyDestAcc();
    } else if (trType === 'debtfrom' || trType === 'debtto') {
        this.data.acc_id = account.id;
        this.data.src_curr = account.curr_id;
        this.data.dest_curr = account.curr_id;

        // Set same currency as main account
        this.setCurrency(this.model.mainAccount.curr_id);
    }

    this.syncCurrAvail();
    this.syncDestAmountAvail();
};

/** Transaction type select 'change' event handler */
ImportTransactionItem.prototype.onTrTypeChanged = function () {
    var personId;
    var typeBefore = this.data.type;
    var isDiffBefore = (this.data.src_curr !== this.data.dest_curr);
    var trType = selectedValue(this.trTypeSel);

    if (trType === 'expense') {
        this.data.type = EXPENSE;
    } else if (trType === 'income') {
        this.data.type = INCOME;
    } else if (trType === 'transferfrom' || trType === 'transferto') {
        this.data.type = TRANSFER;
    } else if (trType === 'debtfrom' || trType === 'debtto') {
        this.data.type = DEBT;
    } else {
        throw new Error('Invalid transaction type');
    }

    this.syncCurrAvail();

    if (this.data.type === DEBT) {
        delete this.data.src_id;
        delete this.data.dest_id;
        // Set same currency as main account
        this.setCurrency(this.model.mainAccount.curr_id);
        // Select first person if previous type of transaction was not DEBT
        if (!this.data.person_id) {
            personId = this.model.persons.data[0].id;
            this.setPerson(personId);
        }
    } else {
        // Deselect person if previous type of transaction was DEBT
        if (this.data.person_id) {
            this.setPerson(0);
        }

        delete this.data.person_id;
        delete this.data.acc_id;
        delete this.data.op;
    }

    if (this.data.type === TRANSFER) {
        show(this.personField, false);
        enable(this.personSel, false);
        show(this.destAccountField, true);
        enable(this.destAccSel, true);
        this.syncDestAccountSelect();
        this.copyDestAcc();
    } else if (this.data.type === DEBT) {
        show(this.personField, true);
        enable(this.personSel, true);
        show(this.destAccountField, false);
        enable(this.destAccSel, false);
        this.setAccount(0);
    } else {
        if (this.data.type === EXPENSE) {
            this.data.src_id = this.model.mainAccount.id;
            this.data.src_curr = this.model.mainAccount.curr_id;
            this.data.dest_id = 0;
            if (!isDiffBefore || typeBefore !== INCOME) {
                this.setCurrency(this.data.src_curr);
            }
        } else if (this.data.type === INCOME) {
            this.data.src_id = 0;
            this.data.dest_id = this.model.mainAccount.id;
            this.data.dest_curr = this.model.mainAccount.curr_id;
            if (!isDiffBefore || typeBefore !== EXPENSE) {
                this.setCurrency(this.data.dest_curr);
            }
        }
        this.setAccount(0);
        this.copyCurr();

        show(this.personField, false);
        enable(this.personSel, false);
        show(this.destAccountField, false);
        enable(this.destAccSel, false);
    }

    this.syncDestAmountAvail();
};

/** Synchronize availability of destination amount input */
ImportTransactionItem.prototype.syncDestAmountAvail = function () {
    var isDiff;
    var showBottom;

    isDiff = (this.data.src_curr !== this.data.dest_curr);
    if (this.data.type === EXPENSE || this.data.type === INCOME) {
        showBottom = isDiff;
    } else {
        showBottom = true;
    }

    enable(this.destAmountInp, isDiff);
    show(this.destAmountField, isDiff);
    if (!isDiff) {
        this.destAmountInp.value = '';
    }
    show(this.bottomRow, showBottom);
};

/** Copy destination account id from select to hidden input */
ImportTransactionItem.prototype.copyDestAcc = function () {
    var destAccountId;
    var account;
    var trType;

    destAccountId = selectedValue(this.destAccSel);
    this.destAccIdInp.value = destAccountId;

    if (this.data.type !== TRANSFER) {
        return;
    }

    account = this.model.accounts.getItem(destAccountId);
    if (!account) {
        throw new Error('Account not found');
    }

    trType = selectedValue(this.trTypeSel);
    if (trType === 'transferfrom') {
        this.data.src_id = this.model.mainAccount.id;
        this.data.src_curr = this.model.mainAccount.curr_id;
        this.data.dest_id = account.id;
        this.data.dest_curr = account.curr_id;
    } else {
        this.data.src_id = account.id;
        this.data.src_curr = account.curr_id;
        this.data.dest_id = this.model.mainAccount.id;
        this.data.dest_curr = this.model.mainAccount.curr_id;
    }

    this.setCurrency(account.curr_id);
};

/**
 * Destination account select 'change' event handler
 */
ImportTransactionItem.prototype.onDestChanged = function () {
    this.copyDestAcc();
    this.syncDestAmountAvail();
};

/** Disable account option if it's the same as main account */
ImportTransactionItem.prototype.syncAccountOption = function (opt) {
    var optVal;
    var res = opt;

    if (!res) {
        return;
    }

    optVal = parseInt(res.value, 10);
    if (optVal === 0 || optVal === this.model.mainAccount.id) {
        res.disabled = true;
        res.selected = false;
    } else {
        res.disabled = false;
    }
};

/** Synchronize options of destination account select */
ImportTransactionItem.prototype.syncDestAccountSelect = function () {
    var i;
    var l;

    for (i = 0, l = this.destAccSel.options.length; i < l; i += 1) {
        this.syncAccountOption(this.destAccSel.options[i]);
    }
};

/**
 * Copy person id value from select to hidden input
 */
ImportTransactionItem.prototype.copyPerson = function () {
    var trType;
    var person;
    var personId = selectedValue(this.personSel);

    this.personIdInp.value = personId;

    if (this.data.type !== DEBT) {
        return;
    }

    person = this.model.persons.getItem(personId);
    if (!person) {
        throw new Error('Person not found');
    }

    this.data.person_id = personId;
    this.data.acc_id = this.model.mainAccount.id;

    this.data.src_curr = this.model.mainAccount.curr_id;
    this.data.dest_curr = this.data.src_curr;

    trType = selectedValue(this.trTypeSel);
    if (trType === 'debtfrom') {
        this.data.op = 2;
    } else {
        this.data.op = 1;
    }
};

/**
 * Person select 'change' event handler
 */
ImportTransactionItem.prototype.onPersonChanged = function () {
    this.copyPerson();
};

/**
 * Copy currency id value from select to hidden input
 */
ImportTransactionItem.prototype.copyCurr = function () {
    var currency = this.model.currency.getItem(selectedValue(this.currSel));
    if (!currency) {
        throw new Error('Currency not found');
    }

    if (this.data.type === EXPENSE) {
        this.data.dest_curr = currency.id;
    } else if (this.data.type === INCOME) {
        this.data.src_curr = currency.id;
    }

    this.currIdInp.value = currency.id;
};

/**
 * Currency select 'change' event handler
 */
ImportTransactionItem.prototype.onCurrChanged = function () {
    this.copyCurr();
    this.syncDestAmountAvail();
};

/**
 * Enable/disable currency select according to transaction type
 */
ImportTransactionItem.prototype.syncCurrAvail = function () {
    var trType = selectedValue(this.trTypeSel);

    /**
     * transfer expect currencies will be the same as source and destination account
     * debt curently expect only the same currency as account
     */
    if (
        trType === 'transferfrom'
        || trType === 'transferto'
        || trType === 'debtfrom'
        || trType === 'debtto'
    ) {
        enable(this.currSel, false);
    } else {
        enable(this.currSel, true);
    }
};

/** Set type of transaction */
ImportTransactionItem.prototype.setTransactionType = function (value) {
    var typeValue;

    if (typeof value === 'undefined') {
        throw new Error('Invalid value');
    }

    if (value === EXPENSE) {
        typeValue = 'expense';
    } else if (value === INCOME) {
        typeValue = 'income';
    } else if (value === TRANSFER) {
        typeValue = 'transferfrom';
    } else if (value === DEBT) {
        typeValue = 'debtfrom';
    }

    selectByValue(this.trTypeSel, typeValue);
    this.onTrTypeChanged();
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

    selectByValue(this.trTypeSel, typeValue);
    this.onTrTypeChanged();
};

/** Set currency */
ImportTransactionItem.prototype.setCurrency = function (value) {
    if (typeof value === 'undefined') {
        throw new Error('Invalid currency value');
    }

    selectByValue(this.currSel, value);
    this.onCurrChanged();
};

/** Set second account */
ImportTransactionItem.prototype.setAccount = function (value) {
    if (typeof value === 'undefined') {
        throw new Error('Invalid account value');
    }

    selectByValue(this.destAccSel, value);
    this.onDestChanged();
};

/** Set person */
ImportTransactionItem.prototype.setPerson = function (value) {
    if (typeof value === 'undefined') {
        throw new Error('Invalid person value');
    }

    selectByValue(this.personSel, value);
    this.onPersonChanged();
};

/** Set source amount */
ImportTransactionItem.prototype.setSourceAmount = function (value) {
    var isDiff = (this.data.src_curr !== this.data.dest_curr);
    var res;

    if (typeof value === 'undefined') {
        throw new Error('Invalid amount value');
    }

    res = parseFloat(fixFloat(value));
    if (Number.isNaN(res)) {
        throw new Error('Invalid amount value');
    }

    if (res < 0) {
        this.invertTransactionType();
        res = Math.abs(res);
    }

    if (this.data.type === INCOME) {
        this.data.dest_amount = res;
        if (!isDiff) {
            this.data.src_amount = res;
        }
    } else {
        this.data.src_amount = res;
        if (!isDiff) {
            this.data.dest_amount = res;
        }
    }

    this.amountInp.value = res;
};

/** Set destination amount */
ImportTransactionItem.prototype.setDestinationAmount = function (value) {
    var res;

    if (typeof value === 'undefined') {
        throw new Error('Invalid amount value');
    }

    res = parseFloat(fixFloat(value));
    if (Number.isNaN(res)) {
        throw new Error('Invalid amount value');
    }
    res = Math.abs(res);

    this.data.dest_amount = res;

    this.destAmountInp.value = res;
};

/** Set date */
ImportTransactionItem.prototype.setDate = function (value) {
    if (typeof value === 'undefined') {
        throw new Error('Invalid date value');
    }

    this.data.date = value;
    this.dateInp.value = value;
};

/** Set comment */
ImportTransactionItem.prototype.setComment = function (value) {
    if (typeof value !== 'string') {
        throw new Error('Invalid comment value');
    }

    this.data.comment = value;

    this.commInp.value = this.data.comment;
};
