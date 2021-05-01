'use strict';

/* global ge, re, ce, show, enable, formatDate, extend */
/* global urlJoin, ajax, timestampFromString, createMessage, baseURL */
/* global AccountList, CurrencyList, PersonList, ImportRuleList, ImportTemplateList */
/* global View, IconLink, Sortable, DropDown, ImportUploadDialog, ImportRulesDialog */
/* global ImportTransactionItem */
/* eslint no-bitwise: "off" */

/**
 * Import view constructor
 */
function ImportView() {
    ImportView.parent.constructor.apply(this, arguments);

    this.model = {
        transactionRows: [],
        mainAccount: null,
        transCache: null,
        rulesEnabled: true
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
    this.clearFormBtn = IconLink.fromElement({
        elem: 'clearFormBtn',
        onclick: this.removeAllItems.bind(this)
    });

    this.uploadBtn = IconLink.fromElement({
        elem: 'uploadBtn',
        onclick: this.showUploadDialog.bind(this)
    });

    this.accountDropDown = DropDown.create({
        input_id: 'acc_id',
        onchange: this.onMainAccChange.bind(this),
        editable: false,
        extraClass: 'dd__fullwidth'
    });

    this.submitBtn = ge('submitbtn');
    this.transCountElem = ge('trcount');
    this.enabledTransCountElem = ge('entrcount');
    this.rulesCheck = ge('rulesCheck');
    this.rulesBtn = ge('rulesBtn');
    this.rulesCountElem = ge('rulescount');
    this.rowsContainer = ge('rowsContainer');
    if (!this.newItemBtn
        || !this.uploadBtn
        || !this.submitBtn
        || !this.transCountElem
        || !this.enabledTransCountElem
        || !this.accountDropDown
        || !this.rulesCheck
        || !this.rulesBtn
        || !this.rulesCountElem
        || !this.rowsContainer
    ) {
        throw new Error('Failed to initialize Import view');
    }

    this.submitBtn.addEventListener('click', this.onSubmitClick.bind(this));
    this.rulesCheck.addEventListener('change', this.onToggleEnableRules.bind(this));
    this.rulesBtn.addEventListener('click', this.onRulesClick.bind(this));

    this.noDataMsg = this.rowsContainer.querySelector('.nodata-message');
    this.loadingInd = this.rowsContainer.querySelector('.data-container__loading');
    if (!this.loadingInd) {
        throw new Error('Failed to initialize Import view');
    }

    this.trListSortable = new Sortable({
        oninsertat: this.onTransPosChanged.bind(this),
        container: 'rowsContainer',
        group: 'transactions',
        selector: '.import-item',
        placeholderClass: 'import-item__placeholder',
        copyWidth: true,
        handles: [{ query: 'div' }, { query: 'label' }]
    });

    this.updMainAccObj();
    this.setRenderTime();
};

/** Update render time data attribute of list container */
ImportView.prototype.setRenderTime = function () {
    this.rowsContainer.dataset.time = Date.now();
};

/** Import rules 'update' event handler */
ImportView.prototype.onUpdateRules = function () {
    var rulesCount = this.model.rules.length;

    this.rulesCountElem.textContent = rulesCount;

    this.reApplyRules();
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

/** File upload done handler */
ImportView.prototype.onImportDone = function (items) {
    this.uploadDialog.hide();

    this.mapImportedItems(items);

    this.updateItemsCount();
};

/** Map data after template applied and request API for transactions in same date range */
ImportView.prototype.mapImportedItems = function (data) {
    if (!Array.isArray(data)) {
        throw new Error('Invalid data');
    }

    data.forEach(function (row) {
        var item = this.mapImportItem(row);
        if (!item) {
            throw new Error('Failed to map data row');
        }

        item.pos = this.model.transactionRows.length;
        this.model.transactionRows.push(item);
        this.rowsContainer.appendChild(item.elem);
    }, this);

    this.requestSimilar();
};

/**
 * Map import row to new transaction
 * @param {Object} data - import data
 */
ImportView.prototype.mapImportItem = function (data) {
    var item;

    if (!data) {
        throw new Error('Invalid data');
    }

    item = new ImportTransactionItem({
        parent: this,
        currencyModel: this.model.currency,
        accountModel: this.model.accounts,
        personModel: this.model.persons,
        mainAccount: this.model.mainAccount,
        originalData: data
    });

    if (this.model.rulesEnabled) {
        this.model.rules.applyTo(item);
    }
    item.render();

    return item;
};

/** Send API request to obtain transactions similar to imported */
ImportView.prototype.requestSimilar = function () {
    var importedItems;
    var reqParams;
    var importedDateRange = { start: 0, end: 0 };

    show(this.loadingInd, true);

    // Obtain date region of imported transactions
    importedItems = this.getImportedItems();
    importedItems.forEach(function (item) {
        var timestamp;
        var date;

        try {
            date = item.getDate();
            timestamp = timestampFromString(date);
        } catch (e) {
            return;
        }

        if (importedDateRange.start === 0 || importedDateRange.start > timestamp) {
            importedDateRange.start = timestamp;
        }
        if (importedDateRange.end === 0 || importedDateRange.end < timestamp) {
            importedDateRange.end = timestamp;
        }
    });
    // Prepare request data
    reqParams = urlJoin({
        count: 0,
        stdate: formatDate(new Date(importedDateRange.start)),
        enddate: formatDate(new Date(importedDateRange.end)),
        acc_id: this.model.mainAccount.id
    });
    // Send request
    ajax.get({
        url: baseURL + 'api/transaction/list/?' + reqParams,
        callback: this.onTrCacheResult.bind(this)
    });
};

/**
 * Transactions list API request callback
 * Compare list of import items with transactions already in DB
 *  and disable import item if same(similar) transaction found
 * @param {string} response - server response string
 */
ImportView.prototype.onTrCacheResult = function (response) {
    var jsondata;
    var importedItems;

    try {
        jsondata = JSON.parse(response);
        if (!jsondata || jsondata.result !== 'ok') {
            throw new Error('Invalid server response');
        }
    } catch (e) {
        show(this.loadingInd, false);
        return;
    }

    this.model.transCache = jsondata.data;
    importedItems = this.getImportedItems();
    importedItems.forEach(function (item) {
        var data;
        var transaction;

        item.enable(true);
        data = item.getData();
        transaction = this.findSameTransaction(data);
        if (transaction) {
            transaction.picked = true;
            item.enable(false);
        }
        item.render();
    }, this);

    show(this.loadingInd, false);
    this.updateItemsCount();
    this.setRenderTime();
};

/**
 * Compare transaction item with reference object
 * @param {TransactionItem} item - transaction item object
 * @param {Object} reference - imported transaction object
 */
ImportView.prototype.isSameTransaction = function (item, reference) {
    var refSrcAmount;
    var refDestAmount;

    if (!item || !reference) {
        throw new Error('Invalid parameters');
    }

    // Check date, source and destination accounts
    if (item.src_id !== reference.src_id
        || item.dest_id !== reference.dest_id
        || item.date !== reference.date) {
        return false;
    }

    // Check amounts
    // Source and destination amount can be swapped
    refSrcAmount = Math.abs(reference.src_amount);
    refDestAmount = Math.abs(reference.dest_amount);
    if ((item.src_amount !== refSrcAmount && item.src_amount !== refDestAmount)
        || (item.dest_amount !== refDestAmount && item.dest_amount !== refSrcAmount)) {
        return false;
    }

    return true;
};

/** Return first found transaction with same date and amount as reference */
ImportView.prototype.findSameTransaction = function (reference) {
    return this.model.transCache.find(function (item) {
        return (item && !item.picked && this.isSameTransaction(item, reference));
    }, this);
};

/** Initial account of upload change callback */
ImportView.prototype.onUploadAccChange = function (accountId) {
    this.accountDropDown.selectItem(accountId.toString());
    this.onMainAccChange();
};

/** Refresh main account at model according to current selection */
ImportView.prototype.updMainAccObj = function () {
    var selectedAccount;
    var account = null;

    selectedAccount = this.accountDropDown.getSelectionData();
    if (selectedAccount) {
        account = this.model.accounts.getItem(selectedAccount.id);
    }
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
    var hasItems = (this.model.transactionRows.length > 0);
    var enabledList = this.getEnabledItems();

    enable(this.submitBtn, (enabledList.length > 0));
    this.enabledTransCountElem.textContent = enabledList.length;
    this.transCountElem.textContent = this.model.transactionRows.length;

    this.clearFormBtn.enable(hasItems);
    if (hasItems) {
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
    this.model.transactionRows.forEach(function (item) {
        re(item.elem);
    });
    this.model.transactionRows = [];
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

    this.reApplyRules();

    if (!this.uploadDialog || !this.uploadDialog.isVisible()) {
        this.requestSimilar();
    } else {
        this.setRenderTime();
    }
};

/** Filter imported transaction items */
ImportView.prototype.getImportedItems = function () {
    if (!this.model || !Array.isArray(this.model.transactionRows)) {
        throw new Error('Invalid state');
    }

    return this.model.transactionRows.filter(function (item) {
        return item.getOriginal() !== null;
    });
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
    var valid;

    enabledList = this.getEnabledItems();
    if (!Array.isArray(enabledList) || !enabledList.length) {
        throw new Error('Invalid list of items');
    }

    valid = enabledList.every(function (item) {
        return item.validate();
    });
    if (!valid) {
        return;
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

/** Apply rules to imported items */
ImportView.prototype.reApplyRules = function () {
    var importedItems;

    if (!this.model.rulesEnabled) {
        return;
    }

    importedItems = this.getImportedItems();
    importedItems.forEach(function (item) {
        var applied;

        item.restoreOriginal();
        applied = this.model.rules.applyTo(item);
        if (applied) {
            item.render();
        }
    }, this);
};

/** Rules checkbox 'change' event handler */
ImportView.prototype.onToggleEnableRules = function () {
    var importedItems;

    this.model.rulesEnabled = !!this.rulesCheck.checked;
    enable(this.rulesBtn, this.model.rulesEnabled);

    importedItems = this.getImportedItems();
    importedItems.forEach(function (item) {
        if (this.model.rulesEnabled) {
            this.model.rules.applyTo(item);
        } else {
            item.restoreOriginal();
        }
        item.render();
    }, this);
};

/** Rules button 'click' event handler */
ImportView.prototype.onRulesClick = function () {
    if (!this.model.rulesEnabled) {
        return;
    }

    this.showRulesDialog();
};

/** Show rules dialog popup */
ImportView.prototype.showRulesDialog = function () {
    if (!this.rulesDialog) {
        this.rulesDialog = new ImportRulesDialog({
            parent: this,
            tplModel: this.model.templates,
            currencyModel: this.model.currency,
            accountModel: this.model.accounts,
            personModel: this.model.persons,
            rulesModel: this.model.rules,
            elem: 'rulesDialog'
        });
    }

    this.rulesDialog.show();
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
