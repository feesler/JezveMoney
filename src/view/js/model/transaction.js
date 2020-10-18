'use strict';

/* global isObject, isFunction, correct, correctExch, normalize, normalizeExch, isValidValue */
/* global EXPENSE, INCOME, TRANSFER, DEBT */

/**
 * @constructor TransactionModel
 * Manage transaction data, calculate properties and notofy subscribers
 * Main formula:
 *  S2 = S1 - sa        source account
 *  da = sa * e
 *  S2_d = S1_d + da    destination account
 *
 * @param {object} props
 */
function TransactionModel(props) {
    if (!isObject(props)) {
        throw new Error('Invalid Account props');
    }

    this.props = props;
    this.parent = this.props.parent;

    this.S1 = undefined; // balance before transaction
    this.sa = undefined; // source amount
    this.da = undefined; // destination amount
    this.e = undefined; // exchange rate
    this.S2 = undefined; // balance after transaction
    this.S1_d = undefined; // balance of destination account before transaction
    this.S2_d = undefined; // balance of destintation account after transaction

    // parsed float values
    this.fS1 = 0;
    this.fsa = 0;
    this.fda = 0;
    this.fe = 1;
    this.fS2 = 0;
    this.fS1_d = 0;
    this.fS2_d = 0;

    this.s1valid = false;
    this.s2valid = false;
    this.davalid = false;
    this.evalid = false;
    this.savalid = false;
    this.s1dvalid = false;
    this.s2dvalid = false;

    this.type = this.props.transaction.type;
    this.src_id = this.props.transaction.src_id;
    this.dest_id = this.props.transaction.dest_id;
    this.setValue('src_amount', this.props.transaction.src_amount);
    this.setValue('dest_amount', this.props.transaction.dest_amount);
    this.src_curr = this.props.transaction.src_curr;
    this.dest_curr = this.props.transaction.dest_curr;

    this.person_id = this.props.transaction.person_id;
    this.debtType = this.props.transaction.debtType;
    this.lastAcc_id = this.props.transaction.lastAcc_id;
    this.noAccount = this.props.transaction.noAccount;

    this.changedCallback = [];
}

/**
 * Calculate result balance of source by initial balance and source amount
 */
TransactionModel.prototype.f1 = function () {
    if (!this.isExpense() && !this.isTransfer() && !this.isDebt()) {
        return;
    }

    this.S2 = this.fS1 - this.fsa;
    this.fS2 = correct(this.S2);
    this.S2 = this.fS2;
    this.s2valid = isValidValue(this.S2);
    this.notifyChanged('src_resbal', this.fS2);
};

/**
 * Calculate result balance of destination by initial balance and destination amount
 */
TransactionModel.prototype.f1_d = function () {
    if (!this.isIncome() && !this.isTransfer() && !this.isDebt()) {
        return;
    }

    this.S2_d = this.fS1_d + this.fda;
    this.fS2_d = correct(this.S2_d);
    this.S2_d = this.fS2_d;
    this.s2dvalid = isValidValue(this.S2_d);
    this.notifyChanged('dest_resbal', this.fS2_d);
};

/**
 * Calculate destination amount by source amount and exchange rate
 */
TransactionModel.prototype.f2 = function () {
    this.fda = correct(this.fsa * this.fe);
    this.da = this.fda;
    this.davalid = isValidValue(this.da);
    this.notifyChanged('dest_amount', this.fda);
};

/**
 * Calculate source amount by initial and result balance
 */
TransactionModel.prototype.f3 = function () {
    this.sa = this.fS1 - this.fS2;
    this.sa = correct(this.sa);
    this.fsa = this.sa;
    this.savalid = isValidValue(this.sa);
    this.notifyChanged('src_amount', this.fsa);
};

/**
 * Calculate destination amount by initial and result balance
 */
