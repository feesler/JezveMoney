'use strict';

/* global extend, List, ImportRule */

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
 * Apply list of import rules to specified transaction
 * @param {Object} item - import transaction
 */
ImportRuleList.prototype.applyTo = function (item) {
    var applied = false;
    var data = item.getOriginal();

    this.forEach(function (rule) {
        if (!rule.meetConditions(data)) {
            return;
        }

        applied = true;
        rule.runActions(item);
    }, this);

    return applied;
};
