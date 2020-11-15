'use strict';

/* global ce, re, show, enable, selectedValue, selectByValue, extend, Component */
/* global EXPENSE, INCOME, TRANSFER, DEBT */

/**
 * ImportTransactionItem component constructor
 * @param {object} props
 */
function ImportTransactionItem() {
    ImportTransactionItem.parent.constructor.apply(this, arguments);

    // Row enable checkbox
    this.enableCheck = ce('input', { type: 'checkbox', checked: true });
    this.enableCheck.addEventListener('change', this.onRowChecked.bind(this));

    // Currency controls
    this.currIdInp = ce('input', {
        type: 'hidden',
        name: 'curr_id[]',
        value: this.parent.model.mainAccount.curr_id
    });
    this.currSel = ce('select');

    this.parent.model.currency.data.forEach(function (currency) {
        var option = ce('option', {
            value: currency.id,
            textContent: currency.name,
            selected: (currency.id === this.parent.model.mainAccount.curr_id)
        });

        this.currSel.appendChild(option);
    }, this);
    this.currSel.addEventListener('change', this.onCurrChanged.bind(this));

    // Transaction type select
    this.trTypeSel = ce('select',
        { name: 'tr_type[]' },
        [
            ce('option', { value: 'expense', textContent: '-' }),
            ce('option', { value: 'income', textContent: '+' }),
            ce('option', { value: 'transferfrom', textContent: 'T>' }),
            ce('option', { value: 'transferto', textContent: 'T<' }),
            ce('option', { value: 'debtfrom', textContent: 'D>' }),
            ce('option', { value: 'debtto', textContent: 'D<' })
        ]);
    this.trTypeSel.addEventListener('change', this.onTrTypeChanged.bind(this));

    // Destination account controls
    this.destAccIdInp = ce('input', { type: 'hidden', name: 'dest_acc_id[]', value: '' });
    this.destAccSel = ce('select',
        { disabled: true },
        ce('option',
            {
                value: 0,
                textContent: 'Destination account',
                selected: true,
                disabled: true
            }));
    this.parent.model.accounts.data.forEach(function (account) {
        var option = ce('option', { value: account.id, textContent: account.name });
        if (account.id === this.parent.model.mainAccount.id) {
            enable(option, false);
        }

        this.destAccSel.appendChild(option);
    }, this);
    this.destAccSel.addEventListener('change', this.onDestChanged.bind(this));

    // Person controls
    this.personIdInp = ce('input', { type: 'hidden', name: 'person_id[]', value: '' });
    this.personSel = ce('select');
    this.parent.model.persons.data.forEach(function (person) {
        var option = ce('option', { value: person.id, textContent: person.name });
        this.personSel.appendChild(option);
    }, this);
    show(this.personSel, false);
    this.personSel.addEventListener('change', this.onPersonChanged.bind(this));

    // Amount controls
    this.amountInp = ce('input', { type: 'text', name: 'amount[]', placeholder: 'Amount' });
    this.destAmountInp = ce('input', {
        type: 'text',
        name: 'dest_amount[]',
        disabled: true,
        placeholder: 'Destination amount'
    });

    this.dateInp = ce('input', { type: 'text', name: 'date[]', placeholder: 'Date' });
    this.commInp = ce('input', { type: 'text', name: 'comment[]', placeholder: 'Comment' });
    this.delBtn = ce('input', { className: 'btn submit-btn', type: 'button', value: '-' });
    this.delBtn.addEventListener('click', this.remove.bind(this));

    this.elem = ce('div',
        { className: 'tr-row' },
        [
            this.enableCheck,
            this.trTypeSel,
            this.amountInp,
            this.currIdInp,
            this.currSel,
            this.destAccIdInp,
            this.destAccSel,
            this.personIdInp,
            this.personSel,
            this.destAmountInp,
            this.dateInp,
            this.commInp,
            this.delBtn
        ]);
}

extend(ImportTransactionItem, Component);

/**
 * Create new ImportTransactionItem from specified element
 */
ImportTransactionItem.create = function (props) {
    var res;

    // try {
    res = new ImportTransactionItem(props);
    // } catch (e) {
    //     res = null;
    // }

    return res;
};

/**
 * Remove item component
 */
ImportTransactionItem.prototype.remove = function () {
    this.parent.onRemoveItem(this);

    re(this.elem);
};

/**
 * Row checkbox 'change' event handler. Enable/disable related row
 */
ImportTransactionItem.prototype.onRowChecked = function () {
    this.enable(this.enableCheck.checked);
};

/**
 * Enable/disable component
 * @param {boolean} val - if true then enables component, else disable
 */
ImportTransactionItem.prototype.enable = function (val) {
    var newState = (typeof val === 'undefined') ? true : !!val;

    if (newState) {
        this.elem.classList.remove('tr-row_disabled');
    } else {
        this.elem.classList.add('tr-row_disabled');
    }

    this.enableCheck.checked = newState;
    enable(this.trTypeSel, newState);
    enable(this.amountInp, newState);
    enable(this.currIdInp, newState);
    enable(this.currSel, newState);
    enable(this.destAccIdInp, newState);
    enable(this.destAccSel, newState);
    enable(this.personIdInp, newState);
    enable(this.personSel, newState);
    enable(this.destAmountInp, newState);
    enable(this.dateInp, newState);
    enable(this.commInp, newState);

    if (newState) {
        this.onTrTypeChanged();
    }
};