TransactionModel.prototype.f3_d = function () {
    this.fda = correct(this.fS2_d - this.fS1_d);
    this.da = this.fda;
    this.davalid = isValidValue(this.da);
    this.notifyChanged('dest_amount', this.fda);
};

/**
 * Calculate source amount by destination amount and exchange rate
 */
TransactionModel.prototype.f4 = function () {
    this.fsa = correct(this.fda / this.fe);
    this.sa = this.fsa;
    this.savalid = isValidValue(this.sa);
    this.notifyChanged('src_amount', this.fsa);
};

/**
 * Calculate exchange rate by destination and source amount
 */
TransactionModel.prototype.f5 = function () {
    if (this.fsa === 0 || this.fda === 0) {
        this.fe = 1;
        this.e = 1;
    } else {
        this.fe = correctExch(this.fda / this.fsa);
        this.e = this.fe;
    }

    this.evalid = isValidValue(this.e);
    this.notifyChanged('exchrate', this.fe);
};

/**
 * Sync currency of person account with currency of user account
 */
TransactionModel.prototype.syncDebtCurrency = function () {
    var newCurrency;
    var personAccount;
    var personBalance;

    if (!this.isDebt()) {
        return;
    }

    newCurrency = (this.debtType) ? this.dest_curr : this.src_curr;
    if (this.debtType) {
        this.updateValue('src_curr', newCurrency);
        this.notifyChanged('src_curr', newCurrency);
    } else {
        this.updateValue('dest_curr', newCurrency);
        this.notifyChanged('dest_curr', newCurrency);
    }

    personAccount = this.parent.model.accounts.getPersonAccount(this.person_id, newCurrency);
    personBalance = (personAccount) ? personAccount.balance : 0;
    this.updateValue((this.debtType) ? 'src_initbal' : 'dest_initbal', personBalance);
};

/**
 * Source amount update event handler
 */
TransactionModel.prototype.onSrcAmountUpdate = function () {
    if (!this.s1valid && !this.s1dvalid) {
        return;
    }

    if (this.isDiff()) {
        if (this.davalid) {
            if (this.isIncome() || this.isTransfer() || (this.isDebt() && !this.debtType)) {
                this.f1_d(); // calculate S2_d
            }
        }
        if (this.savalid) {
            if (this.isExpense() || this.isTransfer() || (this.isDebt() && this.debtType)) {
                this.f1(); // calculate S2
            }
        }

        this.f5(); // calculate e
    } else {
        this.f2(); // calculate da
        if (this.isIncome()) {
            this.f1_d(); // calculate S2_d
        } else if (this.isTransfer() || this.isDebt()) {
            this.f1_d(); // calculate S2_d
            this.f1(); // calculate S2
        } else {
            this.f1(); // calculate S2
        }
    }

    this.notifyChanged('src_amount', this.sa);
};

/**
 * Destination amount update event handler
 */
TransactionModel.prototype.onDestAmountUpdate = function () {
    if (!this.s1valid && !this.s1dvalid) {
        return;
    }

    if (!this.isDiff()) {
        this.f4(); // calculate sa
    }

    if (this.isIncome() || this.isTransfer() || (this.isDebt() && this.debtType)) {
        this.f1_d(); // calculate S2_d
    }

    if (this.isExpense() || this.isTransfer() || (this.isDebt() && !this.debtType)) {
        if (this.savalid) {
            this.f1(); // calculate S2
        }
    }

    this.f5(); // calculate e

    this.notifyChanged('dest_amount', this.da);
};

/**
 * Exchange rate update event handler
 */
TransactionModel.prototype.onExchangeUpdate = function () {
    if (!this.s1valid && !this.s1dvalid) {
        return;
    }

    if (this.savalid) {
        this.f2(); // calculate da
    } else if (this.davalid) {
        this.f4(); // calculate sa
    }

    if (this.isIncome()) {
        this.f1_d(); // calculate S2_d
    } else {
        this.f1(); // calculate S2
    }

    this.notifyChanged('exchrate', this.e);
};

