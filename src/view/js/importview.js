'use strict';

/* global ge, re, ce, removeChilds, enable, extend */
/* global selectByValue, selectedValue, ajax, createMessage, baseURL */
/* global AccountList, CurrencyList, PersonList, ImportRuleList, ImportTemplateList */
/* global View, IconLink, Sortable, ImportUploadDialog, ImportTransactionItem */
/* eslint no-bitwise: "off" */

/**
 * Import view constructor
 */
function ImportView() {
    ImportView.parent.constructor.apply(this, arguments);

    this.model = {
        transactionRows: [],
        mainAccount: null,
        transCache: null
    };

    this.model.accounts = AccountList.create(this.props.accounts);
    this.model.currency = CurrencyList.create(this.props.currencies);
    this.model.persons = PersonList.create(this.props.persons);
    this.model.rules = ImportRuleList.create(this.props.rules);
    this.model.templates = ImportTemplateList.create(this.props.templates);
}

extend(ImportView, View);

/**
 * View initialization
 */
ImportView.prototype.onStart = function () {
    this.newItemBtn = IconLink.fromElement({
        elem: 'newItemBtn',
        onclick: this.createItem.bind(this)
    });

    this.uploadBtn = IconLink.fromElement({
        elem: 'uploadBtn',
        onclick: this.showUploadDialog.bind(this)
    });

    this.submitBtn = ge('submitbtn');
    this.transCountElem = ge('trcount');
    this.enabledTransCountElem = ge('entrcount');
    this.acc_id = ge('acc_id');
    this.rowsContainer = ge('rowsContainer');
    if (!this.newItemBtn
        || !this.uploadBtn
        || !this.submitBtn
        || !this.transCountElem
        || !this.enabledTransCountElem
        || !this.acc_id
        || !this.rowsContainer
    ) {
        throw new Error('Failed to initialize Import view');
    }

    this.acc_id.addEventListener('change', this.onMainAccChange.bind(this));
    this.submitBtn.addEventListener('click', this.onSubmitClick.bind(this));

    this.noDataMsg = this.rowsContainer.querySelector('.nodata-message');

    this.trListSortable = new Sortable({
        oninsertat: this.onTransPosChanged.bind(this),
        container: 'rowsContainer',
        group: 'transactions',
        selector: '.tr-row',
        placeholderClass: 'tr-row__placeholder',
        copyWidth: true,
        handles: [{ query: 'div' }, { query: 'label' }]
    });

    this.updMainAccObj();
};

/** Show upload file dialog popup */
ImportView.prototype.showUploadDialog = function () {
    if (!this.uploadDialog) {
        this.uploadDialog = new ImportUploadDialog({
            parent: this,
            currencyModel: this.model.currency,
            accountModel: this.model.accounts,
            personModel: this.model.persons,
            rulesModel: this.model.rules,
            tplModel: this.model.templates,
            mainAccount: this.model.mainAccount,
            elem: 'uploadDialog',
            onaccountchange: this.onUploadAccChange.bind(this),
            onuploaddone: this.onImportDone.bind(this)
        });
    }

    this.uploadDialog.show();
};

/** Hide import file form */
ImportView.prototype.onImportDone = function (items) {
    this.uploadDialog.hide();

    if (Array.isArray(items)) {
        items.forEach(function (item) {
            var res = item;

            res.pos = this.model.transactionRows.length;
            this.model.transactionRows.push(res);
            this.rowsContainer.appendChild(res.elem);
        }, this);
    }

    this.updateItemsCount();
};

/** Initial account of upload change callback */
ImportView.prototype.onUploadAccChange = function (accountId) {
    selectByValue(this.acc_id, accountId);
    this.onMainAccChange();
};

/** Refresh main account at model according to current selection */
ImportView.prototype.updMainAccObj = function () {
    var account = this.model.accounts.getItem(selectedValue(this.acc_id));
    if (!account) {
        throw new Error('Account not found');
    }

    this.model.mainAccount = account;
};

/** Set positions of rows as they follows */
ImportView.prototype.updateRowsPos = function () {
    var updatedRows = this.model.transactionRows.map(function (item, ind) {
        var res = item;
        res.pos = ind;
        return res;
    });

    this.model.transactionRows = updatedRows;
};

/** Update count of total/enabled import items and perform related actions */
ImportView.prototype.updateItemsCount = function () {
    var enabledList = this.getEnabledItems();

    enable(this.submitBtn, (enabledList.length > 0));
    this.enabledTransCountElem.textContent = enabledList.length;
    this.transCountElem.textContent = this.model.transactionRows.length;

    if (this.model.transactionRows.length > 0) {
        re(this.noDataMsg);
        this.noDataMsg = null;
    } else {
        if (!this.noDataMsg) {
            this.noDataMsg = ce('span', { className: 'nodata-message', textContent: 'No transactions to import' });
        }
        this.rowsContainer.appendChild(this.noDataMsg);
    }
};

