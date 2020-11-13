'use strict';

/* global ge, ce, show, selectByValue, extend, AdminListView, List */
/* eslint no-bitwise: "off" */

/**
 * Admin import rule list view
 */
function AdminImportActionListView() {
    AdminImportActionListView.parent.constructor.apply(this, arguments);

    this.apiController = 'importaction';
    this.deleteConfirmMessage = 'Are you sure want to delete selected action?';

    if (
        !('data' in this.props)
        || !('actionTypes' in this.props)
    ) {
        throw new Error('Invalid data');
    }
    this.actionTypes = new List(this.props.actionTypes);
    this.parentRule = 0;
}

extend(AdminImportActionListView, AdminListView);

/**
 * View initialization
 */
AdminImportActionListView.prototype.onStart = function () {
    AdminImportActionListView.parent.onStart.apply(this, arguments);

    this.idInput = ge('action_id');
    this.ruleInput = ge('action_rule');
    this.actionSel = ge('action_type_id');
    this.valueInput = ge('action_value');
};

/**
 * Set up fields of form for specified item
 * @param {*} item - if set to null create mode is assumed, if set to object then update mode
 */
AdminImportActionListView.prototype.setItemValues = function (item) {
    if (item) {
        this.idInput.value = item.id;
        this.ruleInput.value = item.rule_id;
        selectByValue(this.actionSel, item.action_id);
        this.valueInput.value = item.value;
    } else {
        this.idInput.value = '';
        this.ruleInput.value = this.parentRule;
        selectByValue(this.actionSel, 0);
        this.valueInput.value = '';
    }
};

/**
 * Set up fields of form for specified item
 * @param {*} item - if set to null create mode is assumed, if set to object then update mode
 */
AdminImportActionListView.prototype.setParentRule = function (ruleId) {
    var rule = parseInt(ruleId, 10);
    if (!rule) {
        throw new Error('Invalid rule: '+ ruleId);
    }

    this.parentRule = ruleId;
    this.requestList();
};

/**
 * Request list of items from API
 */
AdminImportActionListView.prototype.requestList = function () {
    var options = {
        full: true,
        rule: this.parentRule
    };

    ajax.get({
        url: baseURL + 'api/' + this.apiController + '/list?' + urlJoin(options),
        callback: this.onListResult.bind(this)
    });
};

/**
 * Return name of specified action
 * @param {number} actionId - identifier of item
 */
AdminImportActionListView.prototype.getActionName = function (actionId) {
    var action = this.actionTypes.getItem(actionId);
    if (!action) {
        return null;
    }

    return action.name;
};

/**
 * Render list element for specified item
 * @param {object} item - item object
 */
AdminImportActionListView.prototype.renderItem = function (item) {
    var actionName;

    if (!item) {
        return null;
    }

    actionName = this.getActionName(item.action_id);
    if (!actionName) {
        actionName = item.action_id;
    }

    return ce('tr', {}, [
        ce('td', { textContent: item.id }),
        ce('td', { textContent: item.user_id }),
        ce('td', { textContent: item.rule_id }),
        ce('td', { textContent: actionName }),
        ce('td', { textContent: item.value })
    ]);
};