/**
 * Initional balance of source account update event handler
 */
TransactionModel.prototype.onInitBalanceUpdate = function () {
    if (this.savalid) {
        this.f1(); // calculate S2
    } else {
        this.setValue('src_resbal', this.fS1);
        this.notifyChanged('src_resbal', this.fS1);
    }
};

/**
 * Initial balance of destination account update event handler
 */
TransactionModel.prototype.onInitBalanceDestUpdate = function () {
    if (this.savalid) {
        this.f1_d(); // calculate S2_d
    } else {
        this.setValue('dest_resbal', this.fS1_d);
        this.notifyChanged('dest_resbal', this.fS1_d);
    }
};

/**
 * Source result balance update event handler
 */
TransactionModel.prototype.onResBalanceUpdate = function () {
    if (!this.s1valid && !this.s1dvalid) {
        return;
    }

    if (this.isDebt()) {
        this.f3(); // calculate source amount
        this.f2(); // calculate destination amount
        this.f1_d(); // calculate destination result balance
    } else {
        this.f3(); // calculate source amount
        if (this.isDiff()) {
            this.f5(); // calculate exchange
        } else {
            if (this.evalid) {
                this.f2(); // calculate destination amount
            }
            this.f1_d(); // calculate result balance of destination
        }
    }

    this.notifyChanged('src_resbal', this.S2);
};

/**
 * Destination result balance update event handler
 */
TransactionModel.prototype.onResBalanceDestUpdate = function () {
    if (!this.s1dvalid) {
        return;
    }

    if (this.isTransfer() || this.isIncome()) {
        this.f3_d(); // calculate destination amount
        if (this.isDiff()) {
            this.f5(); // calculate exchange rate
        } else {
            if (this.evalid) {
                this.f4(); // calculate source amount
            }
            this.f1(); // calculate result balance of source
        }
    } else if (this.isDebt()) {
        this.f3_d(); // calculate destination amount
        this.f4(); // calculate source amount
        this.f1(); // calculate result balance of source
    }

    this.notifyChanged('dest_resbal', this.S2_d);
};

/**
 * Source account update event handler
 * @param {number} value - identifier of new account
 */
TransactionModel.prototype.onSrcAccUpdate = function (value) {
    var acc = this.parent.model.accounts.getItem(value);

    if (acc) {
        this.updateValue('src_curr', acc.curr_id);
        this.notifyChanged('src_curr', acc.curr_id);
        this.updateValue('src_initbal', acc.balance);
        this.notifyChanged('src_initbal', acc.balance);
    }

    if (this.isDebt() && !this.debtType) {
        this.syncDebtCurrency();
    }
};

/**
 * Destination account update event handler
 * @param {number} value - identifier of new account
 */
TransactionModel.prototype.onDestAccUpdate = function (value) {
    var acc = this.parent.model.accounts.getItem(value);

    if (acc) {
        this.updateValue('dest_curr', acc.curr_id);
        this.notifyChanged('dest_curr', acc.curr_id);
        this.updateValue('dest_initbal', acc.balance);
        this.notifyChanged('dest_initbal', acc.balance);
    }

    if (this.isDebt() && this.debtType) {
        this.syncDebtCurrency();
    }
};

/**
 * Source currency update event handler
 * @param {number} value - identifier of new currency
 */
TransactionModel.prototype.onSrcCurrUpdate = function (value) {
    if (!this.isDiff()) {
        this.fe = 1;
        this.e = 1;
        this.evalid = true;
        this.notifyChanged('exchrate', this.fe);

        if (this.savalid) {
            this.f2(); // calculate da
            this.f1_d(); // calculate S2_d
        }
    }

    this.notifyChanged('src_curr', value);
    this.notifyChanged('src_amount', this.fsa);
};

