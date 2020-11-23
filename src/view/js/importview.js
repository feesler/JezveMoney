'use strict';

/* global ge, isDate, isFunction, removeChilds, show, enable, extend */
/* global selectByValue, selectedValue, fixFloat, urlJoin, ajax */
/* global EXPENSE, INCOME, TRANSFER, DEBT, createMessage, baseURL */
/* global AccountList, CurrencyList, PersonList, ImportRuleList */
/* global View, IconLink, Popup, Sortable, ImportTransactionItem */
/* eslint no-bitwise: "off" */

/** Uploader constructor */
function Uploader(file, options, onSuccess, onError, onProgress) {
    var fileId;
    var fileType;
    var errorCount = 0;
    var MAX_ERROR_COUNT = 6;
    var startByte = 0;
    var xhrUpload;
    var xhrStatus;

    /**
    * Obtain 32-bit integer from string
    * @param {string} str - string to create hash from
    */
    function hashCode(str) {
        var i;
        var chr;
        var hash = 0;

        if (str.length === 0) {
            return 0;
        }

        for (i = 0; i < str.length; i += 1) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; /* Convert to 32bit integer */
        }

        return Math.abs(hash);
    }

    /* fileId is unique file identificator */
    fileId = file.name + '-' + file.size + '-' + +file.lastModifiedDate;
    fileType = file.name.substr(file.name.lastIndexOf('.') + 1);

    /**
     * make integer from file id to send in header
     * only ASCII symbols is available in headers
     */
    fileId = hashCode(fileId);

    function send() {
        xhrUpload = new XMLHttpRequest();
        xhrUpload.onload = function () {
            if (this.status === 200) {
                if (isFunction(onSuccess)) {
                    onSuccess(this.response);
                }
            } else {
                /** Try again if failed */
                errorCount += 1;
                if (errorCount <= MAX_ERROR_COUNT) {
                    setTimeout(send, 1000 * errorCount);
                } else if (isFunction(onError)) {
                    onError(this.statusText);
                }
            }
        };
        xhrUpload.onerror = xhrUpload.onload;

        xhrUpload.open('POST', baseURL + 'import/upload', true);
        // which file upload
        xhrUpload.setRequestHeader('X-File-Id', fileId);
        xhrUpload.setRequestHeader('X-File-Type', fileType);
        xhrUpload.setRequestHeader('X-File-Tpl', options.template);
        if (options.encode) {
            xhrUpload.setRequestHeader('X-File-Encode', 1);
        }

        xhrUpload.upload.onprogress = function (e) {
            errorCount = 0;
            if (isFunction(onProgress)) {
                onProgress(startByte + e.loaded, startByte + e.total);
            }
        };

        // send from startByte
        xhrUpload.send(file.slice(startByte));
    }

    function upload() {
        xhrStatus = new XMLHttpRequest();

        xhrStatus.onload = function () {
            if (this.status === 200) {
                startByte = +this.responseText || 0;
                send();
            } else {
                /* on fail try again after 1 second */
                errorCount += 1;
                if (errorCount <= MAX_ERROR_COUNT) {
                    setTimeout(upload, 1000 * errorCount);
                } else if (isFunction(onError)) {
                    onError(this.statusText);
                }
            }
        };

        xhrStatus.onerror = xhrStatus.onload;

        xhrStatus.open('GET', baseURL + 'import/uploadstatus', true);
        xhrStatus.setRequestHeader('X-File-Id', fileId);
        xhrStatus.setRequestHeader('X-File-Type', fileType);
        xhrStatus.send();
    }

    function pause() {
        if (xhrStatus) {
            xhrStatus.abort();
        }
        if (xhrUpload) {
            xhrUpload.abort();
        }
    }

    this.upload = upload;
    this.pause = pause;
}

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
    this.dataForm = ge('dataForm');
    this.rowsContainer = ge('rowsContainer');
    if (!this.newItemBtn
        || !this.uploadBtn
        || !this.submitBtn
        || !this.transCountElem
        || !this.enabledTransCountElem
        || !this.acc_id
        || !this.dataForm
        || !this.rowsContainer
    ) {
        throw new Error('Failed to initialize Import view');
    }

    this.acc_id.addEventListener('change', this.onMainAccChange.bind(this));
    this.submitBtn.addEventListener('click', this.onSubmitClick.bind(this));

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
        this.uploadDialog = {};

        this.uploadDialog.formElem = ge('fileimportfrm');
        if (!this.uploadDialog.formElem) {
            throw new Error('Failed to initialize upload file dialog');
        }

        this.uploadDialog.formElem.addEventListener('submit', this.onFileImport.bind(this));
        this.uploadDialog.formElem.addEventListener('reset', this.onResetFileImport.bind(this));

        this.uploadDialog.popup = Popup.create({
            id: 'fileupload_popup',
            title: 'Upload',
            content: this.uploadDialog.formElem,
            onclose: this.resetUploadForm.bind(this),
            btn: {
                okBtn: false,
                cancelBtn: false,
                closeBtn: true
            },
            additional: 'center_only upload-popup'
        });

        this.uploadDialog.inputElem = ge('fileInp');
        this.uploadDialog.filenameElem = document.querySelector('.import-form .import-form__filename');
        if (!this.uploadDialog.inputElem || !this.uploadDialog.filenameElem) {
            throw new Error('Failed to initialize upload file dialog');
        }
        this.uploadDialog.inputElem.addEventListener('change', this.onChangeUploadFile.bind(this));

        this.uploadDialog.initialAccountSel = ge('initialAccount');
        this.uploadDialog.templateSel = ge('templateSel');
        this.uploadDialog.importControls = ge('importControls');
        this.uploadDialog.isEncodeCheck = ge('isEncodeCheck');
        if (
            !this.uploadDialog.initialAccountSel
            || !this.uploadDialog.templateSel
            || !this.uploadDialog.importControls
            || !this.uploadDialog.isEncodeCheck
        ) {
            throw new Error('Failed to initialize upload file dialog');
        }

        this.uploadDialog.initialAccountSel.addEventListener('change', this.onInitialAccChange.bind(this));
    }

    this.uploadDialog.popup.show();
};

