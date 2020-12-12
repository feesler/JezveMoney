'use strict';

/* global extend, ListItem, ImportTransactionItem */
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
 * @param {ImportTransactionItem} context - import item component
 */
ImportAction.prototype.execute = function (context) {
    if (!(context instanceof ImportTransactionItem)) {
        throw new Error('Invalid import item');
    }

    if (this.action_id === IMPORT_ACTION_SET_TR_TYPE) {
        context.setTransactionType(this.value);
    } else if (this.action_id === IMPORT_ACTION_SET_ACCOUNT) {
        context.setAccount(this.value);
    } else if (this.action_id === IMPORT_ACTION_SET_PERSON) {
        context.setPerson(this.value);
    } else if (this.action_id === IMPORT_ACTION_SET_SRC_AMOUNT) {
        context.setAmount(this.value);
    } else if (this.action_id === IMPORT_ACTION_SET_DEST_AMOUNT) {
        context.setSecondAmount(this.value);
    } else if (this.action_id === IMPORT_ACTION_SET_COMMENT) {
        context.setComment(this.value);
    } else {
        throw new Error('Invalid action');
    }
};