/**
 * Destination currency update event handler
 * @param {number} value - identifier of new currency
 */
TransactionModel.prototype.onDestCurrUpdate = function (value) {
    if (!this.isDiff()) {
        this.fe = 1;
        this.e = 1;
        this.evalid = true;
        this.notifyChanged('exchrate', this.fe);

        if (this.davalid) {
            this.f4(); // calculate sa
            this.f1(); // calculate S2
        }
    }

    this.notifyChanged('dest_curr', value);
    this.notifyChanged('dest_amount', this.fda);
};

/**
 * Person update event handler
 * @param {*} value - identifier os new person
 */
TransactionModel.prototype.onPersonUpdate = function (value) {
    var newCurrency = (this.debtType) ? this.src_curr : this.dest_curr;
    var personAccount = this.parent.model.accounts.getPersonAccount(value, newCurrency);
    var personBalance = (personAccount) ? personAccount.balance : 0;

    if (this.debtType) {
        this.updateValue('src_initbal', personBalance);
    } else {
        this.updateValue('dest_initbal', personBalance);
    }
};

/**
 * Debt type update event handler
 */
TransactionModel.prototype.onDebtTypeUpdate = function () {
    // Swap source and destination
    var tmp = this.src_id;
    this.src_id = this.dest_id;
    this.dest_id = tmp;

    tmp = this.fS1;
    this.setValue('src_initbal', this.fS1_d);
    this.setValue('dest_initbal', tmp);

    tmp = this.fS2;
    this.setValue('src_resbal', this.fS2_d);
    this.setValue('dest_resbal', tmp);

    if (this.savalid) {
        this.f2(); // calculate da
        this.f1_d(); // calculate S2_d
    } else {
        this.setValue('src_resbal', this.fS1);
        this.notifyChanged('src_resbal', this.fS1);
    }

    if (this.davalid) {
        this.f4(); // calculate sa
        this.f1(); // calculate S2
    } else {
        this.setValue('dest_resbal', this.fS1_d);
        this.notifyChanged('dest_resbal', this.fS1_d);
    }
};

/**
 * Send notification to subscribers about update of property
 * @param {string} item - name of property item
 * @param {*} value - value to set for item
 */
TransactionModel.prototype.notifyChanged = function (item, value) {
    var callback = this.changedCallback[item];

    if (isFunction(callback)) {
        callback(value);
    }
};

/**
 * Set value of property
 * @param {string} item - name of property item
 * @param {*} value - value to set for item
 */
TransactionModel.prototype.setValue = function (item, value) {
    if (item === 'src_amount') {
        this.sa = value;
        this.savalid = isValidValue(this.sa);
        this.fsa = (this.savalid) ? normalize(this.sa) : this.sa;
    } else if (item === 'dest_amount') {
        this.da = value;
        this.davalid = isValidValue(this.da);
        this.fda = (this.davalid) ? normalize(this.da) : this.da;
    } else if (item === 'exchrate') {
        this.e = value;
        this.evalid = isValidValue(this.e);
        this.fe = (this.evalid) ? normalizeExch(this.e) : this.e;
    } else if (item === 'src_initbal') {
        this.S1 = value;
        this.s1valid = isValidValue(this.S1);
        this.fS1 = (this.s1valid) ? normalize(this.S1) : this.S1;
    } else if (item === 'dest_initbal') {
        this.S1_d = value;
        this.s1dvalid = isValidValue(this.S1_d);
        this.fS1_d = (this.s1dvalid) ? normalize(this.S1_d) : this.S1_d;
    } else if (item === 'src_resbal') {
        this.S2 = value;
        this.s2valid = isValidValue(this.S2);
        this.fS2 = (this.s2valid) ? normalize(this.S2) : this.S2;
    } else if (item === 'dest_resbal') {
        this.S2_d = value;
        this.s2dvalid = isValidValue(this.S2_d);
        this.fS2_d = (this.s2dvalid) ? normalize(this.S2_d) : this.S2_d;
    } else if (item === 'src_id') {
        this.src_id = parseInt(value, 10);
    } else if (item === 'dest_id') {
        this.dest_id = parseInt(value, 10);
    } else if (item === 'src_curr') {
        this.src_curr = parseInt(value, 10);
    } else if (item === 'dest_curr') {
        this.dest_curr = parseInt(value, 10);
    } else if (item === 'person_id') {
        this.person_id = parseInt(value, 10);
    } else if (item === 'debt_type') {
        this.debtType = !!value;
    } else if (item === 'no_account') {
        this.noAccount = !!value;
    } else if (item === 'last_acc') {
        this.lastAcc_id = parseInt(value, 10);
    }
};

