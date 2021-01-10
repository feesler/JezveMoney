'use strict';

/* global copyObject, extend, List, ListItem, ImportTransactionItem */
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

/** List of available action types */
ImportAction.actionTypes = [
    { id: IMPORT_ACTION_SET_TR_TYPE, title: 'Set transaction type' },
    { id: IMPORT_ACTION_SET_ACCOUNT, title: 'Set account' },
    { id: IMPORT_ACTION_SET_PERSON, title: 'Set person' },
    { id: IMPORT_ACTION_SET_SRC_AMOUNT, title: 'Set source amount' },
    { id: IMPORT_ACTION_SET_DEST_AMOUNT, title: 'Set destination amount' },
    { id: IMPORT_ACTION_SET_COMMENT, title: 'Set comment' }
];

/**
 * Check specified field name is available
 * @param {string} field - field name to check
 */
ImportAction.prototype.isAvailField = function (field) {
    var availFields = ['id', 'rule_id', 'action_id', 'value'];

    return typeof field === 'string' && availFields.includes(field);
};

/** Return array of available action types */
ImportAction.getTypes = function () {
    var res = copyObject(ImportAction.actionTypes);

    return res;
};

/** Search action type by id */
ImportAction.getActionById = function (value) {
    var res;
    var id = parseInt(value, 10);
    if (!id) {
        return null;
    }

    res = ImportAction.actionTypes.find(function (item) {
        return item.id === id;
    });
    if (!res) {
        return null;
    }

    return copyObject(res);
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

/**
 * @constructor ImportActionList class
 * @param {object[]} props - array of import action
 */
function ImportActionList() {
    ImportActionList.parent.constructor.apply(this, arguments);
}

extend(ImportActionList, List);

/** Static alias for ImportActionList constructor */
ImportActionList.create = function (props) {
    return new ImportActionList(props);
};

/**
 * Create list item from specified object
 * @param {Object} obj
 */
ImportActionList.prototype.createItem = function (obj) {
    return new ImportAction(obj);
};

/**
 * Return list of actions for specified rule
 * @param {number} ruleId - rule id
 */
ImportActionList.prototype.getRuleActions = function (ruleId) {
    var id = parseInt(ruleId, 10);
    if (!id) {
        throw new Error('Invalid rule id');
    }

    return this.data.filter(function (item) {
        return item.rule_id === id;
    });
};
