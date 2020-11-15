'use strict';

/* global ge, ce, show, selectByValue, extend, AdminListView, List */
/* global AdminImportActionListView */
/* eslint no-bitwise: "off" */

var IMPORT_RULE_OP_FIELD_FLAG = 0x01;

/**
 * Admin import rule list view
 */
function AdminImportRuleListView() {
    AdminImportRuleListView.parent.constructor.apply(this, arguments);

    this.apiController = 'importrule';
    this.deleteConfirmMessage = 'Are you sure want to delete selected rule?';

    if (
        !('data' in this.props)
        || !('actionTypes' in this.props)
        || !('fields' in this.props)
        || !('operators' in this.props)
    ) {
        throw new Error('Invalid data');
    }

    this.actionTypes = new List(this.props.actionTypes)
    this.fields = new List(this.props.fields);
    this.operators = new List(this.props.operators);

    this.actionsView = new AdminImportActionListView({
        elements: {
            itemsListElem: 'actions-list',
            createBtn: 'createactbtn',
            updateBtn: 'updactbtn',
            deleteBtn: 'delactbtn',
            itemForm: 'action-frm',
            dialogPopup: 'action_popup'
        },
        data: [],
        actionTypes: this.props.actionTypes
    });
}

extend(AdminImportRuleListView, AdminListView);

/**
 * View initialization
 */
AdminImportRuleListView.prototype.onStart = function () {
    AdminImportRuleListView.parent.onStart.apply(this, arguments);

    this.idInput = ge('item_id');
    this.parentInput = ge('item_parent');
    this.fieldSel = ge('item_field_id');
    this.operatorSel = ge('item_operator');
    this.fieldFlagCheck = ge('fieldflagcheck');
    this.fieldFlagCheck.addEventListener('change', this.onFieldFlagChange.bind(this));
    this.fieldValueRow = ge('fieldvalue_row');
    this.fieldValueSel = ge('item_fieldvalue');
    this.valueRow = ge('value_row');
    this.valueInput = ge('item_value');
    this.actionsContainer = ge('actionsContainer');
};

/**
 * Set up fields of form for specified item
 * @param {*} item - if set to null create mode is assumed, if set to object then update mode
 */
AdminImportRuleListView.prototype.setItemValues = function (item) {
    var isFieldValue;

    if (item) {
        this.idInput.value = item.id;
        this.parentInput.value = item.parent_id;
        selectByValue(this.fieldSel, item.field_id);
        selectByValue(this.operatorSel, item.operator);

        isFieldValue = this.isFieldValueOperator(item.operator);
        this.fieldFlagCheck.checked = isFieldValue;
        if (isFieldValue) {
            selectByValue(this.fieldValueSel, parseInt(item.value, 10));
        }
        this.valueInput.value = item.value;

        this.actionsView.setParentRule(item.id);
        show(this.actionsContainer, true);
    } else {
        this.idInput.value = '';
        this.parentInput.value = '';
        selectByValue(this.fieldSel, 0);
        selectByValue(this.operatorSel, 0);
        this.fieldFlagCheck.checked = false;
        this.valueInput.value = '';

        show(this.actionsContainer, false);
    }

    this.onFieldFlagChange();
};

/**
 * Field flag 'change' event handler
 */
AdminImportRuleListView.prototype.onFieldFlagChange = function () {
    show(this.fieldValueRow, this.fieldFlagCheck.checked);
    show(this.valueRow, !this.fieldFlagCheck.checked);
};

/**
 * Check operator id has field value flag
 * @param {number} data - operator value
 */
AdminImportRuleListView.prototype.isFieldValueOperator = function (data) {
    var flags = parseInt(data, 10);
    if (!flags) {
        throw new Error('Invalid flags value');
    }

    return (flags & IMPORT_RULE_OP_FIELD_FLAG) === IMPORT_RULE_OP_FIELD_FLAG;
};

/**
 * Return name of specified field
 * @param {number} operatorId - identifier of item
 */
AdminImportRuleListView.prototype.getFieldName = function (fieldId) {
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
AdminImportRuleListView.prototype.getOperatorName = function (operatorId) {
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
AdminImportRuleListView.prototype.prepareRequestData = function (data) {
    var res = copyObject(data);

    res.flags = 0;
    if (this.fieldFlagCheck.checked) {
        res.flags |= IMPORT_RULE_OP_FIELD_FLAG;
        res.value = this.fieldValueSel.value;
    } else {
        res.value = this.valueInput.value;
    }

    return res;
};

/**
 * Request list of items from API
 */
AdminImportRuleListView.prototype.requestList = function () {
    ajax.get({
        url: baseURL + 'api/' + this.apiController + '/list?full=true',
        callback: this.onListResult.bind(this)
    });
};

/**
 * Render list element for specified item
 * @param {object} item - item object
 */
AdminImportRuleListView.prototype.renderItem = function (item) {
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

    if (this.isFieldValueOperator(item.operator)) {
        valueStr = this.getFieldName(item.value);
    } else {
        valueStr = item.value;
    }

    return ce('tr', {}, [
        ce('td', { textContent: item.id }),
        ce('td', { textContent: item.user_id }),
        ce('td', { textContent: item.parent_id }),
        ce('td', { textContent: fieldName }),
        ce('td', { textContent: operatorName }),
        ce('td', { textContent: valueStr }),
        ce('td', { textContent: item.flags })
    ]);
};
