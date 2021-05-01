'use strict';

/* global extend, List, ImportAction */
/* global IMPORT_ACTION_SET_TR_TYPE */
/* eslint no-bitwise: "off" */

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

    return this.filter(function (item) {
        return item.rule_id === id;
    });
};

/** Check list has `Set transaction type` action with 'transferfrom' or 'transferto' value */
ImportActionList.prototype.hasSetTransfer = function () {
    return !!this.find(function (item) {
        return (
            item.action_id === IMPORT_ACTION_SET_TR_TYPE
            && (
                item.value === 'transferfrom'
                || item.value === 'transferto'
            )
        );
    });
};

/** Check list has `Set transaction type` action with 'debtfrom' or 'debtto' value */
ImportActionList.prototype.hasSetDebt = function () {
    return !!this.find(function (item) {
        return (
            item.action_id === IMPORT_ACTION_SET_TR_TYPE
            && (
                item.value === 'debtfrom'
                || item.value === 'debtto'
            )
        );
    });
};