/**
 * Enable/disable upload button
 */
ImportView.prototype.enableUploadButton = function (val) {
    var submitBtn;

    if (!this.uploadDialog) {
        throw new Error('Upload dialog not initialized');
    }

    if (val) {
        submitBtn = { value: 'Import', onclick: this.onFileImport.bind(this) };
    } else {
        submitBtn = false;
    }

    this.uploadDialog.popup.setControls({
        okBtn: submitBtn,
        cancelBtn: false
    });
};

/** Copy file name from file input */
ImportView.prototype.updateUploadFileName = function () {
    var pos;
    var fileName;

    if (!this.uploadDialog || !this.uploadDialog.inputElem) {
        throw new Error('Upload dialog not initialized');
    }
    fileName = this.uploadDialog.inputElem.value;
    if (fileName.includes('fakepath')) {
        pos = fileName.lastIndexOf('\\');
        fileName = fileName.substr(pos + 1);
    }

    this.uploadDialog.filenameElem.textContent = fileName;
};

/**
 * File input 'change' event handler
 * Update displayng file name and show control of form
 */
ImportView.prototype.onChangeUploadFile = function () {
    this.updateUploadFileName();

    this.enableUploadButton(true);
    show(this.uploadDialog.importControls, true);
};

/**
 * Update displayng file name and hide controls of form
 */
ImportView.prototype.resetImportForm = function () {
    this.updateUploadFileName();

    this.enableUploadButton(false);
    show(this.uploadDialog.importControls, false);
};

/**
 * Import form 'reset' event handler
 */
ImportView.prototype.onResetFileImport = function () {
    this.enableUploadButton();
};

/**
 * Import form 'reset' event handler
 */
ImportView.prototype.onResetFileImport = function () {
    setTimeout(this.resetImportForm.bind(this));
};

/** Hide import file form */
ImportView.prototype.importDone = function () {
    this.uploadDialog.popup.hide();
    this.enableUploadButton(false);
    show(this.uploadDialog.importControls, false);
    show(this.dataForm, true);

    this.updateItemsCount();
};

/** Reset file upload form */
ImportView.prototype.resetUploadForm = function () {
    if (!this.uploadDialog || !this.uploadDialog.formElem) {
        throw new Error('Upload dialog not initialized');
    }

    this.uploadDialog.formElem.reset();
};

/** Hide import file form */
ImportView.prototype.onInitialAccChange = function () {
    this.copyMainAccount();
};

