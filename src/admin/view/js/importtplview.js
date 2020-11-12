'use strict';

/* global ge, ce, extend, AdminListView */

/**
 * Admin import template list view
 */
function AdminImportTemplateListView() {
    AdminImportTemplateListView.parent.constructor.apply(this, arguments);

    this.apiController = 'importtpl';
    this.deleteConfirmMessage = 'Are you sure want to delete selected template?';
}

extend(AdminImportTemplateListView, AdminListView);

/**
 * View initialization
 */
AdminImportTemplateListView.prototype.onStart = function () {
    AdminImportTemplateListView.parent.onStart.apply(this, arguments);

    this.idInput = ge('item_id');
    this.nameInput = ge('item_name');
    this.typeInput = ge('item_type_id');
    this.dateColInput = ge('item_date_col');
    this.commentColInput = ge('item_comment_col');
    this.trCurrColInput = ge('item_trans_curr_col');
    this.trAmountColInput = ge('item_trans_amount_col');
    this.accCurrColInput = ge('item_account_curr_col');
    this.accAmountColInput = ge('item_account_amount_col');
};

/**
 * Set up fields of form for specified item
 * @param {*} item - if set to null create mode is assumed, if set to object then update mode
 */
AdminImportTemplateListView.prototype.setItemValues = function (item) {
    if (item) {
        this.idInput.value = item.id;
        this.nameInput.value = item.name;
        this.typeInput.value = item.type_id;
        this.dateColInput.value = item.dateColumn;
        this.commentColInput.value = item.commentColumn;
        this.trCurrColInput.value = item.transactionCurrColumn;
        this.trAmountColInput.value = item.transactionAmountColumn;
        this.accCurrColInput.value = item.accountCurrColumn;
        this.accAmountColInput.value = item.accountAmountColumn;
    } else {
        this.idInput.value = '';
        this.nameInput.value = '';
        this.typeInput.value = '';
        this.dateColInput.value = '';
        this.commentColInput.value = '';
        this.trCurrColInput.value = '';
        this.trAmountColInput.value = '';
        this.accCurrColInput.value = '';
        this.accAmountColInput.value = '';
    }
};

/**
 * Render list element for specified item
 * @param {object} item - item object
 */
AdminImportTemplateListView.prototype.renderItem = function (item) {
    if (!item) {
        return null;
    }

    return ce('tr', {}, [
        ce('td', { textContent: item.id }),
        ce('td', { textContent: item.name }),
        ce('td', { textContent: item.type_id }),
        ce('td', { textContent: item.dateColumn }),
        ce('td', { textContent: item.commentColumn }),
        ce('td', { textContent: item.transactionCurrColumn }),
        ce('td', { textContent: item.transactionAmountColumn }),
        ce('td', { textContent: item.accountCurrColumn }),
        ce('td', { textContent: item.accountAmountColumn })
    ]);
};
