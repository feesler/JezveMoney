'use strict';

/* global extend, ListItem, List, ImportConditionList, ImportActionList */

/**
 * @constructor Import rule class
 * @param {object} props - properties of instance
 */
function ImportRule() {
    ImportRule.parent.constructor.apply(this, arguments);

    this.conditions = new ImportConditionList(this.conditions);
    this.actions = new ImportActionList(this.actions);
}

extend(ImportRule, ListItem);

/**
 * Check specified field name is available
 * @param {string} field - field name to check
 */
ImportRule.prototype.isAvailField = function (field) {
    var availFields = [
        'id',
        'flags',
        'conditions',
        'actions'
    ];

    return typeof field === 'string' && availFields.includes(field);
};

/** Check specified data is meet all conditions of rule */
ImportRule.prototype.meetConditions = function (data) {
    var res = this.conditions.every(function (condition) {
        return condition.meet(data);
    });

    return res;
};

/** Run actions assigned to rule */
ImportRule.prototype.runActions = function (context) {
    this.actions.forEach(function (item) {
        item.execute(context);
    });
};

/**
 * @constructor ImportRuleList class
 * @param {object[]} props - array of import rules
 */
function ImportRuleList() {
    ImportRuleList.parent.constructor.apply(this, arguments);
}

extend(ImportRuleList, List);

/** Static alias for ImportRuleList constructor */
ImportRuleList.create = function (props) {
    return new ImportRuleList(props);
};

/**
 * Create list item from specified object
 * @param {Object} obj
 */
ImportRuleList.prototype.createItem = function (obj) {
    return new ImportRule(obj);
};

/**
 * Apply list of import rules to specified transaction data
 * @param {Object} data - imported transaction data
 * @param {Object} context - transaction row object
 */
ImportRuleList.prototype.applyTo = function (data, context) {
    this.data.forEach(function (rule) {
        if (!rule.meetConditions(data)) {
            return;
        }

        rule.runActions(context);
    }, this);
};