/** Remove all transaction rows */
ImportView.prototype.removeAllItems = function () {
    this.model.transactionRows = [];
    removeChilds(this.rowsContainer);
    this.updateItemsCount();
};

/** Transaction item enable/disable event handler */
ImportView.prototype.onEnableItem = function (item) {
    if (!item) {
        return;
    }

    this.updateItemsCount();
};

/**
 * Transaction item remove event handler
 * Return boolean result confirming remove action
 * @param {ImportTransactionItem} item - item to remove
 */
ImportView.prototype.onRemoveItem = function (item) {
    var delPos;

    if (!item) {
        return false;
    }

    delPos = item.pos;
    this.model.transactionRows.splice(delPos, 1);
    this.updateRowsPos();
    this.updateItemsCount();

    return true;
};

/** Add new transaction row and insert it into list */
ImportView.prototype.createItem = function () {
    var item;

    this.updMainAccObj();
    if (!this.model.mainAccount) {
        return;
    }

    item = ImportTransactionItem.create({
        parent: this,
        currencyModel: this.model.currency,
        accountModel: this.model.accounts,
        personModel: this.model.persons,
        mainAccount: this.model.mainAccount
    });
    item.enable(true);
    item.render();

    this.rowsContainer.appendChild(item.elem);
    item.pos = this.model.transactionRows.length;
    this.model.transactionRows.push(item);

    this.updateItemsCount();
};

/**
 * Main account select event handler
 */
ImportView.prototype.onMainAccChange = function () {
    this.updMainAccObj();
    if (!this.model.mainAccount) {
        return;
    }

    this.model.transactionRows.forEach(function (item) {
        item.onMainAccountChanged(this.model.mainAccount.id);
    }, this);
};

/** Filter enabled transaction items */
ImportView.prototype.getEnabledItems = function () {
    if (!this.model || !Array.isArray(this.model.transactionRows)) {
        throw new Error('Invalid state');
    }

    return this.model.transactionRows.filter(function (item) {
        return item.isEnabled();
    });
};

/** Submit buttom 'click' event handler */
ImportView.prototype.onSubmitClick = function () {
    var requestObj;
    var enabledList;

    enabledList = this.getEnabledItems();
    if (!Array.isArray(enabledList) || !enabledList.length) {
        throw new Error('Invalid list of items');
    }

    requestObj = enabledList.map(function (item) {
        var res = item.getData();
        if (!res) {
            throw new Error('Invalid transaction object');
        }

        return res;
    }, this);

    ajax.post({
        url: baseURL + 'api/transaction/createMultiple/',
        data: JSON.stringify(requestObj),
        headers: { 'Content-Type': 'application/json' },
        callback: this.onSubmitResult.bind(this)
    });
};

/**
 * Submit response handler
 * @param {String} response - response text
 */
ImportView.prototype.onSubmitResult = function (response) {
    var respObj;
    var status = false;
    var message = 'Fail to import transactions';

    try {
        respObj = JSON.parse(response);
        status = (respObj && respObj.result === 'ok');
        if (status) {
            message = 'All transactions have been successfully imported';
            this.removeAllItems();
        } else if (respObj && respObj.msg) {
            message = respObj.msg;
        }
    } catch (e) {
        message = e.message;
    }

    createMessage(message, (status ? 'msg_success' : 'msg_error'));
};

/**
 * Search row object by specified element
 * @param {Element} rowEl - row root element
 */
ImportView.prototype.getRowByElem = function (rowEl) {
    return this.model.transactionRows.find(function (rowObj) {
        return (rowEl === rowObj.elem);
    });
};

/**
 * Transaction reorder handler
 * @param {Object} original - original item object
 * @param {Object} replaced - new item object
 */
ImportView.prototype.onTransPosChanged = function (original, replaced) {
    var origItem;
    var replacedItem;
    var cutItem;

    if (this.model.transactionRows.length < 2) {
        return;
    }

    origItem = this.getRowByElem(original);
    if (!origItem || !replaced) {
        return;
    }

    replacedItem = this.getRowByElem(replaced);
    if (!replacedItem) {
        return;
    }
    cutItem = this.model.transactionRows.splice(origItem.pos, 1)[0];
    this.model.transactionRows.splice(replacedItem.pos, 0, cutItem);

    this.updateRowsPos();
};
