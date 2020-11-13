'use strict';

/* global extend, ListItem, List, normalize */
/* eslint no-bitwise: "off" */

/** Action types */
var IMPORT_ACTION_SET_TR_TYPE = 1;
var IMPORT_ACTION_SET_ACCOUNT = 2;
var IMPORT_ACTION_SET_PERSON = 3;
var IMPORT_ACTION_SET_SRC_AMOUNT = 4;
var IMPORT_ACTION_SET_DEST_AMOUNT = 5;
var IMPORT_ACTION_SET_COMMENT = 6;

/**
 * @constructor Import action class
 * @param {object} props - properties of instance
 */
function ImportAction() {
    ImportAction.parent.constructor.apply(this, arguments);
}

extend(ImportAction, ListItem);

/**
 * Check specified field name is available
 * @param {string} field - field name to check
 */
ImportAction.prototype.isAvailField = function (field) {
    var availFields = ['id', 'rule_id', 'action_id', 'value'];

    return typeof field === 'string' && availFields.includes(field);
};

/**
 * Execute import action
 * @param {number} data - value on the left to operator
 * @param {number} rightVal - value on the right to operator
 */
ImportAction.prototype.execute = function (data, rowObj, context) {
    if (!isObject(data)) {
        throw new Error('Invalid data object');
    }
    if (!isObject(rowObj)) {
        throw new Error('Invalid row object');
    }
    if (!context) {
        throw new Error('Invalid context');
    }

    if (this.action_id === IMPORT_ACTION_SET_TR_TYPE) {
        this.setTransactionType(data, rowObj, context);
    } else if (this.action_id === IMPORT_ACTION_SET_ACCOUNT) {
        this.setAccount(data, rowObj, context);
    } else if (this.action_id === IMPORT_ACTION_SET_PERSON) {
        this.setPerson(data, rowObj, context);
    } else if (this.action_id === IMPORT_ACTION_SET_SRC_AMOUNT) {
        this.setSourceAmount(data, rowObj, context);
    } else if (this.action_id === IMPORT_ACTION_SET_DEST_AMOUNT) {
        this.setDestinationAmount(data, rowObj, context);
    } else if (this.action_id === IMPORT_ACTION_SET_COMMENT) {
        this.setComment(data, rowObj, context);
    } else {
        throw new Error('Invalid action');
    }
};

/** Set type of transaction action */
ImportAction.prototype.setTransactionType = function (data, rowObj, context) {
    var typeValue;

    if (!isObject(data) || !isObject(rowObj) || !context) {
        throw new Error('Invalid data object');
    }

    if (this.value === EXPENSE) {
        typeValue = 'expense';
    } else if (this.value === INCOME) {
        typeValue = 'income';
    } else if (this.value === TRANSFER) {
        typeValue = (data.trAmountVal > 0) ? 'transferto' : 'transferfrom';
    } else if (this.value == DEBT) {
        typeValue = (data.trAmountVal > 0) ? 'debtto' : 'debtfrom';
    }

    selectByValue(rowObj.trTypeSel, typeValue);
    context.onTrTypeChanged(res);
};

/** Set account action */
ImportAction.prototype.setAccount = function (data, rowObj, context) {
    if (!isObject(data) || !isObject(rowObj) || !context) {
        throw new Error('Invalid data object');
    }

    selectByValue(rowObj.destAccSel, this.value);
    context.onDestChanged(rowObj);
};

/** Set person action */
ImportAction.prototype.setPerson = function (data, rowObj, context) {
    if (!isObject(data) || !isObject(rowObj) || !context) {
        throw new Error('Invalid data object');
    }

    selectByValue(rowObj.personSel, this.value);
    context.onPersonChanged(rowObj);
};

/** Set source amount action */
ImportAction.prototype.setSourceAmount = function (data, rowObj, context) {
    if (!isObject(data) || !isObject(rowObj) || !context) {
        throw new Error('Invalid data object');
    }

    rowObj.amountInp.value = this.value;
};

/** Set destination amount action */
ImportAction.prototype.setDestinationAmount = function (data, rowObj, context) {
    if (!isObject(data) || !isObject(rowObj) || !context) {
        throw new Error('Invalid data object');
    }

    rowObj.destAmountInp.value = this.value;
};

/** Set comment action */
ImportAction.prototype.setComment = function (data, rowObj, context) {
    if (!isObject(data) || !isObject(rowObj) || !context) {
        throw new Error('Invalid data object');
    }

    rowObj.commInp.value = this.value;
};