/** Return component enabled status */
ImportTransactionItem.prototype.isEnabled = function () {
    return this.elem && !this.elem.classList.contains('tr-row_disabled');
};

/** Main account of transaction select 'change' event handler */
ImportTransactionItem.prototype.onMainAccountChanged = function () {
    var trType = selectedValue(this.trTypeSel);
    if (trType === 'transferfrom' || trType === 'transferto') {
        this.syncDestAccountSelect();
        this.copyDestAcc();
    }
    this.syncCurrAvail();
    this.syncDestAmountAvail();
};

/** Transaction type select 'change' event handler */
ImportTransactionItem.prototype.onTrTypeChanged = function () {
    var trType = selectedValue(this.trTypeSel);
    if (!this.destAccSel || !this.destAccSel.options) {
        return;
    }

    this.syncCurrAvail();
    if (trType === 'transferfrom' || trType === 'transferto') {
        show(this.personSel, false);
        show(this.destAccSel, true);
        enable(this.destAccSel, true);
        this.syncDestAccountSelect(this);
        this.copyDestAcc();
    } else if (trType === 'debtfrom' || trType === 'debtto') {
        this.copyPerson();
        show(this.personSel, true);
        show(this.destAccSel, false);
        enable(this.destAccSel, false);
    } else {
        show(this.personSel, false);
        show(this.destAccSel, true);
        enable(this.destAccSel, false);
    }

    this.syncDestAmountAvail();
};

/** Synchronize availability of destination amount input */
ImportTransactionItem.prototype.syncDestAmountAvail = function () {
    var trType;
    var currObj;
    var destAccObj;
    var isDiff;

    trType = selectedValue(this.trTypeSel);
    if (trType === 'expense' || trType === 'income') {
        currObj = this.parent.currFromSelect(this.currSel);
        isDiff = (currObj !== null && this.parent.model.mainAccount.curr_id !== currObj.id);
        enable(this.destAmountInp, isDiff);
    } else if (trType === 'transferfrom' || trType === 'transferto') {
        destAccObj = this.parent.accFromSelect(this.destAccSel);
        isDiff = (
            destAccObj !== null
            && this.parent.model.mainAccount.curr_id !== destAccObj.curr_id
        );
        enable(this.destAmountInp, isDiff);
    } else {
        /** Debt */
        enable(this.destAmountInp, false);
    }
};

/** Copy destination account id from select to hidden input */
ImportTransactionItem.prototype.copyDestAcc = function () {
    if (!this.destAccIdInp || !this.destAccSel) {
        return;
    }

    this.destAccIdInp.value = selectedValue(this.destAccSel);
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
    if (optVal === 0 || optVal === this.parent.model.mainAccount.id) {
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
    if (!this.personIdInp || !this.personSel) {
        return;
    }

    this.personIdInp.value = selectedValue(this.personSel);
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
    if (!this.currIdInp || !this.currSel) {
        return;
    }

    this.currIdInp.value = selectedValue(this.currSel);
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
        selectByValue(this.currSel, this.parent.model.mainAccount.curr_id);
        this.copyCurr();
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
        throw new Error('Invalid value');
    }

    selectByValue(this.currSel, value);
    this.onCurrChanged();
};

/** Set second account */
ImportTransactionItem.prototype.setAccount = function (value) {
    if (typeof value === 'undefined') {
        throw new Error('Invalid value');
    }

    selectByValue(this.destAccSel, value);
    this.onDestChanged();
};

/** Set person */
ImportTransactionItem.prototype.setPerson = function (value) {
    if (typeof value === 'undefined') {
        throw new Error('Invalid value');
    }

    selectByValue(this.personSel, value);
    this.onPersonChanged();
};

/** Set source amount */
ImportTransactionItem.prototype.setSourceAmount = function (value) {
    var res;

    if (typeof value === 'undefined') {
        throw new Error('Invalid value');
    }

    res = parseFloat(value);
    if (Number.isNaN(res)) {
        throw new Error('Invalid value');
    }

    if (res < 0) {
        this.invertTransactionType();
    }

    this.amountInp.value = Math.abs(res);
};

/** Set destination amount */
ImportTransactionItem.prototype.setDestinationAmount = function (value) {
    var res;

    if (typeof value === 'undefined') {
        throw new Error('Invalid value');
    }

    res = parseFloat(value);
    if (Number.isNaN(res)) {
        throw new Error('Invalid value');
    }

    this.destAmountInp.value = Math.abs(res);
};

/** Set date */
ImportTransactionItem.prototype.setDate = function (value) {
    if (typeof value === 'undefined') {
        throw new Error('Invalid value');
    }

    this.dateInp.value = value;
};

/** Set comment */
ImportTransactionItem.prototype.setComment = function (value) {
    if (typeof value === 'undefined') {
        throw new Error('Invalid value');
    }

    this.commInp.value = value;
};
