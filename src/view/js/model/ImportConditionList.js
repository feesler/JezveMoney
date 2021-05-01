'use strict';

/* global extend, List, ImportCondition */

/**
 * @constructor ImportConditionList class
 * @param {object[]} props - array of import conditions
 */
function ImportConditionList() {
    ImportConditionList.parent.constructor.apply(this, arguments);
}

extend(ImportConditionList, List);

/** Static alias for ImportConditionList constructor */
ImportConditionList.create = function (props) {
    return new ImportConditionList(props);
};

/**
 * Create list item from specified object
 * @param {Object} obj
 */
ImportConditionList.prototype.createItem = function (obj) {
    return new ImportCondition(obj);
};

/**
 * Return list of conditions for specified rule
 * @param {number} ruleId - rule id
 */
ImportConditionList.prototype.getRuleConditions = function (ruleId) {
    var id = parseInt(ruleId, 10);
    if (!id) {
        throw new Error('Invalid rule id');
    }

    return this.filter(function (item) {
        return item.rule_id === id;
    });
};

/**
 * Check list of conditions has condition with same properties
 * @param {ImportCondition} condition
 */
ImportConditionList.prototype.hasSameCondition = function (condition) {
    if (!(condition instanceof ImportCondition)) {
        throw new Error('Invalid condition');
    }

    return !!this.find(function (item) {
        return (
            item !== condition
            && item.field_id === condition.field_id
            && item.operator === condition.operator
            && item.value === condition.value
            && item.flags === condition.flags
        );
    });
};

/**
 * Check list of conditions has condition with same field type
 * @param {ImportCondition} condition
 */
ImportConditionList.prototype.hasSameFieldCondition = function (condition) {
    if (!(condition instanceof ImportCondition)) {
        throw new Error('Invalid condition');
    }

    return !!this.find(function (item) {
        return (
            item !== condition
            && item.flags === condition.flags
            && item.field_id === condition.field_id
        );
    });
};

/**
 * Check list of conditions has condition with same field type
 * and equal or greater value than specified condition
 * @param {ImportCondition} condition
 */
ImportConditionList.prototype.hasNotLessCondition = function (condition) {
    var value;

    if (!(condition instanceof ImportCondition)) {
        throw new Error('Invalid rule id');
    }

    if (condition.isPropertyValue()) {
        return false;
    }

    value = condition.getConditionValue({});
    return !!this.find(function (item) {
        return (
            item !== condition
            && !item.isPropertyValue()
            && item.field_id === condition.field_id
            && !(item.getConditionValue({}) < value)
        );
    });
};

/**
 * Check list of conditions has condition with same field type
 * and equal or less value than specified condition
 * @param {ImportCondition} condition
 */
ImportConditionList.prototype.hasNotGreaterCondition = function (condition) {
    var value;

    if (!(condition instanceof ImportCondition)) {
        throw new Error('Invalid rule id');
    }

    if (condition.isPropertyValue()) {
        return false;
    }

    value = condition.getConditionValue({});
    return !!this.find(function (item) {
        return (
            item !== condition
            && !item.isPropertyValue()
            && item.field_id === condition.field_id
            && !(item.getConditionValue({}) > value)
        );
    });
};