/** Hide import file form */
ImportView.prototype.copyMainAccount = function () {
    var accountId;

    if (!this.uploadDialog) {
        throw new Error('Upload dialog not initialized');
    }

    accountId = selectedValue(this.uploadDialog.initialAccountSel);
    selectByValue(this.acc_id, accountId);
    this.updMainAccObj();
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

/** Filter enabled transaction items */
ImportView.prototype.itemToTransaction = function (item) {
    var transaction = {};
    var selType;
    var isDiff;
    var secondAcc;
    var person;
    var amountVal;
    var secondAmountVal;
    var selectedCurr;

    if (!item) {
        throw new Error('Invalid item');
    }

    selType = selectedValue(item.trTypeSel);
    secondAcc = this.model.accounts.getItem(parseInt(item.destAccIdInp.value, 10));
    person = this.model.persons.getItem(parseInt(item.personIdInp.value, 10));
    amountVal = fixFloat(item.amountInp.value);
    secondAmountVal = fixFloat(item.destAmountInp.value);
    selectedCurr = parseInt(item.currIdInp.value, 10);

    if (selType === 'expense') {
        transaction.type = EXPENSE;
        transaction.src_id = this.model.mainAccount.id;
        transaction.dest_id = 0;
        transaction.src_curr = this.model.mainAccount.curr_id;
        transaction.dest_curr = selectedCurr;
        transaction.src_amount = amountVal;
        isDiff = (transaction.src_curr !== transaction.dest_curr);
        transaction.dest_amount = (isDiff) ? secondAmountVal : amountVal;
    } else if (selType === 'income') {
        transaction.type = INCOME;
        transaction.src_id = 0;
        transaction.dest_id = this.model.mainAccount.id;
        transaction.src_curr = selectedCurr;
        transaction.dest_curr = this.model.mainAccount.curr_id;
        isDiff = (transaction.src_curr !== transaction.dest_curr);
        transaction.src_amount = (isDiff) ? secondAmountVal : amountVal;
        transaction.dest_amount = amountVal;
    } else if (selType === 'transferfrom') {
        if (!secondAcc) {
            throw new Error('Invalid transaction: Second account not set');
        }

        transaction.type = TRANSFER;
        transaction.src_id = this.model.mainAccount.id;
        transaction.dest_id = secondAcc.id;
        transaction.src_curr = this.model.mainAccount.curr_id;
        transaction.dest_curr = secondAcc.curr_id;
        transaction.src_amount = amountVal;
        isDiff = (transaction.src_curr !== transaction.dest_curr);
        transaction.dest_amount = (isDiff) ? secondAmountVal : amountVal;
    } else if (selType === 'transferto') {
        if (!secondAcc) {
            throw new Error('Invalid transaction: Second account not set');
        }

        transaction.type = TRANSFER;
        transaction.src_id = secondAcc.id;
        transaction.dest_id = this.model.mainAccount.id;
        transaction.src_curr = secondAcc.curr_id;
        transaction.dest_curr = this.model.mainAccount.curr_id;
        isDiff = (transaction.src_curr !== transaction.dest_curr);
        transaction.src_amount = (isDiff) ? secondAmountVal : amountVal;
        transaction.dest_amount = amountVal;
    } else if (selType === 'debtfrom' || selType === 'debtto') {
        if (!person) {
            throw new Error('Invalid transaction: Person not set');
        }

        transaction.type = DEBT;
        transaction.op = (selType === 'debtfrom') ? 1 : 2;
        transaction.person_id = person.id;
        transaction.acc_id = this.model.mainAccount.id;
        transaction.src_curr = this.model.mainAccount.curr_id;
        transaction.dest_curr = this.model.mainAccount.curr_id;
        transaction.src_amount = amountVal;
        transaction.dest_amount = amountVal;
    }

    transaction.date = item.dateInp.value;
    transaction.comment = item.commInp.value;

    return transaction;
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
        var res = this.itemToTransaction(item);
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

    this.enableUploadButton(!status);
    show(this.uploadDialog.importControls, !status);
    show(this.dataForm, !status);
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
    if ((item.src_id !== this.model.mainAccount.id
        && item.dest_id !== this.model.mainAccount.id)
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

/**
 * Transactions list API request callback
 * Compare list of import items with transactions already in DB
 *  and disable import item if same(similar) transaction found
 * @param {string} response - server response string
 */
ImportView.prototype.onTrCacheResult = function (response) {
    var jsondata;

    try {
        jsondata = JSON.parse(response);
        if (!jsondata || jsondata.result !== 'ok') {
            throw new Error('Invalid server response');
        }
    } catch (e) {
        this.importDone();
        return;
    }

    this.model.transCache = jsondata.data;
    this.model.transactionRows.forEach(function (row) {
        var data;
        var transaction = this.findSameTransaction(row.data);
        if (transaction) {
            transaction.picked = true;
            data = row.data;
            data.sameFound = true;
            row.enable(false);
        }
    }, this);

    this.importDone();
};

/**
 * Convert date string to timestamp
 * @param {string} str - date string in DD.MM.YYYY format
 */
ImportView.prototype.timestampFromDateString = function (str) {
    var dparts;
    var res;

    if (typeof str !== 'string') {
        throw new Error('Invalid type of parameter');
    }

    dparts = str.split('.');
    res = new Date(dparts[2], dparts[1] - 1, dparts[0]);

    return res.getTime();
};

/**
 * Format date as DD.MM.YYYY
 * @param {Date} date - date to format
 */
ImportView.prototype.formatDate = function (date) {
    var month;
    var year;
    var day;

    if (!isDate(date)) {
        throw new Error('Invalid type of parameter');
    }

    month = date.getMonth();
    year = date.getFullYear();
    day = date.getDate();

    return ((day > 9) ? '' : '0') + day + '.' + ((month + 1 > 9) ? '' : '0') + (month + 1) + '.' + year;
};

/**
 * Import data request callback
 * @param {object} response - data for import request
 */
ImportView.prototype.importLoadCallback = function (response) {
    var defErrorMessage = 'Fail to import file';
    var importedDateRange = { start: 0, end: 0 };
    var res;
    var reqParams;

    try {
        this.resetUploadForm();
        res = JSON.parse(response);
        if (!res || res.result !== 'ok' || !Array.isArray(res.data)) {
            throw new Error((res && 'msg' in res) ? res.msg : defErrorMessage);
        }
    } catch (e) {
        createMessage(e.message, 'msg_error');
        return;
    }

    this.removeAllItems();
    res.data.forEach(function (item) {
        var timestamp;
        var transactionItem;

        if (!item) {
            return;
        }

        // Store date region of imported transactions
        timestamp = this.timestampFromDateString(item.date);

        if (importedDateRange.start === 0 || importedDateRange.start > timestamp) {
            importedDateRange.start = timestamp;
        }
        if (importedDateRange.end === 0 || importedDateRange.end < timestamp) {
            importedDateRange.end = timestamp;
        }

        transactionItem = this.mapImportRow(item);
        if (!transactionItem) {
            return;
        }

        this.rowsContainer.appendChild(transactionItem.elem);
        transactionItem.pos = this.model.transactionRows.length;
        this.model.transactionRows.push(transactionItem);
        this.transCountElem.textContent = this.model.transactionRows.length;
    }, this);

    reqParams = urlJoin({
        count: 0,
        stdate: this.formatDate(new Date(importedDateRange.start)),
        enddate: this.formatDate(new Date(importedDateRange.end)),
        acc_id: this.model.mainAccount.id
    });

    ajax.get({
        url: baseURL + 'api/transaction/list/?' + reqParams,
        callback: this.onTrCacheResult.bind(this)
    });
};

/**
 * Map import row to new transaction
 * @param {Object} data - import data
 */
ImportView.prototype.mapImportRow = function (data) {
    var accCurr;
    var trCurr;
    var item;

    if (!data) {
        return null;
    }

    accCurr = this.model.currency.findByName(data.accCurrVal);
    if (!accCurr) {
        console.log('Unknown currency ' + data.accCurrVal);
        return null;
    }

    trCurr = this.model.currency.findByName(data.trCurrVal);
    if (!trCurr) {
        console.log('Unknown currency ' + data.trCurrVal);
        return null;
    }

    /** Currency should be same as main account */
    if (accCurr.id !== this.model.mainAccount.curr_id) {
        console.log('Currency must be the same as main account');
        return null;
    }

    item = ImportTransactionItem.create({
        parent: this,
        currencyModel: this.model.currency,
        accountModel: this.model.accounts,
        personModel: this.model.persons,
        mainAccount: this.model.mainAccount,
        originalData: data
    });

    item.setSourceAmount(data.accAmountVal);

    if (trCurr.id !== accCurr.id) {
        item.setCurrency(trCurr.id);
        item.setDestinationAmount(data.trAmountVal);
    }

    item.setDate(data.date);
    item.setComment(data.descr);

    this.model.rules.applyTo(data, item);

    return item;
};

/**
 * Import success callback
 * @param {string} response - text of response for import request
 */
ImportView.prototype.onImportSuccess = function (response) {
    this.importLoadCallback(response);
};

/**
 * Import error callback
 */
ImportView.prototype.onImportError = function () {
    this.importLoadCallback(null);
};

/**
 * Import progress callback
 */
ImportView.prototype.onImportProgress = function () {
};

/**
 * Upload file to server
 */
ImportView.prototype.onFileImport = function () {
    var file;
    var uploader;
    var templateId = this.uploadDialog.templateSel.value;
    var isEncoded = this.uploadDialog.isEncodeCheck.checked;

    file = this.uploadDialog.inputElem.files[0];
    if (!file) {
        return;
    }

    uploader = new Uploader(
        file,
        { template: templateId, encode: isEncoded },
        this.onImportSuccess.bind(this),
        this.onImportError.bind(this),
        this.onImportProgress.bind(this)
    );
    uploader.upload();
};
