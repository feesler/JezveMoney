'use strict';

/* global ge, ce, show, copyObject, ajax, extend, baseURL */
/* global AdminListView, AdminImportConditionListView, AdminImportActionListView */
/* eslint no-bitwise: "off" */

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

    this.conditionsView = new AdminImportConditionListView({
        elements: {
            itemsListElem: 'conditions-list',
            createBtn: 'createcondbtn',
            updateBtn: 'updcondbtn',
            deleteBtn: 'delcondbtn',
            itemForm: 'condition-frm',
            dialogPopup: 'condition_popup'
        },
        data: [],
        actionTypes: this.props.actionTypes,
        fields: this.props.fields,
        operators: this.props.operators
    });

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
    this.flagsInput = ge('item_flags');

    this.conditionsContainer = ge('conditionsContainer');
    this.actionsContainer = ge('actionsContainer');
};

/**
 * Set up fields of form for specified item
 * @param {*} item - if set to null create mode is assumed, if set to object then update mode
 */
AdminImportRuleListView.prototype.setItemValues = function (item) {
    if (item) {
        this.idInput.value = item.id;
        this.flagsInput.value = item.flags;

        this.conditionsView.setParentRule(item.id);
        this.actionsView.setParentRule(item.id);
    } else {
        this.idInput.value = '';
        this.flagsInput.value = '';
    }

    show(this.conditionsContainer, !!item);
    show(this.actionsContainer, !!item);
};

/**
 * Process from data if needed and return request data
 * @param {object} data - form data
 */
AdminImportRuleListView.prototype.prepareRequestData = function (data) {
    var res = copyObject(data);

    res.flags = 0;

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
    if (!item) {
        return null;
    }

    return ce('tr', {}, [
        ce('td', { textContent: item.id }),
        ce('td', { textContent: item.user_id }),
        ce('td', { textContent: item.flags })
    ]);
};