/**
 * Set value of property and update related properties if needed
 * @param {string} item - name of property item
 * @param {*} value - value to set for item
 */
TransactionModel.prototype.updateValue = function (item, value) {
    this.setValue(item, value);

    if (item === 'src_amount') {
        this.onSrcAmountUpdate(value);
    } else if (item === 'dest_amount') {
        this.onDestAmountUpdate(value);
    } else if (item === 'exchrate') {
        this.onExchangeUpdate(value);
    } else if (item === 'src_initbal') {
        this.onInitBalanceUpdate(value);
    } else if (item === 'dest_initbal') {
        this.onInitBalanceDestUpdate(value);
    } else if (item === 'src_resbal') {
        this.onResBalanceUpdate(value);
    } else if (item === 'dest_resbal') {
        this.onResBalanceDestUpdate(value);
    } else if (item === 'src_id') {
        this.onSrcAccUpdate(value);
    } else if (item === 'dest_id') {
        this.onDestAccUpdate(value);
    } else if (item === 'src_curr') {
        this.onSrcCurrUpdate(value);
    } else if (item === 'dest_curr') {
        this.onDestCurrUpdate(value);
    } else if (item === 'person_id') {
        this.onPersonUpdate(value);
    } else if (item === 'debt_type') {
        this.onDebtTypeUpdate(value);
    }
};

/**
 * @returns true if transaction type is expense
 */
TransactionModel.prototype.isExpense = function () {
    return (this.type === EXPENSE);
};

/**
 * @returns true if transaction type is income
 */
TransactionModel.prototype.isIncome = function () {
    return (this.type === INCOME);
};

/**
 * @returns true if transaction type is transfer
 */
TransactionModel.prototype.isTransfer = function () {
    return (this.type === TRANSFER);
};

/**
 * @returns true if transaction type is debt
 */
TransactionModel.prototype.isDebt = function () {
    return (this.type === DEBT);
};

/**
 * Return source account
 */
TransactionModel.prototype.srcAcc = function () {
    return this.src_id;
};

/**
 * Return destination account
 */
TransactionModel.prototype.destAcc = function () {
    return this.dest_id;
};

/**
 * Return source currency
 */
TransactionModel.prototype.srcCurr = function () {
    return this.src_curr;
};

/**
 * Return destiantion currency
 */
TransactionModel.prototype.destCurr = function () {
    return this.dest_curr;
};

/**
 * Return source amount
 */
TransactionModel.prototype.srcAmount = function () {
    return this.fsa;
};

/**
 * Return destination amount
 */
TransactionModel.prototype.destAmount = function () {
    return this.fda;
};

/**
 * Return echange rate
 */
TransactionModel.prototype.exchRate = function () {
    return this.fe;
};

/**
 * Check source and destination currencies is different
 */
TransactionModel.prototype.isDiff = function () {
    return (this.src_curr !== this.dest_curr);
};

/**
 * Subscribe to updates of specified property
 * @param {*} item - name of property
 * @param {Function} callback - function to call on property update event
 */
TransactionModel.prototype.subscribe = function (item, callback) {
    this.changedCallback[item] = callback;
};
