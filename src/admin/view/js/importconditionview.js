'use strict';

/* global ge, ce, show, copyObject, ajax, selectByValue, extend, urlJoin, baseURL */
/* global AdminListView, List */
/* eslint no-bitwise: "off" */

var IMPORT_COND_OP_FIELD_FLAG = 0x01;

/**
 * Admin import rule list view
 */
function AdminImportConditionListView() {
    AdminImportConditionListView.parent.constructor.apply(this, arguments);

    this.apiController = 'importcond';
    this.deleteConfirmMessage = 'Are you sure want to delete selected condition?';

    if (
        !('data' in this.props)
        || !('actionTypes' in this.props)
        || !('fields' in this.props)
        || !('operators' in this.props)
    ) {
        throw new Error('Invalid data');
    }

    this.actionTypes = new List(this.props.actionTypes);
    this.fields = new List(this.props.fields);
    this.operators = new List(this.props.operators);
}

extend(AdminImportConditionListView, AdminListView);

/**
 * View initialization
 */
AdminImportConditionListView.prototype.onStart = function () {
    AdminImportConditionListView.parent.onStart.apply(this, arguments);

    this.idInput = ge('cond_id');
    this.ruleInput = ge('cond_rule');
    this.fieldSel = ge('cond_field_id');
    this.operatorSel = ge('cond_operator');
    this.fieldFlagCheck = ge('fieldflagcheck');
    this.fieldFlagCheck.addEventListener('change', this.onFieldFlagChange.bind(this));
    this.fieldValueRow = ge('fieldvalue_row');
    this.fieldValueSel = ge('cond_fieldvalue');
    this.valueRow = ge('value_row');
    this.valueInput = ge('cond_value');
    this.actionsContainer = ge('actionsContainer');
};

/**
 * Set up fields of form for specified item
 * @param {*} item - if set to null create mode is assumed, if set to object then update mode
 */
AdminImportConditionListView.prototype.setItemValues = function (item) {
    var isFieldValue;

    if (item) {
        this.idInput.value = item.id;
        this.ruleInput.value = item.rule_id;
        selectByValue(this.fieldSel, item.field_id);
        selectByValue(this.operatorSel, item.operator);

        isFieldValue = this.isPropertyValue(item.flags);
        this.fieldFlagCheck.checked = isFieldValue;
        if (isFieldValue) {
            selectByValue(this.fieldValueSel, parseInt(item.value, 10));
        }
        this.valueInput.value = item.value;
    } else {
        this.idInput.value = '';
        this.ruleInput.value = this.parentRule;
        selectByValue(this.fieldSel, 0);
        selectByValue(this.operatorSel, 0);
        this.fieldFlagCheck.checked = false;
        this.valueInput.value = '';
    }

    this.onFieldFlagChange();
};

/**
 * Field flag 'change' event handler
 */
AdminImportConditionListView.prototype.onFieldFlagChange = function () {
    show(this.fieldValueRow, this.fieldFlagCheck.checked);
    show(this.valueRow, !this.fieldFlagCheck.checked);
};

/**
 * Check operator id has field value flag
 * @param {number} data - operator value
 */
AdminImportConditionListView.prototype.isPropertyValue = function (data) {
    var flags = parseInt(data, 10);
    if (Number.isNaN(flags)) {
        throw new Error('Invalid flags value');
    }

    return (flags & IMPORT_COND_OP_FIELD_FLAG) === IMPORT_COND_OP_FIELD_FLAG;
};

/**
 * Return name of specified field
 * @param {number} operatorId - identifier of item
 */
AdminImportConditionListView.prototype.getFieldName = function (fieldId) {
    var field = this.fields.getItem(fieldId);
    if (!field) {
        return null;
    }

    return field.name;
};

/**
 * Return name of specified operator
 * @param {number} operatorId - identifier of item
 */
AdminImportConditionListView.prototype.getOperatorName = function (operatorId) {
    var operator = this.operators.getItem(operatorId);
    if (!operator) {
        return null;
    }

    return operator.name;
};

/**
 * Process from data if needed and return request data
 * @param {object} data - form data
 */
AdminImportConditionListView.prototype.prepareRequestData = function (data) {
    var res = copyObject(data);

    res.flags = 0;
    if (this.fieldFlagCheck.checked) {
        res.flags |= IMPORT_COND_OP_FIELD_FLAG;
        res.value = this.fieldValueSel.value;
    } else {
        res.value = this.valueInput.value;
    }

    return res;
};

/**
 * Set up parent rule for conditions list
 * @param {number} ruleId - parent rule id
 */
AdminImportConditionListView.prototype.setParentRule = function (ruleId) {
    var rule = parseInt(ruleId, 10);
    if (!rule) {
        throw new Error('Invalid rule: ' + ruleId);
    }

    this.parentRule = ruleId;
    this.requestList();
};

/**
 * Request list of items from API
 */
AdminImportConditionListView.prototype.requestList = function () {
    var options = {
        full: true,
        rule: this.parentRule
    };

    show(this.itemsListElem, false);
    ajax.get({
        url: baseURL + 'api/' + this.apiController + '/list?' + urlJoin(options),
        callback: this.onListResult.bind(this)
    });
};

/**
 * Render list element for specified item
 * @param {object} item - item object
 */
AdminImportConditionListView.prototype.renderItem = function (item) {
    var fieldName;
    var operatorName;
    var valueStr;

    if (!item) {
        return null;
    }

    fieldName = this.getFieldName(item.field_id);
    if (!fieldName) {
        fieldName = item.field_id;
    }
    operatorName = this.getOperatorName(item.operator);
    if (!operatorName) {
        operatorName = item.operator;
    }

    if (this.isPropertyValue(item.flags)) {
        valueStr = this.getFieldName(item.value);
    } else {
        valueStr = item.value;
    }

    return ce('tr', {}, [
        ce('td', { textContent: item.id }),
        ce('td', { textContent: item.user_id }),
        ce('td', { textContent: item.rule_id }),
        ce('td', { textContent: fieldName }),
        ce('td', { textContent: operatorName }),
        ce('td', { textContent: valueStr }),
        ce('td', { textContent: item.flags })
    ]);
};
